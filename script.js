// script.js
// Game state and configuration
const gameConfig = {
    difficulties: {
        easy: { rows: 4, cols: 4, pairs: 8 },
        medium: { rows: 4, cols: 5, pairs: 10 },
        hard: { rows: 5, cols: 6, pairs: 15 }
    },
    flowers: ['🌸', '🌺', '🌹', '🌻', '🌼', '💐', '🌷', '🌿', '🥀', '🪷', '🌾', '🍀', '🌱', '☘️', '🎋']
};

// Global game state
let gameState = {
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    moveCount: 0,
    gameActive: false,
    timer: 0,
    timerInterval: null,
    currentDifficulty: 'easy',
    hints: 3
};

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add touch event listeners for better mobile experience
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('touchstart', function(e) {
            this.style.transform = 'scale(0.95)';
            e.preventDefault();
        });
        
        btn.addEventListener('touchend', function() {
            this.style.transform = '';
        });
    });
    
    // Initialize with main screen
    showScreen('main-screen');
});

// Screen management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    
    // Stop timer if leaving game screen
    if (screenId !== 'game-screen' && gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

// Start game with selected difficulty
function startGame(difficulty) {
    gameState.currentDifficulty = difficulty;
    const config = gameConfig.difficulties[difficulty];
    
    // Reset game state
    gameState = {
        cards: [],
        flippedCards: [],
        matchedPairs: 0,
        moveCount: 0,
        gameActive: true,
        timer: 0,
        timerInterval: null,
        currentDifficulty: difficulty,
        hints: 3
    };
    
    // Create cards based on difficulty
    createCards(config);
    
    // Update UI
    updateScore();
    
    // Show game screen
    showScreen('game-screen');
    
    // Start timer
    startTimer();
}

// Create cards for the game
function createCards(config) {
    const gameGrid = document.getElementById('game-grid');
    gameGrid.innerHTML = '';
    
    // Adjust grid layout based on difficulty
    gameGrid.style.gridTemplateColumns = `repeat(${config.cols}, 1fr)`;
    
    // Select flowers for this game
    const selectedFlowers = gameConfig.flowers.slice(0, config.pairs);
    
    // Create pairs of flowers
    let cardValues = [...selectedFlowers, ...selectedFlowers];
    cardValues = shuffleArray(cardValues);
    
    // Create card objects
    gameState.cards = cardValues.map((value, index) => ({
        id: index,
        value: value,
        flipped: false,
        matched: false
    }));
    
    // Render cards
    renderCards();
    
    // Update pair count display
    document.getElementById('pair-count').textContent = `0/${config.pairs}`;
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Render cards in the game grid
function renderCards() {
    const gameGrid = document.getElementById('game-grid');
    gameGrid.innerHTML = '';
    
    gameState.cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        
        if (card.matched) {
            cardElement.classList.add('matched');
        }
        if (card.flipped) {
            cardElement.classList.add('flipped');
            cardElement.textContent = card.value;
        }
        
        // Add both click and touchstart event listeners for responsiveness on mobile
        cardElement.addEventListener('click', () => handleCardClick(card.id));
        cardElement.addEventListener('touchstart', (e) => {
            e.preventDefault(); // prevent ghost click
            handleCardClick(card.id);
        });
        
        gameGrid.appendChild(cardElement);
    });
}

// Handle card click
function handleCardClick(cardId) {
    if (!gameState.gameActive) return;
    
    const card = gameState.cards[cardId];
    
    // Don't allow clicking already flipped or matched cards
    if (card.flipped || card.matched || gameState.flippedCards.length >= 2) {
        return;
    }
    
    // Flip the card
    card.flipped = true;
    gameState.flippedCards.push(cardId);
    renderCards();
    
    // Check for match when two cards are flipped
    if (gameState.flippedCards.length === 2) {
        gameState.moveCount++;
        updateScore();
        
        const [firstId, secondId] = gameState.flippedCards;
        const firstCard = gameState.cards[firstId];
        const secondCard = gameState.cards[secondId];
        
        if (firstCard.value === secondCard.value) {
            // Match found
            firstCard.matched = true;
            secondCard.matched = true;
            gameState.matchedPairs++;
            gameState.flippedCards = [];
            
            // Check for win
            const config = gameConfig.difficulties[gameState.currentDifficulty];
            if (gameState.matchedPairs === config.pairs) {
                setTimeout(showWinScreen, 500);
            }
        } else {
            // No match - flip back after delay
            setTimeout(() => {
                firstCard.flipped = false;
                secondCard.flipped = false;
                gameState.flippedCards = [];
                renderCards();
            }, 1000);
        }
        
        renderCards();
    }
}

// Update score displays
function updateScore() {
    document.getElementById('move-count').textContent = gameState.moveCount;
    
    const config = gameConfig.difficulties[gameState.currentDifficulty];
    document.getElementById('pair-count').textContent = `${gameState.matchedPairs}/${config.pairs}`;
}

// Start game timer
function startTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    gameState.timer = 0;
    document.getElementById('timer').textContent = '0s';
    
    gameState.timerInterval = setInterval(() => {
        gameState.timer++;
        document.getElementById('timer').textContent = `${gameState.timer}s`;
    }, 1000);
}

// Show win screen
function showWinScreen() {
    clearInterval(gameState.timerInterval);
    gameState.gameActive = false;
    
    // Calculate score (higher is better)
    const config = gameConfig.difficulties[gameState.currentDifficulty];
    const timeBonus = Math.max(0, 300 - gameState.timer);
    const moveBonus = Math.max(0, (config.pairs * 10) - gameState.moveCount);
    const difficultyBonus = {
        easy: 100,
        medium: 200,
        hard: 300
    }[gameState.currentDifficulty];
    
    const totalScore = timeBonus + moveBonus + difficultyBonus;
    
    // Update win screen
    document.getElementById('win-time').textContent = `${gameState.timer}s`;
    document.getElementById('win-moves').textContent = gameState.moveCount;
    document.getElementById('win-score').textContent = totalScore;
    
    showScreen('win-screen');
}

// Provide hint to player
function hint() {
    if (gameState.hints <= 0 || !gameState.gameActive) return;
    
    // Find unmatched pairs that can be hinted
    const unmatchedCards = gameState.cards.filter(card => !card.matched && !card.flipped);
    
    if (unmatchedCards.length < 2) return;
    
    // Group by flower type
    const flowerGroups = {};
    unmatchedCards.forEach(card => {
        if (!flowerGroups[card.value]) {
            flowerGroups[card.value] = [];
        }
        flowerGroups[card.value].push(card.id);
    });
    
    // Find a pair to hint
    let hintPair = null;
    for (const flower in flowerGroups) {
        if (flowerGroups[flower].length >= 2) {
            hintPair = flowerGroups[flower].slice(0, 2);
            break;
        }
    }
    
    if (hintPair) {
        // Highlight the hint cards
        hintPair.forEach(cardId => {
            const cardElement = document.querySelectorAll('.card')[cardId];
            cardElement.classList.add('hint');
            
            // Remove hint after animation
            setTimeout(() => {
                cardElement.classList.remove('hint');
            }, 1000);
        });
        
        gameState.hints--;
    }
}

// Restart the current game
function restartGame() {
    if (confirm('Are you sure you want to restart? Your progress will be lost.')) {
        startGame(gameState.currentDifficulty);
    }
}

// Quit game with confirmation
function quitGame() {
    showModal('quit-modal');
}

// Show modal
function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

// Hide modal
function hideModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

// Confirm quit action
function confirmQuit() {
    hideModal();
    showScreen('main-screen');
}

// Handle Android back button
if (window.history && window.history.pushState) {
    window.addEventListener('popstate', function() {
        if (document.getElementById('game-screen').classList.contains('active') && gameState.gameActive) {
            quitGame();
        } else {
            showScreen('main-screen');
        }
    });
}
