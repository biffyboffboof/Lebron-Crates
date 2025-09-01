import { state } from './state';
import { potions, crateShopValues, getItemRarity, getItemSellValue, getPotionSellValue, itemData } from './data';
// FIX: Added updateAllUI and unlockCrate to imports
import { showToast, updateAllUI, showCrateResult, showMultiCrateResult, unlockCrate, updateFreeCrateDisplay } from './ui';
import { playCrateOpenAnimation } from './animation';
import { getElement, randomItem, weightedRandomItem } from './utils';
import { applyWildMagicEffect } from './inventory';
import { CrateType } from './types';

export function applyLuck(pool) {
  const luckBoost = state.activePotions.luckBoost;
  if (luckBoost && luckBoost.timeLeft > 0) {
    let luck = luckBoost.value;

    const qualityOrder = [
        { action: 'item', rarity: 'common' },
        { action: 'potion', rarity: 'common' },
        { action: 'crate', rarity: 'rare' },
        { action: 'item', rarity: 'rare' },
        { action: 'potion', rarity: 'rare' },
        { action: 'crate', rarity: 'epic' },
        { action: 'item', rarity: 'epic' },
        { action: 'crate', rarity: 'legendary' },
        { action: 'item', rarity: 'legendary' },
        { action: 'item', rarity: 'lebron' },
        { action: 'item', rarity: 'mythical'},
    ];

    for (let i = qualityOrder.length - 1; i > 0; i--) {
        if (luck <= 0) break;

        const toTier = qualityOrder[i];
        const fromTier = qualityOrder[i - 1];

        const toPoolItem = pool.find(p => p.action === toTier.action && p.rarity === toTier.rarity);
        const fromPoolItem = pool.find(p => p.action === fromTier.action && p.rarity === fromTier.rarity);

        if (fromPoolItem && toPoolItem && fromPoolItem.chance > 0) {
            const amountToMove = Math.min(luck, fromPoolItem.chance);
            fromPoolItem.chance -= amountToMove;
            toPoolItem.chance += amountToMove;
            luck -= amountToMove;
        }
    }
  }
  return pool;
}

function selectFromPool(pool) {
    let roll = Math.random() * 100;
    let sum = 0;
    let result = null;

    const totalChance = pool.reduce((acc, p) => acc + p.chance, 0);
    if (totalChance > 0) {
        // Normalize chances before rolling
        const normalizedPool = pool.map(p => ({...p, chance: (p.chance / totalChance) * 100 }));
        for (let p of normalizedPool) {
            sum += p.chance;
            if (roll <= sum) {
                result = p;
                break;
            }
        }
    }
    if (!result) result = pool.find(p => p.chance > 0) || pool[0]; // Fallback
    return result;
}

export function getCratePool(type: CrateType) {
    let pool = [];

    if (type.startsWith('weapon_') || type.startsWith('armor_') || type.startsWith('potion_')) {
        const [category, rarity] = type.split('_');
        const action = category === 'potion' ? 'potion' : 'item';
        if (rarity === 'legendary') {
            const upgradeChance = 2; // 2% chance to upgrade
            const mythicalCrateType = `${category}_mythical` as CrateType;
            pool = [
                { action: action, category, rarity: 'legendary', chance: 100 - upgradeChance },
                { action: 'crate', rarity: 'mythical', crateType: mythicalCrateType, chance: upgradeChance }
            ];
        } else {
             pool = [{ action: action, category, rarity, chance: 100 }];
        }
    } else {
        switch(type) {
            case "basic":
                pool = [
                    {action: "item", rarity: "common", chance: 89},
                    {action: "potion", rarity: "common", chance: 3},
                    {action: "crate", rarity: "rare", chance: 7},
                    {action: "crate", rarity: "epic", chance: 1}
                ];
                break;
            case "rare":
                pool = [
                    {action: "item", rarity: "rare", chance: 80},
                    {action: "potion", rarity: "rare", chance: 5},
                    {action: "crate", rarity: "epic", chance: 12},
                    {action: "crate", rarity: "legendary", chance: 3}
                ];
                break;
            case "epic":
                pool = [
                    {action: "item", rarity: "epic", chance: 85},
                    {action: "crate", rarity: "legendary", chance: 15}
                ];
                break;
            case "legendary":
                let legendaryBaseChance = 99;
                let lebronBaseChance = 1;
                const lebronHunter = state.activePotions.lebronHunter;
                if (lebronHunter && lebronHunter.timeLeft > 0) {
                    const boost = lebronHunter.chanceIncrease;
                    lebronBaseChance += boost;
                    legendaryBaseChance -= boost;
                }
                const upgradeChance = 2; // 2% chance to upgrade
                legendaryBaseChance -= upgradeChance;
                pool = [
                    {action: "item", rarity: "legendary", chance: legendaryBaseChance},
                    {action: "item", rarity: "lebron", chance: lebronBaseChance},
                    {action: "crate", rarity: "mythical", chance: upgradeChance}
                ];
                break;
            case "mythical":
                pool = [
                    {action: "item", rarity: "mythical", chance: 95},
                    {action: "item", rarity: "lebron", chance: 5}
                ];
                break;
            default:
                return null;
        }
    }
    return pool;
}

export function getCrateResult(type: CrateType) {
  let pool = getCratePool(type);
  if (!pool) return null;

  pool = applyLuck(pool);

  const result = selectFromPool(pool);
  if (!result) return null;

  let resultPayload = null;
  if (result.action === "item") {
    let itemPool = Object.keys(itemData).filter(itemName => {
        const data = itemData[itemName];
        if (data.rarity !== result.rarity) return false;
        if (result.category && ['weapon', 'armor'].includes(result.category)) {
            return data.category === result.category;
        }
        return data.category !== 'ingredient';
    });

    if (itemPool.length === 0) {
        console.error(`No items found for criteria:`, result);
        itemPool = Object.keys(itemData).filter(i => itemData[i].rarity === result.rarity && itemData[i].category !== 'ingredient');
        if(itemPool.length === 0) return null;
    }
    
    const getItemWeight = (itemName: string) => {
        const owned = state.inventory[itemName] || 0;
        return 1 / (owned + 1);
    };
    const it = result.rarity === "lebron" ? "LeBron James" : weightedRandomItem(itemPool, getItemWeight);
    if (!it) return null; // Handle case where weightedRandomItem returns null

    resultPayload = {type: 'item', name: it, rarity: result.rarity};

  } else if (result.action === "crate") {
    const crateType: CrateType = result.crateType || result.rarity;
    const crateName = `${crateType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Crate`;
    resultPayload = {type: 'crate', name: crateName, rarity: result.rarity, crateType };
  } else if (result.action === 'potion') {
    let availablePotions = Object.keys(potions).filter(p => potions[p].rarity === result.rarity);
    if(availablePotions.length === 0) {
        console.error(`No potions of rarity "${result.rarity}" found.`);
         const commonItemPool = Object.keys(itemData).filter(i => itemData[i].rarity === 'common' && itemData[i].category !== 'ingredient');
         const fallbackItem = randomItem(commonItemPool);
         return {type: 'item', name: fallbackItem, rarity: 'common'};
    }
    const getPotionWeight = (potionName: string) => {
        const owned = state.potions[potionName] || 0;
        return 1 / (owned + 1);
    };
    const potionName = weightedRandomItem(availablePotions, getPotionWeight);
    if (!potionName) { // Handle null case if weighted random fails
         const commonItemPool = Object.keys(itemData).filter(i => itemData[i].rarity === 'common' && itemData[i].category !== 'ingredient');
         const fallbackItem = randomItem(commonItemPool);
         return {type: 'item', name: fallbackItem, rarity: 'common'};
    }
    resultPayload = {type: 'potion', name: potionName, rarity: result.rarity};
  }
  return resultPayload;
}

function processCrateResult(resultPayload: any) {
    if (!resultPayload) return;

    if (resultPayload.type === 'item') {
        state.inventory[resultPayload.name] = (state.inventory[resultPayload.name] || 0) + 1;
        if (!state.discoveredItems.includes(resultPayload.name)) {
            state.discoveredItems.push(resultPayload.name);
        }
        const itemRarity = getItemRarity(resultPayload.name);
        const itemValue = itemRarity ? getItemSellValue(resultPayload.name) : 0;
        state.stats.totalPullValue += itemValue;
        if (resultPayload.rarity === "rare") unlockCrate("rare");
        if (resultPayload.rarity === "epic") unlockCrate("epic");
        if (resultPayload.rarity === "legendary" || resultPayload.rarity === "lebron") unlockCrate("legendary");
        if (resultPayload.rarity === "mythical") unlockCrate("mythical");

    } else if (resultPayload.type === 'crate') {
        const crateTypeToGive = resultPayload.crateType || resultPayload.rarity;
        state.crateCount[crateTypeToGive] = (state.crateCount[crateTypeToGive] || 0) + 1;
        state.stats.totalPullValue += crateShopValues.standard[resultPayload.rarity] || 0;
        unlockCrate(resultPayload.rarity);
    } else if (resultPayload.type === 'potion') {
        state.potions[resultPayload.name] = (state.potions[resultPayload.name] || 0) + 1;
        if (!state.discoveredPotions.includes(resultPayload.name)) {
            state.discoveredPotions.push(resultPayload.name);
        }
        state.stats.totalPullValue += getPotionSellValue(resultPayload.name) || 0;
    }
}

export async function openSingleCrate(type: CrateType) {
    if(state.crateCount[type] <= 0){ showToast("No crates left!", 'error'); return; }
    state.crateCount[type]--;
    applyWildMagicEffect();
    state.stats.cratesOpened++;

    let crateValue = 0;
    if (type.includes('_')) {
        const [category, rarity] = type.split('_');
        crateValue = crateShopValues[category][rarity] || 0;
    } else {
        crateValue = crateShopValues.standard[type] || 0;
    }
    state.stats.totalCrateValue += crateValue;


    if (state.rebirthUpgrades.crateBounties > 0) {
      const coinGain = 5;
      state.coins += coinGain;
      state.stats.lifetimeCoins += coinGain;
      showToast(`+${coinGain} coin from Crate Bounty!`, 'success');
    }

    const resultPayload = getCrateResult(type);
    
    if (!resultPayload) {
        console.error(`Could not generate a result for a ${type} crate. Check item data.`);
        showToast("There was an error opening the crate.", "error");
        state.crateCount[type]++; // Give the crate back
        return;
    }

    processCrateResult(resultPayload);
    updateAllUI();

    const modal = getElement('crate-modal');
    modal.classList.remove('hidden');
    getElement('animation-container').classList.remove('hidden');
    getElement('result-container').classList.add('hidden');
    
    try {
        await playCrateOpenAnimation(type, resultPayload.rarity);
    } catch (error) {
        console.error("Crate animation failed, skipping to result.", error);
    } finally {
        showCrateResult(resultPayload);
    }
}

export function openAllCrates(type: CrateType) {
    const count = state.crateCount[type] || 0;
    if (count <= 0) {
        showToast("No crates to open!", 'error');
        return;
    }

    const fee = state.rebirthUpgrades.crateBounties > 0 ? 0 : Math.ceil(count / 5);
    if (state.coins < fee) {
        showToast(`Not enough coins! Need ${fee} to open all.`, 'error');
        return;
    }

    state.coins -= fee;
    state.crateCount[type] = 0; // Use them all up
    applyWildMagicEffect();
    
    const results = [];
    let coinsGainedFromBounty = 0;
    let failedOpens = 0;

    let crateValue = 0;
    if (type.includes('_')) {
        const [category, rarity] = type.split('_');
        crateValue = crateShopValues[category]?.[rarity] || 0;
    } else {
        crateValue = crateShopValues.standard[type] || 0;
    }

    for (let i = 0; i < count; i++) {
        state.stats.cratesOpened++;
        state.stats.totalCrateValue += crateValue;
        if (state.rebirthUpgrades.crateBounties > 0) coinsGainedFromBounty += 5;
      
        const resultPayload = getCrateResult(type);
        if (resultPayload) {
            processCrateResult(resultPayload);
            results.push(resultPayload);
        } else {
            failedOpens++;
        }
    }
    
    if (failedOpens > 0) {
         state.crateCount[type] += failedOpens;
         showToast(`${failedOpens} crate(s) failed to open and were returned.`, 'error');
    }

    if (state.rebirthUpgrades.crateBounties > 0 && coinsGainedFromBounty > 0) {
         state.coins += coinsGainedFromBounty;
         state.stats.lifetimeCoins += coinsGainedFromBounty;
         showToast(`+${coinsGainedFromBounty} coins from Crate Bounties!`, 'success');
    }
    
    updateAllUI();
    showMultiCrateResult(results);
}


export function buyCrate(type: CrateType) {
    let discount = state.rebirthUpgrades.shopHaggler * 0.2;
    const merchantWisdom = state.activePotions.merchantWisdom;
    if (merchantWisdom && merchantWisdom.timeLeft > 0) {
        discount += merchantWisdom.buyDiscount;
    }

    let cost = 0;
    let category, rarity;
    if (type.includes('_')) {
        [category, rarity] = type.split('_');
        cost = crateShopValues[category]?.[rarity] || 99999;
    } else {
        rarity = type;
        cost = crateShopValues.standard[rarity] || 99999;
    }

    const finalCost = Math.ceil(cost * (1 - discount));

    if (state.coins < finalCost) {
        showToast("Not enough coins!", 'error');
        return;
    }
    applyWildMagicEffect();
    state.coins -= finalCost;
    state.crateCount[type] = (state.crateCount[type] || 0) + 1;
    
    if (!type.includes('common') && !type.includes('basic')) {
         unlockCrate(rarity);
    }

    showToast(`Purchased a crate!`, 'success');
    updateAllUI();
}

export function tickFreeCrateTimer() {
    if (state.freeCrateTimer > 0) {
        const speedMultiplier = 1 + (state.rebirthUpgrades.speedyCrates * 0.25);
        state.freeCrateTimer -= speedMultiplier;
    }

    if (state.freeCrateTimer <= 0) {
        const freeCratePool: { type: CrateType, weight: number }[] = [
            { type: 'basic', weight: 70 },
            { type: 'rare', weight: 15 },
            { type: 'weapon_common', weight: 5 },
            { type: 'armor_common', weight: 5 },
            { type: 'potion_common', weight: 5 },
        ];

        const totalWeight = freeCratePool.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        let chosenCrate: CrateType = 'basic'; // Default
        for (const item of freeCratePool) {
            if (random < item.weight) {
                chosenCrate = item.type;
                break;
            }
            random -= item.weight;
        }

        state.freeCratesToClaim.push(chosenCrate);
        
        if (state.freeCratesToClaim.length > 100) {
            state.freeCratesToClaim.shift();
        }

        state.nextCrateDelay += 5;
        state.freeCrateTimer = state.nextCrateDelay;
        updateFreeCrateDisplay();
    }
    getElement("timer").innerText = Math.ceil(state.freeCrateTimer).toString();
}

export function claimFreeCrates() {
    if(state.freeCratesToClaim.length <= 0) {
      showToast("No free crates to claim.", 'error');
      return;
    }
    applyWildMagicEffect();
    
    const claimedSummary: Record<string, number> = {};
    state.freeCratesToClaim.forEach(crateType => {
        state.crateCount[crateType] = (state.crateCount[crateType] || 0) + 1;
        claimedSummary[crateType] = (claimedSummary[crateType] || 0) + 1;
    });

    state.freeCratesToClaim = [];
    state.nextCrateDelay = 30; // Reset delay after claiming

    const summaryText = Object.entries(claimedSummary)
        .map(([type, count]) => `${count}x ${type.replace(/_/g, ' ')}`)
        .join(', ');
    showToast(`Claimed: ${summaryText}!`, 'success');
    updateAllUI();
}