import { state } from './state';
import { itemData, potions } from './data';
import { showToast, showCrateResult, showWillyVoteModal } from './ui';
import { playCrateOpenAnimation } from './animation';
import { getElement } from './utils';

export async function redeemCode(code: string): Promise<void> {
    if (!code) {
        showToast('Please enter a code.', 'error');
        return;
    }
    const normalizedCode = code.trim();
    if (state.redeemedCodes.includes(normalizedCode)) {
        showToast('You have already redeemed this code.', 'error');
        return;
    }

    let validCode = false;
    switch (normalizedCode) {
        case 'CoinsCoins':
            state.coins += 20;
            state.stats.lifetimeCoins += 20;
            showToast('You received 20 coins!', 'success');
            validCode = true;
            break;
        case 'SkibidiRizzler67':
            state.inventory['LeBron James'] = (state.inventory['LeBron James'] || 0) + 1;
            showToast('You received LeBron James!', 'success');
            const modal = getElement('crate-modal');
            modal.classList.remove('hidden');
            getElement('animation-container').classList.remove('hidden');
            getElement('result-container').classList.add('hidden');
            await playCrateOpenAnimation('legendary', 'lebron');
            showCrateResult({ type: 'item', name: 'LeBron James', rarity: 'lebron' });
            validCode = true;
            break;
        case 'CraftCraft':
            if (state.craftingUnlocked) {
                showToast('Crafting is already unlocked.', 'error');
            } else {
                state.craftingUnlocked = true;
                state.potionCraftingUnlockedThisLife = true;
                showToast('Crafting and Potion Crafting have been unlocked!', 'success');
                validCode = true;
            }
            break;
        case 'Add It':
            for (const itemName in itemData) {
                if (itemName !== "LeBron James") {
                    state.inventory[itemName] = 99;
                }
            }
            for (const potionName in potions) {
                state.potions[potionName] = 99;
            }
            showToast('Received 99 of almost everything!', 'success');
            validCode = true;
            break;
        case 'Brawl':
            state.brawlUnlockedOverride = true;
            state.brawlCooldowns = {};
            showToast('All brawl restrictions lifted for this session!', 'success');
            validCode = true;
            break;
        case 'TradeTime':
            state.tradingCash += 100;
            showToast('You received 100 TC!', 'success');
            validCode = true;
            break;
        case 'WC4HocoKing':
            showWillyVoteModal();
            validCode = true;
            break;
        default:
            showToast('Invalid code.', 'error');
            break;
    }

    if (validCode) {
        state.redeemedCodes.push(normalizedCode);
    }
}