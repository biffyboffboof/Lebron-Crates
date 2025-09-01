import { state } from './state';
import { getItemSellValue, getPotionSellValue } from './data';

/**
 * A strongly-typed utility function to get an element by its ID.
 * Throws an error if the element is not found, ensuring type safety downstream.
 * @param id The ID of the element to find.
 * @returns The found HTMLElement.
 */
export function getElement<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) {
        throw new Error(`Element with id "${id}" not found`);
    }
    return el as T;
}

/**
 * Selects a random item from an array.
 * @param arr The array to select from.
 * @returns A random item from the array.
 */
export function randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Selects a random item from an array based on weights.
 * The weight is determined by a provided function.
 * @param items The array of items to select from.
 * @param getWeight A function that returns the weight for a given item.
 * @returns A randomly selected item from the array, or null if the input array is empty.
 */
export function weightedRandomItem<T extends string>(items: T[], getWeight: (item: T) => number): T | null {
    if (!items || items.length === 0) {
        return null;
    }

    const weightedItems = items.map(item => ({ item, weight: getWeight(item) })).filter(x => x.weight > 0);

    if (weightedItems.length === 0) {
        // If all items have 0 or negative weight, fall back to uniform random on the original list
        return randomItem(items);
    }
    
    const totalWeight = weightedItems.reduce((sum, { weight }) => sum + weight, 0);

    if (totalWeight <= 0) {
        return randomItem(items);
    }
    
    let random = Math.random() * totalWeight;
    let weightSum = 0;

    for (const { item, weight } of weightedItems) {
        weightSum += weight;
        if (random < weightSum) {
            return item;
        }
    }
    
    // Fallback: should be extremely rare if logic is correct, but handles floating point edge cases.
    return weightedItems[weightedItems.length - 1].item;
}


/**
 * Creates a promise that resolves after a specified number of milliseconds.
 * Useful for creating delays with async/await.
 * @param ms The number of milliseconds to wait.
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function calculateNetWorth(): number {
    let totalValue = state.coins + state.gambledCoins + (state.tradingCash * state.tcExchangeRate);
    for (const itemName in state.inventory) {
        const count = state.inventory[itemName];
        if (count !== 0) {
            totalValue += count * getItemSellValue(itemName);
        }
    }
    for (const potionName in state.potions) {
        const count = state.potions[potionName];
        if (count !== 0) {
            totalValue += count * getPotionSellValue(potionName);
        }
    }
    for (const item of state.selectedForGamble) {
         const value = item.type === 'item' ? getItemSellValue(item.name) : getPotionSellValue(item.name);
         totalValue += item.amount * value;
    }
    // Add market portfolio value
    for (const assetId in state.marketPortfolio) {
        const portfolioItem = state.marketPortfolio[assetId];
        const price = state.marketAssets[assetId]?.currentPrice || 0;
        totalValue += (portfolioItem.quantity * price) * state.tcExchangeRate; // This handles long (+) and short (-) positions correctly as a liability
    }
    for (const assetId in state.shortCollateral) {
        totalValue += state.shortCollateral[assetId] * state.tcExchangeRate;
    }

    return Math.floor(totalValue);
}

export function showConfirmationModal(title: string, message: string): Promise<boolean> {
    return new Promise((resolve) => {
        const modal = getElement('confirm-modal');
        const titleEl = getElement('confirm-modal-title');
        const messageEl = getElement('confirm-modal-text');
        const confirmBtn = getElement('confirm-modal-yes-btn') as HTMLButtonElement;
        const cancelBtn = getElement('confirm-modal-no-btn') as HTMLButtonElement;

        titleEl.textContent = title;
        messageEl.innerHTML = message;

        const onConfirm = () => cleanup(true);
        const onCancel = () => cleanup(false);

        function cleanup(result: boolean) {
            confirmBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
            modal.classList.add('hidden');
            resolve(result);
        }
        
        // Use { once: true } to automatically remove the listeners after they're called
        confirmBtn.addEventListener('click', onConfirm, { once: true });
        cancelBtn.addEventListener('click', onCancel, { once: true });

        modal.classList.remove('hidden');
    });
}