import { state } from './state';
import { getItemSellValue, getPotionSellValue, getItemRarity, getItemCategory, getPotionData, potions, itemEmojis, UPGRADE_DEFINITIONS, ROMAN_NUMERALS, crateShopValues, BRAWL_BARS, itemData, BRAWL_ITEM_EFFECTS, crateEmojis, LOAN_OFFERS } from './data';
import { getElement, calculateNetWorth, showConfirmationModal } from './utils';
import { updateCraftingUI, checkPotionCraftingUnlock, craftItem, setSelectedRecipeId } from './crafting';
import { sellItem, sellPotion, usePotion, equipWeapon, equipArmor } from './inventory';
import { addToGamble, flipSelected, restoreSelection } from './gamble';
import { getCratePool, applyLuck } from './crates';
import { initiateBrawl, useBrawlItem, useBrawlPotion } from './brawl';
// FIX: Added MainView and CraftingSubView to imports
import { CrateType, InventorySubView, Rarity, CrateView, ConsumableSubView, ItemCategory, TowerReward, BrawlRarity, MainView, CraftingSubView } from './types';
import { pickCard, leaveTower, continueTowerAfterLoss } from './fatesTower';
import { takeLoan } from './market';

const CONTINUE_COSTS = [50, 200, 1000];
const CONVERSION_TAX = 0.02; // Base tax, can be reduced by upgrades

export const uiRarityColors: Record<string, string> = {
  common: 'var(--rarity-common)',
  rare: 'var(--rarity-rare)',
  epic: 'var(--rarity-epic)',
  legendary: 'var(--rarity-legendary)',
  mythical: 'var(--rarity-mythical)',
  lebron: 'var(--rarity-lebron)',
  ingredient: 'var(--rarity-epic)'
};

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const toastContainer = getElement('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

export function showAddCoinsModal() { getElement('add-coins-modal').classList.remove('hidden'); }
export function hideAddCoinsModal() { getElement('add-coins-modal').classList.add('hidden'); }
export function showCodeModal() { getElement('code-modal').classList.remove('hidden'); }
export function hideCodeModal() { getElement('code-modal').classList.add('hidden'); }
export function showStatsModal() {
    const { stats } = state;
    
    getElement('stat-lifetime-coins').textContent = stats.lifetimeCoins.toLocaleString();
    getElement('stat-peak-net-worth').textContent = stats.peakNetWorth.toLocaleString();
    getElement('stat-rebirths').textContent = stats.rebirths.toLocaleString();
    getElement('stat-crates-opened').textContent = stats.cratesOpened.toLocaleString();
    getElement('stat-total-gambled').textContent = stats.totalGambledValue.toLocaleString();
    getElement('stat-total-won').textContent = stats.totalWonValue.toLocaleString();
    
    const totalGambles = stats.gamblesWon + stats.gamblesLost;
    const winRate = totalGambles > 0 ? (stats.gamblesWon / totalGambles * 100).toFixed(1) + '%' : 'N/A';
    getElement('stat-gamble-win-rate').textContent = winRate;
    
    getElement('stat-market-pnl').textContent = `${stats.marketPnl.toFixed(2)} TC`;
    
    // Crate Luck
    const avgPullValue = stats.cratesOpened > 0 ? (stats.totalPullValue / stats.cratesOpened) : 0;
    const avgCrateCost = stats.cratesOpened > 0 ? (stats.totalCrateValue / stats.cratesOpened) : 0;
    const crateLuck = avgCrateCost > 0 ? (avgPullValue / avgCrateCost * 100).toFixed(1) + '%' : 'N/A';
    getElement('stat-crate-luck').textContent = crateLuck;

    // Overall Luck
    let luckScore = 0;
    if (avgCrateCost > 0) {
        luckScore += (avgPullValue / avgCrateCost - 1) * 50; // Max 50 points from crates
    }
    if (totalGambles > 10) { // Only count after 10 gambles
        luckScore += ((stats.gamblesWon / totalGambles) - 0.5) * 100; // Max 50 points from gambles
    }
    luckScore += state.stats.marketPnl / 10; // 1 point per 10 TC PNL
    const overallLuck = luckScore > 0 ? `+${luckScore.toFixed(0)}` : luckScore.toFixed(0);
    getElement('stat-overall-luck').textContent = `${overallLuck}`;

    getElement('stats-modal').classList.remove('hidden');
}
export function hideStatsModal() { getElement('stats-modal').classList.add('hidden'); }
export function showSaveLoadModal() { getElement('saveload-modal').classList.remove('hidden'); }
export function hideSaveLoadModal() { getElement('saveload-modal').classList.add('hidden'); }
export function showBrawlSelectionModal() { getElement('brawl-selection-modal').classList.remove('hidden'); }
export function hideBrawlSelectionModal() { getElement('brawl-selection-modal').classList.add('hidden'); }
export function showBrawlItemModal(type: 'item' | 'potion') {
    const modal = getElement('brawl-item-modal');
    const list = getElement('brawl-item-grid'); // Corrected ID
    list.innerHTML = '';
    const source = type === 'item' ? state.inventory : state.potions;
    const effectSource = type === 'item' ? BRAWL_ITEM_EFFECTS : potions;

    const items = Object.keys(source).filter(name => source[name] > 0 && effectSource[name]);

    if (items.length === 0) {
        list.innerHTML = `<p class="no-items-text">No usable ${type}s.</p>`;
    } else {
        items.forEach(name => {
            const button = document.createElement('button');
            const item = effectSource[name];
            const emoji = itemEmojis[name] || item.emoji || '❓';
            button.innerHTML = `
                <span class="emoji">${emoji}</span>
                <span>${name}</span>
                <span class="count">(x${source[name]})</span>
            `;
            button.onclick = () => {
                if (type === 'item') useBrawlItem(name);
                else useBrawlPotion(name);
            };
            list.appendChild(button);
        });
    }

    modal.classList.remove('hidden');
}
export function hideBrawlItemModal() { getElement('brawl-item-modal').classList.add('hidden'); }
export function showCrateInfoModal(crateType: CrateType) {
    const modal = getElement('crate-info-modal');
    const title = getElement('crate-info-title');
    const content = getElement('crate-info-content');

    title.textContent = `${crateType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Crate Contents`;

    let pool = getCratePool(crateType);
    if (!pool) {
        content.innerHTML = '<p>Could not load crate information.</p>';
        modal.classList.remove('hidden');
        return;
    }

    pool = applyLuck(pool);
    const totalChance = pool.reduce((acc, p) => acc + p.chance, 0);

    content.innerHTML = '<ul>' + pool.map(item => {
        const percentage = totalChance > 0 ? ((item.chance / totalChance) * 100).toFixed(2) : '0.00';
        let name = '';
        if (item.action === 'item') name = `${item.rarity} Item`;
        if (item.action === 'potion') name = `${item.rarity} Potion`;
        if (item.action === 'crate') name = `${item.rarity} Crate`;
        const rarityClass = item.rarity;

        return `<li><span class="${rarityClass}">${name}</span>: ${percentage}%</li>`;
    }).join('') + '</ul>';

     if (state.activePotions.luckBoost && state.activePotions.luckBoost.timeLeft > 0) {
        content.innerHTML += `<p class="luck-boost-text">Luck Boost (+${state.activePotions.luckBoost.value}%) is active, improving your odds!</p>`;
    }

    modal.classList.remove('hidden');
}
export function hideCrateInfoModal() { getElement('crate-info-modal').classList.add('hidden'); }
export function showMarketModal() { getElement('market-modal').classList.remove('hidden'); }
export function hideMarketModal() { getElement('market-modal').classList.add('hidden'); }
export function showWillyVoteModal() { getElement('willy-vote-modal').classList.remove('hidden'); }
export function hideWillyVoteModal() { getElement('willy-vote-modal').classList.add('hidden'); }
export function showCreditsModal() { getElement('credits-modal').classList.remove('hidden'); }
export function hideCreditsModal() { getElement('credits-modal').classList.add('hidden'); }
export function showCoinFlipModal() { getElement('coin-flip-modal').classList.remove('hidden'); }
export function hideCoinFlipModal() { getElement('coin-flip-modal').classList.add('hidden'); }

// FIX: Added missing view-setting functions and unlockCrate function.
export function setMainView(view: MainView) {
    state.mainView = view;
    updateAllUI();
}

export function setInventorySubView(view: InventorySubView) {
    state.inventorySubView = view;
    updateAllUI();
}

export function setCraftingSubView(view: CraftingSubView) {
    state.craftingSubView = view;
    updateAllUI();
}

export function setCrateView(view: CrateView) {
    state.crateView = view;
    updateAllUI();
}

export function setConsumableSubView(view: ConsumableSubView) {
    state.consumableSubView = view;
    updateAllUI();
}

export function unlockCrate(type: CrateType | Rarity) {
    if (!state.unlocked[type]) {
        state.unlocked[type] = true;
        showToast(`Unlocked ${type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Crates!`, 'success');
    }
}

export function showCrateResult(resultPayload: any) {
    const resultContainer = getElement('result-container');
    const animationContainer = getElement('animation-container');
    const resultEmoji = getElement('result-emoji');
    const resultText = getElement('result-text');
    const resultRarity = getElement('result-rarity');

    animationContainer.classList.add('hidden');
    resultContainer.classList.remove('hidden');

    let emoji;
    if (resultPayload.type === 'item') {
        emoji = itemEmojis[resultPayload.name] || '❓';
    } else if (resultPayload.type === 'potion') {
        emoji = potions[resultPayload.name]?.emoji || '🧪';
    } else { // crate
        emoji = crateEmojis[resultPayload.crateType] || '🎁';
    }

    resultEmoji.textContent = emoji;
    resultText.textContent = resultPayload.name;
    resultRarity.textContent = resultPayload.rarity.toUpperCase();
    resultRarity.style.color = uiRarityColors[resultPayload.rarity];
}

export function showMultiCrateResult(results: any[]) {
    const modal = getElement('multi-result-modal');
    const grid = getElement('multi-result-grid');
    grid.innerHTML = '';

    const groupedResults: { [key: string]: { count: number; rarity: Rarity; type: string; crateType?: CrateType } } = {};

    results.forEach(result => {
        const key = result.name;
        if (groupedResults[key]) {
            groupedResults[key].count++;
        } else {
            groupedResults[key] = { count: 1, rarity: result.rarity, type: result.type, crateType: result.crateType };
        }
    });
    
    const sortedGroupedResults = Object.entries(groupedResults).sort(([, a], [, b]) => {
        const rarityOrder = ['common', 'rare', 'epic', 'legendary', 'mythical', 'lebron'];
        const valueA = a.type === 'item' ? getItemSellValue(Object.keys(groupedResults).find(k => groupedResults[k] === a)) : getPotionSellValue(Object.keys(groupedResults).find(k => groupedResults[k] === a));
        const valueB = b.type === 'item' ? getItemSellValue(Object.keys(groupedResults).find(k => groupedResults[k] === b)) : getPotionSellValue(Object.keys(groupedResults).find(k => groupedResults[k] === b));
        
        if (valueB !== valueA) return valueB - valueA;
        return rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity);
    });


    for (const [name, item] of sortedGroupedResults) {
        const itemEl = document.createElement('div');
        itemEl.className = 'multi-result-item';
        itemEl.style.borderLeft = `3px solid ${uiRarityColors[item.rarity]}`;
        itemEl.style.backgroundColor = 'var(--bg-color)';


        let emoji;
        if (item.type === 'item') {
            emoji = itemEmojis[name] || '❓';
        } else if (item.type === 'potion') {
            emoji = potions[name]?.emoji || '🧪';
        } else { // crate
            emoji = crateEmojis[item.crateType] || '🎁';
        }

        itemEl.innerHTML = `
            <span class="emoji">${emoji}</span>
            <span class="name" style="color: ${uiRarityColors[item.rarity]}">${name}</span>
            <span class="count">x${item.count}</span>
        `;
        grid.appendChild(itemEl);
    }

    modal.classList.remove('hidden');
}

export function showWelcomeBackModal(summary: any) {
    const summaryEl = getElement('welcome-back-summary');
    let html = '';

    if (summary.timeAway) {
        html += `<p>${summary.timeAway}</p>`;
    }

    if (summary.cratesGenerated > 0) {
        html += `<h4>🎁 Free Crates</h4>`;
        html += `<ul><li>You received <strong>${summary.cratesGenerated}</strong> new free crates.</li></ul>`;
    }
    if (summary.autoClaimed > 0) {
         html += `<ul><li>Your Diligent Draft automatically claimed <strong>${summary.autoClaimed}</strong> crates for you.</li></ul>`;
    }
     if (summary.towerPlays > 0) {
        html += `<h4>🤖 Tower of Bots</h4>`;
        html += `<ul><li>You gained <strong>${summary.towerPlays}</strong> free play(s).</li></ul>`;
    }

    if (summary.potionsExpired.length > 0) {
        html += `<h4>🧪 Potions</h4>`;
        html += '<ul>';
        summary.potionsExpired.forEach(name => {
            html += `<li>Your <strong>${name}</strong> potion wore off.</li>`;
        });
        html += '</ul>';
    }
    
    if (summary.marketPnl !== 0) {
        html += `<h4>📈 Market</h4>`;
        const pnl = summary.marketPnl;
        const pnlClass = pnl >= 0 ? 'rarity-rare' : 'error-color';
        html += `<ul><li>Your portfolio value changed by <strong class="${pnlClass}">${pnl.toFixed(2)} TC</strong>.</li></ul>`;
    }
    
     if (summary.brawlsReady.length > 0) {
        html += `<h4>🍻 Drunken Brawl</h4>`;
        html += '<ul>';
        summary.brawlsReady.forEach(name => {
            html += `<li>The cooldown for <strong>${name}</strong> has finished.</li>`;
        });
        html += '</ul>';
    }

    if (summary.newUnlocks.length > 0) {
        html += `<h4>✨ New Unlocks</h4>`;
        html += '<ul>';
        summary.newUnlocks.forEach(name => {
            html += `<li>You can now access: <strong>${name}</strong>!</li>`;
        });
        html += '</ul>';
    }
    
    if (html === '') {
        // Nothing happened, don't show the modal
        return;
    }

    summaryEl.innerHTML = html;
    getElement('welcome-back-modal').classList.remove('hidden');
}

export function hideWelcomeBackModal() {
    getElement('welcome-back-modal').classList.add('hidden');
}

export function populateRebirthUpgradesScreen() {
    const grid = getElement('upgrades-grid');
    grid.innerHTML = '';

    const offers = state.rebirthShopOffers;
    if (!offers) {
        grid.innerHTML = "<p>No upgrade offers available. Please start a new rebirth.</p>";
        return;
    }

    offers.forEach(upgradeId => {
        const upgradeDef = UPGRADE_DEFINITIONS[upgradeId];
        if (!upgradeDef) return;

        const currentTier = state.rebirthUpgrades[upgradeDef.id] || 0;
        const isMaxed = currentTier >= upgradeDef.maxTier;
        
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        
        let costText = 'MAX';
        let canAfford = false;
        let cost = 0;

        if (!isMaxed) {
            cost = upgradeDef.getCost(currentTier);
            costText = `${cost} Tokens`;
            canAfford = state.rebirthTokens >= cost;
        } else {
             card.classList.add('maxed');
        }

        if (!isMaxed && !canAfford) {
            card.classList.add('locked');
        }

        card.innerHTML = `
            <h4>${upgradeDef.name} ${ROMAN_NUMERALS[currentTier]}</h4>
            <p>${upgradeDef.getDescription(currentTier)}</p>
            <div class="cost">${costText}</div>
            <button class="buy-upgrade-btn" data-upgrade-id="${upgradeDef.id}" ${isMaxed ? 'disabled' : ''}>Buy</button>
        `;
        
        grid.appendChild(card);
    });

     // Add event listeners after populating
    grid.querySelectorAll('.buy-upgrade-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            const upgradeId = btn.dataset.upgradeId;
            const upgradeDef = UPGRADE_DEFINITIONS[upgradeId];
            const currentTier = state.rebirthUpgrades[upgradeId] || 0;
            const cost = upgradeDef.getCost(currentTier);

            if (state.rebirthTokens >= cost) {
                state.rebirthTokens -= cost;
                state.rebirthUpgrades[upgradeId]++;
                // After purchase, the offer is fulfilled for this rebirth.
                // We can remove it from the list or just disable the button.
                // Re-rendering is easiest.
                populateRebirthUpgradesScreen();
                updateAllUI();
            } else {
                showToast("Not enough tokens!", 'error');
            }
        });
    });
}


export function setupTooltips() {
    const tooltipEl = getElement('tooltip');
    document.body.addEventListener('mouseover', e => {
        const target = e.target as HTMLElement;
        const slot = target.closest<HTMLElement>('.slot, .effect-badge, .upgrade-card, .recipe-item, .brawl-bar-option');
        if (slot && slot.dataset.tooltip) {
            tooltipEl.innerHTML = slot.dataset.tooltip;
            tooltipEl.classList.add('visible');
            const rect = slot.getBoundingClientRect();
            
            // Position tooltip above the element, centered
            let left = rect.left + window.scrollX + rect.width / 2 - tooltipEl.offsetWidth / 2;
            let top = rect.top + window.scrollY - tooltipEl.offsetHeight - 5;

            // Adjust if it goes off-screen
            if (left < 0) left = 5;
            if (top < 0) top = rect.bottom + window.scrollY + 5;

            tooltipEl.style.left = `${left}px`;
            tooltipEl.style.top = `${top}px`;
        }
    });

    document.body.addEventListener('mouseout', e => {
        const target = e.target as HTMLElement;
        const slot = target.closest<HTMLElement>('.slot, .effect-badge, .upgrade-card, .recipe-item, .brawl-bar-option');
        if (slot) {
            tooltipEl.classList.remove('visible');
        }
    });
}

function updateGambleDisplay() {
    const selectionDiv = getElement('selected-gamble-items');
    selectionDiv.innerHTML = "";
    let totalValue = state.gambledCoins;
    let totalItems = 0;

    state.selectedForGamble.forEach(item => totalItems += item.amount);
    getElement('selectedCount').textContent = totalItems.toString();
    getElement('gambledCoinsCount').textContent = state.gambledCoins.toLocaleString();


    if (state.selectedForGamble.length === 0 && state.gambledCoins === 0) {
        selectionDiv.innerHTML = '<p class="no-items-text">Select items or add coins to gamble.</p>';
    } else {
        const itemsToDisplay = [...state.selectedForGamble];
        if (state.gambledCoins > 0) {
            itemsToDisplay.push({ name: 'Coins', amount: state.gambledCoins, type: 'item' });
        }

        itemsToDisplay.forEach(item => {
            let value, emoji;
            if (item.name === 'Coins') {
                value = 1;
                emoji = '💰';
            } else {
                value = item.type === 'item' ? getItemSellValue(item.name) : getPotionSellValue(item.name);
                emoji = item.type === 'potion' ? potions[item.name].emoji : itemEmojis[item.name];
            }
            
            if (item.name !== 'Coins') {
                 totalValue += item.amount * value;
            }

            const itemDiv = document.createElement('div');
            itemDiv.className = 'gamble-item';
            itemDiv.innerHTML = `<span>${emoji} ${item.name} x${item.amount}</span>`;
            selectionDiv.appendChild(itemDiv);
        });
    }

    getElement('gamble-value').textContent = totalValue.toLocaleString();
    const gambleControls = getElement('gamble-controls');
    const hasItems = totalValue > 0;
    gambleControls.classList.toggle('hidden', !hasItems);

    const hasItemsLeft = Object.values(state.inventory).some(count => count > 0) || Object.values(state.potions).some(count => count > 0);
    const hasGambledSomething = state.selectedForGamble.length > 0 || state.gambledCoins > 0;
    if (state.coins === 0 && !hasItemsLeft && hasGambledSomething) {
        if (!state.isAllIn) {
            state.isAllIn = true;
            showToast("ALL IN! 3x items and coins on win!", 'success');
        }
    }

    const gambleSection = getElement('gamble-section');
    gambleSection.classList.toggle('all-in-aura', state.isAllIn);
    
    // Update UI indicators based on state
    const secondChanceStatus = getElement('second-chance-status');
    const insuranceStatus = getElement('gamble-insurance-status');
    const gambleStatusIndicators = getElement('gamble-status-indicators');

    // Remove old message if it exists
    const oldMsg = document.getElementById('all-in-message');
    if (oldMsg) oldMsg.remove();
    
    if (state.isAllIn) {
        secondChanceStatus.classList.add('hidden');
        insuranceStatus.classList.add('hidden');
        
        const allInMessageEl = document.createElement('p');
        allInMessageEl.id = 'all-in-message';
        allInMessageEl.style.color = 'var(--rarity-legendary)';
        allInMessageEl.style.fontWeight = 'bold';
        allInMessageEl.style.flexBasis = '100%';
        allInMessageEl.textContent = 'ALL IN! Potions & rebirth upgrades have no effect. 3x win or total loss!';
        gambleStatusIndicators.prepend(allInMessageEl);
    } else {
        if (state.canRedoCoinFlip > 0) {
            secondChanceStatus.textContent = `Second Chance available (x${state.canRedoCoinFlip})`;
            secondChanceStatus.classList.remove('hidden');
        } else {
            secondChanceStatus.classList.add('hidden');
        }
        if (state.rebirthUpgrades.gambleInsurance > 0 && !state.gambleInsuranceUsedThisLife) {
            insuranceStatus.textContent = 'Gamble Insurance active';
            insuranceStatus.classList.remove('hidden');
        } else {
            insuranceStatus.classList.add('hidden');
        }
    }
}


function updateActivePotionsUI() {
    const container = getElement('active-effects-container');
    container.innerHTML = '';
    if (Object.keys(state.activePotions).length === 0) {
        return;
    }

    for (const effectType in state.activePotions) {
        const effect = state.activePotions[effectType];
        const badge = document.createElement('div');
        badge.className = 'effect-badge';
        const minutes = Math.floor(effect.timeLeft / 60);
        const seconds = effect.timeLeft % 60;
        
        const potionData = Object.values(potions).find(p => p.effect.type === effectType);

        if (potionData) {
            badge.dataset.tooltip = potionData.description(effect);
        }

        let effectText = `${effect.emoji} ${effect.name}`;
        if (effect.type === 'luckBoost' && effect.stacks > 1) {
            effectText += ` (x${effect.stacks})`;
        }

        badge.innerHTML = `
            <span class="effect-badge-icon">${effect.emoji}</span>
            <span>${effect.name}${effect.stacks > 1 ? ` (x${effect.stacks})` : ''}</span>
            <span class="effect-badge-timer">${minutes}:${seconds.toString().padStart(2, '0')}</span>
        `;
        container.appendChild(badge);
    }
}

function updateRebirthUI() {
    const rebirthBtn = getElement('rebirthBtn') as HTMLButtonElement;
    const netWorth = calculateNetWorth();
    const inflationMultiplier = 1 + (state.rebirthUpgrades.netWorthInflation * 0.15);
    const effectiveNetWorth = netWorth * inflationMultiplier;
    const potentialTokens = Math.floor(effectiveNetWorth / 100);
    getElement('rebirth-token-preview').textContent = potentialTokens.toString();
    getElement('rebirth-token-balance').textContent = state.rebirthTokens.toString();

    const hasLeBron = (state.inventory['LeBron James'] || 0) > 0;
    rebirthBtn.disabled = !hasLeBron || potentialTokens <= 0;
}

function updateCrateDescriptions() {
    const luckBoost = state.activePotions.luckBoost;
    const crateTypes: CrateType[] = ['basic', 'rare', 'epic', 'legendary', 'mythical'];

    crateTypes.forEach(type => {
        const descEl = document.getElementById(`${type}-desc-text`) as HTMLElement;
        if (!descEl) return;

        if (!descEl.dataset.base) {
            descEl.dataset.base = descEl.textContent;
        }

        let dynamicText = '';
        if (type === 'legendary') {
            const lebronHunter = state.activePotions.lebronHunter;
            if (lebronHunter && lebronHunter.timeLeft > 0) {
                dynamicText += `<br><span style="color: var(--secondary-color);">👑 (King's Favor Active)</span>`;
            }
        }
        if (luckBoost && luckBoost.timeLeft > 0) {
            dynamicText += `<br><span style="color: var(--secondary-color);">✨(+${luckBoost.value}%) Better odds!</span>`;
        }
        
        descEl.innerHTML = descEl.dataset.base + dynamicText;
    });
}

export function updateFreeCrateDisplay() {
    const display = getElement('free-crates-display');
    const claimBtn = getElement('claimFreeBtn') as HTMLButtonElement;
    const countSpan = getElement('freeCrates');

    display.innerHTML = '';
    if (state.freeCratesToClaim.length === 0) {
        display.innerHTML = '<p class="no-free-crates-text">No free crates to claim.</p>';
    } else {
        state.freeCratesToClaim.forEach(crateType => {
            const crateEl = document.createElement('span');
            crateEl.className = 'free-crate-icon';
            crateEl.textContent = crateEmojis[crateType] || '❓';
            crateEl.title = crateType.replace(/_/g, ' ');
            display.appendChild(crateEl);
        });
    }

    countSpan.textContent = state.freeCratesToClaim.length.toString();
    claimBtn.disabled = state.freeCratesToClaim.length === 0;
}

export function updateBrawlStatus() {
    const container = getElement('brawl-bars-list');
    container.innerHTML = '';
    const netWorth = calculateNetWorth();

    for (const rarity in BRAWL_BARS) {
        const bar = BRAWL_BARS[rarity as BrawlRarity];
        const barEl = document.createElement('div');
        barEl.className = `brawl-bar-option ${rarity}`;
        
        let unlocked = state.brawlUnlockedOverride;
        let unlockText = '';

        if (!unlocked) {
            if (bar.unlock.type === 'none') {
                unlocked = true;
            } else if (bar.unlock.type === 'netWorth' && netWorth >= bar.unlock.value) {
                unlocked = true;
            } else if (bar.unlock.type === 'rebirth' && state.stats.rebirths >= bar.unlock.value) {
                unlocked = true;
            }

            if (!unlocked) {
                 if (bar.unlock.type === 'netWorth') unlockText = `(Requires ${bar.unlock.value.toLocaleString()} Net Worth)`;
                 if (bar.unlock.type === 'rebirth') unlockText = `(Requires Rebirth ${bar.unlock.value})`;
            }
        }
        
        const cooldown = state.brawlCooldowns[rarity];
        const now = Date.now();
        const onCooldown = cooldown && cooldown > now;
        let cooldownText = '';
        if (onCooldown) {
            const timeLeft = Math.ceil((cooldown - now) / 1000);
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            cooldownText = `(On Cooldown: ${minutes}:${seconds.toString().padStart(2, '0')})`;
            barEl.classList.add('on-cooldown');
        }

        const beaten = state.brawlTavernsBeaten[rarity as BrawlRarity];
        const highestStage = (state.brawlProgress[rarity as BrawlRarity] || -1);

        barEl.innerHTML = `
            <div class="brawl-bar-info">
              <p class="bar-name">${bar.name} ${beaten ? '🏆' : ''}</p>
              <p class="bar-progress">Highest Stage Cleared: ${highestStage + 1}/30</p>
              <p class="bar-status">${unlocked ? (onCooldown ? cooldownText : 'Ready') : unlockText}</p>
            </div>
            <div class="brawl-bar-actions">
                <button class="brawl-start-btn" data-rarity="${rarity}" data-stage="0" ${!unlocked || onCooldown ? 'disabled' : ''}>Start from Floor 1</button>
                ${highestStage >= 0 && highestStage < 29 ? `<button class="brawl-start-btn" data-rarity="${rarity}" data-stage="${highestStage + 1}" ${!unlocked || onCooldown ? 'disabled' : ''}>Continue from Floor ${highestStage + 2}</button>` : ''}
            </div>
        `;
        if(!unlocked) barEl.classList.add('locked');
        
        container.appendChild(barEl);
    }
    
    container.querySelectorAll('.brawl-start-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget as HTMLButtonElement;
            const rarity = target.dataset.rarity as BrawlRarity;
            const stage = parseInt(target.dataset.stage, 10);
            initiateBrawl(rarity, stage);
        });
    });
}

function renderMarketChart(asset: any) {
    const canvas = getElement('market-graph-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!asset || !asset.priceHistory || asset.priceHistory.length < 2) {
        ctx.fillStyle = 'var(--text-color-secondary)';
        ctx.textAlign = 'center';
        ctx.fillText('Not enough data to display chart.', canvas.width / 2, canvas.height / 2);
        return;
    }

    const history = asset.priceHistory.slice(-state.marketActiveTimeScale);
    const maxPrice = Math.max(...history);
    const minPrice = Math.min(...history);
    const range = maxPrice - minPrice || 1;

    const startPrice = history[0];
    const endPrice = history[history.length - 1];
    
    // Use computed styles to get CSS variable values
    const style = getComputedStyle(document.body);
    const upColor = style.getPropertyValue('--rarity-rare').trim() || 'green';
    const downColor = style.getPropertyValue('--error-color').trim() || 'red';

    ctx.strokeStyle = endPrice >= startPrice ? upColor : downColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < history.length; i++) {
        const x = (i / (history.length - 1)) * canvas.width;
        const y = canvas.height - ((history[i] - minPrice) / range) * canvas.height;
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
}


function updateMarketDetails() {
    const assetNameEl = getElement('market-asset-name');
    const currentPriceEl = getElement('market-current-price');
    const userHoldingEl = getElement('market-user-holding');
    const avgEntryEl = getElement('market-avg-entry');
    const positionValueEl = getElement('market-position-value');
    const unrealizedPnlEl = getElement('market-unrealized-pnl');
    const buyBtn = getElement('market-buy-btn') as HTMLButtonElement;
    const sellBtn = getElement('market-sell-btn') as HTMLButtonElement;
    const shortBtn = getElement('market-short-btn') as HTMLButtonElement;

    if (!state.marketSelectedAssetId) {
        assetNameEl.textContent = 'Select an Asset';
        currentPriceEl.textContent = 'N/A';
        userHoldingEl.textContent = 'N/A';
        avgEntryEl.textContent = 'N/A';
        positionValueEl.textContent = 'N/A';
        unrealizedPnlEl.textContent = 'N/A';
        buyBtn.disabled = true;
        sellBtn.disabled = true;
        shortBtn.disabled = true;
        renderMarketChart(null);
        return;
    }

    const asset = state.marketAssets[state.marketSelectedAssetId];
    const portfolioItem = state.marketPortfolio[state.marketSelectedAssetId];
    const isShort = portfolioItem && portfolioItem.quantity < 0;

    assetNameEl.textContent = asset.name;
    currentPriceEl.textContent = asset.currentPrice.toFixed(2) + ' TC';

    if (portfolioItem && portfolioItem.quantity !== 0) {
        const positionValue = Math.abs(portfolioItem.quantity) * asset.currentPrice;
        const pnl = (asset.currentPrice - portfolioItem.avgEntryPrice) * portfolioItem.quantity;
        userHoldingEl.textContent = `${Math.abs(portfolioItem.quantity)} (${isShort ? 'Short' : 'Long'})`;
        avgEntryEl.textContent = portfolioItem.avgEntryPrice.toFixed(2) + ' TC';
        positionValueEl.textContent = positionValue.toFixed(2) + ' TC';
        unrealizedPnlEl.textContent = pnl.toFixed(2) + ' TC';
        unrealizedPnlEl.style.color = pnl >= 0 ? 'var(--rarity-rare)' : 'var(--error-color)';
    } else {
        userHoldingEl.textContent = '0';
        avgEntryEl.textContent = 'N/A';
        positionValueEl.textContent = 'N/A';
        unrealizedPnlEl.textContent = 'N/A';
        unrealizedPnlEl.style.color = 'var(--text-color)';
    }
    
    const qtyInput = getElement('market-quantity-input') as HTMLInputElement;
    const quantity = parseInt(qtyInput.value, 10) || 0;

    buyBtn.disabled = quantity <= 0;
    buyBtn.textContent = isShort ? 'Cover' : 'Buy';
    sellBtn.disabled = !portfolioItem || isShort || portfolioItem.quantity === 0 || quantity <= 0;
    shortBtn.disabled = (!!portfolioItem && portfolioItem.quantity > 0) || quantity <= 0;
    
    renderMarketChart(asset);
}

export function updateMarketUI() {
    const views = {
        trading: getElement('market-trading-view'),
        history: getElement('market-history-view'),
        exchange: getElement('market-exchange-view'),
        loan: getElement('market-loan-view'),
    };

    // Hide all views and deactivate all tabs
    Object.values(views).forEach(view => view.classList.add('hidden'));
    document.querySelectorAll('#market-tabs .toggle-btn').forEach(btn => btn.classList.remove('active'));

    // Activate the correct tab and view
    const activeTabButton = document.querySelector(`#market-tabs .toggle-btn[data-tab="${state.marketActiveTab}"]`);
    if (activeTabButton) {
        activeTabButton.classList.add('active');
    }

    const activeView = views[state.marketActiveTab];
    if (activeView) {
        activeView.classList.remove('hidden');
    }

    // Show and update the active view
    if (state.marketActiveTab === 'trading') {
        const assetListEl = getElement('market-asset-list');
        getElement('market-tc-balance').textContent = state.tradingCash.toFixed(2);
        // Render asset list
        assetListEl.innerHTML = '';
        Object.values(state.marketAssets).forEach(asset => {
            const item = document.createElement('div');
            item.className = 'market-asset-item';
            if (asset.id === state.marketSelectedAssetId) {
                item.classList.add('selected');
            }
            const change = asset.currentPrice - (asset.priceHistory[asset.priceHistory.length - 2] || asset.currentPrice);
            const changeColor = change > 0 ? 'var(--rarity-rare)' : (change < 0 ? 'var(--error-color)' : 'var(--text-color-secondary)');
            item.innerHTML = `
                <div class="asset-item-info">
                  <span class="asset-item-name">${asset.name}</span>
                  <span class="asset-item-price" style="color: ${changeColor}">${asset.currentPrice.toFixed(2)}</span>
                </div>
            `;
            item.onclick = () => {
                state.marketSelectedAssetId = asset.id;
                updateMarketUI();
            };
            assetListEl.appendChild(item);
        });
        updateMarketDetails();
    } else if (state.marketActiveTab === 'history') {
        const historyListEl = getElement('market-history-list');
        historyListEl.innerHTML = '';
        if (state.tradeHistory.length === 0) {
            historyListEl.innerHTML = '<p class="no-items-text">No trade history.</p>';
        } else {
            const table = document.createElement('table');
            table.className = 'history-table';
            table.innerHTML = `<thead><tr><th>Time</th><th>Action</th><th>Asset</th><th>Qty</th><th>Price</th><th>Total</th><th>P/L</th></tr></thead><tbody></tbody>`;
            const tbody = table.querySelector('tbody');
             state.tradeHistory.slice(0, 50).forEach(trade => { // Show last 50 trades
                const row = document.createElement('tr');
                const pnlText = trade.pnl !== undefined ? trade.pnl.toFixed(2) : 'N/A';
                const pnlClass = trade.pnl !== undefined ? (trade.pnl >= 0 ? 'rarity-rare' : 'error-color') : '';
                const typeClass = `history-type-${trade.type}`;
                row.innerHTML = `
                    <td>${new Date(trade.timestamp).toLocaleTimeString()}</td>
                    <td class="${typeClass}">${trade.type.toUpperCase()}</td>
                    <td>${trade.assetName}</td>
                    <td>${trade.quantity}</td>
                    <td>${trade.price.toFixed(2)}</td>
                    <td>${trade.total.toFixed(2)}</td>
                    <td class="${pnlClass}">${pnlText}</td>
                `;
                tbody.appendChild(row);
            });
             historyListEl.appendChild(table);
        }
    } else if (state.marketActiveTab === 'loan') {
        const newLoanContainer = getElement('new-loan-view');
        const activeLoanContainer = getElement('loan-status-view');
        if (state.loan) {
            newLoanContainer.classList.add('hidden');
            activeLoanContainer.classList.remove('hidden');
            getElement('loan-owed-amount').textContent = (state.loan.amount * 1.05).toFixed(2);
            const timeLeft = Math.max(0, state.loan.dueDate - Date.now());
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            getElement('loan-due-timer').textContent = `${hours}h ${minutes}m`;
            
            const collateralList = getElement('loan-active-collateral-list');
            collateralList.innerHTML = '';
            let collateralValue = 0;
            for (const assetId in state.loan.collateral) {
                const item = state.loan.collateral[assetId];
                const asset = state.marketAssets[assetId];
                collateralValue += item.quantity * asset.currentPrice;
                const li = document.createElement('div');
                li.textContent = `${item.quantity}x ${asset.name}`;
                collateralList.appendChild(li);
            }
            getElement('loan-collateral-value').textContent = `${collateralValue.toFixed(2)} TC`;

        } else {
            newLoanContainer.classList.remove('hidden');
            activeLoanContainer.classList.add('hidden');
            const offersContainer = getElement('loan-offers-container');
            offersContainer.innerHTML = '';

            const portfolioValue = Object.entries(state.marketPortfolio).reduce((acc, [assetId, item]) => {
                if (item.quantity > 0) { // Only long positions can be collateral
                    return acc + (item.quantity * state.marketAssets[assetId].currentPrice);
                }
                return acc;
            }, 0);

            let availableLoans = 0;
            LOAN_OFFERS.forEach(offer => {
                const requiredCollateral = offer.amount * offer.collateralMultiplier;
                const canAfford = portfolioValue >= requiredCollateral;
                
                const card = document.createElement('div');
                card.className = 'loan-offer-card';
                if (!canAfford) {
                    card.classList.add('disabled');
                }
                card.innerHTML = `
                    <h4>${offer.name}</h4>
                    <p><strong>${offer.amount} TC</strong></p>
                    <p>Requires ~${requiredCollateral.toFixed(2)} TC in collateral.</p>
                    <button data-loan-amount="${offer.amount}" ${canAfford ? '' : 'disabled'}>Take Loan</button>
                `;
                offersContainer.appendChild(card);
                if(canAfford) availableLoans++;
            });

            if (availableLoans === 0) {
                offersContainer.innerHTML = '<p class="no-items-text">You do not have enough assets to secure a loan.</p>';
            }
        }
    } else if (state.marketActiveTab === 'exchange') {
        getElement('exchange-coin-balance').textContent = state.coins.toLocaleString();
        getElement('exchange-tc-balance').textContent = state.tradingCash.toFixed(2);
        getElement('exchange-rate').textContent = state.tcExchangeRate.toFixed(2);
        const tax = state.rebirthUpgrades.marketInsider > 0 ? 0 : CONVERSION_TAX;
        getElement('exchange-tax').textContent = (tax * 100).toString();
    }
}

function renderInventoryGrid() {
    const container = getElement('inventory');
    const mainViewToggle = getElement('main-view-toggle-container');
    const subToggleContainer = getElement('inventory-sub-toggle-container');
    const consumableSubToggleContainer = getElement('consumable-sub-toggle-container');
    const inventoryControls = getElement('inventory-controls');
    const craftingUI = getElement('crafting-ui');

    // Toggle main view sections
    const isInventoryView = state.mainView === 'inventory';
    container.classList.toggle('hidden', !isInventoryView);
    subToggleContainer.classList.toggle('hidden', !isInventoryView);
    inventoryControls.classList.toggle('hidden', !isInventoryView);
    craftingUI.classList.toggle('hidden', isInventoryView);

    // Update main view buttons
    getElement('show-inventory-btn').classList.toggle('active', isInventoryView);
    getElement('show-crafting-btn').classList.toggle('active', !isInventoryView);

    if (!isInventoryView) {
        updateCraftingUI();
        return;
    }

    container.innerHTML = '';
    
    // Update inventory sub-view buttons
    consumableSubToggleContainer.classList.toggle('hidden', state.inventorySubView !== 'consumables');
    ['items', 'weapons', 'armor', 'ingredients', 'consumables'].forEach(view => {
        getElement(`show-${view}-btn`).classList.toggle('active', state.inventorySubView === view);
    });
    if(state.inventorySubView === 'consumables') {
         ['potions', 'combatItems'].forEach(view => {
            getElement(`show-consumable-${view}-btn`).classList.toggle('active', state.consumableSubView === view);
         });
    }

    // Determine what to display
    const currentView = state.inventorySubView;
    let itemsToShow: Record<string, number>;
    let itemType: 'item' | 'potion' = 'item';
    let filterCategory: ItemCategory | null = null;
    let hasAnyItemsInView = false;


    if (currentView === 'consumables') {
        if (state.consumableSubView === 'potions') {
            itemsToShow = state.potions;
            itemType = 'potion';
        } else { // 'combatItems'
            itemsToShow = state.inventory;
            filterCategory = 'consumable';
        }
    } else {
        const categoryMap: Record<string, ItemCategory | null> = {
            'items': 'good', 'weapons': 'weapon', 'armor': 'armor', 'ingredients': 'ingredient',
        };
        itemsToShow = state.inventory;
        filterCategory = categoryMap[currentView];
    }
    
    const rarities: Rarity[] = ['lebron', 'mythical', 'legendary', 'epic', 'rare', 'common'];

    for (const rarity of rarities) {
        let itemsOfRarity: string[] = [];
        let totalForRarity = 0;
        let ownedForRarity = 0;

        if (itemType === 'potion') {
            const allPotionsOfRarity = Object.keys(potions).filter(p => potions[p].rarity === rarity);
            totalForRarity = allPotionsOfRarity.length;
            itemsOfRarity = allPotionsOfRarity.filter(name => (itemsToShow[name] || 0) > 0);
            ownedForRarity = itemsOfRarity.reduce((acc, name) => acc + (itemsToShow[name] || 0), 0);
        } else { // item
            const allItemsOfRarity = Object.keys(itemData).filter(i => itemData[i].rarity === rarity && itemData[i].category === filterCategory);
            totalForRarity = allItemsOfRarity.length;
            itemsOfRarity = allItemsOfRarity.filter(name => (itemsToShow[name] || 0) > 0);
            ownedForRarity = itemsOfRarity.reduce((acc, name) => acc + (itemsToShow[name] || 0), 0);
        }
        
        if (ownedForRarity > 0) hasAnyItemsInView = true;

        if (totalForRarity === 0) continue;

        const section = document.createElement('div');
        section.className = `rarity-section ${rarity}`;
        section.innerHTML = `<h3 class="${rarity}">${rarity.toUpperCase()} <span class="rarity-count">(${ownedForRarity}/${totalForRarity})</span></h3>`;
        
        if (itemsOfRarity.length > 0) {
            const grid = document.createElement('div');
            grid.className = 'inventory-grid';

            for (const itemName of itemsOfRarity.sort()) {
                const count = itemsToShow[itemName];
                const slot = document.createElement('div');
                slot.className = `slot ${rarity}`;
                
                const isPotion = itemType === 'potion';
                const itemInfo = isPotion ? getPotionData(itemName) : itemData[itemName];
                const emoji = isPotion ? (itemInfo?.emoji || '🧪') : (itemEmojis[itemName] || '❓');
                
                // Add tooltip
                let tooltipText = `<strong>${itemName}</strong><br><span style="color:${uiRarityColors[rarity]}">Rarity: ${rarity}</span>`;
                if (itemInfo) {
                    if (isPotion && typeof itemInfo.description === 'function') {
                        tooltipText += `<br><br>${itemInfo.description(itemInfo.effect)}`;
                    } else if (!isPotion && itemInfo.description) {
                        tooltipText += `<br><br>${itemInfo.description}`;
                    }
                }
                slot.dataset.tooltip = tooltipText;

                slot.innerHTML = `
                    <div class="slot-emoji">${emoji}</div>
                    <div class="slot-name">${itemName}</div>
                    <div class="slot-count">${count > 1 ? `x${count}` : ''}</div>
                `;
                
                slot.addEventListener('click', e => {
                    e.stopPropagation();
                    document.querySelector('.popup')?.remove();
                    
                    const popup = document.createElement('div');
                    popup.className = 'popup';
                    
                    const options: (HTMLElement | null)[] = [];
                    const addOption = (text: string, action: () => void, disabled = false) => {
                        const opt = document.createElement('div');
                        opt.className = 'popup-option';
                        opt.textContent = text;
                        if(disabled) {
                            opt.classList.add('disabled');
                        } else {
                            opt.onclick = (ev) => {
                                ev.stopPropagation();
                                action();
                                popup.remove();
                            };
                        }
                        options.push(opt);
                    };

                    const category = getItemCategory(itemName);

                    addOption(`Sell 1`, () => {
                        isPotion ? sellPotion(itemName, 1) : sellItem(itemName, 1);
                        updateAllUI();
                    });
                     addOption(`Sell All (${count})`, () => {
                        isPotion ? sellPotion(itemName, count) : sellItem(itemName, count);
                        updateAllUI();
                    });
                    addOption(`Gamble 1`, () => {
                        addToGamble({ name: itemName, amount: 1, type: itemType });
                        updateAllUI();
                    });
                     addOption(`Gamble All (${count})`, () => {
                        addToGamble({ name: itemName, amount: count, type: itemType });
                        updateAllUI();
                    });

                    if (isPotion) {
                        addOption(`Use`, () => {
                            usePotion(itemName);
                            updateAllUI();
// FIX: Replaced 'potionData' with 'potions' which is the correct variable for the potions object.
                        }, potions[itemName]?.effect.type.startsWith('brawl_'));
                    }
                    
                    if (category === 'weapon') {
                        addOption(state.equippedWeapon === itemName ? 'Unequip' : 'Equip', () => {
                            equipWeapon(state.equippedWeapon === itemName ? null : itemName);
                            updateAllUI();
                        });
                    }
                     if (category === 'armor') {
                        addOption(state.equippedArmor === itemName ? 'Unequip' : 'Equip', () => {
                            equipArmor(state.equippedArmor === itemName ? null : itemName);
                            updateAllUI();
                        });
                    }
                    
                    options.filter(o => o).forEach(o => popup.appendChild(o));
                    
                    document.body.appendChild(popup);
                    const rect = slot.getBoundingClientRect();
                    popup.style.left = `${rect.left + window.scrollX}px`;
                    popup.style.top = `${rect.bottom + window.scrollY}px`;
                });
                
                grid.appendChild(slot);
            }
            section.appendChild(grid);
        }
        container.appendChild(section);
    }
     document.addEventListener('click', () => document.querySelector('.popup')?.remove(), { once: true });


    if (!hasAnyItemsInView) {
        const noItemText = container.querySelector('.no-items-text');
        if(!noItemText) {
            container.insertAdjacentHTML('beforeend', `<p class="no-items-text">You have no items in this category.</p>`);
        }
    }
}


export function updateTowerOfBotsUI() {
    const screen = getElement('tower-of-bots-screen');
    if (!state.towerOfBotsState.isActive) {
        screen.classList.add('hidden');
        return;
    }
    screen.classList.remove('hidden');

    const { currentFloor, accumulatedRewards, cards, revealedCardIndex, lossPending, continuesUsed, cardOutcomes } = state.towerOfBotsState;

    getElement('tower-floor').textContent = currentFloor.toString();
    const rewardsList = getElement('tower-rewards-list');
    rewardsList.innerHTML = '';
    if (accumulatedRewards.length === 0) {
        rewardsList.textContent = 'None';
    } else {
        accumulatedRewards.forEach(reward => {
            const badge = document.createElement('div');
            badge.className = 'tower-reward-badge';
            badge.textContent = `${reward.amount}x ${reward.name}`;
            if (reward.rarity) {
                badge.style.borderLeft = `3px solid ${uiRarityColors[reward.rarity]}`;
            }
            rewardsList.appendChild(badge);
        });
    }

    const cardArea = getElement('bots-tower-card-area');
    cardArea.innerHTML = '';
    cards.forEach((cardType, index) => {
        const card = document.createElement('button');
        card.className = 'tower-card';
        card.dataset.index = index.toString();
        
        const inner = document.createElement('div');
        inner.className = 'tower-card-inner';

        const front = document.createElement('div');
        front.className = 'tower-card-front';
        front.textContent = '🤖';

        const back = document.createElement('div');
        back.className = 'tower-card-back';

        inner.append(front, back);
        card.appendChild(inner);
        cardArea.appendChild(card);
        
        if (revealedCardIndex !== null) {
            card.classList.add('is-flipped');
            card.disabled = true;
            
            const outcome = cardOutcomes[index];
            if(outcome.type === 'lose') {
                back.innerHTML = `<span class="emoji">💥</span><span class="text">${outcome.name}</span>`;
                back.style.borderColor = 'var(--error-color)';
            } else {
                const reward = outcome as TowerReward;
                let emoji = '❓';
                if (reward.type === 'coins') emoji = '💰';
                else if (reward.type === 'crate') emoji = '🎁';
                else if (reward.type === 'item') emoji = itemEmojis[reward.name] || '❓';

                back.innerHTML = `<span class="emoji">${emoji}</span><span class="text">${reward.amount}x ${reward.name}</span>`;
                if(reward.rarity) {
                    back.style.borderColor = uiRarityColors[reward.rarity];
                }
            }
        }
    });

    const resultText = getElement('tower-result-text');
    const leaveBtn = getElement('tower-leave-btn') as HTMLButtonElement;
    const continueBtn = getElement('tower-continue-btn') as HTMLButtonElement;
    const giveUpBtn = getElement('tower-give-up-btn') as HTMLButtonElement;

    leaveBtn.classList.add('hidden');
    continueBtn.classList.add('hidden');
    giveUpBtn.classList.add('hidden');

    if (lossPending) {
        resultText.textContent = 'You hit a Clanker!';
        resultText.style.color = 'var(--error-color)';
        if (continuesUsed < CONTINUE_COSTS.length) {
            continueBtn.textContent = `Continue (${CONTINUE_COSTS[continuesUsed]} Coins)`;
            continueBtn.classList.remove('hidden');
            continueBtn.disabled = state.coins < CONTINUE_COSTS[continuesUsed];
        }
        giveUpBtn.classList.remove('hidden');
    } else if (revealedCardIndex !== null) {
        resultText.textContent = 'Nice find!';
        resultText.style.color = 'var(--secondary-color)';
    } else {
        resultText.textContent = `Floor ${currentFloor}. Pick a card...`;
        resultText.style.color = 'var(--text-color)';
        leaveBtn.classList.remove('hidden');
    }
}

export function showTowerOfBots() {
    getElement('tower-of-bots-screen').classList.remove('hidden');
}

// Global UI Update Function
export function updateAllUI() {
    const netWorth = calculateNetWorth();
    
    // Stats Header
    getElement('coins').textContent = state.coins.toLocaleString();
    getElement('trading-cash').textContent = state.tradingCash.toFixed(2);
    getElement('netWorth').textContent = netWorth.toLocaleString();
    getElement('equipped-weapon').textContent = state.equippedWeapon || 'None';
    getElement('equipped-armor').textContent = state.equippedArmor || 'None';

    // Update peak net worth stat
    if (netWorth > state.stats.peakNetWorth) {
        state.stats.peakNetWorth = netWorth;
    }

    // Dynamically create/update crate cards
    const crateContainer = getElement('crates-container');
    ['standard', 'weapon', 'armor', 'potion'].forEach(view => {
        getElement(`${view}-crates-page`).classList.toggle('hidden', state.crateView !== view);
        getElement(`nav-${view}-btn`).classList.toggle('active', state.crateView !== view);
    });

    if (state.crateView !== 'standard') {
        const page = getElement(`${state.crateView}-crates-page`);
        page.innerHTML = '<div class="crate-grid"></div>'; // Clear it
        const grid = page.querySelector('.crate-grid');

        const rarities: Rarity[] = ['common', 'rare', 'epic', 'legendary', 'mythical'];
        rarities.forEach(rarity => {
            const crateType = `${state.crateView}_${rarity}` as CrateType;
            const shopData = crateShopValues[state.crateView as 'weapon' | 'armor' | 'potion'];
            if (!shopData) return;
            const cost = shopData[rarity];

            const cardHTML = `
                <div class="crate-card ${rarity}">
                    <div class="crate-card-header">
                        <h3>${rarity.charAt(0).toUpperCase() + rarity.slice(1)} Crate</h3>
                        <div class="crate-info-icon" id="${crateType}-info-btn" data-action="info" data-type="${crateType}">ⓘ</div>
                        <div class="crate-count" id="${crateType}-crate-count">0</div>
                    </div>
                    <p class="crate-desc" id="${crateType}-desc-text"></p>
                    <div class="crate-card-actions">
                        <button id="${crateType}-crate-btn" data-action="open" data-type="${crateType}">Open</button>
                        <button id="${crateType}-open-all-btn" data-action="open-all" data-type="${crateType}">Open All</button>
                        <button id="${crateType}-buy-btn" data-action="buy" data-type="${crateType}">Buy (${cost})</button>
                    </div>
                </div>
            `;
            if (grid) grid.innerHTML += cardHTML;
        });
    }

    // Crate Counts & Unlocks
    Object.keys(state.crateCount).forEach(type => {
        const countEl = document.getElementById(`${type}-crate-count`);
        
        // Only update elements that are currently rendered in the DOM
        if (countEl) {
            const btn = document.getElementById(`${type}-crate-btn`) as HTMLButtonElement;
            const openAllBtn = document.getElementById(`${type}-open-all-btn`) as HTMLButtonElement;
            const buyBtn = document.getElementById(`${type}-buy-btn`) as HTMLButtonElement;
            const infoBtn = document.getElementById(`${type}-info-btn`) as HTMLElement;

            const count = state.crateCount[type as CrateType] || 0;
            countEl.textContent = count.toString();
            
            const isUnlocked = state.unlocked[type as CrateType];

            if (btn) {
                btn.disabled = count <= 0 || !isUnlocked;
                btn.classList.toggle('locked', !isUnlocked);
            }
            if (openAllBtn) {
                openAllBtn.disabled = count <= 0 || !isUnlocked;
                const fee = state.rebirthUpgrades.crateBounties > 0 ? 0 : Math.ceil(count / 5);
                openAllBtn.textContent = count > 1 && fee > 0 ? `Open All (${fee} Coins)` : 'Open All';
            }
            if (buyBtn && buyBtn.parentElement) {
                buyBtn.parentElement.classList.toggle('hidden', !isUnlocked);
            }
            if(infoBtn && infoBtn.parentElement) {
                 infoBtn.parentElement.parentElement.classList.toggle('hidden', !isUnlocked);
            }
        }
    });

    renderInventoryGrid();
    updateGambleDisplay();
    updateActivePotionsUI();
    updateRebirthUI();
    updateCrateDescriptions();
    updateFreeCrateDisplay();
    updateBrawlStatus();
    updateMarketUI();
    updateTowerOfBotsUI();
    
    // Potions
    checkPotionCraftingUnlock();
}