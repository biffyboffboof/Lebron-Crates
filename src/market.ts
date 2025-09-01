import { state } from './state';
import { updateMarketUI, updateAllUI, showToast } from './ui';
import { MarketAsset, Trade, MarketPortfolioItem, Loan } from './types';
import { showConfirmationModal } from './utils';
// FIX: Import LOAN_OFFERS from data.ts to prevent circular dependencies
import { LOAN_OFFERS } from './data';

const MAX_HISTORY = 100; // Store last 100 price points for graph
const COLLATERAL_RATIO = 1.0; // 100% collateral required for shorts
const CONVERSION_TAX = 0.02; // 2% tax
const LOAN_INTEREST_RATE = 0.05; // 5% interest for the period
const LOAN_DURATION_MS = 3 * 60 * 60 * 1000; // 3 hours
const MARGIN_CALL_THRESHOLD = 1.2; // 120% collateralization required

const initialAssets: MarketAsset[] = [
    { id: 'labubu_basic', name: 'Basic Labubu', currentPrice: 10, basePrice: 10, priceHistory: [10], momentum: 0 },
    { id: 'labubu_fuzzy', name: 'Fuzzy Labubu', currentPrice: 25, basePrice: 25, priceHistory: [25], momentum: 0 },
    { id: 'labubu_cyborg', name: 'Cyborg Labubu', currentPrice: 150, basePrice: 150, priceHistory: [150], momentum: 0 },
    { id: 'labubu_golden', name: 'Golden Labubu', currentPrice: 1000, basePrice: 1000, priceHistory: [1000], momentum: 0 },
];

export function initializeMarket() {
    if (Object.keys(state.marketAssets).length > 0) return; // Already initialized from save

    initialAssets.forEach(asset => {
        const history = [asset.currentPrice];
        let price = asset.currentPrice;
        for (let i = 0; i < MAX_HISTORY - 1; i++) {
            price *= (1 + (Math.random() - 0.495) * 0.08);
            price = Math.max(asset.currentPrice * 0.5, price);
            price = Math.min(asset.currentPrice * 2.0, price);
            history.unshift(price);
        }
        
        state.marketAssets[asset.id] = { ...asset, priceHistory: history };
    });
}

// Price update logic
export function updateMarketPrices() {
    const now = Date.now();
    let eventTriggeredThisTick = false;

    // News Event Logic - 5% chance per update tick
    if (Math.random() < 0.05 && !eventTriggeredThisTick) {
        triggerNewsEvent();
        eventTriggeredThisTick = true;
    }

    for (const assetId in state.marketAssets) {
        const asset = state.marketAssets[assetId];
        
        const reversionForce = (asset.basePrice - asset.currentPrice) * 0.001; // Pulls back to base price
        const longTermCycle = Math.sin(now / 200000 + asset.id.length * 10) * 0.0005;
        asset.momentum = asset.momentum * 0.97 + (Math.random() - 0.495) * 0.001; 
        const randomWalk = (Math.random() - 0.5) * 0.015;

        let priceChangePercentage = longTermCycle + asset.momentum + randomWalk + reversionForce;
        priceChangePercentage = Math.max(-0.1, Math.min(0.1, priceChangePercentage));

        asset.currentPrice *= (1 + priceChangePercentage);
        asset.currentPrice = Math.max(0.01, asset.currentPrice);

        asset.priceHistory.push(asset.currentPrice);
        if (asset.priceHistory.length > MAX_HISTORY) {
            asset.priceHistory.shift();
        }
    }
    
    // Fluctuate TC exchange rate
    const rateChange = (Math.random() - 0.5) * 0.02; // Small fluctuation
    state.tcExchangeRate += rateChange;
    // Clamp the value to a reasonable range
    state.tcExchangeRate = Math.max(4.5, Math.min(5.5, state.tcExchangeRate));

    updateMarketUI();
}

function triggerNewsEvent() {
    const assetIds = Object.keys(state.marketAssets);
    const randomAssetId = assetIds[Math.floor(Math.random() * assetIds.length)];
    const asset = state.marketAssets[randomAssetId];

    const isPositive = Math.random() > 0.5;
    const changePercent = 0.1 + Math.random() * 0.4;
    const multiplier = isPositive ? 1 + changePercent : 1 - changePercent;

    const positiveEvents = [`goes viral on TikTok!`, `featured in a new movie!`, `becomes a collector's favorite!`, `receives a design award!`];
    const negativeEvents = [`factory recall due to defects!`, `involved in a celebrity scandal!`, `production halted!`, `loses popularity to new toy!`];
    const eventText = isPositive ? positiveEvents[Math.floor(Math.random() * positiveEvents.length)] : negativeEvents[Math.floor(Math.random() * negativeEvents.length)];

    asset.currentPrice *= multiplier;
    asset.momentum += (multiplier - 1) * 0.1;
    
    showToast(`NEWS: ${asset.name} ${eventText} Price ${isPositive ? '▲' : '▼'} ${(changePercent * 100).toFixed(0)}%`, isPositive ? 'success' : 'error');
}

function recordTrade(trade: Omit<Trade, 'timestamp' | 'assetName'>) {
    const fullTrade: Trade = {
        ...trade,
        timestamp: Date.now(),
        assetName: state.marketAssets[trade.assetId].name,
    };
    state.tradeHistory.unshift(fullTrade);
    if (state.tradeHistory.length > 200) {
        state.tradeHistory.pop();
    }
    if (fullTrade.pnl) {
        state.stats.marketPnl = (state.stats.marketPnl || 0) + fullTrade.pnl;
    }
}

// Currency Conversion
export function convertCurrency(direction: 'toTC' | 'fromTC', amount: number) {
    if (isNaN(amount) || amount <= 0) return;

    const { coins, tradingCash, tcExchangeRate } = state;
    const tax = state.rebirthUpgrades.marketInsider > 0 ? 0 : CONVERSION_TAX;

    if (direction === 'toTC') {
        if (coins < amount) {
            showToast('Not enough coins!', 'error');
            return;
        }
        const tcReceived = (amount / tcExchangeRate) * (1 - tax);
        state.coins -= amount;
        state.tradingCash += tcReceived;
        showToast(`Exchanged ${amount} Coins for ${tcReceived.toFixed(2)} TC`, 'success');
    } else { // fromTC
        if (tradingCash < amount) {
            showToast('Not enough TC!', 'error');
            return;
        }
        const potentialCoinsWithTax = (amount * tcExchangeRate) * (1 - tax);
        const coinsReceived = Math.floor(potentialCoinsWithTax);

        if (coinsReceived < 1) {
            showToast('That amount is too small to convert to a whole coin.', 'error');
            return;
        }

        const tcCostForWholeCoins = coinsReceived / (tcExchangeRate * (1 - tax || 1));


        if (state.tradingCash < tcCostForWholeCoins) {
            showToast('Error during conversion calculation.', 'error');
            return;
        }
        
        state.tradingCash -= tcCostForWholeCoins;
        state.coins += coinsReceived;
        showToast(`Exchanged ${tcCostForWholeCoins.toFixed(2)} TC for ${coinsReceived} Coins`, 'success');
    }
    updateAllUI();
}

// Trading logic
export async function buyAsset(assetId: string, quantity: number) {
    if (!Number.isInteger(quantity) || quantity <= 0) return;
    const asset = state.marketAssets[assetId];
    const portfolioItem = state.marketPortfolio[assetId] || { quantity: 0, avgEntryPrice: 0 };
    const cost = asset.currentPrice * quantity;

    if (portfolioItem.quantity < 0) { // This is a "cover" action
        const quantityToCover = Math.min(quantity, Math.abs(portfolioItem.quantity));
        const costToCover = asset.currentPrice * quantityToCover;
        const collateralToRelease = (state.shortCollateral[assetId] || 0) * (quantityToCover / Math.abs(portfolioItem.quantity));

        if (state.tradingCash + collateralToRelease < costToCover) {
            showToast('Not enough TC to cover the position!', 'error');
            return;
        }
        
        const pnl = (portfolioItem.avgEntryPrice - asset.currentPrice) * quantityToCover;

        if (pnl < 0) {
            const confirmed = await showConfirmationModal(
                'Confirm Cover',
                `Covering this position will result in a loss of <strong>${Math.abs(pnl).toFixed(2)} TC</strong>. Are you sure?`
            );
            if (!confirmed) {
                showToast('Cover operation cancelled.', 'success');
                return;
            }
        }

        state.tradingCash -= costToCover;
        
        state.shortCollateral[assetId] -= collateralToRelease;
        state.tradingCash += collateralToRelease;
        
        portfolioItem.quantity += quantityToCover;
        
        if (portfolioItem.quantity === 0) {
            delete state.marketPortfolio[assetId];
            delete state.shortCollateral[assetId];
        }

        recordTrade({ assetId, type: 'cover', quantity: quantityToCover, price: asset.currentPrice, total: costToCover, pnl });
        showToast(`Covered ${quantityToCover} ${asset.name}. P/L: ${pnl.toFixed(2)} TC`, pnl >= 0 ? 'success' : 'error');

    } else { // This is a normal "buy"
        if (state.tradingCash < cost) {
            showToast('Not enough TC!', 'error');
            return;
        }
        state.tradingCash -= cost;

        const oldTotalValue = portfolioItem.quantity * portfolioItem.avgEntryPrice;
        const newTotalValue = oldTotalValue + cost;
        portfolioItem.quantity += quantity;
        portfolioItem.avgEntryPrice = newTotalValue / portfolioItem.quantity;
        state.marketPortfolio[assetId] = portfolioItem;

        recordTrade({ assetId, type: 'buy', quantity, price: asset.currentPrice, total: cost });
        showToast(`Bought ${quantity} ${asset.name}`, 'success');
    }
    
    updateAllUI();
}

export function sellAsset(assetId: string, quantity: number) {
    if (!Number.isInteger(quantity) || quantity <= 0) return;
    const asset = state.marketAssets[assetId];
    const portfolioItem = state.marketPortfolio[assetId];

    if (!portfolioItem || portfolioItem.quantity < quantity) {
        showToast('You don\'t own enough to sell!', 'error');
        return;
    }

    const earnings = asset.currentPrice * quantity;
    const pnl = (asset.currentPrice - portfolioItem.avgEntryPrice) * quantity;
    
    state.tradingCash += earnings;
    portfolioItem.quantity -= quantity;

    if (portfolioItem.quantity === 0) {
        delete state.marketPortfolio[assetId];
    }
    
    recordTrade({ assetId, type: 'sell', quantity, price: asset.currentPrice, total: earnings, pnl });
    showToast(`Sold ${quantity} ${asset.name}. P/L: ${pnl.toFixed(2)} TC`, pnl >= 0 ? 'success' : 'error');
    updateAllUI();
}

export function shortAsset(assetId: string, quantity: number) {
    if (!Number.isInteger(quantity) || quantity <= 0) return;
    const asset = state.marketAssets[assetId];
    const portfolioItem = state.marketPortfolio[assetId] || { quantity: 0, avgEntryPrice: 0 };

    if (portfolioItem.quantity > 0) {
        showToast('Close your long position before shorting!', 'error');
        return;
    }

    const value = asset.currentPrice * quantity;
    const collateralNeeded = value * COLLATERAL_RATIO;

    if (state.tradingCash < collateralNeeded) {
        showToast(`Not enough TC for collateral! Need ${collateralNeeded.toFixed(2)} TC.`, 'error');
        return;
    }

    state.tradingCash -= collateralNeeded;
    state.shortCollateral[assetId] = (state.shortCollateral[assetId] || 0) + collateralNeeded;
    state.tradingCash += value;

    const oldTotalValue = Math.abs(portfolioItem.quantity) * portfolioItem.avgEntryPrice;
    const newTotalValue = oldTotalValue + value;
    portfolioItem.quantity -= quantity;
    portfolioItem.avgEntryPrice = newTotalValue / Math.abs(portfolioItem.quantity);
    state.marketPortfolio[assetId] = portfolioItem;

    recordTrade({ assetId, type: 'short', quantity, price: asset.currentPrice, total: value });
    showToast(`Shorted ${quantity} ${asset.name}`, 'success');
    updateAllUI();
}

export async function takeLoan(amount: number) {
    if (state.loan) {
        showToast("You already have an active loan.", "error");
        return;
    }

    const offer = LOAN_OFFERS.find(o => o.amount === amount);
    if (!offer) {
        showToast("Invalid loan offer.", "error");
        return;
    }
    
    const requiredCollateral = offer.amount * offer.collateralMultiplier;

    const confirmation = await showConfirmationModal(
        'Confirm Loan',
        `Take out a loan for <strong>${amount} TC</strong>? <br><br>The bank will automatically hold assets valued at ~<strong>${requiredCollateral.toFixed(2)} TC</strong> from your portfolio as collateral.`
    );
     if (!confirmation) {
        showToast('Loan cancelled.', 'info');
        return;
    }

    // Automatically select best collateral
    const collateralSelection: Record<string, MarketPortfolioItem> = {};
    let collectedCollateralValue = 0;
    
    const sortedPortfolio = Object.entries(state.marketPortfolio)
        .filter(([, item]) => item.quantity > 0) // Only long positions
        .map(([assetId, item]) => ({ assetId, item, value: item.quantity * state.marketAssets[assetId].currentPrice }))
        .sort((a, b) => b.value - a.value); // Sort by most valuable first
        
    for (const asset of sortedPortfolio) {
        if (collectedCollateralValue >= requiredCollateral) break;
        collateralSelection[asset.assetId] = asset.item;
        collectedCollateralValue += asset.value;
    }

    if (collectedCollateralValue < requiredCollateral) {
         showToast('Collateral selection failed. Not enough assets.', 'error');
         return;
    }

    // Move items from portfolio to collateral
    for (const assetId in collateralSelection) {
        delete state.marketPortfolio[assetId];
    }

    state.tradingCash += amount;
    state.loan = {
        amount: amount,
        collateral: collateralSelection,
        dueDate: Date.now() + LOAN_DURATION_MS,
    };

    showToast(`Loan of ${amount} TC received!`, 'success');
    updateAllUI();
}

export async function repayLoan() {
    if (!state.loan) {
        showToast("You have no loan to repay.", 'info');
        return;
    }
    
    const amountDue = state.loan.amount * (1 + LOAN_INTEREST_RATE);
    
    if (state.tradingCash < amountDue) {
        showToast(`You need ${amountDue.toFixed(2)} TC to repay your loan. You only have ${state.tradingCash.toFixed(2)} TC.`, 'error');
        return;
    }
    
     const confirmation = await showConfirmationModal(
        'Repay Loan',
        `Repay your loan for <strong>${amountDue.toFixed(2)} TC</strong>? Your collateral will be returned.`
    );
    if (!confirmation) {
        showToast('Repayment cancelled.', 'info');
        return;
    }

    state.tradingCash -= amountDue;
    
    // Return collateral to portfolio
    for (const assetId in state.loan.collateral) {
        state.marketPortfolio[assetId] = state.loan.collateral[assetId];
    }
    
    state.loan = null;

    showToast('Loan repaid successfully!', 'success');
    updateAllUI();
}

export function checkLoanStatus() {
    if (!state.loan) return;
    
    const now = Date.now();
    let collateralValue = 0;
    for (const assetId in state.loan.collateral) {
        if (state.marketAssets[assetId]) {
            collateralValue += state.loan.collateral[assetId].quantity * state.marketAssets[assetId].currentPrice;
        }
    }

    const amountOwed = state.loan.amount;

    // Margin Call Check
    if (collateralValue < amountOwed * MARGIN_CALL_THRESHOLD) {
        showToast(`MARGIN CALL! Your collateral value dropped too low. Liquidating assets to cover your ${amountOwed.toFixed(2)} TC loan.`, 'error');
        state.loan = null;
        // You don't get the money back, the bank takes it. The penalty is the loss of assets.
        updateAllUI();
        return;
    }

    // Overdue Check
    if (now > state.loan.dueDate) {
        showToast(`LOAN OVERDUE! Your collateral is being liquidated to cover your ${amountOwed.toFixed(2)} TC loan.`, 'error');
        state.loan = null;
        updateAllUI();
        return;
    }
}