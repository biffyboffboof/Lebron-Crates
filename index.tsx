import { loadGame, saveGame } from './src/saveload';
// FIX: Added 'updateTowerOfBotsUI' to the import list. Other missing functions will be added to ui.ts.
import { updateAllUI, showAddCoinsModal, hideAddCoinsModal, showCodeModal, hideCodeModal, showStatsModal, hideStatsModal, showSaveLoadModal, hideSaveLoadModal, setMainView, setInventorySubView, setCraftingSubView, setupTooltips, showBrawlSelectionModal, updateBrawlStatus, hideBrawlSelectionModal, hideBrawlItemModal, setCrateView, showCrateInfoModal, hideCrateInfoModal, setConsumableSubView, showMarketModal, hideMarketModal, showToast, hideWillyVoteModal, showCreditsModal, hideCreditsModal, updateMarketUI, hideWelcomeBackModal, populateRebirthUpgradesScreen, updateTowerOfBotsUI } from './src/ui';
import { state } from './src/state';
import { tickFreeCrateTimer, claimFreeCrates, openSingleCrate, buyCrate, openAllCrates } from './src/crates';
import { addCoinsToGamble, flipSelected, restoreSelection } from './src/gamble';
import { redeemCode } from './src/codes';
import { sellAllItems, gambleAll } from './src/inventory';
import { handleRebirth, handleFinishRebirth, handleHit, handleStand } from './src/rebirth';
import { handlePlayerAttack, handlePlayerShield, handlePlayerRun, handleBrawlClose, handleUseItem, handleUsePotion } from './src/brawl';
import { getElement, showConfirmationModal, calculateNetWorth } from './src/utils';
import './style.css'
import { CrateType, CraftingSubView, InventorySubView, ConsumableSubView, CrateView, MarketPortfolioItem } from './src/types';
import { initializeMarket, updateMarketPrices, buyAsset, sellAsset, shortAsset, convertCurrency, checkLoanStatus, takeLoan, repayLoan } from './src/market';
import { itemData, potions, UPGRADE_DEFINITIONS } from './src/data';
import { startTowerOfBotsGame, startTowerOfBotsGameWithShortcut, leaveTower, continueTowerAfterLoss, pickCard } from './src/fatesTower';
import { lebronJamesImage } from './src/image';

/**
 * Downloads the current game state as a text file. test
 */
function downloadSaveFile() {
    // Generate a new unique ID for this specific save file
    state.saveId = Date.now() + '-' + Math.random();
    saveGame(); // Ensure localStorage is up-to-date with the new saveId
    const saveObject = { ...state };
    const jsonString = JSON.stringify(saveObject);
    const obfuscatedData = btoa(jsonString); // Obfuscate using Base64

    const blob = new Blob([obfuscatedData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lebron-crates-save.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Save file downloaded!', 'success');
    hideSaveLoadModal();
}

/**
 * Handles the file upload event to load a game state from a file.
 * @param event The file input change event.
 */
function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onerror = function() {
        console.error("FileReader error:", reader.error);
        showToast("Error reading the selected file.", "error");
        target.value = ''; // Reset file input
    };

    reader.onload = async function(e) {
        try {
            const obfuscatedData = e.target?.result as string;
            if (!obfuscatedData) {
                throw new Error("File is empty or could not be read.");
            }
            const jsonString = atob(obfuscatedData); // De-obfuscate
            const loadedSave = JSON.parse(jsonString);

            if (loadedSave.coins === undefined || loadedSave.inventory === undefined || loadedSave.stats === undefined) {
                throw new Error('Invalid save file structure.');
            }

            const confirmation = await showConfirmationModal(
                'Load Save File?',
                'Are you sure you want to load this save?<br><br>' +
                'Your current progress will be overwritten.'
            );

            if (!confirmation) {
                target.value = ''; // Reset file input
                showToast('Load operation cancelled.', 'info');
                return;
            }

            // Safely merge the loaded state by overwriting state property by property,
            // providing defaults from the initial state structure for any missing fields.
            // This prevents errors from loading older save files that lack newer state properties.
            const defaultCrateCount = {
                basic: 5, rare: 0, epic: 0, legendary: 0, mythical: 0,
                weapon_common: 0, weapon_rare: 0, weapon_epic: 0, weapon_legendary: 0, weapon_mythical: 0,
                armor_common: 0, armor_rare: 0, armor_epic: 0, armor_legendary: 0, armor_mythical: 0,
                potion_common: 0, potion_rare: 0, potion_epic: 0, potion_legendary: 0, potion_mythical: 0,
            };
            const defaultUnlocked = {
                basic: true, rare: false, epic: false, legendary: false, mythical: false,
                weapon_common: true, weapon_rare: false, weapon_epic: false, weapon_legendary: false, weapon_mythical: false,
                armor_common: true, armor_rare: false, armor_epic: false, armor_legendary: false, armor_mythical: false,
                potion_common: true, potion_rare: false, potion_epic: false, potion_legendary: false, potion_mythical: false,
            };
            const defaultBrawlProgress = {
                common: -1, rare: -1, epic: -1, legendary: -1,
            };
            const defaultBrawlTavernsBeaten = {
                common: false, rare: false, epic: false, legendary: false,
            };
            const defaultStats = {
                lifetimeCoins: 0, peakNetWorth: 0, cratesOpened: 0, totalGambledValue: 0, totalWonValue: 0,
                gamblesWon: 0, gamblesLost: 0, totalCrateValue: 0, totalPullValue: 0, rebirths: 0, marketPnl: 0,
            };
             const defaultRebirthUpgrades = {
                speedyCrates: 0, secondChance: 0, crateBounties: 0, startingCapital: 0,
                goldenTouch: 0, shopHaggler: 0, gambleInsurance: 0, netWorthInflation: 0, weightedCoin: 0,
                tavernBrawler: 0, marketInsider: 0,
            };

            // Simple values
            state.coins = loadedSave.coins ?? 0;
            state.inventory = loadedSave.inventory ?? {};
            state.potions = loadedSave.potions ?? {};
            state.discoveredItems = loadedSave.discoveredItems ?? [];
            state.discoveredPotions = loadedSave.discoveredPotions ?? [];
            state.freeCrateTimer = loadedSave.freeCrateTimer ?? 30;
            state.nextCrateDelay = loadedSave.nextCrateDelay ?? 35;
            state.gambledCoins = loadedSave.gambledCoins ?? 0;
            state.redeemedCodes = loadedSave.redeemedCodes ?? [];
            state.rebirthTokens = loadedSave.rebirthTokens ?? 0;
            state.canRedoCoinFlip = loadedSave.canRedoCoinFlip ?? 0;
            state.gambleInsuranceUsedThisLife = loadedSave.gambleInsuranceUsedThisLife ?? false;
            state.craftingUnlocked = loadedSave.craftingUnlocked ?? false;
            state.activePotions = loadedSave.activePotions ?? {};
            state.potionCraftingUnlockedThisLife = loadedSave.potionCraftingUnlockedThisLife ?? false;
            state.mainView = loadedSave.mainView ?? 'inventory';
            state.inventorySubView = loadedSave.inventorySubView ?? 'items';
            state.craftingSubView = loadedSave.craftingSubView ?? 'goods';
            state.consumableSubView = loadedSave.consumableSubView ?? 'potions';
            state.brawlCooldowns = loadedSave.brawlCooldowns ?? {};
            state.brawlUnlockedOverride = loadedSave.brawlUnlockedOverride ?? false;
            state.equippedWeapon = loadedSave.equippedWeapon ?? null;
            state.equippedArmor = loadedSave.equippedArmor ?? null;
            state.crateView = loadedSave.crateView ?? 'standard';
            state.marketAssets = loadedSave.marketAssets ?? {};
            state.marketPortfolio = loadedSave.marketPortfolio ?? {};
            state.tradingCash = loadedSave.tradingCash ?? 5.0;
            state.tcExchangeRate = loadedSave.tcExchangeRate ?? 5.0;
            state.shortCollateral = loadedSave.shortCollateral ?? {};
            state.tradeHistory = loadedSave.tradeHistory ?? [];
            state.saveId = loadedSave.saveId ?? ''; // Get saveId from the file.
            state.towerOfBotsPlays = loadedSave.towerOfBotsPlays ?? 1;
            state.towerOfBotsNextPlayTimer = loadedSave.towerOfBotsNextPlayTimer ?? 1800;
            state.lastOnline = loadedSave.lastOnline ?? 0;
            state.rebirthShopOffers = loadedSave.rebirthShopOffers ?? null;
            state.loan = loadedSave.loan ?? null;

            // Merged objects
            state.crateCount = { ...defaultCrateCount, ...(loadedSave.crateCount ?? {}) };
            state.unlocked = { ...defaultUnlocked, ...(loadedSave.unlocked ?? {}) };
            state.brawlProgress = { ...defaultBrawlProgress, ...(loadedSave.brawlProgress ?? {}) };
            state.brawlTavernsBeaten = { ...defaultBrawlTavernsBeaten, ...(loadedSave.brawlTavernsBeaten ?? {}) };
            state.rebirthUpgrades = { ...defaultRebirthUpgrades, ...(loadedSave.rebirthUpgrades ?? {}) };
            state.stats = { ...defaultStats, ...(loadedSave.stats ?? {}) };
            if (loadedSave.brawlState) {
                state.brawlState = { ...state.brawlState, ...loadedSave.brawlState };
            }
            
            // Generate a new ID for this session to prevent re-use of the just-loaded file
            state.saveId = Date.now() + '-' + Math.random();

            // Ensure all items/potions from the current data file are present
            Object.keys(itemData).forEach(i => {
                if (state.inventory[i] === undefined) state.inventory[i] = 0;
            });
            Object.keys(potions).forEach(pName => {
                if (state.potions[pName] === undefined) state.potions[pName] = 0;
            });
            
            // Ensure discovered arrays exist
            if (!state.discoveredItems) state.discoveredItems = [];
            if (!state.discoveredPotions) state.discoveredPotions = [];

            saveGame(); // Persist the new state to localStorage
            updateAllUI();
            
            localStorage.setItem('hasPlayedBefore', 'true');
            getElement('title-screen').classList.add('hidden');
            getElement('container').classList.remove('hidden');
            showToast('Progress loaded successfully!', 'success');
        } catch (error) {
            console.error('Failed to load save file:', error);
            showToast('Failed to load save file. It may be corrupted or invalid.', 'error');
        } finally {
            target.value = ''; // Reset file input
        }
    };
    reader.readAsText(file);
}

/**
 * Resets all game progress by clearing localStorage and reloading the page.
 */
async function restartGame() {
    const confirmation = await showConfirmationModal(
        'Restart Game?',
        'Are you sure you want to restart? All your progress, including items, coins, and rebirth upgrades, will be permanently deleted.'
    );

    if (confirmation) {
        // Clear all saved data
        localStorage.clear();
        sessionStorage.clear(); // Also clear session storage for good measure
        // Reload the page to start from scratch
        window.location.reload();
    }
}


/**
 * Initializes the entire application.
 * Loads the game state, sets up all UI event listeners, and starts timers.
 */
function init() {
    loadGame();

    if (localStorage.getItem('hasPlayedBefore')) {
        getElement('title-screen').classList.add('hidden');
        getElement('container').classList.remove('hidden');
    } else {
        getElement('title-screen').classList.remove('hidden');
        getElement('container').classList.add('hidden');
    }

    initializeMarket();
    updateAllUI();
    setupTooltips();

    // Set title screen background
    getElement('title-screen').style.backgroundImage = `linear-gradient(rgba(18, 18, 18, 0.85), rgba(18, 18, 18, 0.85)), url(${lebronJamesImage})`;

    // Game Timers
    setInterval(tickFreeCrateTimer, 1000);
    setInterval(updateMarketPrices, 3000);
    setInterval(saveGame, 15000); // Autosave
    setInterval(() => {
        let needsUIUpdate = false;
        // Potion timers
        for (const effectType in state.activePotions) {
            const effect = state.activePotions[effectType];
            if (effect.timeLeft > 0) {
                effect.timeLeft--;
                if (effect.timeLeft === 0) {
                    delete state.activePotions[effectType];
                    needsUIUpdate = true; 
                }
            }
        }

        // Tower of Bots timer
        if (state.towerOfBotsPlays < state.towerOfBotsMaxPlays) {
            if (state.towerOfBotsNextPlayTimer > 0) {
                state.towerOfBotsNextPlayTimer--;
            } else {
                state.towerOfBotsPlays++;
                state.towerOfBotsNextPlayTimer = 1800; // 30 minutes
                showToast("You gained a free Tower of Bots play!", "success");
            }
            needsUIUpdate = true; // Always update tower UI if timer is running
        }

        // Brawl cooldown timers
        updateBrawlStatus();
        
        // Market Loan Timer & Margin Call Check
        checkLoanStatus();

        if (needsUIUpdate) {
            updateAllUI();
        } else if (Object.keys(state.activePotions).length > 0) {
            // We still need to update the timer display even if no potions expired
            const container = getElement('active-effects-container');
            container.querySelectorAll('.effect-badge-timer').forEach(timerEl => {
                const badge = timerEl.closest('.effect-badge');
                if (badge) {
                    const effectType = Object.keys(state.activePotions).find(k => state.activePotions[k].name === badge.querySelector('span:not([class])')?.textContent.split(' ')[0]);
                    if(effectType) {
                        const effect = state.activePotions[effectType];
                        const minutes = Math.floor(effect.timeLeft / 60);
                        const seconds = effect.timeLeft % 60;
                        timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    }
                }
            });
        }
        
        const autoClaim = state.activePotions.autoClaim;
        if (autoClaim && autoClaim.timeLeft > 0 && state.freeCratesToClaim.length > 0) {
            claimFreeCrates();
        }
    }, 1000);

    // Event Listeners
    window.addEventListener('beforeunload', saveGame);

    // Title Screen
    getElement('start-game-btn').onclick = () => {
        localStorage.setItem('hasPlayedBefore', 'true');
        getElement('title-screen').classList.add('hidden');
        getElement('container').classList.remove('hidden');
    };
    getElement('upload-save-input-title').onchange = handleFileUpload;
    getElement('credits-btn').onclick = showCreditsModal;
    getElement('close-credits-btn').onclick = hideCreditsModal;
    getElement('close-welcome-back-btn').onclick = hideWelcomeBackModal;

    // Crate Emoji Easter Egg
    let crateEmojiClicks = 0;
    const crateEmoji = getElement('title-crate-emoji');
    crateEmoji.onclick = () => {
        crateEmojiClicks++;
        
        crateEmoji.classList.add('shake');
        setTimeout(() => crateEmoji.classList.remove('shake'), 820);

        if (crateEmojiClicks === 7) {
            localStorage.setItem('hasPlayedBefore', 'true');
            getElement('title-screen').classList.add('hidden');
            getElement('container').classList.remove('hidden');
            state.crateCount.epic++;
            showToast('You found a secret! +1 Epic Crate', 'success');
            updateAllUI();
        }
    };

    // --- Crate Section Event Delegation ---
    getElement('crates-section').addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const actionTarget = target.closest('[data-action]') as HTMLElement;
        if (!actionTarget) return;

        const action = actionTarget.dataset.action;
        const type = actionTarget.dataset.type as CrateType;

        if (!type) return;

        switch (action) {
            case 'open':
                openSingleCrate(type);
                break;
            case 'open-all':
                openAllCrates(type);
                break;
            case 'buy':
                buyCrate(type);
                break;
            case 'info':
                showCrateInfoModal(type);
                break;
        }
    });

    getElement('crate-view-nav').addEventListener('click', e => {
        const target = e.target as HTMLButtonElement;
        if (target.matches('.toggle-btn')) {
            setCrateView(target.dataset.view as CrateView);
        }
    });
    getElement('result-close-btn').onclick = () => getElement('crate-modal').classList.add('hidden');
    getElement('multi-result-close-btn').onclick = () => getElement('multi-result-modal').classList.add('hidden');

    // Free Crates
    getElement('claimFreeBtn').onclick = claimFreeCrates;

    // Header buttons
    getElement('enterCodeBtn').onclick = showCodeModal;
    getElement('statsBtn').onclick = showStatsModal;
    getElement('saveBtn').onclick = showSaveLoadModal;
    getElement('restartBtn').onclick = restartGame;

    // Modals
    getElement('cancel-add-coins-btn').onclick = hideAddCoinsModal;
    getElement('confirm-add-coins-btn').onclick = () => {
        const input = getElement('gamble-coin-input') as HTMLInputElement;
        const amount = parseInt(input.value, 10);
        addCoinsToGamble(amount);
        updateAllUI();
        hideAddCoinsModal();
        input.value = '';
    };
    getElement('cancel-code-btn').onclick = hideCodeModal;
    getElement('redeem-code-btn').onclick = () => {
        const input = getElement('code-input') as HTMLInputElement;
        redeemCode(input.value);
        updateAllUI();
        hideCodeModal();
        input.value = '';
    };
    getElement('close-stats-btn').onclick = hideStatsModal;
    getElement('cancel-saveload-btn').onclick = hideSaveLoadModal;
    getElement('download-save-btn').onclick = downloadSaveFile;
    getElement('crate-info-close-btn').onclick = hideCrateInfoModal;

    // Inventory View Toggles
    getElement('main-view-toggle-container').addEventListener('click', e => {
        const target = e.target as HTMLElement;
        if (target.id === 'show-inventory-btn') {
            setMainView('inventory');
        } else if (target.id === 'show-crafting-btn') {
            if (!state.craftingUnlocked && calculateNetWorth() < 200) {
                showToast('Reach a Net Worth of 200 to unlock Crafting.', 'error');
                return;
            }
            if (!state.craftingUnlocked) {
                state.craftingUnlocked = true;
                showToast('Crafting Unlocked!', 'success');
            }
            setMainView('crafting');
        }
    });

    getElement('inventory-sub-toggle-container').addEventListener('click', e => {
        const target = e.target as HTMLElement;
        const viewMap = {
            'show-items-btn': 'items', 'show-weapons-btn': 'weapons', 'show-armor-btn': 'armor',
            'show-ingredients-btn': 'ingredients', 'show-consumables-btn': 'consumables'
        };
        const view = viewMap[target.id];
        if (view) setInventorySubView(view as InventorySubView);
    });
    
    getElement('consumable-sub-toggle-container').addEventListener('click', e => {
        const target = e.target as HTMLElement;
        const viewMap = {
            'show-consumable-potions-btn': 'potions', 'show-consumable-combatItems-btn': 'combatItems'
        };
        const view = viewMap[target.id];
        if (view) setConsumableSubView(view as ConsumableSubView);
    });

    getElement('crafting-sub-toggle-container').addEventListener('click', e => {
        const target = e.target as HTMLElement;
        const viewMap = {
            'show-crafting-goods-btn': 'goods', 'show-crafting-weapons-btn': 'weapons', 'show-crafting-potions-btn': 'potions'
        };
        const view = viewMap[target.id];
        if (view) setCraftingSubView(view as CraftingSubView);
    });

    // Inventory Controls
    const selectAllDropdown = getElement('selectAllDropdown');
    getElement('selectAllBtn').onclick = () => selectAllDropdown.classList.toggle('hidden');
    document.addEventListener('click', e => { // Close dropdown if clicking outside
        if (!(e.target as HTMLElement).closest('.dropdown-container')) {
            selectAllDropdown.classList.add('hidden');
        }
    });
    getElement('sellAllBtn').onclick = () => {
        sellAllItems();
        selectAllDropdown.classList.add('hidden');
        updateAllUI();
    };
    getElement('gambleAllBtn').onclick = () => {
        gambleAll();
        selectAllDropdown.classList.add('hidden');
        updateAllUI();
    };

    // Gamble section
    getElement('addCoinsBtn').onclick = showAddCoinsModal;
    getElement('headsBtn').onclick = () => flipSelected('heads');
    getElement('tailsBtn').onclick = () => flipSelected('tails');
    getElement('restoreBtn').onclick = restoreSelection;
    
    // Rebirth section
    getElement('rebirthBtn').onclick = handleRebirth;
    getElement('hit-btn').onclick = handleHit;
    getElement('stand-btn').onclick = handleStand;
    getElement('proceed-to-upgrades-btn').onclick = () => {
        getElement('blackjack-screen').classList.add('hidden');
        getElement('rebirth-upgrades-screen').classList.remove('hidden');
        populateRebirthUpgradesScreen();
    };
    getElement('finish-rebirth-btn').onclick = handleFinishRebirth;

    // Brawl section
    getElement('startBrawlBtn').onclick = () => {
        updateBrawlStatus();
        showBrawlSelectionModal();
    };
    getElement('cancel-brawl-selection-btn').onclick = hideBrawlSelectionModal;
    getElement('brawl-attack-btn').onclick = handlePlayerAttack;
    getElement('brawl-shield-btn').onclick = handlePlayerShield;
    getElement('brawl-run-btn').onclick = handlePlayerRun;
    getElement('brawl-close-btn').onclick = handleBrawlClose;
    getElement('brawl-item-btn').onclick = handleUseItem;
    getElement('brawl-potion-btn').onclick = handleUsePotion;
    getElement('cancel-brawl-item-btn').onclick = hideBrawlItemModal;
    
    // Tower of Bots section
    getElement('enter-bots-tower-btn').onclick = startTowerOfBotsGame;
    getElement('shortcut-bots-tower-btn').onclick = startTowerOfBotsGameWithShortcut;

    // Market section
    getElement('tradeBtn').onclick = () => {
        state.marketActiveTab = 'trading'; // Ensure default state
        updateMarketUI();
        showMarketModal();
    };
    getElement('market-close-btn').onclick = hideMarketModal;
    getElement('market-tabs').addEventListener('click', e => {
        const target = e.target as HTMLElement;
        if (target.dataset.tab) {
            state.marketActiveTab = target.dataset.tab as any;
            updateMarketUI();
        }
    });
    getElement('market-graph-timescale').addEventListener('click', e => {
        const target = e.target as HTMLElement;
        if (target.dataset.scale) {
            state.marketActiveTimeScale = parseInt(target.dataset.scale, 10);
            updateMarketUI();
        }
    });
    const marketQtyInput = getElement('market-quantity-input') as HTMLInputElement;
    marketQtyInput.oninput = updateMarketUI;
    getElement('market-buy-btn').onclick = () => {
        const quantity = parseInt(marketQtyInput.value, 10);
        if (state.marketSelectedAssetId && quantity > 0) {
            buyAsset(state.marketSelectedAssetId, quantity);
        }
    };
    getElement('market-sell-btn').onclick = () => {
        const quantity = parseInt(marketQtyInput.value, 10);
        if (state.marketSelectedAssetId && quantity > 0) {
            sellAsset(state.marketSelectedAssetId, quantity);
        }
    };
    getElement('market-short-btn').onclick = () => {
        const quantity = parseInt(marketQtyInput.value, 10);
        if (state.marketSelectedAssetId && quantity > 0) {
            shortAsset(state.marketSelectedAssetId, quantity);
        }
    };
    getElement('market-to-tc-btn').onclick = () => {
        const input = getElement('market-exchange-input') as HTMLInputElement;
        convertCurrency('toTC', parseFloat(input.value));
        input.value = '';
    };
    getElement('market-from-tc-btn').onclick = () => {
        const input = getElement('market-exchange-input') as HTMLInputElement;
        convertCurrency('fromTC', parseFloat(input.value));
        input.value = '';
    };
    getElement('repay-loan-btn').onclick = repayLoan;
    getElement('loan-offers-container').addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const button = target.closest('button');
        if (button && button.dataset.loanAmount) {
            const amount = parseFloat(button.dataset.loanAmount);
            takeLoan(amount);
        }
    });

    // Willy Vote Modal
    getElement('willy-vote-yes-btn').onclick = () => {
        state.coins += 1000;
        showToast("You have made the correct choice. +1000 Coins", 'success');
        hideWillyVoteModal();
        updateAllUI();
    };
    getElement('willy-vote-no-btn').onclick = () => {
        showToast("An interesting, albeit incorrect, decision.", 'info');
        hideWillyVoteModal();
    };

    // Confirm Modal
    // Handled by showConfirmationModal utility

    // Tower of Bots screen
    getElement('tower-leave-btn').onclick = () => {
        leaveTower();
        getElement('tower-of-bots-screen').classList.add('hidden');
        updateAllUI();
    };
    getElement('tower-continue-btn').onclick = () => {
        continueTowerAfterLoss();
        updateAllUI();
    };
     getElement('tower-give-up-btn').onclick = () => {
        leaveTower();
        getElement('tower-of-bots-screen').classList.add('hidden');
        updateAllUI();
    };
     getElement('bots-tower-card-area').addEventListener('click', e => {
        // FIX: Cast target to HTMLElement to access dataset property.
        const target = (e.target as HTMLElement).closest('.tower-card') as HTMLElement | null;
        if (target && target.dataset.index) {
            pickCard(parseInt(target.dataset.index, 10));
            updateTowerOfBotsUI();
        }
    });
}

init();