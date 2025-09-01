import { state } from './state';
import { getItemSellValue, getPotionSellValue } from './data';
// FIX: Added updateAllUI to imports
import { showToast, showCoinFlipModal, hideCoinFlipModal, updateAllUI } from './ui';
import { playCoinFlipAnimation } from './animation';
import { getElement } from './utils';
import { GambledItem } from './types';
import { applyWildMagicEffect } from './inventory';
import { saveGame } from './saveload';

export function addToGamble({name, amount, type}: GambledItem) {
    const source = type === 'item' ? state.inventory : state.potions;
    if ((source[name] || 0) < amount) return; // not enough, handles debt
    source[name] -= amount;

    const found = state.selectedForGamble.find(x => x.name === name && x.type === type);
    if (found) {
        found.amount += amount;
    } else {
        state.selectedForGamble.push({ name, amount, type });
    }
}

export function addCoinsToGamble(amount: number) {
    if (amount <= 0 || !Number.isInteger(amount)) {
        showToast("Invalid amount.", 'error');
        return;
    }
    if (state.coins < amount) {
        showToast("Not enough coins!", 'error');
        return;
    }
    state.coins -= amount;
    state.gambledCoins += amount;
}

export function restoreSelection() {
    state.selectedForGamble.forEach(item => {
        const source = item.type === 'item' ? state.inventory : state.potions;
        source[item.name] = (source[item.name] || 0) + item.amount;
    });
    state.selectedForGamble = [];
    state.coins += state.gambledCoins;
    state.gambledCoins = 0;
    state.isAllIn = false;
    showToast("Restored selection to inventory.", 'success');
    updateAllUI();
}

export async function flipSelected(choice: 'heads' | 'tails') {
    if (state.selectedForGamble.length === 0 && state.gambledCoins === 0) return;
    applyWildMagicEffect();

    let totalGambledValue = state.gambledCoins;
    for (const item of state.selectedForGamble) {
        const value = item.type === 'item' ? getItemSellValue(item.name) : getPotionSellValue(item.name);
        totalGambledValue += item.amount * value;
    }
    state.stats.totalGambledValue += totalGambledValue;
    
    (getElement('headsBtn') as HTMLButtonElement).disabled = true;
    (getElement('tailsBtn') as HTMLButtonElement).disabled = true;
    (getElement('restoreBtn') as HTMLButtonElement).disabled = true;
    
    // --- All In Logic ---
    if (state.isAllIn) {
        const result = Math.random() < 0.5 ? "heads" : "tails";
        let message = `The coin landed on ${result.toUpperCase()}! `;
        showCoinFlipModal();
        await playCoinFlipAnimation(result);
        hideCoinFlipModal();

        if (choice === result) { // WIN ALL IN
            const winMultiplier = 3;
            state.selectedForGamble.forEach(itemObj => {
                const source = itemObj.type === 'item' ? state.inventory : state.potions;
                source[itemObj.name] = (source[itemObj.name] || 0) + itemObj.amount * winMultiplier;
            });
            const coinReturn = state.gambledCoins * winMultiplier;
            const coinProfit = coinReturn - state.gambledCoins;
            state.coins += coinReturn;
            state.stats.lifetimeCoins += coinProfit;
            state.stats.gamblesWon++;
            state.stats.totalWonValue += totalGambledValue * winMultiplier;
            showToast(message + `ALL IN WIN! You multiplied your gamble by ${winMultiplier}!`, 'success');
        } else { // LOSE ALL IN
            state.stats.gamblesLost++;
            showToast(message + "ALL IN LOSS! You lost everything.", 'error');
            // Items and coins are already removed from state, so nothing else to do.
        }

    } else { // --- Normal Gamble Logic ---
        const winChance = state.rebirthUpgrades.weightedCoin > 0 ? 0.53 : 0.5;
        const result = Math.random() < winChance ? "heads" : "tails";
        
        let message = `The coin landed on ${result.toUpperCase()}! `;
        showCoinFlipModal();
        await playCoinFlipAnimation(result);
        hideCoinFlipModal();
        
        const isHighStakes = state.activePotions.highStakes?.timeLeft > 0;
        const isInvisible = state.activePotions.invisibility?.timeLeft > 0;
        
        if (choice === result) { // WIN
            let winMultiplier = 2; // Default win multiplier
            if (isHighStakes) {
                // BUG FIX: Potion effect REPLACES the multiplier, not multiplies it.
                winMultiplier = state.activePotions.highStakes.winMultiplier;
            }
            
            state.selectedForGamble.forEach(itemObj => {
                const { name, amount, type } = itemObj;
                const source = type === 'item' ? state.inventory : state.potions;
                const discoveryList = type === 'item' ? state.discoveredItems : state.discoveredPotions;
                
                source[name] = (source[name] || 0) + amount * winMultiplier;

                if (!discoveryList.includes(name)) {
                    discoveryList.push(name);
                }
            });
            const coinReturn = state.gambledCoins * winMultiplier;
            const coinProfit = coinReturn - state.gambledCoins;
            state.coins += coinReturn;
            state.stats.lifetimeCoins += coinProfit;
            state.stats.gamblesWon++;
            state.stats.totalWonValue += totalGambledValue * winMultiplier;
            
            const winMessage = `You won and multiplied your gamble by ${winMultiplier}!`;
            showToast(message + winMessage, 'success');
            
        } else { // LOSS
            state.stats.gamblesLost++;
            
            if (state.canRedoCoinFlip > 0) {
                state.canRedoCoinFlip--;
                showToast(message + "You lost... but your Second Chance saves you! The items are returned.", 'success');
                restoreSelection();
                return; // Early exit, restoreSelection handles the rest
            } 
            
            let lossMultiplier = 1;
            if (isHighStakes) {
                lossMultiplier = state.activePotions.highStakes.lossMultiplier;
            }

            const allowDebt = isHighStakes || isInvisible;
            if (allowDebt) {
                let debtMessage = isHighStakes ? `Draught of Ruin caused a ${lossMultiplier}x loss!` : "Phantom Veil turned your loss to debt!";
                showToast(message + "You lost... " + debtMessage, 'error');
                
                state.selectedForGamble.forEach(itemObj => {
                    const source = itemObj.type === 'item' ? state.inventory : state.potions;
                    const finalLoss = itemObj.amount * lossMultiplier;
                    source[itemObj.name] -= (finalLoss - itemObj.amount); // Adjust for amount already removed
                });
                
                const coinFinalLoss = state.gambledCoins * lossMultiplier;
                state.coins -= (coinFinalLoss - state.gambledCoins); // Adjust for coins already removed
            
            } else if (state.rebirthUpgrades.gambleInsurance > 0 && !state.gambleInsuranceUsedThisLife) {
                state.gambleInsuranceUsedThisLife = true;
                const refund = Math.floor(totalGambledValue * 0.5);
                state.coins += refund;
                state.stats.lifetimeCoins += refund;
                showToast(message + `You lost... but Gamble Insurance refunded you ${refund} coins!`, 'success');
            } else {
                showToast(message + "You lost all selected items and coins.", 'error');
            }
        }
    }
    
    saveGame(); // AUTOSAVE after gamble
    
    state.selectedForGamble = [];
    state.gambledCoins = 0;
    state.isAllIn = false;

    (getElement('headsBtn') as HTMLButtonElement).disabled = false;
    (getElement('tailsBtn') as HTMLButtonElement).disabled = false;
    (getElement('restoreBtn') as HTMLButtonElement).disabled = false;
    updateAllUI();
}