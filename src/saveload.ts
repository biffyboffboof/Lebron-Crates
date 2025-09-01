import { state } from './state';
// Fix: CrateType is not exported from 'data.ts', it is defined and exported from 'types.ts'.
import { BRAWL_BARS, itemData, potions } from './data';
import { CrateType } from './types';
import { regenerateCompositePartRecipe } from './crafting';
import { calculateNetWorth, randomItem } from './utils';
import { showWelcomeBackModal } from './ui';
import { updateMarketPrices } from './market';

const OFFLINE_SPEED_MULTIPLIER = 0.25;

function calculateOfflineProgress(offlineTimeMs: number) {
    const effectiveSeconds = (offlineTimeMs * OFFLINE_SPEED_MULTIPLIER) / 1000;

    if (effectiveSeconds < 10) return null; // Don't calculate for very short periods

    const summary = {
        timeAway: '',
        cratesGenerated: 0,
        autoClaimed: 0,
        potionsExpired: [],
        towerPlays: 0,
        marketPnl: 0,
        brawlsReady: [],
        newUnlocks: [],
    };

    const minutes = Math.floor(offlineTimeMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) summary.timeAway = `You were away for over ${days} day(s).`;
    else if (hours > 0) summary.timeAway = `You were away for about ${hours} hour(s).`;
    else if (minutes > 0) summary.timeAway = `You were away for ${minutes} minute(s).`;

    const netWorthBefore = calculateNetWorth();
    const portfolioValueBefore = state.tradingCash; // simple TC value for now

    // 1. Potions
    for (const effectType in state.activePotions) {
        const effect = state.activePotions[effectType];
        effect.timeLeft -= effectiveSeconds;
        if (effect.timeLeft <= 0) {
            summary.potionsExpired.push(effect.name);
            delete state.activePotions[effectType];
        }
    }

    // 2. Tower of Bots
    if (state.towerOfBotsPlays < state.towerOfBotsMaxPlays) {
        state.towerOfBotsNextPlayTimer -= effectiveSeconds;
        while(state.towerOfBotsNextPlayTimer <= 0 && state.towerOfBotsPlays < state.towerOfBotsMaxPlays) {
            state.towerOfBotsPlays++;
            summary.towerPlays++;
            state.towerOfBotsNextPlayTimer += 1800; // 30 mins
        }
    }

    // 3. Free Crates
    let secondsProcessed = 0;
    let tempFreeCrateTimer = state.freeCrateTimer;
    let tempNextCrateDelay = state.nextCrateDelay;
    const cratesToAdd: CrateType[] = [];

    while (secondsProcessed < effectiveSeconds) {
        if (tempFreeCrateTimer > effectiveSeconds - secondsProcessed) {
            tempFreeCrateTimer -= (effectiveSeconds - secondsProcessed);
            secondsProcessed = effectiveSeconds;
        } else {
            secondsProcessed += tempFreeCrateTimer;
            
            const freeCratePool: { type: CrateType, weight: number }[] = [
                { type: 'basic', weight: 70 }, { type: 'rare', weight: 15 },
                { type: 'weapon_common', weight: 5 }, { type: 'armor_common', weight: 5 }, { type: 'potion_common', weight: 5 },
            ];
            const totalWeight = freeCratePool.reduce((sum, item) => sum + item.weight, 0);
            let random = Math.random() * totalWeight;
            let chosenCrate: CrateType = 'basic';
            for (const item of freeCratePool) {
                if (random < item.weight) { chosenCrate = item.type; break; }
                random -= item.weight;
            }
            cratesToAdd.push(chosenCrate);

            tempNextCrateDelay += 5;
            tempFreeCrateTimer = tempNextCrateDelay;
        }
    }
    state.freeCrateTimer = tempFreeCrateTimer;
    state.nextCrateDelay = tempNextCrateDelay;
    summary.cratesGenerated = cratesToAdd.length;
    cratesToAdd.forEach(c => state.freeCratesToClaim.push(c));
    if (state.freeCratesToClaim.length > 100) {
        state.freeCratesToClaim.splice(0, state.freeCratesToClaim.length - 100);
    }
    
    // Auto-claim if potion was active
    const autoClaim = state.activePotions.autoClaim;
    if(autoClaim && autoClaim.timeLeft > 0 && summary.cratesGenerated > 0) {
        summary.autoClaimed = summary.cratesGenerated;
        cratesToAdd.forEach(crateType => {
            state.crateCount[crateType] = (state.crateCount[crateType] || 0) + 1;
        });
        state.freeCratesToClaim = []; // Clear them since they were claimed
    }

    // 4. Market Prices
    const marketUpdates = Math.min(1000, Math.floor(effectiveSeconds / 3)); // Cap iterations
    for (let i = 0; i < marketUpdates; i++) {
        updateMarketPrices();
    }
    summary.marketPnl = state.tradingCash - portfolioValueBefore;

    // 5. Brawls
    const now = Date.now();
    for(const rarity in BRAWL_BARS) {
        const cooldown = state.brawlCooldowns[rarity];
        if (cooldown && cooldown < now && cooldown > state.lastOnline) {
            summary.brawlsReady.push(BRAWL_BARS[rarity].name);
        }
    }
    
    // 6. New Unlocks
    const netWorthAfter = calculateNetWorth();
    const oldCraftingUnlocked = state.craftingUnlocked;
    if (!oldCraftingUnlocked && netWorthAfter >= 200) {
        state.craftingUnlocked = true;
        summary.newUnlocks.push('Crafting');
    }
    
    for (const rarity in BRAWL_BARS) {
        const bar = BRAWL_BARS[rarity];
        if (bar.unlock.type === 'netWorth' && netWorthBefore < bar.unlock.value && netWorthAfter >= bar.unlock.value) {
            summary.newUnlocks.push(bar.name);
        }
    }

    // Check if anything actually happened
    const somethingHappened = Object.values(summary).some(val => 
        (Array.isArray(val) && val.length > 0) || (typeof val === 'number' && val !== 0)
    );

    return somethingHappened ? summary : null;
}

export function saveGame() {
    state.lastOnline = Date.now();
    localStorage.setItem("lastOnline", state.lastOnline.toString());
    localStorage.setItem("coins", state.coins.toString());
    localStorage.setItem("inventory", JSON.stringify(state.inventory));
    localStorage.setItem("potions", JSON.stringify(state.potions));
    localStorage.setItem("crateCount", JSON.stringify(state.crateCount));
    localStorage.setItem("unlocked", JSON.stringify(state.unlocked));
    localStorage.setItem("discoveredItems", JSON.stringify(state.discoveredItems));
    localStorage.setItem("discoveredPotions", JSON.stringify(state.discoveredPotions));
    localStorage.setItem("freeCrateTimer", state.freeCrateTimer.toString());
    localStorage.setItem("nextCrateDelay", state.nextCrateDelay.toString());
    localStorage.setItem("gambledCoins", state.gambledCoins.toString());
    localStorage.setItem("redeemedCodes", JSON.stringify(state.redeemedCodes));
    localStorage.setItem("stats", JSON.stringify(state.stats));
    localStorage.setItem("rebirthTokens", state.rebirthTokens.toString());
    localStorage.setItem("rebirthUpgrades", JSON.stringify(state.rebirthUpgrades));
    localStorage.setItem("rebirthShopOffers", JSON.stringify(state.rebirthShopOffers));
    localStorage.setItem("canRedoCoinFlip", JSON.stringify(state.canRedoCoinFlip));
    localStorage.setItem("gambleInsuranceUsedThisLife", JSON.stringify(state.gambleInsuranceUsedThisLife));
    localStorage.setItem("craftingUnlocked", JSON.stringify(state.craftingUnlocked));
    localStorage.setItem("mainView", state.mainView);
    localStorage.setItem("inventorySubView", state.inventorySubView);
    localStorage.setItem("craftingSubView", state.craftingSubView);
    localStorage.setItem("consumableSubView", state.consumableSubView);
    localStorage.setItem("activePotions", JSON.stringify(state.activePotions));
    localStorage.setItem("potionCraftingUnlockedThisLife", JSON.stringify(state.potionCraftingUnlockedThisLife));
    localStorage.setItem("brawlCooldowns", JSON.stringify(state.brawlCooldowns));
    localStorage.setItem("brawlUnlockedOverride", JSON.stringify(state.brawlUnlockedOverride));
    localStorage.setItem("brawlProgress", JSON.stringify(state.brawlProgress));
    localStorage.setItem("brawlTavernsBeaten", JSON.stringify(state.brawlTavernsBeaten));
    localStorage.setItem("crateView", state.crateView);
    localStorage.setItem("marketAssets", JSON.stringify(state.marketAssets));
    localStorage.setItem("marketPortfolio", JSON.stringify(state.marketPortfolio));
    localStorage.setItem("tradingCash", state.tradingCash.toString());
    localStorage.setItem("tcExchangeRate", state.tcExchangeRate.toString());
    localStorage.setItem("shortCollateral", JSON.stringify(state.shortCollateral));
    localStorage.setItem("tradeHistory", JSON.stringify(state.tradeHistory));
    localStorage.setItem("equippedWeapon", state.equippedWeapon || '');
    localStorage.setItem("equippedArmor", state.equippedArmor || '');
    localStorage.setItem("saveId", state.saveId);
    localStorage.setItem("towerOfBotsState", JSON.stringify(state.towerOfBotsState));
    localStorage.setItem("towerOfBotsPlays", state.towerOfBotsPlays.toString());
    localStorage.setItem("towerOfBotsNextPlayTimer", state.towerOfBotsNextPlayTimer.toString());
    localStorage.setItem("loan", JSON.stringify(state.loan));
}

export function loadGame() {
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
    const defaultTowerState = {
        isActive: false, currentFloor: 0, accumulatedRewards: [],
        cards: [], revealedCardIndex: null, continuesUsed: 0, lossPending: false
    };


    state.coins = parseInt(localStorage.getItem("coins") || '0', 10);
    state.inventory = JSON.parse(localStorage.getItem("inventory") || '{}');
    state.potions = JSON.parse(localStorage.getItem("potions") || '{}');
    
    const loadedCrateCount = JSON.parse(localStorage.getItem("crateCount") || JSON.stringify(defaultCrateCount));
    state.crateCount = { ...defaultCrateCount, ...loadedCrateCount };
    
    const loadedUnlocked = JSON.parse(localStorage.getItem("unlocked") || JSON.stringify(defaultUnlocked));
    state.unlocked = { ...defaultUnlocked, ...loadedUnlocked };
    
    state.discoveredItems = JSON.parse(localStorage.getItem("discoveredItems") || '[]');
    state.discoveredPotions = JSON.parse(localStorage.getItem("discoveredPotions") || '[]');
    state.freeCrateTimer = parseFloat(localStorage.getItem("freeCrateTimer") || '30');
    state.nextCrateDelay = parseInt(localStorage.getItem("nextCrateDelay") || '35', 10);
    state.gambledCoins = parseInt(localStorage.getItem("gambledCoins") || '0', 10);
    state.redeemedCodes = JSON.parse(localStorage.getItem("redeemedCodes") || '[]');
    state.rebirthTokens = parseInt(localStorage.getItem("rebirthTokens") || '0', 10);
    const loadedUpgrades = JSON.parse(localStorage.getItem("rebirthUpgrades") || '{}');
    state.rebirthUpgrades = { ...state.rebirthUpgrades, ...loadedUpgrades };
    state.rebirthShopOffers = JSON.parse(localStorage.getItem("rebirthShopOffers") || 'null');
    state.canRedoCoinFlip = JSON.parse(localStorage.getItem("canRedoCoinFlip") || '0');
    state.gambleInsuranceUsedThisLife = JSON.parse(localStorage.getItem("gambleInsuranceUsedThisLife") || 'false');
    state.craftingUnlocked = JSON.parse(localStorage.getItem("craftingUnlocked") || 'false');
    state.activePotions = JSON.parse(localStorage.getItem("activePotions") || '{}');
    state.potionCraftingUnlockedThisLife = JSON.parse(localStorage.getItem("potionCraftingUnlockedThisLife") || 'false');
    state.mainView = localStorage.getItem("mainView") as any || 'inventory';
    state.inventorySubView = localStorage.getItem("inventorySubView") as any || 'items';
    state.craftingSubView = localStorage.getItem("craftingSubView") as any || 'goods';
    state.consumableSubView = localStorage.getItem("consumableSubView") as any || 'potions';
    state.brawlCooldowns = JSON.parse(localStorage.getItem("brawlCooldowns") || '{}');
    state.brawlUnlockedOverride = JSON.parse(localStorage.getItem("brawlUnlockedOverride") || 'false');
    const loadedBrawlProgress = JSON.parse(localStorage.getItem("brawlProgress") || JSON.stringify(defaultBrawlProgress));
    state.brawlProgress = { ...defaultBrawlProgress, ...loadedBrawlProgress };
    const loadedBrawlTavernsBeaten = JSON.parse(localStorage.getItem("brawlTavernsBeaten") || JSON.stringify(defaultBrawlTavernsBeaten));
    state.brawlTavernsBeaten = { ...defaultBrawlTavernsBeaten, ...loadedBrawlTavernsBeaten };
    state.equippedWeapon = localStorage.getItem("equippedWeapon") || null;
    state.equippedArmor = localStorage.getItem("equippedArmor") || null;
    state.crateView = (localStorage.getItem("crateView") as any) || 'standard';
    state.marketAssets = JSON.parse(localStorage.getItem("marketAssets") || '{}');
    const loadedTowerState = JSON.parse(localStorage.getItem("towerOfBotsState") || JSON.stringify(defaultTowerState));
    state.towerOfBotsState = { ...defaultTowerState, ...loadedTowerState };
    state.towerOfBotsPlays = parseInt(localStorage.getItem("towerOfBotsPlays") || '1', 10);
    state.towerOfBotsNextPlayTimer = parseInt(localStorage.getItem("towerOfBotsNextPlayTimer") || '1800', 10);
    state.towerOfBotsMaxPlays = 2; // This is a constant, no need to save/load
    state.lastOnline = parseInt(localStorage.getItem("lastOnline") || '0', 10);
    state.loan = JSON.parse(localStorage.getItem("loan") || 'null');


    // Migration for basePrice
    for (const assetId in state.marketAssets) {
        if (state.marketAssets[assetId].basePrice === undefined) {
            state.marketAssets[assetId].basePrice = state.marketAssets[assetId].currentPrice;
        }
    }
    
    const loadedPortfolio = JSON.parse(localStorage.getItem("marketPortfolio") || '{}');
    if (Object.values(loadedPortfolio).some(v => typeof v === 'number')) {
        state.marketPortfolio = {};
    } else {
        state.marketPortfolio = loadedPortfolio;
    }

    state.tradingCash = parseFloat(localStorage.getItem("tradingCash") || '5.0');
    state.tcExchangeRate = parseFloat(localStorage.getItem("tcExchangeRate") || '5.0');
    state.shortCollateral = JSON.parse(localStorage.getItem("shortCollateral") || '{}');
    state.tradeHistory = JSON.parse(localStorage.getItem("tradeHistory") || '[]');
    state.saveId = localStorage.getItem("saveId") || '';


    // Migration for old saves: remove goods, weapon, armor, potion base types
    delete state.crateCount['goods'];
    delete state.crateCount['weapon'];
    delete state.crateCount['armor'];
    delete state.crateCount['potion'];
    delete state.unlocked['goods'];
    delete state.unlocked['weapon'];
    delete state.unlocked['armor'];
    delete state.unlocked['potion'];

    const loadedStats = JSON.parse(localStorage.getItem("stats") || '{}');
    const defaultStats = {
        lifetimeCoins: 0,
        peakNetWorth: state.coins,
        cratesOpened: 0,
        totalGambledValue: 0,
        totalWonValue: 0,
        gamblesWon: 0,
        gamblesLost: 0,
        totalCrateValue: 0,
        totalPullValue: 0,
        rebirths: 0,
        marketPnl: 0,
    };
    state.stats = { ...defaultStats, ...loadedStats };
    
    if (!state.saveId) {
        // Assign an ID if one doesn't exist (new game or old save)
        state.saveId = Date.now() + '-' + Math.random();
    }
    
