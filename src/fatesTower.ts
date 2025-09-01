import { state } from './state';
// FIX: Removed imports from ui.ts to break circular dependency
import { showToast, showTowerOfBots, updateTowerOfBotsUI } from './ui';
import { TowerReward, Rarity, CrateType } from './types';
import { randomItem, showConfirmationModal } from './utils';
import { itemData, potions } from './data';

const CONTINUE_COSTS = [50, 200, 1000];

function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function generateReward(floor: number): TowerReward {
    const roll = Math.random() * 100;

    // Helper to get random items
    function getRandomItem(rarity: Rarity, category: 'good' | 'weapon' | 'armor') {
        const pool = Object.keys(itemData).filter(i => itemData[i].rarity === rarity && itemData[i].category === category);
        return pool.length > 0 ? randomItem(pool) : null;
    }
    function getRandomPotion(rarity: Rarity) {
        const pool = Object.keys(potions).filter(p => potions[p].rarity === rarity);
        return pool.length > 0 ? randomItem(pool) : null;
    }

    if (floor <= 5) { // Common tier
        if (roll < 40) { // 40% Coins
            return { type: 'coins', name: 'Coins', amount: Math.floor(5 + Math.random() * 5) };
        } else if (roll < 60) { // 20% Basic Crate
            return { type: 'crate', name: 'Basic Crate', crateType: 'basic', amount: 1, rarity: 'common' };
        } else if (roll < 80) { // 20% Common Good
            const item = getRandomItem('common', 'good');
            return { type: 'item', name: item || 'Dust Bunny', amount: 1, rarity: 'common' };
        } else { // 20% Common Weapon/Armor
            const item = Math.random() < 0.5 ? getRandomItem('common', 'weapon') : getRandomItem('common', 'armor');
            return { type: 'item', name: item || 'Broken Bottle', amount: 1, rarity: 'common' };
        }
    } else if (floor <= 15) { // Rare tier
        if (roll < 30) { // 30% Coins
            return { type: 'coins', name: 'Coins', amount: Math.floor(15 + Math.random() * 15) };
        } else if (roll < 50) { // 20% Rare Crate
            return { type: 'crate', name: 'Rare Crate', crateType: 'rare', amount: 1, rarity: 'rare' };
        } else if (roll < 70) { // 20% Rare Good
            const item = getRandomItem('rare', 'good');
            return { type: 'item', name: item || 'Antique Pocket Watch', amount: 1, rarity: 'rare' };
        } else if (roll < 90) { // 20% Rare Weapon/Armor
            const item = Math.random() < 0.5 ? getRandomItem('rare', 'weapon') : getRandomItem('rare', 'armor');
            return { type: 'item', name: item || 'Rusty Cutlass', amount: 1, rarity: 'rare' };
        } else { // 10% Ingredients/Potions
            if (Math.random() < 0.5) {
                const potion = getRandomPotion('common');
                return { type: 'item', name: potion || 'Minor Luck Potion', amount: 1, rarity: 'common' };
            } else {
                return { type: 'item', name: 'Composite Part', amount: 1, rarity: 'epic' };
            }
        }
    } else if (floor <= 29) { // Epic tier
        if (roll < 20) { // 20% Coins
            return { type: 'coins', name: 'Coins', amount: Math.floor(50 + Math.random() * 50) };
        } else if (roll < 45) { // 25% Epic Crate
            return { type: 'crate', name: 'Epic Crate', crateType: 'epic', amount: 1, rarity: 'epic' };
        } else if (roll < 65) { // 20% Epic Good
            const item = getRandomItem('epic', 'good');
            return { type: 'item', name: item || 'Hoverboard from the Future', amount: 1, rarity: 'epic' };
        } else if (roll < 90) { // 25% Epic Weapon/Armor
            const item = Math.random() < 0.5 ? getRandomItem('epic', 'weapon') : getRandomItem('epic', 'armor');
            return { type: 'item', name: item || 'Mjolnir Keychain', amount: 1, rarity: 'epic' };
        } else { // 10% Rare/Epic Potions
            const potionName = Math.random() < 0.5 ? getRandomPotion('rare') : getRandomPotion('epic');
            const potion = potionName || 'Luck Potion';
            return { type: 'item', name: potion, amount: 1, rarity: potions[potion]?.rarity || 'rare' };
        }
    } else { // Floor 30+ (Legendary tier)
        if (roll < 15) { // 15% Coins
            return { type: 'coins', name: 'Coins', amount: Math.floor(100 + Math.random() * 100) };
        } else if (roll < 45) { // 30% Legendary Crate
            return { type: 'crate', name: 'Legendary Crate', crateType: 'legendary', amount: 1, rarity: 'legendary' };
        } else if (roll < 65) { // 20% Legendary Good
            const item = getRandomItem('legendary', 'good');
            return { type: 'item', name: item || 'Grumpy Cat\'s Scowl', amount: 1, rarity: 'legendary' };
        } else if (roll < 90) { // 25% Legendary Weapon/Armor
            const item = Math.random() < 0.5 ? getRandomItem('legendary', 'weapon') : getRandomItem('legendary', 'armor');
            return { type: 'item', name: item || 'Excalibur', amount: 1, rarity: 'legendary' };
        } else { // 10% Epic/Legendary Potions
            const potionName = Math.random() < 0.5 ? getRandomPotion('epic') : getRandomPotion('legendary');
            const potion = potionName || 'Greater Luck Potion';
            return { type: 'item', name: potion, amount: 1, rarity: potions[potion]?.rarity || 'epic' };
        }
    }
}


function setupFloor(floor: number) {
    state.towerOfBotsState.currentFloor = floor;

    if (floor === 50) {
        state.towerOfBotsState.cards = ['lebron', 'reward', 'reward', 'reward'];
    } else if (floor % 5 === 0) {
        state.towerOfBotsState.cards = ['reward', 'reward', 'reward', 'reward'];
    } else {
        state.towerOfBotsState.cards = ['reward', 'reward', 'reward', 'lose'];
    }

    shuffleArray(state.towerOfBotsState.cards);
    state.towerOfBotsState.revealedCardIndex = null;
    state.towerOfBotsState.lossPending = false;
    delete state.towerOfBotsState.cardOutcomes;
}

function beginTowerRun(startingFloor: number = 1) {
     state.towerOfBotsState = {
        isActive: true,
        currentFloor: startingFloor,
        accumulatedRewards: [],
        cards: [],
        revealedCardIndex: null,
        continuesUsed: 0,
        lossPending: false,
    };
    setupFloor(startingFloor);
    showTowerOfBots();
    updateTowerOfBotsUI();
}

export async function startTowerOfBotsGame() {
    if (state.towerOfBotsPlays > 0) {
        state.towerOfBotsPlays--;
        beginTowerRun(1);
    } else {
        const confirmation = await showConfirmationModal(
            'No Free Plays',
            'You have no free plays for the Tower of Bots. Would you like to buy one for 100 coins?'
        );
        if (confirmation) {
            if (state.coins >= 100) {
                state.coins -= 100;
                beginTowerRun(1);
            } else {
                showToast('Not enough coins!', 'error');
            }
        }
    }
    // updateAllUI is not defined here, but will be called from index.tsx where this function is triggered.
}

export async function startTowerOfBotsGameWithShortcut() {
    const cost = 500;
    const confirmation = await showConfirmationModal(
        'Tower Shortcut',
        `This will cost ${cost} coins and start you at Floor 30. You will NOT receive any rewards from floors 1-29. This action does not use a free play. Continue?`
    );
    if (!confirmation) return;

    if (state.coins < cost) {
        showToast(`Not enough coins! Need ${cost}.`, 'error');
        return;
    }

    state.coins -= cost;
    showToast(`Paid ${cost} coins for the shortcut!`, 'success');
    beginTowerRun(30);
    // updateAllUI is not defined here, but will be called from index.tsx where this function is triggered.
}


export function pickCard(index: number) {
    if (state.towerOfBotsState.revealedCardIndex !== null) return;

    state.towerOfBotsState.revealedCardIndex = index;
    const pickedCardType = state.towerOfBotsState.cards[index];

    // Generate outcomes for all cards for display
    state.towerOfBotsState.cardOutcomes = state.towerOfBotsState.cards.map((type, i) => {
        if (type === 'lose') {
            return { type: 'lose', name: "Clanker" };
        }
        if (type === 'lebron') {
            const lebronReward: TowerReward = { type: 'item', name: 'LeBron James', amount: 1, rarity: 'lebron' };
             if (i === index) {
                state.towerOfBotsState.accumulatedRewards.push(lebronReward);
            }
            return lebronReward;
        }
        // It's a 'reward' card
        const reward = generateReward(state.towerOfBotsState.currentFloor);
        if (i === index) {
            state.towerOfBotsState.accumulatedRewards.push(reward);
        }
        return reward;
    });

    if (pickedCardType === 'lose') {
        state.towerOfBotsState.lossPending = true;
    } else {
        setTimeout(goToNextFloor, 2500);
    }
    updateTowerOfBotsUI();
}

function applyLossPenalties() {
    showToast("You hit a Clanker! You lose everything...", 'error');
    state.coins = 0;
    // Wipe common and rare items
    for (const itemName in state.inventory) {
        const item = itemData[itemName];
        if (item && (item.rarity === 'common' || item.rarity === 'rare')) {
            state.inventory[itemName] = 0;
        }
    }
    state.towerOfBotsState.accumulatedRewards = [];
}

export function leaveTower() {
    if (state.towerOfBotsState.lossPending) {
        applyLossPenalties();
    }
    
    if (state.towerOfBotsState.accumulatedRewards.length > 0) {
        let summary = 'Rewards claimed: ';
        state.towerOfBotsState.accumulatedRewards.forEach(reward => {
            summary += `${reward.amount}x ${reward.name}, `;
            switch (reward.type) {
                case 'coins':
                    state.coins += reward.amount;
                    state.stats.lifetimeCoins += reward.amount;
                    break;
                case 'crate':
                    state.crateCount[reward.crateType] = (state.crateCount[reward.crateType] || 0) + reward.amount;
                    break;
                case 'item':
                    state.inventory[reward.name] = (state.inventory[reward.name] || 0) + reward.amount;
                    break;
            }
        });
        showToast(summary.slice(0, -2) + '!', 'success');
    } else {
        showToast("You leave the tower with nothing.", 'success');
    }

    state.towerOfBotsState.isActive = false;
    // hideTowerOfBots and updateAllUI will be called from ui.ts where this function is triggered.
}

export function continueTowerAfterLoss() {
    const { continuesUsed } = state.towerOfBotsState;
    if (continuesUsed >= CONTINUE_COSTS.length) {
        showToast("No more continues allowed.", 'error');
        return;
    }
    const cost = CONTINUE_COSTS[continuesUsed];
    if (state.coins < cost) {
        showToast(`Not enough coins to continue! (Need ${cost})`, 'error');
        return;
    }

    state.coins -= cost;
    state.towerOfBotsState.continuesUsed++;
    state.towerOfBotsState.accumulatedRewards = []; // Lose accumulated rewards as penalty
    showToast(`Paid ${cost} coins to bypass the Clanker. Your rewards were lost.`, 'success');
    
    // Proceed to next floor
    goToNextFloor();
}


export function goToNextFloor() {
    if (state.towerOfBotsState.currentFloor === 50) {
        showToast("You've conquered the Tower of Bots! Claiming rewards...", 'success');
        leaveTower();
        return;
    }
    const nextFloor = state.towerOfBotsState.currentFloor + 1;
    setupFloor(nextFloor);
    updateTowerOfBotsUI();
}