import { state } from "./state";
import { itemData, potions, UPGRADE_DEFINITIONS } from "./data";
import { getElement, sleep, calculateNetWorth } from "./utils";
// FIX: Added updateAllUI to imports
import { updateAllUI, showToast, populateRebirthUpgradesScreen } from "./ui";
import { initializeMarket } from "./market";

let netWorthAtRebirthStart = 0;

const blackjackState = {
    deck: [],
    playerHand: [],
    dealerHand: [],
    playerScore: 0,
    dealerScore: 0,
    gameOver: false,
};

function createDeck() {
    const suits = ['♥', '♦', '♣', '♠'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({ suit, rank });
        }
    }
    return deck;
}

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function getCardValue(card) {
    if (['J', 'Q', 'K'].includes(card.rank)) return 10;
    if (card.rank === 'A') return 11;
    return parseInt(card.rank, 10);
}

function calculateHandValue(hand) {
    let value = 0;
    let aceCount = 0;
    for (const card of hand) {
        value += getCardValue(card);
        if (card.rank === 'A') aceCount++;
    }
    while (value > 21 && aceCount > 0) {
        value -= 10;
        aceCount--;
    }
    return value;
}

function renderCard(card, isHidden) {
    const cardEl = document.createElement('div');
    if (isHidden) {
        cardEl.className = 'card-blackjack back';
    } else {
        const isRed = ['♥', '♦'].includes(card.suit);
        cardEl.className = `card-blackjack ${isRed ? 'red' : 'black'}`;
        cardEl.innerHTML = `<span class="rank">${card.rank}</span><span class="suit">${card.suit}</span><span class="rank" style="transform: rotate(180deg); bottom: 5px; right: 10px;">${card.rank}</span>`;
    }
    return cardEl;
}

async function dealCard(hand, handElementId, isHidden = false) {
    const cardData = blackjackState.deck.pop();
    hand.push(cardData);
    
    const handElement = getElement(handElementId);
    const cardElement = renderCard(cardData, isHidden);
    handElement.appendChild(cardElement);
    
    blackjackState.playerScore = calculateHandValue(blackjackState.playerHand);
    getElement('player-score').textContent = blackjackState.playerScore.toString();
    
    if (handElementId === 'dealer-hand' && !blackjackState.gameOver) {
       getElement('dealer-score').textContent = '?';
    } else {
        blackjackState.dealerScore = calculateHandValue(blackjackState.dealerHand);
        getElement('dealer-score').textContent = blackjackState.dealerScore.toString();
    }
    await sleep(300);
}

function determineWinner(playerBusted = false, dealerBusted = false) {
    if (blackjackState.gameOver) return;
    blackjackState.gameOver = true;

    const { playerScore, dealerScore } = blackjackState;
    let message = '';
    let won = false; // 'won' means full tokens

    if (playerBusted) {
        message = 'You busted! You receive half the tokens.';
        won = false;
    } else if (dealerBusted) {
        message = 'Dealer busted! You receive the full amount of tokens!';
        won = true;
    } else if (!playerBusted && playerScore === 21 && blackjackState.playerHand.length === 2) {
        message = 'Blackjack! You receive the full amount of tokens!';
        won = true;
    } else if (playerScore > dealerScore) {
        message = 'You win! You receive the full amount of tokens!';
        won = true;
    } else if (dealerScore > playerScore) {
        message = 'Dealer wins. You receive half the tokens.';
        won = false;
    } else {
        message = 'It\'s a push! You receive half the tokens.';
        won = false; // Treat push as "not a win"
    }

    const netWorth = netWorthAtRebirthStart;
    const inflationMultiplier = 1 + (state.rebirthUpgrades.netWorthInflation * 0.15);
    const effectiveNetWorth = netWorth * inflationMultiplier;
    const baseTokens = Math.floor(effectiveNetWorth / 100);
    const tokensGained = won ? baseTokens : Math.floor(baseTokens / 2);

    getElement('blackjack-message').textContent = message;
    getElement('blackjack-token-result').innerHTML = `
        Base Tokens: <span>${baseTokens}</span><br>
        Result: <span>${won ? 'Win' : 'Loss/Push'}</span><br>
        Total Gained: <span>${tokensGained}</span>
    `;

    state.rebirthTokens += tokensGained;

    getElement('player-actions').classList.add('hidden');
    const proceedBtn = getElement('proceed-to-upgrades-btn');
    proceedBtn.classList.remove('hidden');
    proceedBtn.style.display = 'inline-block';
}

async function dealerTurn() {
    // Reveal dealer's hand correctly
    getElement('blackjack-message').textContent = 'Dealer reveals...';
    const dealerHandEl = getElement('dealer-hand');
    dealerHandEl.innerHTML = ''; // Clear the hand of placeholder/visible cards
    for (const card of blackjackState.dealerHand) {
        dealerHandEl.appendChild(renderCard(card, false));
        await sleep(150);
    }

    blackjackState.dealerScore = calculateHandValue(blackjackState.dealerHand);
    getElement('dealer-score').textContent = blackjackState.dealerScore.toString();
    await sleep(500);

    while (blackjackState.dealerScore < 17) {
        getElement('blackjack-message').textContent = 'Dealer hits...';
        await dealCard(blackjackState.dealerHand, 'dealer-hand');
        
        // BUG FIX: The dealer's score was not being updated inside the loop.
        blackjackState.dealerScore = calculateHandValue(blackjackState.dealerHand);
        getElement('dealer-score').textContent = blackjackState.dealerScore.toString();
        
        await sleep(500);
    }
    
    if (blackjackState.dealerScore > 21) {
        determineWinner(false, true);
    } else {
        determineWinner(false, false);
    }
}

async function startBlackjack() {
    getElement('blackjack-screen').classList.remove('hidden');
    getElement('container').classList.add('hidden');

    // --- Animation Logic Start ---
    const introEl = getElement('blackjack-intro');
    introEl.innerHTML = ''; // Clear previous stars
    introEl.classList.remove('hidden');

    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 2}s`;
        introEl.appendChild(star);
    }
    
    setTimeout(() => {
        introEl.classList.add('hidden');
    }, 2500); // Hide after warp-speed animation
    // --- Animation Logic End ---

    getElement('player-hand').innerHTML = '';
    getElement('dealer-hand').innerHTML = '';
    getElement('blackjack-message').textContent = '';
    getElement('blackjack-token-result').textContent = '';
    // Ensure buttons are in the correct initial state
    getElement('player-actions').classList.add('hidden');
    (getElement('hit-btn') as HTMLButtonElement).disabled = false;
    (getElement('stand-btn') as HTMLButtonElement).disabled = false;
    const proceedBtn = getElement('proceed-to-upgrades-btn');
    proceedBtn.classList.add('hidden');
    proceedBtn.style.display = 'none';
    
    blackjackState.deck = createDeck();
    shuffleDeck(blackjackState.deck);
    blackjackState.playerHand = [];
    blackjackState.dealerHand = [];
    blackjackState.gameOver = false;
    
    await sleep(2500); // Wait for animation

    getElement('blackjack-message').textContent = 'Dealing cards...';
    await dealCard(blackjackState.playerHand, 'player-hand');
    await dealCard(blackjackState.playerHand, 'player-hand');
    await dealCard(blackjackState.dealerHand, 'dealer-hand');
    await dealCard(blackjackState.dealerHand, 'dealer-hand', true);

    if (blackjackState.playerScore === 21) {
        getElement('blackjack-message').textContent = 'Blackjack! Checking dealer...';
        await sleep(1000);
        await dealerTurn();
    } else {
        getElement('blackjack-message').textContent = 'Your turn. Hit or Stand?';
        getElement('player-actions').classList.remove('hidden');
    }
}

export async function handleHit() {
    if (blackjackState.gameOver) return;
    (getElement('hit-btn') as HTMLButtonElement).disabled = true;
    (getElement('stand-btn') as HTMLButtonElement).disabled = true;
    await dealCard(blackjackState.playerHand, 'player-hand');
    if (blackjackState.playerScore > 21) {
        determineWinner(true, false);
    } else {
        (getElement('hit-btn') as HTMLButtonElement).disabled = false;
        (getElement('stand-btn') as HTMLButtonElement).disabled = false;
    }
}

export async function handleStand() {
    if (blackjackState.gameOver) return;
    (getElement('hit-btn') as HTMLButtonElement).disabled = true;
    (getElement('stand-btn') as HTMLButtonElement).disabled = true;
    await dealerTurn();
}

export function handleRebirth() {
    const netWorth = calculateNetWorth();
    const inflationMultiplier = 1 + (state.rebirthUpgrades.netWorthInflation * 0.15);
    const effectiveNetWorth = netWorth * inflationMultiplier;
    const potentialTokens = Math.floor(effectiveNetWorth / 100);

    if (potentialTokens <= 0) {
        showToast('Not enough Net Worth for a single token!', 'error');
        return;
    }

    if (!state.inventory['LeBron James'] || state.inventory['LeBron James'] < 1) {
        showToast('You must have LeBron James in your inventory to rebirth!', 'error');
        return;
    }

    netWorthAtRebirthStart = netWorth;
    startBlackjack();
}

export function handleFinishRebirth() {
    state.stats.rebirths++;
    state.coins = state.rebirthUpgrades.startingCapital > 0 ? [250, 750, 2000][state.rebirthUpgrades.startingCapital -1] : 0;
    
    // Reset inventory, keeping upgrades
    Object.keys(state.inventory).forEach(key => state.inventory[key] = 0);
    Object.keys(state.potions).forEach(key => state.potions[key] = 0);
    
    state.crateCount = {
        basic: 5, rare: 0, epic: 0, legendary: 0, mythical: 0,
        weapon_common: 0, weapon_rare: 0, weapon_epic: 0, weapon_legendary: 0, weapon_mythical: 0,
        armor_common: 0, armor_rare: 0, armor_epic: 0, armor_legendary: 0, armor_mythical: 0,
        potion_common: 0, potion_rare: 0, potion_epic: 0, potion_legendary: 0, potion_mythical: 0,
    };
    state.unlocked = {
        basic: true, rare: false, epic: false, legendary: false, mythical: false,
        weapon_common: true, weapon_rare: false, weapon_epic: false, weapon_legendary: false, weapon_mythical: false,
        armor_common: true, armor_rare: false, armor_epic: false, armor_legendary: false, armor_mythical: false,
        potion_common: true, potion_rare: false, potion_epic: false, potion_legendary: false, potion_mythical: false,
    };

    state.discoveredItems = [];
    state.discoveredPotions = [];
    state.selectedForGamble = [];
    state.freeCrateTimer = state.baseTimer;
    state.nextCrateDelay = 35;
    state.freeCratesToClaim = [];
    state.gambledCoins = 0;
    state.isAllIn = false;
    state.craftingUnlocked = false;
    state.potionCraftingUnlockedThisLife = false;
    state.gambleInsuranceUsedThisLife = false;
    state.activePotions = {};
    state.canRedoCoinFlip = state.rebirthUpgrades.secondChance;
    state.equippedWeapon = null;
    state.equippedArmor = null;
    state.rebirthShopOffers = null;
    
    // Reset brawls
    state.brawlProgress = { common: -1, rare: -1, epic: -1, legendary: -1 };
    state.brawlTavernsBeaten = { common: false, rare: false, epic: false, legendary: false };
    state.brawlCooldowns = {};
    
    // Reset Market
    state.marketAssets = {};
    state.marketPortfolio = {};
    state.tradingCash = 5.0;
    state.tcExchangeRate = 5.0;
    state.shortCollateral = {};
    state.tradeHistory = [];
    state.loan = null;
    initializeMarket();

    // Reset Tower of Bots
    state.towerOfBotsState.isActive = false;
    state.towerOfBotsPlays = 1;
    state.towerOfBotsNextPlayTimer = 1800;

    // Reset UI state
    state.mainView = 'inventory';
    state.inventorySubView = 'items';
    state.craftingSubView = 'goods';
    state.consumableSubView = 'potions';
    state.crateView = 'standard';

    getElement('rebirth-upgrades-screen').classList.add('hidden');
    getElement('container').classList.remove('hidden');
    updateAllUI();
    showToast('Rebirth successful!', 'success');
}