// ============================================
// THE DAILY SLEUTH - MEMORY MATCH GAME
// Advanced Error Handling & Mobile Optimized
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

    // Error Toast System
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
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Safe DOM Element Getter with Error Handling
    function safeGetElement(id) {
        const el = document.getElementById(id);
        if (!el) {
            console.warn(`Element with id "${id}" not found`);
            return null;
        }
        return el;
    }

    function shuffleArray(arr) {
        try {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        } catch (error) {
            console.error('Shuffle error:', error);
            showErrorToast('Error shuffling cards. Restarting...');
            return arr;
        }
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
        try {
            const matchesEl = safeGetElement('gameMatches');
            const movesEl = safeGetElement('gameMoves');
            const timeEl = safeGetElement('gameTime');
            
            if (matchesEl) matchesEl.innerText = `${gameState.matches} / 8`;
            if (movesEl) movesEl.innerText = gameState.moves;
            if (timeEl) timeEl.innerText = formatTime(gameState.time);
        } catch (error) {
            console.error('UI Update error:', error);
        }
    }

    function renderGrid() {
        try {
            const grid = safeGetElement('memoryGrid');
            if (!grid) return;
            
            grid.innerHTML = '';
            
            gameState.cards.forEach((card, idx) => {
                const cardDiv = document.createElement('div');
                cardDiv.className = `memory-card ${(card.flipped || card.matched) ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`;
                cardDiv.dataset.idx = idx;
                cardDiv.setAttribute('role', 'button');
                cardDiv.setAttribute('aria-label', `Card ${card.label} ${card.matched ? 'matched' : ''}`);
                cardDiv.innerHTML = `
                    <div class="card-face card-back"></div>
                    <div class="card-face card-front">
                        <div class="card-emoji">${card.emoji}</div>
                        <div class="card-label">${card.label}</div>
                    </div>
                `;
                cardDiv.addEventListener('click', () => flipCard(idx));
                cardDiv.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    flipCard(idx);
                }, { passive: false });
                grid.appendChild(cardDiv);
            });
        } catch (error) {
            console.error('Render grid error:', error);
            showErrorToast('Error displaying cards. Please restart.');
        }
    }

    function updateCardDOM(idx) {
        try {
            const card = gameState.cards[idx];
            if (!card) return;
            
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
        } catch (error) {
            console.error('Update card DOM error:', error);
        }
    }

    function flipCard(idx) {
        try {
            if (!gameState.running || gameState.lockBoard || gameState.hinting) return;
            if (idx < 0 || idx >= gameState.cards.length) return;
            
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
        } catch (error) {
            console.error('Flip card error:', error);
            showErrorToast('Error flipping card');
            gameState.lockBoard = false;
        }
    }

    function checkMatch() {
        try {
            if (gameState.flipped.length !== 2) return;
            
            const [a, b] = gameState.flipped;
            const cardA = gameState.cards[a];
            const cardB = gameState.cards[b];
            
            if (!cardA || !cardB) {
                gameState.flipped = [];
                gameState.lockBoard = false;
                return;
            }

            if (cardA.id === cardB.id) {
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
                gameState.lockBoard = true;
                setTimeout(() => {
                    try {
                        if (!gameState.running) return;
                        cardA.flipped = false;
                        cardB.flipped = false;
                        updateCardDOM(a);
                        updateCardDOM(b);
                        gameState.flipped = [];
                        gameState.lockBoard = false;
                    } catch (error) {
                        console.error('Timeout flip back error:', error);
                        gameState.lockBoard = false;
                        gameState.flipped = [];
                    }
                }, 800);
            }
        } catch (error) {
            console.error('Check match error:', error);
            gameState.lockBoard = false;
            gameState.flipped = [];
            showErrorToast('Match check error. Resuming game.');
        }
    }

    function gameWon() {
        try {
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
            
            // Save best score to localStorage
            try {
                const best = localStorage.getItem('sleuth_best');
                if (!best || gameState.moves < parseInt(best)) {
                    localStorage.setItem('sleuth_best', gameState.moves);
                }
            } catch (e) {
                console.warn('LocalStorage not available:', e);
            }
        } catch (error) {
            console.error('Game win error:', error);
            showErrorToast('Game completed but display error occurred');
        }
    }

    function closeModal() {
        try {
            const winModal = safeGetElement('winModal');
            if (winModal) winModal.classList.remove('visible');
        } catch (error) {
            console.error('Close modal error:', error);
        }
    }

    function startGame() {
        try {
            if (gameState.timer) {
                clearInterval(gameState.timer);
                gameState.timer = null;
            }
            
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
                try {
                    if (gameState.running && !gameState.hinting) {
                        gameState.time++;
                        updateUI();
                    }
                } catch (error) {
                    console.error('Timer error:', error);
                }
            }, 1000);
        } catch (error) {
            console.error('Start game error:', error);
            showErrorToast('Error starting game. Please refresh the page.');
        }
    }

    function hint() {
        try {
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
                try {
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
                } catch (error) {
                    console.error('Hint timeout error:', error);
                    gameState.hinting = false;
                }
            }, 1000);
        } catch (error) {
            console.error('Hint error:', error);
            gameState.hinting = false;
            showErrorToast('Hint failed. Try again.');
        }
    }

    function showRanking() {
        try {
            let bestMoveText = 'No games played yet';
            try {
                const best = localStorage.getItem('sleuth_best');
                if (best) bestMoveText = `${best} moves (${getRank(parseInt(best))})`;
            } catch (e) {}
            
            let currentText = '';
            if (gameState.moves > 0 && gameState.matches > 0) {
                currentText = `\nCurrent game: ${gameState.moves} moves (${getRank(gameState.moves)})`;
            }
            
            alert(`🏆 DETECTIVE RANKING 🏆\n\nS★★★: ≤14 moves\nA★★☆: 15-18 moves\nB★☆☆: 19-24 moves\nC☆☆☆: ≥25 moves\n\n⭐ Your Best: ${bestMoveText}${currentText}`);
        } catch (error) {
            console.error('Show ranking error:', error);
            alert('S★★★ ≤14 | A★★☆ 15-18 | B★☆☆ 19-24 | C☆☆☆ ≥25');
        }
    }

    // Initialize Event Listeners with Error Handling
    document.addEventListener('DOMContentLoaded', () => {
        try {
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
            
            startGame();
        } catch (error) {
            console.error('Initialization error:', error);
            showErrorToast('Game initialization failed. Please refresh.');
        }
    });
})();