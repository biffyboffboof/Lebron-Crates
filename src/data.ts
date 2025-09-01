import { Rarity, ItemCategory, BrawlOpponent, BrawlRarity, BrawlBar, CrateType, BrawlReward, BrawlTier } from './types';

export const itemData: Record<string, { rarity: Rarity, category: ItemCategory, damage?: number, description?: string, critChanceBonus?: number, critMultiplierBonus?: number, defense?: number }> = {
    // --- Goods (Common) ---
    "Slightly Bent Paperclip": { rarity: 'common', category: 'good' },
    "Mysterious Stained Napkin": { rarity: 'common', category: 'good' },
    "Single Sock": { rarity: 'common', category: 'good' },
    "Expired Coupon": { rarity: 'common', category: 'good' },
    "Dust Bunny": { rarity: 'common', category: 'good' },
    "Used Sticky Note": { rarity: 'common', category: 'good' },
    "Crumpled Receipt": { rarity: 'common', category: 'good' },
    "Empty Pen": { rarity: 'common', category: 'good' },
    "A Single Button": { rarity: 'common', category: 'good' },
    "Dead Houseplant": { rarity: 'common', category: 'good' },
    "Outdated Phone Charger": { rarity: 'common', category: 'good' },
    "Fuzzy Lint Ball": { rarity: 'common', category: 'good' },
    "Old Newspaper": { rarity: 'common', category: 'good' },
    
    // --- Consumables (Common) ---
    "Half-Eaten Sandwich": { rarity: 'common', category: 'consumable', description: 'Restores 10 HP in a brawl.' },
    "Generic Brand Soda Can": { rarity: 'common', category: 'consumable', description: 'Can be thrown to deal 5 damage in a brawl.' },
    "Smoke Bomb": { rarity: 'common', category: 'consumable', description: 'Greatly increases the chance to successfully run from a brawl for one attempt.' },
    "Energy Bar": { rarity: 'common', category: 'consumable', description: 'Restores 30 Stamina in a brawl.' },
    
    // --- Goods (Rare) ---
    "Antique Pocket Watch": { rarity: 'rare', category: 'good' },
    "High-End Drone": { rarity: 'rare', category: 'good' },
    "Self-Lacing Sneakers": { rarity: 'rare', category: 'good' },
    "Bonsai Tree": { rarity: 'rare', category: 'good' },
    "Gourmet Coffee Beans": { rarity: 'rare', category: 'good' },
    "Professional-Grade Camera": { rarity: 'rare', category: 'good' },
    "A Signed First Edition Book": { rarity: 'rare', category: 'good' },
    "Vintage Vinyl Record": { rarity: 'rare', category: 'good' },
    "Smart Telescope": { rarity: 'rare', category: 'good' },
    "Mechanical Keyboard": { rarity: 'rare', category: 'good' },
    "Fountain Pen": { rarity: 'rare', category: 'good' },
    "Designer Sunglasses": { rarity: 'rare', category: 'good' },
    "A Small Meteorite Fragment": { rarity: 'rare', category: 'good' },
    "Miniature Zen Garden": { rarity: 'rare', category: 'good' },
    
    // --- Consumables (Rare) ---
    "Adrenaline Shot": { rarity: 'rare', category: 'consumable', description: 'Instantly gain 20 shield in a brawl.' },

    // --- Goods (Epic) ---
    "Hoverboard from the Future": { rarity: 'epic', category: 'good' },
    "Ring of Invisibility": { rarity: 'epic', category: 'good' },
    "Sentient Toaster": { rarity: 'epic', category: 'good' },
    "Portal Gun Replica": { rarity: 'epic', category: 'good' },
    "A Dragon's Egg": { rarity: 'epic', category: 'good' },
    "Self-Solving Rubik's Cube": { rarity: 'epic', category: 'good' },
    "Everlasting Gobstopper": { rarity: 'epic', category: 'good' },
    "Jetpack": { rarity: 'epic', category: 'good' },
    "Golden Spatula": { rarity: 'epic', category: 'good' },

    // --- Goods (Legendary) ---
    "Grumpy Cat's Scowl": { rarity: 'legendary', category: 'good' },
    "Doge's Side-Eye": { rarity: 'legendary', category: 'good' },
    "Stonks Guy's Arrow": { rarity: 'legendary', category: 'good' },
    "Skibidi Toilet": { rarity: 'legendary', category: 'good' },
    "Philosoraptor's Question": { rarity: 'legendary', category: 'good' },
    "Salt Bae's Sprinkle": { rarity: 'legendary', category: 'good' },
    "Distracted Boyfriend's Glance": { rarity: 'legendary', category: 'good' },
    "Hide the Pain Harold's Smile": { rarity: 'legendary', category: 'good' },
    "Pepe the Frog": { rarity: 'legendary', category: 'good' },
    
    // --- Goods (Mythical) ---
    "The Holy Grail": { rarity: 'mythical', category: 'good' },
    "Schrodinger's Cat Box": { rarity: 'mythical', category: 'good' },

    // --- Goods (LeBron) ---
    "LeBron James": { rarity: 'lebron', category: 'good' },

    // --- Ingredients ---
    'Composite Part': { rarity: 'epic', category: 'ingredient' },

    // --- Weapons (Common) ---
    'Broken Bottle': { rarity: 'common', category: 'weapon', damage: 3, description: 'Deals 3 damage.' },
    'Dusty Broom': { rarity: 'common', category: 'weapon', damage: 4, description: 'Deals 4 damage.' },
    
    // --- Weapons (Rare) ---
    'Rusty Cutlass': { rarity: 'rare', category: 'weapon', damage: 8, description: 'Deals 8 damage.' },
    'Iron Knuckles': { rarity: 'rare', category: 'weapon', damage: 10, description: 'Deals 10 damage.' },
    'Spiked Bat': { rarity: 'rare', category: 'weapon', damage: 12, description: 'Deals 12 damage. Has a slightly increased critical hit chance.', critChanceBonus: 0.05 },
    "Shiv": { rarity: 'rare', category: 'weapon', damage: 6, description: 'Deals 6 damage. Has a very high chance to critically hit.', critChanceBonus: 0.25 },
    
    // --- Weapons (Epic) ---
    'Mjolnir Keychain': { rarity: 'epic', category: 'weapon', damage: 18, description: 'Deals 18 damage.' },
    'Lightsaber Hilt': { rarity: 'epic', category: 'weapon', damage: 20, description: 'Deals 20 damage.' },
    'Enchanted Mace': { rarity: 'epic', category: 'weapon', damage: 22, description: 'Deals 22 damage.' },
    'Executioner\'s Axe': { rarity: 'epic', category: 'weapon', damage: 25, description: 'Deals 25 damage. Critical hits deal massive bonus damage.', critMultiplierBonus: 1.0 },
    "Warlock's Blade": { rarity: 'epic', category: 'weapon', damage: 20, description: 'Deals 20 damage. Has a chance to curse the opponent, dealing damage over time.', },

    // --- Weapons (Legendary) ---
    "Excalibur": { rarity: 'legendary', category: 'weapon', damage: 40, description: 'A legendary sword, fit for a king. Deals 40 damage with a high critical hit chance.', critChanceBonus: 0.15 },
    "Gjallarhorn": { rarity: 'legendary', category: 'weapon', damage: 50, description: 'A rocket launcher from another world. Deals 50 damage and critical hits are devastating.', critMultiplierBonus: 1.5 },

    // --- Weapons (Mythical) ---
    "BFG 9000": { rarity: 'mythical', category: 'weapon', damage: 100, description: 'It\'s big. It\'s loud. It deals 100 damage.' },


    // --- Armor (Common) ---
    'Leather Tunic': { rarity: 'common', category: 'armor', defense: 0.05, description: 'Reduces incoming damage by 5%.' },
    
    // --- Armor (Rare) ---
    'Chainmail Vest': { rarity: 'rare', category: 'armor', defense: 0.1, description: 'Reduces incoming damage by 10%.' },
    
    // --- Armor (Epic) ---
    'Knight\'s Platebody': { rarity: 'epic', category: 'armor', defense: 0.2, description: 'Reduces incoming damage by 20%.' },
    "Spiked Shield": { rarity: 'epic', category: 'armor', defense: 0.15, description: 'Reduces incoming damage by 15%. Reflects 20% of pre-mitigation damage back to the attacker.' },

    // --- Armor (Legendary) ---
    'Aegis Shield': { rarity: 'legendary', category: 'armor', defense: 0.3, description: 'Reduces incoming damage by 30%.' },
    
    // --- Armor (Mythical) ---
    'Adamantium Armor': { rarity: 'mythical', category: 'armor', defense: 0.5, description: 'Reduces incoming damage by 50%.' },
};

export const potions = {
    // --- UTILITY POTIONS ---
    'Minor Luck Potion': { 
        rarity: 'common' as Rarity, 
        emoji: '🍀', 
        sellValue: 18, 
        description: (effect) => `Increases your chance to find better items from crates by ${effect.value}% for ${effect.duration / 60} minutes. Stacks up to ${effect.maxStacks} times.`, 
        effect: { type: 'luckBoost', value: 5, duration: 180, maxStacks: 5 } 
    },
    'Luck Potion': { 
        rarity: 'rare' as Rarity, 
        emoji: '🍀', 
        sellValue: 25, 
        description: (effect) => `Increases your chance to find better items from crates by ${effect.value}% for ${effect.duration / 60} minutes. Stacks up to ${effect.maxStacks} times.`, 
        effect: { type: 'luckBoost', value: 10, duration: 300, maxStacks: 5 } 
    },
     'Potion of Crate Attraction': {
        rarity: 'rare' as Rarity,
        emoji: '🧲',
        sellValue: 70,
        description: () => `A swirling, magnetic liquid. Instantly grants you 3 basic crates.`,
        effect: { type: 'instant_crate', crateType: 'basic', amount: 3 }
    },
    'Greater Luck Potion': { 
        rarity: 'epic' as Rarity, 
        emoji: '🍀', 
        sellValue: 75, 
        description: (effect) => `Increases your chance to find better items from crates by ${effect.value}% for ${effect.duration / 60} minutes. Stacks up to ${effect.maxStacks} times.`, 
        effect: { type: 'luckBoost', value: 15, duration: 300, maxStacks: 5 } 
    },
    'Wild Magic Potion': {
        rarity: 'epic' as Rarity,
        emoji: '🌀',
        sellValue: 50,
        description: (effect) => `For ${effect.duration / 60} minutes, every major action has a chance to grant or cost you between ${effect.min} and ${effect.max} coins. Pure chaos.`,
        effect: { type: 'wildMagic', min: -10, max: 15, duration: 300 }
    },
    'Potion of Insight': {
        rarity: 'rare' as Rarity,
        emoji: '🧠',
        sellValue: 40,
        description: (effect) => `For ${effect.duration / 60} minutes, all crafting ingredient costs are reduced by ${effect.value * 100}%.`,
        effect: { type: 'craftingCostReduction', value: 0.25, duration: 600 }
    },
    'Flask of Time': {
        rarity: 'epic' as Rarity,
        emoji: '⏳',
        sellValue: 100,
        description: (effect) => `Instantly skips time forward by ${effect.minutes} minutes, granting you all the free crates you would have accumulated. Also reduces active potion timers.`,
        effect: { type: 'timeSkip', minutes: 30 }
    },
    'Diligent Draft': {
        rarity: 'rare' as Rarity,
        emoji: '🤖',
        sellValue: 60,
        description: (effect) => `For ${effect.duration / 60} minutes, automatically claims free crates as soon as they become available.`,
        effect: { type: 'autoClaim', duration: 1800 }
    },
    'Merchant\'s Elixir': {
        rarity: 'epic' as Rarity,
        emoji: '💰',
        sellValue: 80,
        description: (effect) => `For ${effect.duration / 60} minutes, buy crates for ${effect.buyDiscount * 100}% less and sell items for ${effect.sellBonus * 100}% more.`,
        effect: { type: 'merchantWisdom', buyDiscount: 0.15, sellBonus: 0.20, duration: 900 }
    },
    'Draught of Ruin': {
        rarity: 'legendary' as Rarity,
        emoji: '🎲',
        sellValue: 250,
        description: (effect) => `For ${effect.duration / 60} minutes, coin flips are high-stakes. Wins are multiplied by ${effect.winMultiplier}, but losses are multiplied by ${effect.lossMultiplier}. You can go into debt.`,
        effect: { type: 'highStakes', winMultiplier: 4, lossMultiplier: 2, duration: 180 }
    },
    'King\'s Favor Potion': {
        rarity: 'legendary' as Rarity,
        emoji: '👑',
        sellValue: 300,
        description: (effect) => `For ${effect.duration / 60} minutes, your chance of finding LeBron James in a Legendary Crate is increased by an additional ${effect.chanceIncrease}%.`,
        effect: { type: 'lebronHunter', chanceIncrease: 4, duration: 600 }
    },
    'Phantom Veil Potion': {
        rarity: 'legendary' as Rarity,
        emoji: '👻',
        sellValue: 200,
        description: (effect) => `For ${effect.duration / 60} minutes, any losses from a coin flip are converted into debt instead of being taken from your current inventory.`,
        effect: { type: 'invisibility', duration: 300 }
    },
     'Elixir of Life': {
        rarity: 'mythical' as Rarity,
        emoji: '💖',
        sellValue: 1000,
        description: (effect) => `For ${effect.duration / 60} minutes, you are immune to brawl penalties, brawl cooldowns are halved, you regenerate ${effect.hpRegen} HP per turn in brawls, and gain ${effect.coinBonus * 100}% more coins from brawl victories.`,
        effect: { type: 'immortality', duration: 1800, hpRegen: 5, coinBonus: 0.1 }
    },
    // --- COMBAT POTIONS ---
    'Minor Health Potion': {
        rarity: 'common' as Rarity,
        emoji: '❤️',
        sellValue: 10,
        description: () => 'A bubbly red liquid. Instantly restores 20 HP in a brawl.',
        effect: { type: 'brawl_heal', amount: 20 }
    },
    'Minor Stamina Potion': {
        rarity: 'common' as Rarity,
        emoji: '💧',
        sellValue: 10,
        description: () => 'A refreshing blue liquid. Instantly restores 50 Stamina in a brawl.',
        effect: { type: 'brawl_stamina_restore', amount: 50 }
    },
    'Strength Potion': {
        rarity: 'rare' as Rarity,
        emoji: '💪',
        sellValue: 40,
        description: () => 'Tastes like iron and rage. Increases your damage by 50% for your next 2 attacks in a brawl.',
        effect: { type: 'brawl_damage_boost', multiplier: 1.5, turns: 2 }
    },
    'Stamina Potion': {
        rarity: 'rare' as Rarity,
        emoji: '💦',
        sellValue: 40,
        description: () => 'A highly concentrated energy drink. Instantly restores 100 Stamina in a brawl.',
        effect: { type: 'brawl_stamina_restore', amount: 100 }
    },
    'Stoneskin Potion': {
        rarity: 'rare' as Rarity,
        emoji: '🧱',
        sellValue: 40,
        description: () => 'Makes your skin feel like rock. Reduces incoming damage by 50% for 2 turns in a brawl.',
        effect: { type: 'brawl_defense_boost', multiplier: 0.5, turns: 2 }
    },
    'Potion of Swiftness': {
        rarity: 'rare' as Rarity,
        emoji: '⚡',
        sellValue: 50,
        description: () => 'A tingling sensation. Guarantees your next attack will be a critical hit.',
        effect: { type: 'brawl_guaranteed_crit', turns: 1 }
    },
    'Elixir of Fortitude': {
        rarity: 'epic' as Rarity,
        emoji: '➕',
        sellValue: 120,
        description: () => 'A thick, hearty brew. Increases your Max HP by 50 for 5 turns and heals for that amount.',
        effect: { type: 'brawl_max_hp_boost', amount: 50, turns: 5 }
    },
    'Vial of Venom': {
        rarity: 'epic' as Rarity,
        emoji: '☠️',
        sellValue: 100,
        description: () => 'A swirling green poison. Your next attack also poisons the enemy, dealing 5 damage per turn for 3 turns.',
        effect: { type: 'brawl_apply_poison', damage: 5, turns: 3 }
    },
    "Berserker's Brew": {
        rarity: 'epic' as Rarity,
        emoji: '😡',
        sellValue: 90,
        description: () => 'A frothing, blood-red concoction. For 3 turns, you deal 50% more damage but take 25% more damage.',
        effect: { type: 'brawl_berserk', damageMultiplier: 1.5, defenseMultiplier: 1.25, turns: 3 }
    },
    "Vampiric Draught": {
        rarity: 'legendary' as Rarity,
        emoji: '🦇',
        sellValue: 220,
        description: () => 'A dark, viscous fluid that smells of iron. For 3 turns, you heal for 30% of the damage you deal with attacks.',
        effect: { type: 'brawl_lifesteal', value: 0.3, turns: 3 }
    }
};

export const itemEmojis: Record<string, string> = {
    // common
    "Slightly Bent Paperclip": "📎",
    "Half-Eaten Sandwich": "🥪",
    "Mysterious Stained Napkin": "🗒️",
    "Single Sock": "🧦",
    "Expired Coupon": "🎟️",
    "Dust Bunny": "🦠",
    "Generic Brand Soda Can": "🥫",
    "Used Sticky Note": "📝",
    "Crumpled Receipt": "🧾",
    "Empty Pen": "🖊️",
    "A Single Button": "🔘",
    "Dead Houseplant": "🥀",
    "Outdated Phone Charger": "🔌",
    "Fuzzy Lint Ball": "🔵",
    "Old Newspaper": "📰",
    "Broken Bottle": "🍾",
    "Dusty Broom": "🧹",
    "Smoke Bomb": "💨",
    "Energy Bar": "🍫",
    // rare
    "Antique Pocket Watch": "⏱️",
    "High-End Drone": "🛸",
    "Self-Lacing Sneakers": "👟",
    "Bonsai Tree": "🌳",
    "Gourmet Coffee Beans": "☕",
    "Professional-Grade Camera": "📷",
    "A Signed First Edition Book": "📖",
    "Vintage Vinyl Record": "💿",
    "Smart Telescope": "🔭",
    "Mechanical Keyboard": "⌨️",
    "Fountain Pen": "✒️",
    "Designer Sunglasses": "😎",
    "A Small Meteorite Fragment": "☄️",
    "Miniature Zen Garden": "🏞️",
    "Rusty Cutlass": "🗡️",
    "Iron Knuckles": "👊",
    "Spiked Bat": "🏏",
    "Adrenaline Shot": "💉",
    "Shiv": "🔪",
    // epic
    "Hoverboard from the Future": "🛹",
    "Ring of Invisibility": "💍",
    "Sentient Toaster": "🤖",
    "Portal Gun Replica": "🌀",
    "A Dragon's Egg": "🥚",
    "Self-Solving Rubik's Cube": "🧩",
    "Everlasting Gobstopper": "🍬",
    "Jetpack": "🚀",
    "Golden Spatula": "🍳",
    "Composite Part": "⚙️",
    "Mjolnir Keychain": "🔨",
    "Lightsaber Hilt": "⚔️",
    "Enchanted Mace": "✨",
    "Executioner's Axe": "🪓",
    "Warlock's Blade": "🗡️",
    // legendary
    "Grumpy Cat's Scowl": "😾",
    "Doge's Side-Eye": "🐶",
    "Stonks Guy's Arrow": "📈",
    "Skibidi Toilet": "🚽",
    "Philosoraptor's Question": "🦖",
    "Salt Bae's Sprinkle": "🧂",
    "Distracted Boyfriend's Glance": "👀",
    "Hide the Pain Harold's Smile": "😄",
    "Pepe the Frog": "🐸",
    "Excalibur": "🗡️",
    "Gjallarhorn": "🚀",
    // mythical
    "The Holy Grail": "🏆",
    "Schrodinger's Cat Box": "📦",
    "BFG 9000": "💥",
    "Adamantium Armor": "🛡️",
    // lebron
    "LeBron James": "👑",
    // armor
    'Leather Tunic': '👕',
    'Chainmail Vest': '⛓️',
    'Knight\'s Platebody': '🛡️',
    'Aegis Shield': '🛡️',
    "Spiked Shield": "🛡️",
    // potions
    'Minor Luck Potion': '🍀',
    'Luck Potion': '🍀',
    'Greater Luck Potion': '🍀',
    'Wild Magic Potion': '🌀',
    'Potion of Insight': '🧠',
    'Flask of Time': '⏳',
    'Diligent Draft': '🤖',
    'Merchant\'s Elixir': '💰',
    'Draught of Ruin': '🎲',
    'King\'s Favor Potion': '👑',
    'Phantom Veil Potion': '👻',
    'Elixir of Life': '💖',
    'Minor Health Potion': '❤️',
    'Minor Stamina Potion': '💧',
    'Strength Potion': '💪',
    'Stamina Potion': '💦',
    'Stoneskin Potion': '🧱',
    'Potion of Swiftness': '⚡',
    'Elixir of Fortitude': '➕',
    'Vial of Venom': '☠️',
    "Potion of Crate Attraction": "🧲",
    "Berserker's Brew": "😡",
    "Vampiric Draught": "🦇",
};

export const crateEmojis: Record<CrateType, string> = {
    'basic': '🎁',
    'rare': '📦',
    'epic': '💎',
    'legendary': '🌟',
    'mythical': '✨',
    'weapon_common': '⚔️',
    'weapon_rare': '⚔️',
    'weapon_epic': '⚔️',
    'weapon_legendary': '⚔️',
    'weapon_mythical': '⚔️',
    'armor_common': '🛡️',
    'armor_rare': '🛡️',
    'armor_epic': '🛡️',
    'armor_legendary': '🛡️',
    'armor_mythical': '🛡️',
    'potion_common': '🧪',
    'potion_rare': '🧪',
    'potion_epic': '🧪',
    'potion_legendary': '🧪',
    'potion_mythical': '🧪',
};

export const raritySellValues: Record<Rarity | 'ingredient', number> = {
  common: 1,
  rare: 5,
  epic: 20,
  legendary: 100,
  mythical: 500,
  lebron: 1000,
  ingredient: 50,
};

export const itemSellValues: Record<string, number> = {
    "Composite Part": 50,
};

export const crateShopValues = {
    standard: {
        basic: 5,
        rare: 20,
        epic: 75,
        legendary: 200,
        mythical: 1000,
    },
    weapon: {
        common: 50,
        rare: 250,
        epic: 1000,
        legendary: 5000,
        mythical: 25000,
    },
    armor: {
        common: 50,
        rare: 250,
        epic: 1000,
        legendary: 5000,
        mythical: 25000,
    },
    potion: {
        common: 10,
        rare: 50,
        epic: 200,
        legendary: 800,
        mythical: 4000,
    }
};

export const recipes = {
    // --- GOODS ---
    compositePart: {
        id: 'compositePart',
        name: 'Composite Part',
        category: 'goods',
        description: 'A dense bundle of common materials, valuable for its condensed nature. The required materials shift after each craft.',
        produces: { type: 'item', name: 'Composite Part', amount: 1 },
        ingredients: [
            { name: 'Slightly Bent Paperclip', amount: 15 },
            { name: 'Used Sticky Note', amount: 15 },
            { name: 'Empty Pen', amount: 15 },
        ]
    },
    minorCoinCraft: {
        id: 'minorCoinCraft',
        name: 'Craft Coins (Minor)',
        category: 'goods',
        description: 'Transmute simple materials into 15-25 coins instantly.',
        produces: { type: 'instantCoin', min: 15, max: 25, emoji: '💰' },
        ingredients: [
            { name: 'Dust Bunny', amount: 5 },
            { name: 'Fuzzy Lint Ball', amount: 5 },
            { name: 'Generic Brand Soda Can', amount: 1 },
        ]
    },
    minorCrateCraft: {
        id: 'minorCrateCraft',
        name: 'Craft Basic Crate',
        category: 'goods',
        description: 'Materialize a basic crate out of thin air instantly.',
        produces: { type: 'instantCrate', crateType: 'basic', amount: 1, emoji: '🎁' },
        ingredients: [
            { name: 'Crumpled Receipt', amount: 2 },
            { name: 'Slightly Bent Paperclip', amount: 2 },
        ]
    },
    greaterCoinCraft: {
        id: 'greaterCoinCraft',
        name: 'Craft Coins (Greater)',
        category: 'goods',
        description: 'A more potent transmutation, yielding 30-40 coins instantly.',
        produces: { type: 'instantCoin', min: 30, max: 40, emoji: '💰' },
        ingredients: [
            { name: 'Bonsai Tree', amount: 1 },
            { name: 'Gourmet Coffee Beans', amount: 1 },
            { name: 'Vintage Vinyl Record', amount: 1 },
            { name: 'Fountain Pen', amount: 1 },
            { name: 'Designer Sunglasses', amount: 1 },
        ]
    },
    greaterCrateCraft: {
        id: 'greaterCrateCraft',
        name: 'Craft Rare Crate',
        category: 'goods',
        description: 'A powerful mixture that can create a rare crate instantly.',
        produces: { type: 'instantCrate', crateType: 'rare', amount: 1, emoji: '📦' },
        ingredients: [
            { name: 'Professional-Grade Camera', amount: 1 },
            { name: 'Designer Sunglasses', amount: 1 },
            { name: 'Smart Telescope', amount: 1 },
        ]
    },
    // --- WEAPONS ---
    dustyBroom: {
        id: 'dustyBroom',
        name: 'Dusty Broom',
        category: 'weapons',
        description: 'A sturdy piece of wood. Better than your fists. (+4 Damage)',
        produces: { type: 'item', name: 'Dusty Broom', amount: 1 },
        ingredients: [
            { name: 'Old Newspaper', amount: 5 },
            { name: 'Single Sock', amount: 5 },
        ]
    },
    ironKnuckles: {
        id: 'ironKnuckles',
        name: 'Iron Knuckles',
        category: 'weapons',
        description: 'For when the negotiations get aggressive. (+10 Damage)',
        produces: { type: 'item', name: 'Iron Knuckles', amount: 1 },
        ingredients: [
            { name: 'Composite Part', amount: 1 },
            { name: 'A Small Meteorite Fragment', amount: 1 },
        ]
    },
    // --- POTIONS ---
    minorHealthPotion: {
        id: 'minorHealthPotion',
        name: 'Minor Health Potion',
        category: 'potions',
        description: () => 'A bubbly red liquid. Instantly restores 20 HP in a brawl.',
        produces: { type: 'item', name: 'Minor Health Potion', amount: 1 },
        ingredients: [
            { name: 'Half-Eaten Sandwich', amount: 3 },
            { name: 'Dead Houseplant', amount: 3 },
        ]
    },
    minorLuckPotion: {
        id: 'minorLuckPotion',
        name: 'Minor Luck Potion',
        category: 'potions',
        description: (effect) => `Increases your chance to find better items from crates by ${effect.value}% for ${effect.duration / 60} minutes. Stacks up to ${effect.maxStacks} times.`,
        produces: { type: 'item', name: 'Minor Luck Potion', amount: 1 },
        ingredients: [
            { name: 'Dust Bunny', amount: 10 },
            { name: 'Single Sock', amount: 5 },
        ]
    },
    luckPotion: {
        id: 'luckPotion',
        name: 'Luck Potion',
        category: 'potions',
        description: (effect) => `Increases your chance to find better items from crates by ${effect.value}% for ${effect.duration / 60} minutes. Stacks up to ${effect.maxStacks} times.`,
        produces: { type: 'item', name: 'Luck Potion', amount: 1 },
        ingredients: [
            { name: 'Antique Pocket Watch', amount: 2 },
            { name: 'A Small Meteorite Fragment', amount: 2 },
        ]
    },
    greaterLuckPotion: {
        id: 'greaterLuckPotion',
        name: 'Greater Luck Potion',
        category: 'potions',
        description: (effect) => `Increases your chance to find better items from crates by ${effect.value}% for ${effect.duration / 60} minutes. Stacks up to ${effect.maxStacks} times.`,
        produces: { type: 'item', name: 'Greater Luck Potion', amount: 1 },
        ingredients: [
            { name: 'Composite Part', amount: 1 },
            { name: 'A Dragon\'s Egg', amount: 1 },
        ]
    },
    wildMagicPotion: {
        id: 'wildMagicPotion',
        name: 'Wild Magic Potion',
        category: 'potions',
        description: (effect) => `For ${effect.duration / 60} minutes, every major action has a chance to grant or cost you between ${effect.min} and ${effect.max} coins. Pure chaos.`,
        produces: { type: 'item', name: 'Wild Magic Potion', amount: 1 },
        ingredients: [
            { name: 'A Dragon\'s Egg', amount: 1 },
            { name: 'Mjolnir Keychain', amount: 1 },
        ]
    },
    potionOfInsight: {
        id: 'potionOfInsight',
        name: 'Potion of Insight',
        category: 'potions',
        description: (effect) => `For ${effect.duration / 60} minutes, all crafting ingredient costs are reduced by ${effect.value * 100}%.`,
        produces: { type: 'item', name: 'Potion of Insight', amount: 1 },
        ingredients: [
            { name: 'Self-Solving Rubik\'s Cube', amount: 1 },
            { name: 'Fountain Pen', amount: 2 },
        ]
    },
    flaskOfTime: {
        id: 'flaskOfTime',
        name: 'Flask of Time',
        category: 'potions',
        description: (effect) => `Instantly skips time forward by ${effect.minutes} minutes, granting you all the free crates you would have accumulated. Also reduces active potion timers.`,
        produces: { type: 'item', name: 'Flask of Time', amount: 1 },
        ingredients: [
            { name: 'Antique Pocket Watch', amount: 5 },
            { name: 'Composite Part', amount: 1 },
        ]
    },
    diligentDraft: {
        id: 'diligentDraft',
        name: 'Diligent Draft',
        category: 'potions',
        description: (effect) => `For ${effect.duration / 60} minutes, automatically claims free crates as soon as they become available.`,
        produces: { type: 'item', name: 'Diligent Draft', amount: 1 },
        ingredients: [
            { name: 'Mechanical Keyboard', amount: 1 },
            { name: 'Gourmet Coffee Beans', amount: 2 },
        ]
    },
    merchantsElixir: {
        id: 'merchantsElixir',
        name: 'Merchant\'s Elixir',
        category: 'potions',
        description: (effect) => `For ${effect.duration / 60} minutes, buy crates for ${effect.buyDiscount * 100}% less and sell items for ${effect.sellBonus * 100}% more.`,
        produces: { type: 'item', name: 'Merchant\'s Elixir', amount: 1 },
        ingredients: [
            { name: 'Crumpled Receipt', amount: 50 },
            { name: 'A Signed First Edition Book', amount: 1 },
        ]
    },
    draughtOfRuin: {
        id: 'draughtOfRuin',
        name: 'Draught of Ruin',
        category: 'potions',
        description: (effect) => `For ${effect.duration / 60} minutes, coin flips are high-stakes. Wins are multiplied by ${effect.winMultiplier}, but losses are multiplied by ${effect.lossMultiplier}. You can go into debt.`,
        produces: { type: 'item', name: 'Draught of Ruin', amount: 1 },
        ingredients: [
            { name: 'Doge\'s Side-Eye', amount: 1 },
            { name: 'Stonks Guy\'s Arrow', amount: 1 },
        ]
    },
    kingsFavorPotion: {
        id: 'kingsFavorPotion',
        name: 'King\'s Favor Potion',
        category: 'potions',
        description: (effect) => `For ${effect.duration / 60} minutes, your chance of finding LeBron James in a Legendary Crate is increased by an additional ${effect.chanceIncrease}%.`,
        produces: { type: 'item', name: 'King\'s Favor Potion', amount: 1 },
        ingredients: [
            { name: 'Pepe the Frog', amount: 1 },
            { name: 'Hide the Pain Harold\'s Smile', amount: 1 },
        ]
    },
    phantomVeilPotion: {
        id: 'phantomVeilPotion',
        name: 'Phantom Veil Potion',
        category: 'potions',
        description: (effect) => `For ${effect.duration / 60} minutes, any losses from a coin flip are converted into debt instead of being taken from your current inventory.`,
        produces: { type: 'item', name: 'Phantom Veil Potion', amount: 1 },
        ingredients: [
            { name: 'Ring of Invisibility', amount: 1 },
            { name: 'Distracted Boyfriend\'s Glance', amount: 1 },
        ]
    }
};

export const BRAWL_BARS: Record<BrawlRarity, BrawlBar> = {
    common: { name: "The Salty Spitoon", rarity: 'common', unlock: { type: 'none' }, cooldownMinutes: { min: 1, max: 5 } },
    rare: { name: "The Tipsy Kobold", rarity: 'rare', unlock: { type: 'netWorth', value: 100 }, cooldownMinutes: { min: 5, max: 10 } },
    epic: { name: "The Gilded Goblet", rarity: 'epic', unlock: { type: 'netWorth', value: 500 }, cooldownMinutes: { min: 10, max: 20 } },
    legendary: { name: "The Wyrm's Breath Inn", rarity: 'legendary', unlock: { type: 'rebirth', value: 1 }, cooldownMinutes: { min: 20, max: 60 } }
};

export const BRAWL_OPPONENTS: Record<BrawlRarity, BrawlTier> = {
    common: {
        pool: [
            { name: "Drunken Thug", emoji: "😠", health: 30, damageRange: [3, 6], critChance: 0.05, rewards: { coins: [2, 5], items: [{ pool: ["Slightly Bent Paperclip", "Broken Bottle"], chance: 0.5, amount: [1, 2] }] } },
            { name: "Rowdy Patron", emoji: "🍻", health: 40, damageRange: [4, 7], rewards: { coins: [3, 6], items: [{ pool: ["Broken Bottle"], chance: 0.6, amount: [1, 1] }] } },
            { name: "Bar Bouncer", emoji: "💪", health: 50, damageRange: [5, 8], abilities: [{ type: 'shield', chance: 0.3, value: 10, cooldown: 3 }], rewards: { crates: [{ type: 'basic', chance: 0.8, amount: [1, 1] }] } },
        ],
        bosses: {
            5: { name: "The Grifter", emoji: "😒", health: 70, damageRange: [5, 7], abilities: [{ type: 'debuff', chance: 0.5, debuffType: 'attack', value: 0.75, turns: 2, cooldown: 3 }], rewards: { potions: [{ pool: ['Minor Luck Potion'], chance: 1.0, amount: [1, 1] }] } },
            10: { name: "Head Bouncer", emoji: "😡", health: 120, damageRange: [8, 12], abilities: [{ type: 'heavy_hit', chance: 0.4, value: 1.5, cooldown: 2 }, { type: 'shield', chance: 0.3, value: 15, cooldown: 4 }], rewards: { crates: [{ type: 'rare', chance: 0.75, amount: [1, 1] }] } },
            15: { name: "Bar Room Champion", emoji: "🏆", health: 150, damageRange: [10, 15], abilities: [{ type: 'multi_hit', chance: 0.4, hits: 2, cooldown: 3 }], rewards: { items: [{ pool: ["Dusty Broom"], chance: 1.0, amount: [1, 1] }] } },
            20: { name: "The Loan Shark", emoji: "🦈", health: 180, damageRange: [12, 18], abilities: [{ type: 'bleed', chance: 0.6, value: 5, turns: 3, cooldown: 3 }], rewards: { coins: [20, 40] } },
            25: { name: "The Card Sharp", emoji: "🃏", health: 160, damageRange: [10, 15], abilities: [{ type: 'stun_chance', chance: 0.3, cooldown: 4 }], rewards: { items: [{ pool: ["Shiv"], chance: 0.8, amount: [1,1] }] } },
            30: { name: "Tavern Owner", emoji: "😈", health: 250, damageRange: [15, 20], abilities: [{ type: 'charge_attack', chance: 0.4, value: 2.0, cooldown: 3 }, { type: 'heal', chance: 0.25, value: 40, cooldown: 4 }], rewards: { crates: [{ type: 'rare', chance: 1.0, amount: [1, 1] }], items: [{ pool: ["Iron Knuckles"], chance: 1.0, amount: [1,1] }] } }
        }
    },
    rare: {
        pool: [
             { name: "Goblin Stabber", emoji: "👺", health: 40, damageRange: [7, 12], critChance: 0.1, abilities: [{ type: 'bleed', chance: 0.4, value: 4, turns: 2, cooldown: 3 }], rewards: { coins: [10, 20], potions: [{ pool: ['Minor Luck Potion', 'Minor Health Potion'], chance: 0.4, amount: [1, 1] }] } },
             { name: "Alley Cat Scrapper", emoji: "😼", health: 55, damageRange: [6, 9], abilities: [{ type: 'multi_hit', chance: 0.5, hits: 2, cooldown: 2 }], rewards: { coins: [12, 18], items: [{ pool: ["Shiv"], chance: 0.1, amount: [1, 1] }] } },
             { name: "Grumpy Dwarf", emoji: "🧔", health: 80, damageRange: [6, 10], abilities: [{ type: 'heavy_hit', chance: 0.4, value: 1.5, cooldown: 2 }], rewards: { items: [{ pool: ["Iron Knuckles", "Spiked Bat"], chance: 0.2, amount: [1, 1] }], crates: [{ type: 'rare', chance: 0.1, amount: [1, 1] }] } },
        ],
        bosses: {
             5: { name: "Hobgoblin Chieftain", emoji: "👹", health: 100, damageRange: [10, 15], abilities: [{ type: 'buff', chance: 0.5, buffType: 'attack', value: 1.5, turns: 2, cooldown: 3 }], rewards: { potions: [{ pool: ['Strength Potion'], chance: 1.0, amount: [1, 1] }] } },
            10: { name: "Dwarven Berserker", emoji: "🔨", health: 180, damageRange: [12, 18], abilities: [{ type: 'heavy_hit', chance: 0.8, value: 1.2, cooldown: 1 }], rewards: { crates: [{ type: 'epic', chance: 0.25, amount: [1, 1] }] } },
            15: { name: "Bandit Leader", emoji: "🤠", health: 160, damageRange: [15, 20], abilities: [{ type: 'multi_hit', chance: 0.4, hits: 2, cooldown: 3 }, { type: 'debuff', chance: 0.3, debuffType: 'attack', value: 0.8, turns: 2, cooldown: 4 }], rewards: { items: [{ pool: ["Spiked Bat"], chance: 1.0, amount: [1, 1] }] } },
            20: { name: "Ogre Bruiser", emoji: "🦍", health: 250, damageRange: [20, 25], abilities: [{ type: 'charge_attack', chance: 0.4, value: 2, cooldown: 3 }], rewards: { coins: [40, 60] } },
            25: { name: "Corrupted Knight", emoji: "💀", health: 200, damageRange: [18, 22], abilities: [{ type: 'lifesteal_hit', chance: 0.3, value: 0.5, cooldown: 4 }], rewards: { items: [{ pool: ["Warlock's Blade"], chance: 0.5, amount: [1, 1] }] } },
            30: { name: "Kobold King", emoji: "👑", health: 300, damageRange: [20, 25], abilities: [{ type: 'multi_hit', chance: 0.3, hits: 3, cooldown: 4 }, { type: 'bleed', chance: 0.5, value: 8, turns: 3, cooldown: 4 }, { type: 'heal', chance: 0.2, value: 50, cooldown: 5 }], rewards: { crates: [{ type: 'epic', chance: 0.5, amount: [1, 1] }], items: [{ pool: ["Mjolnir Keychain"], chance: 0.3, amount: [1, 1] }] } }
        }
    },
    epic: {
        pool: [
            { name: "Cursed Shade", emoji: "👻", health: 130, damageRange: [18, 22], abilities: [{ type: 'lifesteal_hit', chance: 0.4, value: 0.5, cooldown: 3 }, { type: 'debuff', chance: 0.3, debuffType: 'attack', value: 0.8, turns: 2, cooldown: 4 }], rewards: { potions: [{ pool: ["Stoneskin Potion"], chance: 0.6, amount: [1, 1]}] } },
            { name: "One-Eyed Pirate", emoji: "🏴‍☠️", health: 150, damageRange: [20, 30], critChance: 0.1, abilities: [{ type: 'stun_chance', chance: 0.2, cooldown: 4 }], rewards: { coins: [50, 75], potions: [{ pool: ['Strength Potion', 'Stoneskin Potion', 'Potion of Swiftness'], chance: 0.5, amount: [1, 1] }] } },
            { name: "Corrupted Alchemist", emoji: "👨‍🔬", health: 140, damageRange: [15, 20], abilities: [{ type: 'debuff', chance: 0.4, debuffType: 'attack', value: 0.75, turns: 3, cooldown: 3 }, { type: 'burn', chance: 0.4, value: 8, turns: 3, cooldown: 4 }], rewards: { potions: [{ pool: ["Vial of Venom", "Berserker's Brew"], chance: 0.25, amount: [1, 1] }] } },
        ],
        bosses: {
             5: { name: "Executioner", emoji: "🪓", health: 200, damageRange: [25, 30], critMultiplier: 2.0, abilities: [{ type: 'debuff', chance: 0.5, debuffType: 'defense', value: 0.5, turns: 2, cooldown: 4 }], rewards: { items: [{ pool: ["Executioner's Axe"], chance: 0.3, amount: [1,1] }] } },
            10: { name: "War Mage", emoji: "🧙", health: 180, damageRange: [20, 25], abilities: [{ type: 'burn', chance: 0.6, value: 10, turns: 3, cooldown: 3 }, { type: 'shield', chance: 0.4, value: 40, cooldown: 4 }], rewards: { crates: [{ type: 'legendary', chance: 0.2, amount: [1, 1] }] } },
            15: { name: "Grave Warden", emoji: "⚰️", health: 300, damageRange: [22, 28], abilities: [{ type: 'buff', chance: 0.4, buffType: 'defense', value: 2, turns: 2, cooldown: 5 }], rewards: { items: [{ pool: ["Spiked Shield"], chance: 0.7, amount: [1, 1] }] } },
            20: { name: "Giant Slayer", emoji: "💪", health: 250, damageRange: [30, 40], abilities: [{ type: 'heavy_hit', chance: 0.5, value: 1.8, cooldown: 3 }], rewards: { coins: [80, 120] } },
            25: { name: "Twin Assassins", emoji: "🥷", health: 220, damageRange: [15, 20], abilities: [{ type: 'multi_hit', chance: 1.0, hits: 2, cooldown: 2 }, { type: 'bleed', chance: 0.6, value: 7, turns: 2, cooldown: 3 }], rewards: { potions: [{ pool: ["Berserker's Brew", "Potion of Swiftness"], chance: 0.4, amount: [1, 1] }] } },
            30: { name: "The Gilded Golem", emoji: "🏆", health: 500, damageRange: [30, 35], abilities: [{ type: 'shield', chance: 0.6, value: 80, cooldown: 3 }, { type: 'charge_attack', chance: 0.3, value: 2.5, cooldown: 4 }], rewards: { crates: [{ type: 'legendary', chance: 0.4, amount: [1, 1] }], items: [{ pool: ["Composite Part"], chance: 1.0, amount: [1, 1] }] } }
        }
    },
    legendary: {
        pool: [
            { name: "Armored Knight", emoji: "🛡️", health: 250, damageRange: [25, 40], abilities: [{ type: 'shield', chance: 0.5, value: 25, cooldown: 2 }, { type: 'buff', chance: 0.2, buffType: 'defense', value: 2, turns: 2, cooldown: 5 }], rewards: { items: [{ pool: ['Composite Part'], chance: 0.9, amount: [1, 2] }] } },
            { name: "Fire Mage", emoji: "🔥", health: 180, damageRange: [20, 30], abilities: [{ type: 'burn', chance: 0.6, value: 10, turns: 3, cooldown: 3 }, { type: 'heal', chance: 0.2, value: 30, cooldown: 4 }], rewards: { potions: [{ pool: ['Vial of Venom', 'Elixir of Fortitude'], chance: 0.3, amount: [1, 1] }], crates: [{ type: 'epic', chance: 0.25, amount: [1, 1] }] } },
            { name: "Cave Troll", emoji: "🗿", health: 400, damageRange: [30, 35], abilities: [{ type: 'charge_attack', chance: 0.5, value: 2.5, cooldown: 3 }], rewards: { coins: [100, 150], items: [{ pool: ['Executioner\'s Axe'], chance: 0.2, amount: [1, 1]}]} },
        ],
        bosses: {
             5: { name: "Young Dragon", emoji: "🐲", health: 350, damageRange: [30, 35], abilities: [{ type: 'burn', chance: 0.7, value: 12, turns: 3, cooldown: 3 }, { type: 'heavy_hit', chance: 0.4, value: 1.5, cooldown: 2 }], rewards: { crates: [{ type: 'legendary', chance: 0.6, amount: [1,1] }] } },
            10: { name: "The Lich", emoji: "💀", health: 300, damageRange: [25, 30], abilities: [{ type: 'lifesteal_hit', chance: 0.6, value: 0.6, cooldown: 3 }, { type: 'debuff', chance: 0.4, debuffType: 'defense', value: 0.5, turns: 2, cooldown: 4 }], rewards: { potions: [{ pool: ["Vampiric Draught"], chance: 1.0, amount: [1, 1] }] } },
            15: { name: "Abyssal Horror", emoji: "🐙", health: 450, damageRange: [30, 40], abilities: [{ type: 'lifesteal_hit', chance: 0.5, value: 0.4, cooldown: 3 }, { type: 'debuff', chance: 0.5, debuffType: 'attack', value: 0.7, turns: 2, cooldown: 3 }], rewards: { coins: [150, 200], items: [{ pool: ["Warlock's Blade", "Spiked Shield"], chance: 0.1, amount: [1, 1] }], crates: [{ type: 'legendary', chance: 0.05, amount: [1, 1] }] } },
            20: { name: "The Landlord", emoji: "😤", health: 500, damageRange: [35, 45], critChance: 0.15, critMultiplier: 1.5, abilities: [{ type: 'heavy_hit', chance: 0.4, value: 2, cooldown: 4 }, { type: 'shield', chance: 0.3, value: 50, cooldown: 4 }], rewards: { coins: [200, 300], crates: [{ type: 'legendary', chance: 0.1, amount: [1, 1] }] } },
            25: { name: "Avatar of War", emoji: "⚔️", health: 400, damageRange: [30, 35], abilities: [{ type: 'multi_hit', chance: 0.5, hits: 3, cooldown: 3 }, { type: 'buff', chance: 0.3, buffType: 'attack', value: 2, turns: 2, cooldown: 5 }], rewards: { items: [{ pool: ["Excalibur"], chance: 0.3, amount: [1,1] }] } },
            30: { name: "The Wyrm God", emoji: "🐉", health: 1000, damageRange: [40, 50], abilities: [{ type: 'charge_attack', chance: 0.5, value: 3, cooldown: 3 }, { type: 'heal', chance: 0.25, value: 100, cooldown: 5 }, { type: 'debuff', chance: 0.4, debuffType: 'attack', value: 0.5, turns: 3, cooldown: 4 }, { type: 'burn', chance: 0.6, value: 15, turns: 3, cooldown: 3 }], rewards: { crates: [{ type: 'mythical', chance: 0.5, amount: [1, 1] }], items: [{ pool: ["Gjallarhorn", "Aegis Shield"], chance: 0.5, amount: [1, 1] }] } }
        }
    }
};

export const BRAWL_ITEM_EFFECTS: Record<string, {type: 'heal' | 'damage' | 'run_boost' | 'shield' | 'stamina_restore', value: number, log: string}> = {
    "Half-Eaten Sandwich": { type: 'heal', value: 10, log: 'You eat the sandwich, recovering <strong>10</strong> HP.'},
    "Generic Brand Soda Can": { type: 'damage', value: 5, log: 'You throw the soda can, dealing <strong>5</strong> damage.'},
    "Smoke Bomb": { type: 'run_boost', value: 0.4, log: 'You use a Smoke Bomb, obscuring your escape!'},
    "Energy Bar": { type: 'stamina_restore', value: 30, log: 'You eat the Energy Bar, recovering <strong>30</strong> Stamina.'},
    "Adrenaline Shot": { type: 'shield', value: 20, log: 'You inject the Adrenaline Shot, gaining <strong>20</strong> shield.'},
};

export const ROMAN_NUMERALS = ["", "I", "II", "III", "IV", "V"];

export const UPGRADE_DEFINITIONS = {
  speedyCrates: {
    id: 'speedyCrates',
    name: 'Speedy Crates',
    maxTier: 2,
    getCost: (tier: number) => [10, 20][tier],
    getDescription: (tier: number) => `Free crates generate ${[25, 50][tier] || 0}% faster.`,
  },
  crateBounties: {
    id: 'crateBounties',
    name: 'Crate Bounties',
    maxTier: 1,
    getCost: (tier: number) => [15][tier],
    getDescription: (tier: number) => 'Gain 5 coins every time you open a crate. Also makes "Open All" free.',
  },
  secondChance: {
    id: 'secondChance',
    name: 'Second Chance',
    maxTier: 2,
    getCost: (tier: number) => [20, 30][tier],
    getDescription: (tier: number) => `Once per life, if you lose a coin flip, you can try again for free. (${[1, 2][tier] || 0} uses)`,
  },
  startingCapital: {
    id: 'startingCapital',
    name: 'Starting Capital',
    maxTier: 3,
    getCost: (tier: number) => [5, 10, 15][tier],
    getDescription: (tier: number) => `Start each new life with ${[250, 750, 2000][tier] || 0} coins.`,
  },
  goldenTouch: {
    id: 'goldenTouch',
    name: 'Golden Touch',
    maxTier: 3,
    getCost: (tier: number) => [10, 15, 20][tier],
    getDescription: (tier: number) => `All items sell for ${[25, 50, 75][tier] || 0}% more coins.`,
  },
  shopHaggler: {
    id: 'shopHaggler',
    name: 'Shop Haggler',
    maxTier: 2,
    getCost: (tier: number) => [15, 25][tier],
    getDescription: (tier: number) => `Crates purchased from the shop are ${[20, 40][tier] || 0}% cheaper.`,
  },
  gambleInsurance: {
    id: 'gambleInsurance',
    name: 'Gamble Insurance',
    maxTier: 1,
    getCost: (tier: number) => [15][tier],
    getDescription: (tier: number) => 'The first time you lose a coin flip each life, get 50% of the gambled value back in coins as a safety net.',
  },
  netWorthInflation: {
    id: 'netWorthInflation',
    name: 'Net Worth Inflation',
    maxTier: 1,
    getCost: (tier: number) => [20][tier],
    getDescription: (tier: number) => 'Your Net Worth is considered 15% higher when calculating Rebirth Tokens.',
  },
  weightedCoin: {
    id: 'weightedCoin',
    name: 'Weighted Coin',
    maxTier: 1,
    getCost: (tier: number) => [25][tier],
    getDescription: (tier: number) => 'Permanently increase your coin flip win chance from 50% to 53%.',
  },
  tavernBrawler: {
    id: 'tavernBrawler',
    name: 'Tavern Brawler',
    maxTier: 3,
    getCost: (tier: number) => [10, 20, 30][tier],
    getDescription: (tier: number) => `Start every brawl with <strong>${[10, 25, 50][tier] || 0}</strong> shield and regenerate <strong>${[2, 4, 6][tier] || 0}%</strong> of your max HP each turn.`,
  },
  marketInsider: {
    id: 'marketInsider',
    name: 'Market Insider',
    maxTier: 1,
    getCost: (tier: number) => [2][tier],
    getDescription: (tier: number) => `Eliminates the currency exchange tax in the Market entirely.`,
  },
};

// --- Getter Functions ---

export function getItemRarity(itemName: string): Rarity | null {
    return itemData[itemName]?.rarity || null;
}


export function getItemCategory(itemName: string): ItemCategory | null {
    return itemData[itemName]?.category || null;
}

export function getWeaponData(weaponName: string) {
    return itemData[weaponName];
}

export function getPotionData(potionName: string) {
    return potions[potionName];
}

export function getItemSellValue(itemName: string): number {
    if (itemSellValues[itemName] !== undefined) {
        return itemSellValues[itemName];
    }
    const category = getItemCategory(itemName);
    const rarity = getItemRarity(itemName);
    const baseValue = rarity ? raritySellValues[rarity] : 0;
    
    let multiplier = 1;
    if (category === 'weapon' || category === 'armor') multiplier = 5;
    
    return baseValue * multiplier;
}

export function getPotionSellValue(potionName: string): number {
    const baseValue = potions[potionName]?.sellValue || 0;
    return baseValue * 2;
}