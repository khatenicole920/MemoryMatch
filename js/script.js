// ============================================
// THE DAILY SLEUTH - MEMORY MATCH GAME
// IMPROVED: Better state management, fixed hint bug, smoother UX
// ============================================

(function() {
    'use strict';

    const CARDS_DATA = [
        { id: 1, emoji: '🎭', label: 'Masked Thief' },
        { id: 2, emoji: '🕵️', label: 'Shady Suspect' },
        { id: 3, emoji: '⌚', label: 'Pocket Watch' },
        { id: 4, emoji: '🪢', label: 'Rope' },
        { id: 5, emoji: '🔍', label: 'Fingerprints' },
        { id: 6, emoji: '🔧', label: 'Crowbar' },
        { id: 7, emoji: '🧤', label: 'Torn Glove' },
        { id: 8, emoji: '🏅', label: 'Detective Badge' }
    ];

    let gameState = {
        cards: [],
        flipped: [],
        moves: 0,
        matches: 0,
        time: 0,
        running: false,
        lockBoard: false,
        hinting: false,
        timer: null
    };

    // Toast system
    function showErrorToast(message) {
        let toast = document.getElementById('errorToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'errorToast';
            toast.className = 'error-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    function safeGetElement(id) {
        const el = document.getElementById(id);
        if (!el) console.warn(`Element "${id}" not found`);
        return el;
    }

    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function formatTime(sec) {
        const mins = Math.floor(sec / 60);
        const remainingSecs = sec % 60;
        return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
    }

    function getRank(moves) {
        if (moves <= 14) return 'S★★★';
        if (moves <= 18) return 'A★★☆';
        if (moves <= 24) return 'B★☆☆';
        return 'C☆☆☆';
    }

    function updateUI() {
        const matchesEl = safeGetElement('gameMatches');
        const movesEl = safeGetElement('gameMoves');
        const timeEl = safeGetElement('gameTime');
        if (matchesEl) matchesEl.innerText = `${gameState.matches} / 8`;
        if (movesEl) movesEl.innerText = gameState.moves;
        if (timeEl) timeEl.innerText = formatTime(gameState.time);
    }

    function updateBestScoreDisplay() {
        const bestEl = document.getElementById('bestScoreDisplay');
        if (!bestEl) return;
        try {
            const best = localStorage.getItem('sleuth_best');
            if (best) {
                bestEl.innerText = `${best} moves (${getRank(parseInt(best))})`;
            } else {
                bestEl.innerText = 'No record yet';
            }
        } catch (e) {
            bestEl.innerText = '—';
        }
    }

    function saveBestScore() {
        try {
            const best = localStorage.getItem('sleuth_best');
            if (!best || gameState.moves < parseInt(best)) {
                localStorage.setItem('sleuth_best', gameState.moves);
                updateBestScoreDisplay();
            }
        } catch (e) {}
    }

    function renderGrid() {
        const grid = safeGetElement('memoryGrid');
        if (!grid) return;
        grid.innerHTML = '';
        
        gameState.cards.forEach((card, idx) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = `memory-card ${(card.flipped || card.matched) ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`;
            cardDiv.dataset.idx = idx;
            cardDiv.setAttribute('role', 'button');
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
        const cards = document.querySelectorAll('.memory-card');
        for (let el of cards) {
            if (parseInt(el.dataset.idx) === idx) {
                const card = gameState.cards[idx];
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
        if (!card || card.flipped || card.matched) return;
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
        if (gameState.flipped.length !== 2) return;
        
        const [a, b] = gameState.flipped;
        const cardA = gameState.cards[a];
        const cardB = gameState.cards[b];

        if (cardA.id === cardB.id) {
            // Match!
            cardA.matched = true;
            cardB.matched = true;
            gameState.matches++;
            updateCardDOM(a);
            updateCardDOM(b);
            gameState.flipped = [];
            updateUI();
            
            if (gameState.matches === 8) {
                gameWon();
            }
        } else {
            // No match - flip back after delay
            gameState.lockBoard = true;
            setTimeout(() => {
                if (!gameState.running) return;
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
        gameState.timer = null;
        
        const finalMoves = safeGetElement('finalMoves');
        const finalTime = safeGetElement('finalTime');
        const finalRank = safeGetElement('finalRank');
        const winModal = safeGetElement('winModal');
        
        if (finalMoves) finalMoves.innerText = gameState.moves;
        if (finalTime) finalTime.innerText = formatTime(gameState.time);
        if (finalRank) finalRank.innerText = getRank(gameState.moves);
        if (winModal) winModal.classList.add('visible');
        
        saveBestScore();
    }

    function closeModal() {
        const winModal = safeGetElement('winModal');
        if (winModal) winModal.classList.remove('visible');
    }

    function startGame() {
        // Kill existing timer
        if (gameState.timer) {
            clearInterval(gameState.timer);
            gameState.timer = null;
        }
        
        // Build fresh deck
        let deck = [];
        CARDS_DATA.forEach(card => {
            deck.push({ ...card, uid: Math.random(), flipped: false, matched: false });
            deck.push({ ...card, uid: Math.random(), flipped: false, matched: false });
        });
        
        gameState.cards = shuffleArray(deck);
        gameState.flipped = [];
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
        if (!gameState.running || gameState.hinting || gameState.lockBoard) {
            showErrorToast("Hint not available right now");
            return;
        }
        
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
            if (!gameState.running) {
                gameState.hinting = false;
                return;
            }
            toFlip.forEach(idx => {
                if (!gameState.cards[idx].matched && !gameState.flipped.includes(idx)) {
                    gameState.cards[idx].flipped = false;
                    updateCardDOM(idx);
                }
            });
            gameState.hinting = false;
        }, 1000);
    }

    function showRanking() {
        let bestText = 'No games played yet';
        try {
            const best = localStorage.getItem('sleuth_best');
            if (best) bestText = `${best} moves (${getRank(parseInt(best))})`;
        } catch (e) {}
        
        let currentText = gameState.moves > 0 && gameState.matches > 0 
            ? `\nCurrent game: ${gameState.moves} moves (${getRank(gameState.moves)})` 
            : '';
        
        alert(`🏆 DETECTIVE RANKING 🏆\n\nS★★★: ≤14 moves\nA★★☆: 15-18 moves\nB★☆☆: 19-24 moves\nC☆☆☆: ≥25 moves\n\n⭐ Your Best: ${bestText}${currentText}`);
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        const startBtn = safeGetElement('startGameBtn');
        const restartBtn = safeGetElement('restartGameBtn');
        const hintBtn = safeGetElement('hintGameBtn');
        const rankingBtn = safeGetElement('leaderboardBtn');
        const modalNew = safeGetElement('modalNewGame');
        const modalClose = safeGetElement('modalClose');
        
        if (startBtn) startBtn.addEventListener('click', startGame);
        if (restartBtn) restartBtn.addEventListener('click', startGame);
        if (hintBtn) hintBtn.addEventListener('click', hint);
        if (rankingBtn) rankingBtn.addEventListener('click', showRanking);
        if (modalNew) modalNew.addEventListener('click', () => { closeModal(); startGame(); });
        if (modalClose) modalClose.addEventListener('click', closeModal);
        
        updateBestScoreDisplay();
        startGame();
    });
})();