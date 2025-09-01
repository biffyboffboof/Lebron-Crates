import { state } from './state';
// FIX: Added updateAllUI to imports
import { showToast, updateAllUI } from './ui';
import { calculateNetWorth } from './utils';
import { recipes, itemData, potions, itemEmojis } from './data';
import { getElement } from './utils';
import { applyWildMagicEffect } from './inventory';

export let selectedRecipeId: string | null = null;

export function checkPotionCraftingUnlock() {
    if (!state.potionCraftingUnlockedThisLife) {
        if (calculateNetWorth() >= 200) {
            state.potionCraftingUnlockedThisLife = true;
            showToast('Potion crafting unlocked for this life!', 'success');
        }
    }
}

export function regenerateCompositePartRecipe() {
    const commonItemsPool = Object.keys(itemData).filter(i => itemData[i].category === 'good');
    // Shuffle the array
    for (let i = commonItemsPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [commonItemsPool[i], commonItemsPool[j]] = [commonItemsPool[j], commonItemsPool[i]];
    }

    const newIngredients = [];
    for (let i = 0; i < 3; i++) {
        newIngredients.push({ name: commonItemsPool[i], amount: 15 });
    }

    recipes.compositePart.ingredients = newIngredients;
}

export function craftItem(recipeId: string | null) {
    if (!recipeId) return;
    const recipe = recipes[recipeId];
    if (!recipe) return;

    const insight = state.activePotions.craftingCostReduction;
    const costMultiplier = (insight && insight.timeLeft > 0) ? (1 - insight.value) : 1;

    const canCraft = recipe.ingredients.every(ing => {
        const requiredAmount = Math.ceil(ing.amount * costMultiplier);
        return (state.inventory[ing.name] || 0) >= requiredAmount;
    });

    if (!canCraft) {
        showToast("Not enough ingredients!", 'error');
        return;
    }
    applyWildMagicEffect();

    recipe.ingredients.forEach(ing => {
        const requiredAmount = Math.ceil(ing.amount * costMultiplier);
        state.inventory[ing.name] -= requiredAmount;
    });

    const { produces } = recipe;

    if (produces.type === 'item') {
        const { name, amount } = produces;
        // Check if it's a regular item or a potion
        if (potions[name]) {
            state.potions[name] = (state.potions[name] || 0) + amount;
            if (!state.discoveredPotions.includes(name)) {
                state.discoveredPotions.push(name);
            }
        } else {
            state.inventory[name] = (state.inventory[name] || 0) + amount;
            if (!state.discoveredItems.includes(name)) {
                state.discoveredItems.push(name);
            }
        }
        showToast(`Crafted ${amount}x ${name}!`, 'success');
    } else if (produces.type === 'instantCoin') {
        const coinsGained = Math.floor(Math.random() * (produces.max - produces.min + 1)) + produces.min;
        state.coins += coinsGained;
        state.stats.lifetimeCoins += coinsGained;
        showToast(`Crafted ${coinsGained} coins!`, 'success');
    } else if (produces.type === 'instantCrate') {
        state.crateCount[produces.crateType] = (state.crateCount[produces.crateType] || 0) + produces.amount;
        showToast(`Crafted a ${produces.crateType} crate!`, 'success');
    }
    
    if (recipeId === 'compositePart') {
        regenerateCompositePartRecipe();
    }

    updateAllUI(); // Update UI after crafting
}

export function updateCraftingUI() {
    const recipeListEl = getElement('crafting-recipe-list');
    const recipeDetailsEl = getElement('crafting-recipe-details');
    const goodsBtn = getElement('show-crafting-goods-btn') as HTMLButtonElement;
    const weaponsBtn = getElement('show-crafting-weapons-btn') as HTMLButtonElement;
    const potionsBtn = getElement('show-crafting-potions-btn') as HTMLButtonElement;

    if (state.potionCraftingUnlockedThisLife) {
        potionsBtn.disabled = false;
        potionsBtn.title = '';
    } else {
        potionsBtn.disabled = true;
        potionsBtn.title = 'Reach 200 Net Worth to unlock Potion Crafting for this life.';
    }

    goodsBtn.classList.toggle('active', state.craftingSubView === 'goods');
    weaponsBtn.classList.toggle('active', state.craftingSubView === 'weapons');
    potionsBtn.classList.toggle('active', state.craftingSubView === 'potions');

    recipeListEl.innerHTML = '';
    
    const filteredRecipes = Object.keys(recipes).filter(id => recipes[id].category === state.craftingSubView);

    filteredRecipes.forEach(recipeId => {
        const recipe = recipes[recipeId];
        const itemEl = document.createElement('div');
        itemEl.className = 'recipe-item';
        itemEl.textContent = recipe.name;
        itemEl.dataset.recipeId = recipeId;
        if (recipeId === selectedRecipeId) {
            itemEl.classList.add('selected');
        }
        itemEl.addEventListener('click', () => {
            selectedRecipeId = recipeId;
            updateCraftingUI();
        });
        recipeListEl.appendChild(itemEl);
    });

    if (selectedRecipeId && recipes[selectedRecipeId]) {
        const recipe = recipes[selectedRecipeId];

        const insight = state.activePotions.craftingCostReduction;
        const costMultiplier = (insight && insight.timeLeft > 0) ? (1 - insight.value) : 1;
        const producesName = recipe.produces.type === 'item' ? recipe.produces.name : recipe.name;
        
        const description = (typeof recipe.description === 'function')
            ? recipe.description(potions[producesName]?.effect)
            : recipe.description;

        let ingredientsHTML = '<ul class="ingredients-list">';
        let canCraft = true;
        for (const ing of recipe.ingredients) {
            const owned = state.inventory[ing.name] || 0;
            const requiredAmount = Math.ceil(ing.amount * costMultiplier);
            const hasEnough = owned >= requiredAmount;
            if (!hasEnough) canCraft = false;
            let costDisplay = `<strong>(${owned} / ${requiredAmount})</strong>`;
            if (costMultiplier < 1) {
                costDisplay += ` <span style="color: var(--secondary-color);"><s>${ing.amount}</s></span>`;
            }
            ingredientsHTML += `<li class="${hasEnough ? 'ingredient-met' : 'ingredient-unmet'}">
                ${ing.name} ${costDisplay}
            </li>`;
        }
        ingredientsHTML += '</ul>';

        const producesEmoji = recipe.produces.emoji || itemEmojis[recipe.produces.name] || '❓';
        

        recipeDetailsEl.innerHTML = `
            <h3>${producesEmoji} ${producesName}</h3>
            <p><i>${description}</i></p>
            <h4>Ingredients:</h4>
            ${ingredientsHTML}
            <button id="craft-btn" ${canCraft ? '' : 'disabled'}>Craft</button>
        `;
        getElement('craft-btn').addEventListener('click', () => craftItem(selectedRecipeId));
    } else {
        recipeDetailsEl.innerHTML = `<div id="crafting-recipe-details-placeholder">Select a recipe to see details.</div>`;
    }
}

export function setSelectedRecipeId(id: string | null) {
    selectedRecipeId = id;
}