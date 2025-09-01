import { itemData, potions } from "./data";
import { AppState, CrateType, Rarity } from './types';

const crateRarities: Rarity[] = ['common', 'rare', 'epic', 'legendary', 'mythical'];
const specializedCrateTypes = ['weapon', 'armor', 'potion'];

const initialCrateCount: Partial<Record<CrateType, number>> = {
    basic: 5, rare: 0, epic: 0, legendary: 0, mythical: 0,
};
const initialUnlocked: Partial<Record<CrateType, boolean>> = {
    basic: true, rare: false, epic: false, legendary: false, mythical: false,
};

specializedCrateTypes.forEach(type => {
    crateRarities.forEach(rarity => {
        const key = `${type}_${rarity}` as CrateType;
        initialCrateCount[key] = 0;
        initialUnlocked[key] = rarity === 'common'; // Unlock common specialized crates by default
    });
});


export const state: AppState = {
    coins: 0,
    inventory: {},
    potions: {},
    crateCount: initialCrateCount as Record<CrateType, number>,
    unlocked: initialUnlocked as Record<CrateType, boolean>,
    discoveredItems: [],
    discoveredPotions: [],
    selectedForGamble: [],
    baseTimer: 30,
    nextCrateDelay: 35,
    freeCrateTimer: 30,
    freeCratesToClaim: [],
    gambledCoins: 0,
    isAllIn: false,
    redeemedCodes: [],
    craftingUnlocked: false,
    potionCraftingUnlockedThisLife: false,
    mainView: 'inventory',
    inventorySubView: 'items',
    craftingSubView: 'goods',
    consumableSubView: 'potions',
    crateView: 'standard',
    rebirthTokens: 0,
    canRedoCoinFlip: 0,
    gambleInsuranceUsedThisLife: false,
    activePotions: {},
    equippedWeapon: null,
    equippedArmor: null,
    brawlState: {
        isActive: false,
        playerHealth: 100,
        playerMaxHealth: 100,
        playerShield: 0,
        playerStamina: 100,
        playerMaxStamina: 100,
        consecutiveShields: 0,
        opponent: null,
        opponentHealth: 0,
        opponentShield: 0,
        currentStage: 0,
        rewards: [],
        rarity: null,
        playerEffects: {},
        opponentEffects: {},
    },
    brawlCooldowns: {},
    brawlUnlockedOverride: false,
    brawlProgress: {
        common: -1,
        rare: -1,
        epic: -1,
        legendary: -1,
    },
    brawlTavernsBeaten: {
        common: false,
        rare: false,
        epic: false,
        legendary: false,
    },
    rebirthUpgrades: {
        speedyCrates: 0,
        secondChance: 0,
        crateBounties: 0,
        startingCapital: 0,
        goldenTouch: 0,
        shopHaggler: 0,
        gambleInsurance: 0,
        netWorthInflation: 0,
        weightedCoin: 0,
        tavernBrawler: 0,
        marketInsider: 0,
    },
    rebirthShopOffers: null,
    stats: {
        lifetimeCoins: 0,
        peakNetWorth: 0,
        cratesOpened: 0,
        totalGambledValue: 0,
        totalWonValue: 0,
        gamblesWon: 0,
        gamblesLost: 0,
        totalCrateValue: 0,
        totalPullValue: 0,
        rebirths: 0,
        marketPnl: 0,
    },
    marketAssets: {},
    marketPortfolio: {},
    tradingCash: 5.0,
    tcExchangeRate: 5.0,
    shortCollateral: {},
    tradeHistory: [],
    saveId: '',
    towerOfBotsState: {
        isActive: false,
        currentFloor: 0,
        accumulatedRewards: [],
        cards: [],
        revealedCardIndex: null,
        continuesUsed: 0,
        lossPending: false,
    },
    towerOfBotsPlays: 1,
    towerOfBotsMaxPlays: 2,
    towerOfBotsNextPlayTimer: 1800,
    marketSelectedAssetId: null,
    marketActiveTab: 'trading',
    marketActiveTimeScale: 100,
    lastOnline: 0,
    loan: null,
};

// Initialize inventory and potions from data files
Object.keys(itemData).forEach(i => {
    state.inventory[i] = 0;
});
Object.keys(potions).forEach(pName => {
    state.potions[pName] = 0;
});