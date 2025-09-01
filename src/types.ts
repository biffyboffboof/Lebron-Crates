export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythical' | 'lebron';

export type CrateType = 
  | 'basic' | 'rare' | 'epic' | 'legendary' | 'mythical'
  | 'weapon_common' | 'weapon_rare' | 'weapon_epic' | 'weapon_legendary' | 'weapon_mythical'
  | 'armor_common' | 'armor_rare' | 'armor_epic' | 'armor_legendary' | 'armor_mythical'
  | 'potion_common' | 'potion_rare' | 'potion_epic' | 'potion_legendary' | 'potion_mythical';

export type ItemCategory = 'good' | 'ingredient' | 'weapon' | 'armor' | 'consumable';
export type MainView = 'inventory' | 'crafting';
export type InventorySubView = 'items' | 'weapons' | 'ingredients' | 'armor' | 'consumables';
export type ConsumableSubView = 'potions' | 'combatItems';
export type CraftingSubView = 'goods' | 'weapons' | 'potions';
export type CrateView = 'standard' | 'weapon' | 'armor' | 'potion';
export type BrawlRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface GambledItem {
    name: string;
    amount: number;
    type: 'item' | 'potion';
}

export interface PotionData {
    rarity: Rarity;
    emoji: string;
    sellValue: number;
    description: (effect: any) => string;
    effect: any;
}

export interface ActivePotion {
    name: string;
    emoji: string;
    timeLeft: number;
    [key: string]: any;
}

export interface BrawlAbility {
    type: 'heavy_hit' | 'shield' | 'lifesteal_hit' | 'burn' | 'stun_chance' | 'bleed' | 'charge_attack' | 'multi_hit' | 'debuff' | 'buff' | 'heal';
    chance: number;
    value?: number;
    turns?: number;
    cooldown: number;
    currentCooldown?: number;
    hits?: number;
    buffType?: 'attack' | 'defense';
    debuffType?: 'attack' | 'defense';
}

export interface BrawlReward {
    coins?: [number, number];
    items?: { pool: string[]; chance: number; amount: [number, number] }[];
    potions?: { pool: string[]; chance: number; amount: [number, number] }[];
    crates?: { type: CrateType; chance: number; amount: [number, number] }[];
}

export interface BrawlOpponent {
    name: string;
    emoji: string;
    health: number;
    damageRange: [number, number];
    rewards: BrawlReward;
    abilities?: BrawlAbility[];
    critChance?: number;
    critMultiplier?: number;
}

export interface BrawlTier {
    pool: BrawlOpponent[];
    bosses: Record<number, BrawlOpponent>;
}

export interface BrawlBar {
    name: string;
    rarity: BrawlRarity;
    unlock: { type: 'none' } | { type: 'netWorth', value: number } | { type: 'rebirth', value: number };
    cooldownMinutes: { min: number, max: number };
}

export interface Effect {
    turns: number;
    [key: string]: any;
}

export interface BrawlState {
    isActive: boolean;
    playerHealth: number;
    playerMaxHealth: number;
    playerShield: number;
    playerStamina: number;
    playerMaxStamina: number;
    consecutiveShields: number;
    opponent: BrawlOpponent | null;
    opponentHealth: number;
    opponentShield: number;
    currentStage: number;
    rewards: any[];
    rarity: BrawlRarity | null;
    playerEffects: Record<string, Effect>;
    opponentEffects: Record<string, Effect>;
}

export interface RebirthUpgrades {
    speedyCrates: number;
    secondChance: number;
    crateBounties: number;
    startingCapital: number;
    goldenTouch: number;
    shopHaggler: number;
    gambleInsurance: number;
    netWorthInflation: number;
    weightedCoin: number;
    tavernBrawler: number;
    marketInsider: number;
}

export interface Stats {
    lifetimeCoins: number;
    peakNetWorth: number;
    cratesOpened: number;
    totalGambledValue: number;
    totalWonValue: number;
    gamblesWon: number;
    gamblesLost: number;
    totalCrateValue: number;
    totalPullValue: number;
    rebirths: number;
    marketPnl: number;
}

export interface MarketAsset {
    id: string;
    name: string;
    currentPrice: number;
    basePrice: number;
    priceHistory: number[];
    momentum: number;
}

export interface MarketPortfolioItem {
    quantity: number;
    avgEntryPrice: number;
}

export interface Trade {
    timestamp: number;
    assetId: string;
    assetName: string;
    type: 'buy' | 'sell' | 'short' | 'cover';
    quantity: number;
    price: number;
    total: number;
    pnl?: number;
}

export interface TowerReward {
    type: 'coins' | 'crate' | 'item';
    name: string;
    amount: number;
    rarity?: Rarity;
    crateType?: CrateType;
}

export interface TowerOfBotsState {
    isActive: boolean;
    currentFloor: number;
    accumulatedRewards: TowerReward[];
    cards: ('reward' | 'lose' | 'lebron')[];
    revealedCardIndex: number | null;
    cardOutcomes?: (TowerReward | { type: 'lose', name: string })[];
    continuesUsed: number;
    lossPending: boolean;
}

export interface Loan {
    amount: number;
    collateral: Record<string, MarketPortfolioItem>;
    dueDate: number;
}

export interface AppState {
    coins: number;
    inventory: Record<string, number>;
    potions: Record<string, number>;
    crateCount: Record<CrateType, number>;
    unlocked: Record<CrateType, boolean>;
    discoveredItems: string[];
    discoveredPotions: string[];
    selectedForGamble: GambledItem[];
    baseTimer: number;
    nextCrateDelay: number;
    freeCrateTimer: number;
    freeCratesToClaim: CrateType[];
    gambledCoins: number;
    isAllIn: boolean;
    redeemedCodes: string[];
    craftingUnlocked: boolean;
    potionCraftingUnlockedThisLife: boolean;
    mainView: MainView;
    inventorySubView: InventorySubView;
    craftingSubView: CraftingSubView;
    consumableSubView: ConsumableSubView;
    crateView: CrateView;
    rebirthTokens: number;
    canRedoCoinFlip: number;
    gambleInsuranceUsedThisLife: boolean;
    activePotions: Record<string, ActivePotion>;
    equippedWeapon: string | null;
    equippedArmor: string | null;
    brawlState: BrawlState;
    brawlCooldowns: Record<string, number>;
    brawlUnlockedOverride: boolean;
    brawlProgress: Record<BrawlRarity, number>;
    brawlTavernsBeaten: Record<BrawlRarity, boolean>;
    rebirthUpgrades: RebirthUpgrades;
    rebirthShopOffers: string[] | null;
    stats: Stats;
    marketAssets: Record<string, MarketAsset>;
    marketPortfolio: Record<string, MarketPortfolioItem>;
    tradingCash: number;
    tcExchangeRate: number;
    shortCollateral: Record<string, number>;
    tradeHistory: Trade[];
    saveId: string;
    towerOfBotsState: TowerOfBotsState;
    towerOfBotsPlays: number;
    towerOfBotsMaxPlays: number;
    towerOfBotsNextPlayTimer: number;
    marketSelectedAssetId: string | null;
    marketActiveTab: 'trading' | 'history' | 'exchange' | 'loan';
    marketActiveTimeScale: number;
    lastOnline: number;
    loan: Loan | null;
}