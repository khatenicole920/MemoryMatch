// ============================================
// THE DAILY SLEUTH - MEMORY MATCH GAME
// External JavaScript - Fully Functional
// ============================================

const CARDS_DATA = [
    { id: 1, emoji: '🎭', label: 'Masked Thief' },
    { id: 2, emoji: '🕵️', label: 'Shady Suspect' },
    { id: 3, emoji: '⌚', label: 'Pocket Watch' },
    { id: 4, emoji: '🪢', label: 'Rope' },
    { id: 5, emoji: '🔍', label: 'Fingerprints' },
    { id: 6, emoji: '🔧', label: 'Crowbar' },
    { id: 7, emoji: '🧤', label: 'Torn Glove' },
    { id: 8, emoji: '🏅', label: 'Badge' }
];

let gameState = {
    cards: [],
    flipped: [],
    matched: [],
    moves: 0,
    matches: 0,
    time: 0,
    running: false,
    lockBoard: false,
    hinting: false,
    timer: null
};

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function formatTime(sec) {
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
}

function getRank(moves) {
    if (moves <= 14) return 'S★★★';
    if (moves <= 18) return 'A★★☆';
    if (moves <= 24) return 'B★☆☆';
    return 'C☆☆☆';
}

function updateUI() {
    const matchesEl = document.getElementById('gameMatches');
    const movesEl = document.getElementById('gameMoves');
    const timeEl = document.getElementById('gameTime');
    if (matchesEl) matchesEl.innerText = `${gameState.matches} / 8`;
    if (movesEl) movesEl.innerText = gameState.moves;
    if (timeEl) timeEl.innerText = formatTime(gameState.time);
}

function renderGrid() {
    const grid = document.getElementById('memoryGrid');
    if (!grid) return;
    grid.innerHTML = '';
    gameState.cards.forEach((card, idx) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = `memory-card ${(card.flipped || card.matched) ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`;
        cardDiv.dataset.idx = idx;
        cardDiv.innerHTML = `
            <div class="card-face card-back"></div>
            <div class="card-face card-front">
                <div class="card-emoji">${card.emoji}</div>
                <div class="card-label">${card.label}</div>
            </div>
        `;
        cardDiv.addEventListener('click', () => flipCard(idx));
        grid.appendChild(cardDiv);
    });
}

function updateCardDOM(idx) {
    const card = gameState.cards[idx];
    const allCards = document.querySelectorAll('.memory-card');
    for (let el of allCards) {
        if (parseInt(el.dataset.idx) === idx) {
            if (card.flipped || card.matched) el.classList.add('flipped');
            else el.classList.remove('flipped');
            if (card.matched) el.classList.add('matched');
            else el.classList.remove('matched');
            break;
        }
    }
}

function flipCard(idx) {
    if (!gameState.running || gameState.lockBoard || gameState.hinting) return;
    const card = gameState.cards[idx];
    if (card.flipped || card.matched) return;
    if (gameState.flipped.length === 2) return;

    card.flipped = true;
    gameState.flipped.push(idx);
    updateCardDOM(idx);

    if (gameState.flipped.length === 2) {
        gameState.moves++;
        updateUI();
        checkMatch();
    }
}

function checkMatch() {
    const [a, b] = gameState.flipped;
    const cardA = gameState.cards[a];
    const cardB = gameState.cards[b];

    if (cardA.id === cardB.id) {
        cardA.matched = true;
        cardB.matched = true;
        gameState.matches++;
        updateCardDOM(a);
        updateCardDOM(b);
        gameState.flipped = [];
        updateUI();
        if (gameState.matches === 8) gameWon();
    } else {
        gameState.lockBoard = true;
        setTimeout(() => {
            cardA.flipped = false;
            cardB.flipped = false;
            updateCardDOM(a);
            updateCardDOM(b);
            gameState.flipped = [];
            gameState.lockBoard = false;
        }, 800);
    }
}

function gameWon() {
    if (!gameState.running) return;
    gameState.running = false;
    if (gameState.timer) clearInterval(gameState.timer);
    document.getElementById('finalMoves').innerText = gameState.moves;
    document.getElementById('finalTime').innerText = formatTime(gameState.time);
    document.getElementById('finalRank').innerText = getRank(gameState.moves);
    document.getElementById('winModal').classList.add('visible');
    
    const best = localStorage.getItem('sleuth_best');
    if (!best || gameState.moves < parseInt(best)) {
        localStorage.setItem('sleuth_best', gameState.moves);
    }
}

function closeModal() {
    document.getElementById('winModal').classList.remove('visible');
}

function startGame() {
    if (gameState.timer) clearInterval(gameState.timer);
    let deck = [];
    CARDS_DATA.forEach(card => {
        deck.push({ ...card, uid: Math.random(), flipped: false, matched: false });
        deck.push({ ...card, uid: Math.random(), flipped: false, matched: false });
    });
    gameState.cards = shuffleArray(deck);
    gameState.flipped = [];
    gameState.matched = [];
    gameState.moves = 0;
    gameState.matches = 0;
    gameState.time = 0;
    gameState.running = true;
    gameState.lockBoard = false;
    gameState.hinting = false;
    renderGrid();
    updateUI();
    gameState.timer = setInterval(() => {
        if (gameState.running && !gameState.hinting) {
            gameState.time++;
            updateUI();
        }
    }, 1000);
}

function hint() {
    if (!gameState.running || gameState.hinting) return;
    gameState.hinting = true;
    const toFlip = [];
    gameState.cards.forEach((card, idx) => {
        if (!card.matched && !card.flipped) {
            card.flipped = true;
            toFlip.push(idx);
            updateCardDOM(idx);
        }
    });
    setTimeout(() => {
        toFlip.forEach(idx => {
            if (!gameState.cards[idx].matched && !gameState.flipped.includes(idx)) {
                gameState.cards[idx].flipped = false;
                updateCardDOM(idx);
            }
        });
        gameState.hinting = false;
    }, 1000);
}

function showLeaderboard() {
    const best = localStorage.getItem('sleuth_best');
    alert(`🏆 DETECTIVE LEADERBOARD 🏆\n\n1. A. Holmes — 12 moves\n2. J. Watson — 15 moves\n3. I. Adler — 18 moves\n\n${best ? '⭐ Your Best: ' + best + ' moves' : '⭐ Play a game to set your record!'}`);
}

document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startGameBtn');
    const restartBtn = document.getElementById('restartGameBtn');
    const hintBtn = document.getElementById('hintGameBtn');
    const leaderBtn = document.getElementById('leaderboardBtn');
    const modalNew = document.getElementById('modalNewGame');
    const modalClose = document.getElementById('modalClose');
    
    if (startBtn) startBtn.addEventListener('click', startGame);
    if (restartBtn) restartBtn.addEventListener('click', startGame);
    if (hintBtn) hintBtn.addEventListener('click', hint);
    if (leaderBtn) leaderBtn.addEventListener('click', showLeaderboard);
    if (modalNew) modalNew.addEventListener('click', () => { closeModal(); startGame(); });
    if (modalClose) modalClose.addEventListener('click', closeModal);
    
    startGame();
});