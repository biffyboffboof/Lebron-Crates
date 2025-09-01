import { state } from './state';
import { BRAWL_OPPONENTS, BRAWL_BARS, getWeaponData, potions, getPotionData, getItemRarity, itemData, BRAWL_ITEM_EFFECTS } from './data';
import { getElement, sleep, randomItem, calculateNetWorth } from './utils';
// FIX: Added updateAllUI and unlockCrate to imports
import { updateAllUI, unlockCrate, showBrawlSelectionModal, hideBrawlSelectionModal, showBrawlItemModal, hideBrawlItemModal } from './ui';
import { BrawlRarity, CrateType, BrawlReward, Rarity, BrawlOpponent } from './types';

let brawlContinueAction = 'end'; // can be 'next_stage' or 'end'

function setBrawlButtonsDisabled(disabled: boolean) {
    (getElement('brawl-attack-btn') as HTMLButtonElement).disabled = disabled;
    (getElement('brawl-shield-btn') as HTMLButtonElement).disabled = disabled;
    (getElement('brawl-item-btn') as HTMLButtonElement).disabled = disabled;
    (getElement('brawl-potion-btn') as HTMLButtonElement).disabled = disabled;
    (getElement('brawl-run-btn') as HTMLButtonElement).disabled = disabled;
}

function addToBrawlLog(message: string, type: 'normal' | 'crit' | 'special' | 'status' = 'normal') {
    const logEl = getElement('brawl-log');
    const p = document.createElement('p');
    if (type === 'crit') p.classList.add('log-crit');
    if (type === 'special') p.classList.add('log-special');
    if (type === 'status') p.classList.add('log-status');
    p.innerHTML = message; // Use innerHTML to support simple styling
    logEl.prepend(p);
}

function updateBrawlUI() {
    const { playerHealth, playerMaxHealth, playerShield, opponent, opponentHealth, opponentShield, playerEffects, opponentEffects, rarity, currentStage, playerStamina, playerMaxStamina } = state.brawlState;
    
    getElement('brawl-player-health-text').textContent = `${playerHealth} / ${playerMaxHealth}`;
    (getElement('brawl-player-health-bar') as HTMLElement).style.width = `${(playerHealth / playerMaxHealth) * 100}%`;
    getElement('brawl-player-stamina-text').textContent = `${playerStamina} / ${playerMaxStamina}`;
    (getElement('brawl-player-stamina-bar') as HTMLElement).style.width = `${(playerStamina / playerMaxStamina) * 100}%`;
    getElement('brawl-player-shield').textContent = playerShield.toString();

    const playerBuffsContainer = getElement('brawl-player-buffs');
    playerBuffsContainer.innerHTML = '';
    for (const effect in playerEffects) {
        const { turns } = playerEffects[effect];
        let emoji = '✨';
        if (effect === 'damage_boost') emoji = '💪';
        if (effect === 'defense_boost') emoji = '🛡️';
        if (effect === 'guaranteed_crit') emoji = '⚡';
        if (effect === 'max_hp_boost') emoji = '❤️';
        if (effect === 'stun') emoji = '😵';
        if (effect === 'attack_down') emoji = '⚔️-';
        if (effect === 'bleed') emoji = '🩸';
        if (effect === 'lifesteal') emoji = '🦇';
        if (effect === 'berserk') emoji = '😡';
        playerBuffsContainer.innerHTML += `<div class="brawl-buff-badge">${emoji} ${effect.replace('_', ' ')} (${turns}t)</div>`;
    }

    if (opponent) {
        const isBoss = BRAWL_OPPONENTS[rarity].bosses[currentStage + 1] !== undefined;
        let opponentName = opponent.name;
        if (isBoss) {
            opponentName = `<strong>🔥 BOSS 🔥</strong> ${opponent.name}`;
        }

        getElement('brawl-opponent-name').innerHTML = `${opponentName} (Stage ${state.brawlState.currentStage + 1})`;
        getElement('brawl-opponent-emoji').textContent = opponent.emoji;
        getElement('brawl-opponent-health-text').textContent = `${opponentHealth} / ${opponent.health}`;
        (getElement('brawl-opponent-health-bar') as HTMLElement).style.width = `${(opponentHealth / opponent.health) * 100}%`;
        getElement('brawl-opponent-shield').textContent = opponentShield.toString();
        (getElement('brawl-opponent-shield-container') as HTMLElement).style.display = opponentShield > 0 ? 'flex' : 'none';

        const opponentBuffsContainer = getElement('brawl-opponent-buffs');
        opponentBuffsContainer.innerHTML = '';
        for (const effect in opponentEffects) {
            const { turns } = opponentEffects[effect];
            let emoji = '✨';
            if (effect === 'burn') emoji = '🔥';
            if (effect === 'poison') emoji = '☠️';
            if (effect === 'stun') emoji = '😵';
            if (effect === 'bleed') emoji = '🩸';
            if (effect === 'charging') emoji = '🔋';
            if (effect === 'attack_up') emoji = '⚔️+';
            if (effect === 'defense_up') emoji = '🛡️+';
            if (effect === 'cursed') emoji = '👿';
            opponentBuffsContainer.innerHTML += `<div class="brawl-buff-badge">${emoji} ${effect.replace('_', ' ')} (${turns}t)</div>`;
        }
    }
}

function loadOpponent() {
    const { brawlState } = state;
    const currentTavern = BRAWL_OPPONENTS[brawlState.rarity];
    const stage = brawlState.currentStage + 1;

    let opponentTemplate: BrawlOpponent | null = null;

    // Check for boss stage
    if (currentTavern.bosses[stage]) {
        opponentTemplate = { ...currentTavern.bosses[stage] };
    } else {
        // Not a boss, pick from pool
        const opponentPool = currentTavern.pool;
        const opponentIndex = Math.min(brawlState.currentStage, opponentPool.length - 1);
        const baseOpponent = opponentPool[opponentIndex];
        
        // Scale up for very high stages that reuse pool monsters
        if (brawlState.currentStage >= opponentPool.length) {
            const stageMultiplier = 1 + (brawlState.currentStage - opponentPool.length + 1) * 0.2;
            opponentTemplate = {
                ...baseOpponent,
                name: `Enraged ${baseOpponent.name}`,
                health: Math.floor(baseOpponent.health * stageMultiplier),
                damageRange: [
                    Math.floor(baseOpponent.damageRange[0] * stageMultiplier),
                    Math.floor(baseOpponent.damageRange[1] * stageMultiplier),
                ],
            };
        } else {
             opponentTemplate = { ...baseOpponent };
        }
    }
    
    brawlState.opponent = opponentTemplate;
    
    // Initialize cooldowns for abilities
    if (brawlState.opponent.abilities) {
        brawlState.opponent.abilities.forEach(a => a.currentCooldown = 0);
    }
    
    brawlState.opponentHealth = brawlState.opponent.health;
    brawlState.opponentShield = 0;
}

export function initiateBrawl(rarity: BrawlRarity, startingStage: number) {
    hideBrawlSelectionModal();
    brawlContinueAction = 'end';
    
    const tavernBrawlerTier = state.rebirthUpgrades.tavernBrawler;
    const startingShield = tavernBrawlerTier > 0 ? [10, 25, 50][tavernBrawlerTier - 1] : 0;
    
    state.brawlState = {
        isActive: true,
        playerHealth: 100,
        playerMaxHealth: 100,
        playerShield: startingShield,
        playerStamina: 100,
        playerMaxStamina: 100,
        consecutiveShields: 0,
        opponent: null,
        opponentHealth: 0,
        opponentShield: 0,
        currentStage: startingStage,
        rewards: [],
        rarity: rarity,
        playerEffects: {},
        opponentEffects: {},
    };
    
    loadOpponent();
    getElement('container').classList.add('hidden');
    getElement('brawl-screen').classList.remove('hidden');
    getElement('brawl-end-screen').classList.add('hidden');
    getElement('brawl-actions').classList.remove('hidden');
    getElement('brawl-log').innerHTML = '';
    addToBrawlLog(`A challenger approaches: <strong>${state.brawlState.opponent.name}</strong>!`);
    
    setBrawlButtonsDisabled(false);
    updateBrawlUI();
}

function closeBrawlScreen() {
    state.brawlState.isActive = false;
    getElement('brawl-screen').classList.add('hidden');
    getElement('container').classList.remove('hidden');
    updateAllUI();
}

function tickEffects(entity: 'player' | 'opponent') {
    const effects = entity === 'player' ? state.brawlState.playerEffects : state.brawlState.opponentEffects;
    
    if (entity === 'player') {
        // Tavern Brawler passive regen
        const tavernBrawlerTier = state.rebirthUpgrades.tavernBrawler;
        if (tavernBrawlerTier > 0) {
            const regenPercent = [2, 4, 6][tavernBrawlerTier - 1] / 100;
            const healAmount = Math.ceil(state.brawlState.playerMaxHealth * regenPercent);
            if (healAmount > 0 && state.brawlState.playerHealth < state.brawlState.playerMaxHealth) {
                const newHealth = Math.min(state.brawlState.playerMaxHealth, state.brawlState.playerHealth + healAmount);
                const healedAmount = newHealth - state.brawlState.playerHealth;
                 if (healedAmount > 0) {
                    state.brawlState.playerHealth = newHealth;
                    addToBrawlLog(`Tavern Brawler restores <strong>${healedAmount} HP</strong>.`, 'status');
                }
            }
        }

        const immortality = state.activePotions.immortality;
        if (immortality && immortality.timeLeft > 0 && immortality.hpRegen > 0) {
            const newHealth = Math.min(state.brawlState.playerMaxHealth, state.brawlState.playerHealth + immortality.hpRegen);
            const healedAmount = newHealth - state.brawlState.playerHealth;
            if (healedAmount > 0) {
                state.brawlState.playerHealth = newHealth;
                addToBrawlLog(`Elixir of Life restores <strong>${immortality.hpRegen} HP</strong>.`, 'status');
            }
        }
    }

    for (const effectName in effects) {
        const effect = effects[effectName];
        
        // Handle damage-over-time effects at the start of the turn
        if (['poison', 'burn', 'bleed', 'cursed'].includes(effectName)) {
            const damage = effect.damage;
            let targetHealth = 0;
            if (entity === 'player') {
                state.brawlState.playerHealth -= damage;
                targetHealth = state.brawlState.playerHealth;
                addToBrawlLog(`You take ${damage} ${effectName} damage.`, 'status');
            } else {
                state.brawlState.opponentHealth -= damage;
                targetHealth = state.brawlState.opponentHealth;
                addToBrawlLog(`<strong>${state.brawlState.opponent.name}</strong> takes ${damage} ${effectName} damage.`, 'status');
            }
             if (targetHealth <= 0) return; // Stop processing if DoT is lethal
        }

        effect.turns--;
        if (effect.turns < 0) {
            // Handle effect expiration
            if (effectName === 'max_hp_boost' && entity === 'player') {
                state.brawlState.playerMaxHealth -= effect.amount;
                state.brawlState.playerHealth = Math.min(state.brawlState.playerHealth, state.brawlState.playerMaxHealth);
            }
            addToBrawlLog(`${entity === 'player' ? 'Your' : 'The opponent\'s'} ${effectName.replace(/_/g, ' ')} effect wore off.`, 'status');
            delete effects[effectName];
        }
    }
}


async function opponentTurn() {
    const { opponent, opponentEffects } = state.brawlState;

    setBrawlButtonsDisabled(true);
    await sleep(1000);

    tickEffects('opponent');
    if (state.brawlState.opponentHealth <= 0) {
        handleVictory();
        return;
    }
    if (opponentEffects['stun']){
        addToBrawlLog(`<strong>${opponent.name}</strong> is stunned!`, 'status');
        tickEffects('player');
        updateBrawlUI();
        setBrawlButtonsDisabled(false);
        return;
    }

    // AI: Check for charge attack release
    if (opponentEffects['charging']) {
        const chargeData = opponentEffects['charging'];
        delete opponentEffects['charging'];
        await performOpponentAttack({ damageMultiplier: chargeData.value, isSpecial: true, logMessage: `unleashes its charged attack` });
    } else {
        // AI: Decide action
        let actionTaken = false;
        if (opponent.abilities) {
            // Cooldown reduction
            opponent.abilities.forEach(a => { if(a.currentCooldown > 0) a.currentCooldown--; });
            // Use ability?
            for (const ability of opponent.abilities) {
                if (!ability.currentCooldown || ability.currentCooldown <= 0) {
                    if (Math.random() < ability.chance) {
                        actionTaken = true;
                        ability.currentCooldown = ability.cooldown;
                        switch (ability.type) {
                            case 'shield':
                                state.brawlState.opponentShield += ability.value;
                                addToBrawlLog(`<strong>${opponent.name}</strong> raises its shield for <strong>${ability.value}</strong> block!`, 'special');
                                break;
                            case 'heavy_hit':
                                await performOpponentAttack({ damageMultiplier: ability.value, isSpecial: true });
                                break;
                            case 'lifesteal_hit':
                                await performOpponentAttack({ lifesteal: ability.value, isSpecial: true, logMessage: `drains your life force` });
                                break;
                            case 'multi_hit':
                                addToBrawlLog(`<strong>${opponent.name}</strong> uses a flurry of blows!`, 'special');
                                for(let i=0; i < ability.hits; i++) {
                                    await sleep(300);
                                    await performOpponentAttack({ damageMultiplier: 0.6 }); // Multi-hits do less damage each
                                    if(state.brawlState.playerHealth <= 0) break;
                                }
                                break;
                            case 'burn':
                                 state.brawlState.playerEffects['burn'] = { turns: ability.turns, damage: ability.value };
                                 addToBrawlLog(`<strong>${opponent.name}</strong> uses a fire spell! You are burning!`, 'special');
                                 break;
                            case 'bleed':
                                state.brawlState.playerEffects['bleed'] = { turns: ability.turns, damage: ability.value };
                                addToBrawlLog(`<strong>${opponent.name}</strong> inflicts a deep wound! You are bleeding!`, 'special');
                                break;
                            case 'stun_chance':
                                 addToBrawlLog(`<strong>${opponent.name}</strong> attempts a stunning blow!`, 'special');
                                 await performOpponentAttack({ stunChance: 1.0 }); // Guaranteed stun chance roll
                                 break;
                            case 'buff':
                                opponentEffects[`${ability.buffType}_up`] = { turns: ability.turns, value: ability.value };
                                addToBrawlLog(`<strong>${opponent.name}</strong> uses ${ability.buffType} buff!`, 'special');
                                break;
                            case 'debuff':
                                state.brawlState.playerEffects[`${ability.debuffType}_down`] = { turns: ability.turns, value: ability.value };
                                addToBrawlLog(`<strong>${opponent.name}</strong> weakens your ${ability.debuffType}!`, 'special');
                                break;
                            case 'charge_attack':
                                opponentEffects['charging'] = { turns: 2, value: ability.value }; // 2 turns so it wears off next turn
                                addToBrawlLog(`<strong>${opponent.name}</strong> begins to gather immense power!`, 'special');
                                break;
                            case 'heal':
                                const healAmount = ability.value;
                                state.brawlState.opponentHealth = Math.min(state.brawlState.opponent.health, state.brawlState.opponentHealth + healAmount);
                                addToBrawlLog(`<strong>${opponent.name}</strong> heals for <strong>${healAmount} HP</strong>!`, 'status');
                                break;
                        }
                        break; 
                    }
                }
            }
        }

        if (!actionTaken) {
           await performOpponentAttack({});
        }
    }

    tickEffects('player');

    // Passive Stamina Regen
    const staminaRegen = 10;
    state.brawlState.playerStamina = Math.min(state.brawlState.playerMaxStamina, state.brawlState.playerStamina + staminaRegen);

    updateBrawlUI();

    if (state.brawlState.playerHealth <= 0) {
        handleDefeat();
    } else {
        setBrawlButtonsDisabled(false);
    }
}

async function performOpponentAttack({ damageMultiplier = 1, stunChance = 0, isSpecial = false, lifesteal = 0, logMessage = 'attacks' }) {
    const { opponent, playerShield, playerEffects, opponentEffects } = state.brawlState;
    const defenseBoost = playerEffects['defense_boost']?.multiplier || 1;
    const berserkDebuff = playerEffects['berserk']?.defenseMultiplier || 1;
    const attackBuff = opponentEffects['attack_up']?.value || 1;

    let opponentBaseDamage = Math.floor(Math.random() * (opponent.damageRange[1] - opponent.damageRange[0] + 1)) + opponent.damageRange[0];
    opponentBaseDamage = Math.round(opponentBaseDamage * damageMultiplier * attackBuff);
    
    // Crit roll
    let isCrit = false;
    if (Math.random() < (opponent.critChance || 0)) {
        isCrit = true;
        opponentBaseDamage = Math.round(opponentBaseDamage * (opponent.critMultiplier || 1.5));
    }
    
    const finalDamage = Math.round(opponentBaseDamage * defenseBoost * berserkDebuff);
    
    let damageToShield = Math.min(playerShield, finalDamage);
    state.brawlState.playerShield -= damageToShield;
    
    let damageToPlayer = finalDamage - damageToShield;
    state.brawlState.playerHealth -= damageToPlayer;
    
    let message = `<strong>${opponent.name}</strong> ${logMessage} for <strong>${finalDamage}</strong> damage.`;
    if(isCrit) message = `<span class="log-crit">CRITICAL HIT!</span> ` + message;
    if(defenseBoost < 1) message += ` You mitigate some damage.`
    if(berserkDebuff > 1) message += ` Your rage makes you reckless!`
    if(damageToShield > 0) message += ` Your shield absorbs <strong>${damageToShield}</strong>.`
    addToBrawlLog(message, isCrit ? 'crit' : (isSpecial ? 'special' : 'normal'));

    // Thorns effect
    if (state.equippedArmor === "Spiked Shield" && damageToPlayer > 0) {
        const reflectedDamage = Math.round(finalDamage * 0.20); // 20% of pre-mitigation damage
        if (reflectedDamage > 0) {
            state.brawlState.opponentHealth -= reflectedDamage;
            addToBrawlLog(`Your <strong>Spiked Shield</strong> reflects <strong>${reflectedDamage}</strong> damage back!`, 'special');
            updateBrawlUI(); // Update UI immediately after reflection
        }
    }

    if (lifesteal > 0) {
        const healedAmount = Math.round(damageToPlayer * lifesteal);
        if (healedAmount > 0) {
            state.brawlState.opponentHealth = Math.min(opponent.health, state.brawlState.opponentHealth + healedAmount);
            addToBrawlLog(`<strong>${opponent.name}</strong> healed for <strong>${healedAmount}</strong> HP.`, 'status');
        }
    }

    if ((isCrit || stunChance > 0) && Math.random() < (stunChance || 0.25)) {
        state.brawlState.playerEffects['stun'] = { turns: 1 };
        addToBrawlLog('You have been stunned!', 'status');
    }

    await sleep(500);
}

function setBrawlCooldown(rarity: BrawlRarity) {
    if (!rarity) return;
    const bar = BRAWL_BARS[rarity];
    const { min, max } = bar.cooldownMinutes;
    let cooldownMs = (Math.random() * (max - min) + min) * 60 * 1000;

    const immortality = state.activePotions.immortality;
    if (immortality && immortality.timeLeft > 0) {
        cooldownMs /= 2;
    }

    state.brawlCooldowns[rarity] = Date.now() + cooldownMs;
}

function generateBrawlRewards(rewardConfig: BrawlReward, isFirstTime: boolean): any[] {
    const earnedRewards = [];
    const coinMultiplier = isFirstTime ? 1.5 : 0.2;
    const chanceMultiplier = isFirstTime ? 2.0 : 0.25;

    if (rewardConfig.coins) {
        const [min, max] = rewardConfig.coins;
        const amount = Math.floor(Math.random() * (max - min + 1)) + min;
        earnedRewards.push({ type: 'coins', name: 'Coins', amount: Math.ceil(amount * coinMultiplier) });
    }
    if (rewardConfig.items) {
        rewardConfig.items.forEach(itemDrop => {
            if (Math.random() < Math.min(1.0, itemDrop.chance * chanceMultiplier)) {
                const name = randomItem(itemDrop.pool);
                const [min, max] = itemDrop.amount;
                const amount = Math.floor(Math.random() * (max - min + 1)) + min;
                earnedRewards.push({ type: 'item', name, amount });
            }
        });
    }
    if (rewardConfig.potions) {
        rewardConfig.potions.forEach(potionDrop => {
            if (Math.random() < Math.min(1.0, potionDrop.chance * chanceMultiplier)) {
                const name = randomItem(potionDrop.pool);
                const [min, max] = potionDrop.amount;
                const amount = Math.floor(Math.random() * (max - min + 1)) + min;
                earnedRewards.push({ type: 'potion', name, amount });
            }
        });
    }
    if (rewardConfig.crates) {
        rewardConfig.crates.forEach(crateDrop => {
            if (Math.random() < Math.min(1.0, crateDrop.chance * chanceMultiplier)) {
                const [min, max] = crateDrop.amount;
                const amount = Math.floor(Math.random() * (max - min + 1)) + min;
                const crateType = crateDrop.type as CrateType;
                earnedRewards.push({ type: 'crate', name: `${crateType.replace(/_/g, ' ')} Crate`, crateType, amount });
            }
        });
    }
    return earnedRewards;
}

function setupNextStage() {
    const healAmount = Math.floor(state.brawlState.playerMaxHealth * 0.1);
    state.brawlState.playerHealth = Math.min(state.brawlState.playerMaxHealth, state.brawlState.playerHealth + healAmount);
    state.brawlState.currentStage++;
    loadOpponent();
    getElement('brawl-log').innerHTML = '';
    addToBrawlLog(`You heal for <strong>${healAmount} HP</strong>. A new challenger approaches: <strong>${state.brawlState.opponent.name}</strong>!`);
    getElement('brawl-end-screen').classList.add('hidden');
    getElement('brawl-actions').classList.remove('hidden');
    updateBrawlUI();
    setBrawlButtonsDisabled(false);
}

function handleVictory() {
    const { opponent, rarity, currentStage } = state.brawlState;
    const stageNum = currentStage + 1;
    setBrawlCooldown(rarity);

    if (stageNum === 30) {
        brawlContinueAction = 'end';
        state.brawlTavernsBeaten[rarity] = true;
        const newRewards = generateBrawlRewards(opponent.rewards, true); // Final boss is always first-time rewards
        newRewards.forEach(reward => state.brawlState.rewards.push({ ...reward }));
        
        getElement('brawl-end-title').textContent = "TAVERN CONQUERED!";
        let rewardsText = `<h3>You defeated ${opponent.name} and conquered the ${BRAWL_BARS[rarity].name}!</h3>`;
        if(newRewards.length > 0) {
            rewardsText += `<p>Grand Prize: ${newRewards.map(r => `${r.name} x${r.amount}`).join(', ')}</p>`;
        }
        getElement('brawl-rewards-summary').innerHTML = rewardsText;
        getElement('brawl-penalty-summary').textContent = '';
        getElement('brawl-close-btn').textContent = "Claim Grand Prize & End";
    } else {
        brawlContinueAction = 'next_stage';
        const isFirstTimeClear = currentStage > state.brawlProgress[rarity];
        if (isFirstTimeClear) {
            state.brawlProgress[rarity] = currentStage;
        }
        
        const newRewards = generateBrawlRewards(opponent.rewards, isFirstTimeClear);
        newRewards.forEach(reward => {
            const existingReward = state.brawlState.rewards.find(r => r.name === reward.name && r.type === reward.type);
            if (existingReward) {
                existingReward.amount += reward.amount;
            } else {
                state.brawlState.rewards.push({ ...reward });
            }
        });
        
        getElement('brawl-end-title').textContent = "Victory!";
        let rewardsText = `<h3>Stage ${currentStage + 1} Clear!</h3>`;
        if(newRewards.length > 0) {
            rewardsText += `<p>Reward: ${newRewards.map(r => `${r.name} x${r.amount}`).join(', ')}</p>`;
        } else {
            rewardsText += `<p>No rewards this time.</p>`;
        }
        getElement('brawl-rewards-summary').innerHTML = rewardsText;
        getElement('brawl-penalty-summary').textContent = '';
        getElement('brawl-close-btn').textContent = "Next Stage";
    }

    getElement('brawl-actions').classList.add('hidden');
    getElement('brawl-end-screen').classList.remove('hidden');
}

function handleDefeat() {
    brawlContinueAction = 'end';
    setBrawlCooldown(state.brawlState.rarity);
    const immortality = state.activePotions.immortality;
    let penaltyText = '';

    if (immortality && immortality.timeLeft > 0) {
        penaltyText = 'Your Elixir of Life protects you from the consequences of defeat!';
    } else {
        const coinsLost = Math.floor(state.coins * 0.1);
        state.coins -= coinsLost;
        penaltyText = `You lost ${coinsLost} coins.`;

        const netWorth = calculateNetWorth();
        const itemsLost: string[] = [];
        let lostItem = false;

        const loseItemOfRarity = (rarity: Rarity): boolean => {
            const items = Object.keys(state.inventory).filter(name => state.inventory[name] > 0 && itemData[name]?.rarity === rarity && name !== 'LeBron James');
            if (items.length > 0) {
                const itemToLose = randomItem(items);
                state.inventory[itemToLose]--;
                itemsLost.push(itemToLose);
                return true;
            }
            return false;
        };
        
        if (netWorth > 5000) {
            lostItem = loseItemOfRarity('legendary') || loseItemOfRarity('epic');
        } else if (netWorth > 1000) {
            lostItem = loseItemOfRarity('epic') || loseItemOfRarity('rare');
        } else if (netWorth > 100) {
            lostItem = loseItemOfRarity('rare');
        }

        // Fallback to common items
        if (!lostItem) {
            if (loseItemOfRarity('common')) {
                if (netWorth > 100) {
                    loseItemOfRarity('common');
                }
            }
        }

        if(itemsLost.length > 0) {
            penaltyText += ` You also dropped: ${itemsLost.join(', ')}.`;
        }
    }

    const endScreen = getElement('brawl-end-screen');
    getElement('brawl-end-title').textContent = "You have been defeated!";
    getElement('brawl-rewards-summary').innerHTML = '';
    getElement('brawl-penalty-summary').textContent = penaltyText;
    getElement('brawl-close-btn').textContent = "Continue";
    getElement('brawl-actions').classList.add('hidden');
    endScreen.classList.remove('hidden');
}

function handleRunSuccess() {
    brawlContinueAction = 'end';
    setBrawlCooldown(state.brawlState.rarity);
    
    state.brawlState.rewards.forEach(reward => {
        if (reward.type === 'item') {
            state.inventory[reward.name] = (state.inventory[reward.name] || 0) + reward.amount;
            if (!state.discoveredItems.includes(reward.name)) {
                state.discoveredItems.push(reward.name);
            }
        } else if (reward.type === 'potion') {
            state.potions[reward.name] = (state.potions[reward.name] || 0) + reward.amount;
            if (!state.discoveredPotions.includes(reward.name)) {
                state.discoveredPotions.push(reward.name);
            }
        } else if (reward.type === 'crate') {
            const crateType = reward.crateType as CrateType;
            state.crateCount[crateType] = (state.crateCount[crateType] || 0) + reward.amount;
            // FIX: Replaced incorrect getItemRarity call with logic to extract rarity from crateType.
            const rarity = crateType.split('_').pop() as Rarity;
            if (crateType !== 'basic' && !crateType.includes('common')) {
                unlockCrate(rarity);
            }
        } else if (reward.type === 'coins') {
            const immortality = state.activePotions.immortality;
            let coinBonus = 1.0;
            if (immortality && immortality.timeLeft > 0) {
                coinBonus += immortality.coinBonus;
            }
            state.coins += Math.ceil(reward.amount * coinBonus);
        }
    });

    const endScreen = getElement('brawl-end-screen');
    getElement('brawl-end-title').textContent = "Successfully Escaped!";
    
    let rewardsText = "<h3>Rewards Acquired:</h3>";
    if(state.brawlState.rewards.length > 0) {
       rewardsText += state.brawlState.rewards.map(r => `${r.name} x${r.amount}`).join('<br>');
    } else {
       rewardsText += "<p>None this time.</p>";
    }
    getElement('brawl-rewards-summary').innerHTML = rewardsText;
    getElement('brawl-penalty-summary').textContent = '';
    getElement('brawl-close-btn').textContent = "Continue";
    getElement('brawl-actions').classList.add('hidden');
    endScreen.classList.remove('hidden');
}

export function useBrawlItem(itemName: string) {
    if ((state.inventory[itemName] || 0) <= 0) return;
    const effect = BRAWL_ITEM_EFFECTS[itemName];
    if (!effect) return;

    hideBrawlItemModal();
    setBrawlButtonsDisabled(true);

    state.inventory[itemName]--;
    addToBrawlLog(effect.log);
    
    let isAction = true;

    if(effect.type === 'heal') {
        state.brawlState.playerHealth = Math.min(state.brawlState.playerMaxHealth, state.brawlState.playerHealth + effect.value);
    } else if (effect.type === 'damage') {
        state.brawlState.opponentHealth -= effect.value;
    } else if (effect.type === 'run_boost') {
        state.brawlState.playerEffects['run_boost'] = { turns: 1, value: effect.value }; // lasts for 1 attempt
        isAction = false; // Using smoke bomb doesn't cost a turn
    } else if (effect.type === 'shield') {
        state.brawlState.playerShield += effect.value;
    } else if (effect.type === 'stamina_restore') {
        state.brawlState.playerStamina = Math.min(state.brawlState.playerMaxStamina, state.brawlState.playerStamina + effect.value);
    }

    updateBrawlUI();
    
    if (isAction) {
        setTimeout(() => {
            if (state.brawlState.opponentHealth <= 0) {
                handleVictory();
            } else {
                opponentTurn();
            }
        }, 500);
    } else {
        setBrawlButtonsDisabled(false);
    }
}

export function useBrawlPotion(potionName: string) {
    if ((state.potions[potionName] || 0) <= 0) return;
    const potionData = getPotionData(potionName);
    if (!potionData || !potionData.effect.type.startsWith('brawl_')) return;

    hideBrawlItemModal();
    setBrawlButtonsDisabled(true);
    state.potions[potionName]--;
    const { playerEffects } = state.brawlState;
    const effect = potionData.effect;

    switch(effect.type) {
        case 'brawl_heal':
            state.brawlState.playerHealth = Math.min(state.brawlState.playerMaxHealth, state.brawlState.playerHealth + effect.amount);
            addToBrawlLog(`You drink the ${potionName}, recovering <strong>${effect.amount}</strong> HP.`);
            break;
        case 'brawl_stamina_restore':
            state.brawlState.playerStamina = Math.min(state.brawlState.playerMaxStamina, state.brawlState.playerStamina + effect.amount);
            addToBrawlLog(`You drink the ${potionName}, recovering <strong>${effect.amount}</strong> Stamina.`);
            break;
        case 'brawl_damage_boost':
            playerEffects['damage_boost'] = { turns: effect.turns, multiplier: effect.multiplier };
            addToBrawlLog(`You drink the ${potionName}, feeling stronger!`, 'status');
            break;
        case 'brawl_defense_boost':
            playerEffects['defense_boost'] = { turns: effect.turns, multiplier: effect.multiplier };
            addToBrawlLog(`You drink the ${potionName}, your skin hardens!`, 'status');
            break;
        case 'brawl_guaranteed_crit':
            playerEffects['guaranteed_crit'] = { turns: effect.turns };
            addToBrawlLog(`You drink the ${potionName}, feeling precise!`, 'status');
            break;
        case 'brawl_max_hp_boost':
            playerEffects['max_hp_boost'] = { turns: effect.turns, amount: effect.amount };
            state.brawlState.playerMaxHealth += effect.amount;
            state.brawlState.playerHealth += effect.amount;
            addToBrawlLog(`You drink the ${potionName}, feeling fortified!`, 'status');
            break;
        case 'brawl_apply_poison':
            playerEffects['apply_poison'] = { turns: 1, damage: effect.damage, duration: effect.turns };
            addToBrawlLog(`You drink the ${potionName}, your weapon drips with venom!`, 'status');
            break;
        case 'brawl_berserk':
            playerEffects['berserk'] = { turns: effect.turns, damageMultiplier: effect.damageMultiplier, defenseMultiplier: effect.defenseMultiplier };
            addToBrawlLog(`You drink the ${potionName}, flying into a rage!`, 'status');
            break;
        case 'brawl_lifesteal':
            playerEffects['lifesteal'] = { turns: effect.turns, value: effect.value };
            addToBrawlLog(`You drink the ${potionName}, feeling a dark thirst...`, 'status');
            break;
    }
    
    updateBrawlUI();
    setTimeout(() => opponentTurn(), 500);
}

// UI Handlers
export async function handlePlayerAttack() {
    if (state.brawlState.playerEffects['stun']) {
        addToBrawlLog("You are stunned and cannot act!", 'status');
        opponentTurn(); // Ticks player effects
        return;
    }

    const staminaCost = 20;
    if (state.brawlState.playerStamina < staminaCost) {
        addToBrawlLog("Not enough stamina to attack!", 'status');
        return;
    }

    setBrawlButtonsDisabled(true);
    state.brawlState.playerStamina -= staminaCost;

    let baseDamage = 5;
    let critChance = 0.05;
    let critMultiplier = 1.5;

    if (state.equippedWeapon) {
        const weaponData = getWeaponData(state.equippedWeapon);
        if (weaponData) {
            baseDamage += weaponData.damage || 0;
            critChance += weaponData.critChanceBonus || 0;
            critMultiplier += weaponData.critMultiplierBonus || 0;
        }
    }
    
    const damageBoost = state.brawlState.playerEffects['damage_boost'];
    const berserkBuff = state.brawlState.playerEffects['berserk'];
    const attackDebuff = state.brawlState.playerEffects['attack_down']?.value || 1;
    let finalDamage = Math.round(baseDamage * (damageBoost ? damageBoost.multiplier : 1) * (berserkBuff ? berserkBuff.damageMultiplier : 1) * attackDebuff);

    let isCrit = false;
    if (state.brawlState.playerEffects['guaranteed_crit'] || Math.random() < critChance) {
        isCrit = true;
        finalDamage = Math.round(finalDamage * critMultiplier);
        delete state.brawlState.playerEffects['guaranteed_crit'];
    }

    // Apply poison if active
    const poisonEffect = state.brawlState.playerEffects['apply_poison'];
    if (poisonEffect) {
        state.brawlState.opponentEffects['poison'] = { turns: poisonEffect.duration, damage: poisonEffect.damage };
        addToBrawlLog(`You poison the enemy!`, 'status');
        delete state.brawlState.playerEffects['apply_poison'];
    }
    
    // Lifesteal
    const lifestealEffect = state.brawlState.playerEffects['lifesteal'];
    let healedAmount = 0;
    if (lifestealEffect) {
        healedAmount = Math.round(finalDamage * lifestealEffect.value);
        if (healedAmount > 0) {
            state.brawlState.playerHealth = Math.min(state.brawlState.playerMaxHealth, state.brawlState.playerHealth + healedAmount);
        }
    }

    let damageToShield = Math.min(state.brawlState.opponentShield, finalDamage);
    state.brawlState.opponentShield -= damageToShield;

    let damageToOpponent = finalDamage - damageToShield;
    state.brawlState.opponentHealth -= damageToOpponent;

    let attackMessage = `You attack for <strong>${finalDamage}</strong> damage.`;
    if (isCrit) attackMessage = `<span class="log-crit">CRITICAL HIT!</span> ` + attackMessage;
    if (damageToShield > 0) attackMessage += ` Opponent's shield absorbs <strong>${damageToShield}</strong>.`;
    if (healedAmount > 0) attackMessage += ` You heal for <strong>${healedAmount}</strong> HP.`;
    
    addToBrawlLog(attackMessage, isCrit ? 'crit' : 'normal');

    // Handle weapon specific effects
    if (state.equippedWeapon === "Warlock's Blade" && Math.random() < 0.25) { // 25% chance
        state.brawlState.opponentEffects['cursed'] = { turns: 3, damage: 5 };
        addToBrawlLog(`Your Warlock's Blade curses the opponent!`, 'status');
    }

    updateBrawlUI();
    await sleep(500);

    if (state.brawlState.opponentHealth <= 0) {
        handleVictory();
    } else {
        await opponentTurn();
    }
}

export async function handlePlayerShield() {
    if (state.brawlState.playerEffects['stun']) {
        addToBrawlLog("You are stunned and cannot act!", 'status');
        await opponentTurn();
        return;
    }
    setBrawlButtonsDisabled(true);

    const staminaGain = 15;
    state.brawlState.playerStamina = Math.min(state.brawlState.playerMaxStamina, state.brawlState.playerStamina + staminaGain);

    const shieldValue = 15;
    state.brawlState.playerShield += shieldValue;
    state.brawlState.consecutiveShields++;
    let shieldMessage = `You raise your shield, gaining <strong>${shieldValue}</strong> block.`;
    if (state.brawlState.consecutiveShields >= 3) {
        shieldMessage += ` You are feeling tired from defending.`;
    }
    addToBrawlLog(shieldMessage, 'special');
    
    updateBrawlUI();
    await sleep(500);
    await opponentTurn();
}

export async function handlePlayerRun() {
    if (state.brawlState.playerEffects['stun']) {
        addToBrawlLog("You are stunned and cannot act!", 'status');
        await opponentTurn();
        return;
    }
    setBrawlButtonsDisabled(true);

    let runChance = 0.5;
    const runBoost = state.brawlState.playerEffects['run_boost'];
    if (runBoost) {
        runChance += runBoost.value;
        delete state.brawlState.playerEffects['run_boost'];
    }
    
    if (Math.random() < runChance) {
        addToBrawlLog("You successfully escaped!", 'status');
        handleRunSuccess();
    } else {
        addToBrawlLog("You failed to escape!", 'status');
        await opponentTurn();
    }
}

export function handleBrawlClose() {
    if (brawlContinueAction === 'next_stage') {
        setupNextStage();
    } else {
        // Claim rewards and close
        state.brawlState.rewards.forEach(reward => {
            if (reward.type === 'item') {
                state.inventory[reward.name] = (state.inventory[reward.name] || 0) + reward.amount;
                if (!state.discoveredItems.includes(reward.name)) {
                    state.discoveredItems.push(reward.name);
                }
            } else if (reward.type === 'potion') {
                state.potions[reward.name] = (state.potions[reward.name] || 0) + reward.amount;
                 if (!state.discoveredPotions.includes(reward.name)) {
                    state.discoveredPotions.push(reward.name);
                }
            } else if (reward.type === 'crate') {
                const crateType = reward.crateType as CrateType;
                state.crateCount[crateType] = (state.crateCount[crateType] || 0) + reward.amount;
                const rarity = crateType.split('_').pop() as Rarity;
                if (crateType !== 'basic' && !crateType.includes('common')) {
                   unlockCrate(rarity);
                }
            } else if (reward.type === 'coins') {
                 const immortality = state.activePotions.immortality;
                let coinBonus = 1.0;
                if(immortality && immortality.timeLeft > 0){
                    coinBonus += immortality.coinBonus;
                }
                const finalCoins = Math.ceil(reward.amount * coinBonus);
                state.coins += finalCoins;
                state.stats.lifetimeCoins += finalCoins;
            }
        });
        closeBrawlScreen();
    }
}

export function handleUseItem() {
    showBrawlItemModal('item');
}

export function handleUsePotion() {
    showBrawlItemModal('potion');
}