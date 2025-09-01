import { state } from './state';
import { getItemSellValue, getPotionSellValue, getPotionData, getItemCategory, itemData } from './data';
import { showToast } from './ui';
import { GambledItem, CrateType, ItemCategory } from './types';
import { claimFreeCrates } from './crates';
import { updateMarketPrices } from './market';

export function applyWildMagicEffect() {
    const wildMagic = state.activePotions.wildMagic;
    if (wildMagic && wildMagic.timeLeft > 0) {
        const { min, max } = wildMagic;
        const coinChange = Math.floor(Math.random() * (max - min + 1)) + min;
        state.coins += coinChange;
        if (coinChange > 0) {
            state.stats.lifetimeCoins += coinChange;
            showToast(`Wild magic grants you ${coinChange} coins!`, 'success');
        } else if (coinChange < 0) {
            showToast(`Wild magic costs you ${-coinChange} coins!`, 'error');
        }
    }
}

export function sellItem(name: string, count: number) {
  if ((state.inventory[name] || 0) < count) return false;
  applyWildMagicEffect();

  let bonusMultiplier = 1 + (state.rebirthUpgrades.goldenTouch * 0.25);
  const merchantWisdom = state.activePotions.merchantWisdom;
  if (merchantWisdom && merchantWisdom.timeLeft > 0) {
      bonusMultiplier += merchantWisdom.sellBonus;
  }

  const sellValue = Math.ceil(getItemSellValue(name) * bonusMultiplier);
  const totalGain = count * sellValue;

  state.coins += totalGain;
  state.inventory[name] -= count;
  if (state.equippedWeapon === name && state.inventory[name] <= 0) {
      equipWeapon(null); // Unequip if all are sold
  }
   if (state.equippedArmor === name && state.inventory[name] <= 0) {
      equipArmor(null); // Unequip if all are sold
  }
  state.stats.lifetimeCoins += totalGain;
  return true;
}

export function sellPotion(name: string, count: number) {
  if ((state.potions[name] || 0) < count) return false;
  applyWildMagicEffect();

  let bonusMultiplier = 1 + (state.rebirthUpgrades.goldenTouch * 0.25);
  const merchantWisdom = state.activePotions.merchantWisdom;
  if (merchantWisdom && merchantWisdom.timeLeft > 0) {
      bonusMultiplier += merchantWisdom.sellBonus;
  }

  const sellValue = Math.ceil(getPotionSellValue(name) * bonusMultiplier);
  const totalGain = count * sellValue;

  state.coins += totalGain;
  state.potions[name] -= count;
  state.stats.lifetimeCoins += totalGain;
  return true;
}

export function sellAllItems() {
    let totalValue = 0;
    let itemsSold = 0;
    
    let bonusMultiplier = 1 + (state.rebirthUpgrades.goldenTouch * 0.25);
    const merchantWisdom = state.activePotions.merchantWisdom;
    if (merchantWisdom && merchantWisdom.timeLeft > 0) {
        bonusMultiplier += merchantWisdom.sellBonus;
    }
    
    // Sell all regular items
    for (const name in state.inventory) {
        const count = state.inventory[name];
        if (count > 0) {
            const sellValue = Math.ceil(getItemSellValue(name) * bonusMultiplier);
            totalValue += count * sellValue;
            itemsSold += count;
            state.inventory[name] = 0;
            if (state.equippedWeapon === name) {
                equipWeapon(null);
            }
            if (state.equippedArmor === name) {
                equipArmor(null);
            }
        }
    }

    // Sell all potions
     for (const name in state.potions) {
        const count = state.potions[name];
        if (count > 0) {
            const sellValue = Math.ceil(getPotionSellValue(name) * bonusMultiplier);
            totalValue += count * sellValue;
            itemsSold += count;
            state.potions[name] = 0;
        }
    }

    if (itemsSold === 0) {
        showToast("You have nothing to sell.", 'error');
        return;
    }

    applyWildMagicEffect();
    state.coins += totalValue;
    state.stats.lifetimeCoins += totalValue;
    showToast(`Sold all ${itemsSold} items for ${totalValue} coins!`, 'success');
}

export function gambleAll() {
    let itemsToGambleCount = 0;
    const collections: { source: Record<string, number>, type: GambledItem['type'] }[] = [
        { source: state.inventory, type: 'item' },
        { source: state.potions, type: 'potion' }
    ];

    collections.forEach(({ source, type }) => {
        for (const name in source) {
            const amount = source[name];
            if (amount > 0) { // Can only gamble items you have
                itemsToGambleCount += amount;
                const existing = state.selectedForGamble.find(i => i.name === name && i.type === type);
                if (existing) {
                    existing.amount += amount;
                } else {
                    state.selectedForGamble.push({ name, amount, type });
                }
                source[name] = 0;
            }
        }
    });

    if (state.equippedWeapon) {
        equipWeapon(null);
        showToast('Equipped weapon was added to the gamble.', 'success');
    }
    if (state.equippedArmor) {
        equipArmor(null);
        showToast('Equipped armor was added to the gamble.', 'success');
    }

    if (itemsToGambleCount === 0 && state.coins <= 0) {
        showToast("Nothing to gamble!", 'error');
        return;
    }
    if (state.coins > 0) {
        state.gambledCoins += state.coins;
        state.coins = 0;
    }
    state.isAllIn = true;
    showToast("ALL IN! 3x items and coins on win!", 'success');
}

export function equipWeapon(weaponName: string | null) {
    if (weaponName && (state.inventory[weaponName] || 0) <= 0) {
        showToast("You don't own this weapon.", 'error');
        return;
    }
    
    // Unequip current weapon if there is one
    if (state.equippedWeapon) {
        // Logically, no state changes needed for the old weapon, just for the new one.
    }
    
    state.equippedWeapon = weaponName;
    
    if (weaponName) {
        showToast(`Equipped ${weaponName}.`, 'success');
    } else {
        showToast('Weapon unequipped.', 'success');
    }
}

export function equipArmor(armorName: string | null) {
    if (armorName && (state.inventory[armorName] || 0) <= 0) {
        showToast("You don't own this armor.", 'error');
        return;
    }
    state.equippedArmor = armorName;
    if (armorName) {
        showToast(`Equipped ${armorName}.`, 'success');
    } else {
        showToast('Armor unequipped.', 'success');
    }
}


export function usePotion(potionName: string) {
    if ((state.potions[potionName] || 0) <= 0) return;
    
    const potionData = getPotionData(potionName);
    if (!potionData) return;

    // Disallow using combat potions outside of combat
    if (potionData.effect.type.startsWith('brawl_')) {
        showToast("This potion can only be used in a brawl.", 'error');
        return;
    }

    const { effect } = potionData;
    let effectName = potionName;

    const potionEffectTypesWithDuration = ['luckBoost', 'wildMagic', 'craftingCostReduction', 'autoClaim', 'merchantWisdom', 'highStakes', 'lebronHunter', 'invisibility'];
    
    if (potionEffectTypesWithDuration.includes(effect.type)) {
        const existingEffect = state.activePotions[effect.type];
        if (existingEffect) {
            if (effect.type === 'luckBoost') {
                if ((existingEffect.stacks || 0) >= existingEffect.maxStacks) {
                    showToast(`No effect: ${existingEffect.name} is already at maximum stacks!`, 'error');
                    return;
                }
            } else { 
                const maxDuration = effect.duration * (effect.maxStacks || 1);
                if (maxDuration > 0 && existingEffect.timeLeft >= maxDuration) {
                     showToast(`No effect: ${existingEffect.name} is already at maximum duration!`, 'error');
                    return;
                }
            }
        }
    }

    state.potions[potionName]--;
    
    if (effect.type === 'luckBoost') {
        const existingEffect = state.activePotions.luckBoost;
        if (existingEffect) {
            existingEffect.stacks++;
            if (effect.value > existingEffect.baseValue) {
                existingEffect.baseValue = effect.value;
                existingEffect.name = effectName;
                existingEffect.emoji = potionData.emoji;
            }
            existingEffect.value = existingEffect.baseValue * existingEffect.stacks;
            existingEffect.timeLeft = effect.duration;
            showToast(`${potionName} increased Luck to +${existingEffect.value}%!`, 'success');
        } else {
            state.activePotions.luckBoost = {
                name: effectName,
                emoji: potionData.emoji,
                timeLeft: effect.duration,
                baseValue: effect.value,
                stacks: 1,
                ...effect
            };
            showToast(`Used ${potionName}! Effect will last for ${effect.duration / 60} minutes.`, 'success');
        }
    } else if (potionEffectTypesWithDuration.includes(effect.type)) {
        const existingEffect = state.activePotions[effect.type];
        if (existingEffect) {
            const maxDuration = effect.duration * (effect.maxStacks || 1);
            const newDuration = existingEffect.timeLeft + effect.duration;
            existingEffect.timeLeft = maxDuration > 0 ? Math.min(newDuration, maxDuration) : newDuration;
            
            if (effect.value && (!existingEffect.value || effect.value >= existingEffect.value)) {
                existingEffect.name = effectName;
                existingEffect.emoji = potionData.emoji;
                Object.assign(existingEffect, effect);
            }

            showToast(`${potionName} extended ${existingEffect.name}!`, 'success');
        } else {
            state.activePotions[effect.type] = {
                name: effectName,
                emoji: potionData.emoji,
                timeLeft: effect.duration,
                ...effect
            };
            showToast(`Used ${potionName}! The effect will last for ${effect.duration / 60} minutes.`, 'success');
        }
    } else {
        // Instant effects
        switch (effect.type) {
            case 'timeSkip':
                let secondsToSkip = effect.minutes * 60;

                // Tower of Bots
                let towerPlaysGained = 0;
                if (state.towerOfBotsPlays < state.towerOfBotsMaxPlays) {
                    state.towerOfBotsNextPlayTimer -= secondsToSkip;
                    while(state.towerOfBotsNextPlayTimer <= 0 && state.towerOfBotsPlays < state.towerOfBotsMaxPlays) {
                        state.towerOfBotsPlays++;
                        towerPlaysGained++;
                        state.towerOfBotsNextPlayTimer += 1800; // 30 mins
                    }
                }

                // Market
                const marketUpdates = Math.min(1000, Math.floor(secondsToSkip / 3));
                for (let i = 0; i < marketUpdates; i++) {
                    updateMarketPrices();
                }

                // Brawl Cooldowns
                for (const rarity in state.brawlCooldowns) {
                    if (state.brawlCooldowns[rarity]) {
                        state.brawlCooldowns[rarity] -= secondsToSkip * 1000;
                    }
                }

                // Crates
                let cratesGained = 0;
                let tempTimer = state.freeCrateTimer;
                let tempDelay = state.nextCrateDelay;
                let timeHolder = secondsToSkip;

                while (timeHolder > 0) {
                    if (timeHolder >= tempTimer) {
                        timeHolder -= tempTimer;
                        cratesGained++;
                        tempDelay += 5;
                        tempTimer = tempDelay;
                    } else {
                        tempTimer -= timeHolder;
                        timeHolder = 0;
                    }
                }
                if (cratesGained > 0) {
                    const freeCratePool: { type: CrateType, weight: number }[] = [
                        { type: 'basic', weight: 70 },
                        { type: 'rare', weight: 15 },
                        { type: 'weapon_common', weight: 5 },
                        { type: 'armor_common', weight: 5 },
                        { type: 'potion_common', weight: 5 },
                    ];
                    const totalWeight = freeCratePool.reduce((sum, item) => sum + item.weight, 0);

                    for (let i = 0; i < cratesGained; i++) {
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
                    }
                }
                state.freeCrateTimer = tempTimer;
                state.nextCrateDelay = tempDelay;
                
                // Potions
                let potionsSkipped = 0;
                for (const effectType in state.activePotions) {
                    const activeEffect = state.activePotions[effectType];
                    activeEffect.timeLeft -= secondsToSkip;
                    if (activeEffect.timeLeft <= 0) {
                        delete state.activePotions[effectType];
                        potionsSkipped++;
                    }
                }

                // If auto-claim is active, claim the newly generated crates
                const autoClaim = state.activePotions.autoClaim;
                if (autoClaim && autoClaim.timeLeft > 0 && state.freeCratesToClaim.length > 0) {
                    claimFreeCrates();
                }

                let toastMessage = `Warped time by ${effect.minutes} minutes! Gained ${cratesGained} free crates.`;
                if (towerPlaysGained > 0) toastMessage += ` Gained ${towerPlaysGained} Tower play(s).`;
                if (potionsSkipped > 0) toastMessage += ` ${potionsSkipped} potion effects expired.`;
                else if (Object.keys(state.activePotions).length > 0) toastMessage += ` Potion timers reduced.`
                toastMessage += ` Brawl cooldowns reduced.`;
                showToast(toastMessage, 'success');
                break;
            case 'instant_crate':
                for (let i = 0; i < effect.amount; i++) {
                    state.freeCratesToClaim.push(effect.crateType);
                     if (state.freeCratesToClaim.length > 100) {
                        state.freeCratesToClaim.shift();
                    }
                }
                showToast(`You attract ${effect.amount} ${effect.crateType} crates!`, 'success');
                break;
        }
    }
}