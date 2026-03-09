// MathQuest: UI Manager
// Renders all screens, handles transitions

const UI = {
    app: null,
    currentScreen: null,

    init() {
        this.app = document.getElementById('app');
        this._addParticles();
    },

    // SCREEN NAVIGATION
    showScreen(screen, data) {
        this.currentScreen = screen;
        this.app.classList.add('screen-transition');
        setTimeout(() => {
            switch (screen) {
                case 'title': this._renderTitle(); break;
                case 'menu': this._renderMainMenu(); break;
                case 'worldmap': this._renderWorldMap(); break;
                case 'levels': this._renderLevelSelect(data); break;
                case 'story': this._renderStory(data); break;
                case 'gameplay': this._renderGameplay(data); break;
                case 'results': this._renderResults(data); break;
                case 'shop': this._renderShop(); break;
                case 'stats': this._renderStats(); break;
            }
            this.app.classList.remove('screen-transition');
        }, 300);
    },

    //  TITLE SCREEN
    _renderTitle() {
        const hasSave = StorageManager.hasSave();
        this.app.innerHTML = `
        <div class="screen title-screen">
            <div class="title-bg-effects">
                <div class="floating-symbols">${this._mathSymbols()}</div>
            </div>
            <div class="title-content">
                <div class="crystal-icon">
                    <img src="/static/assets/crystal.png" alt="Crystal" class="crystal-img pulse-glow" />
                </div>
                <h1 class="game-title">
                    <span class="title-math">Math</span><span class="title-quest">Quest</span>
                </h1>
                <p class="game-subtitle">The Lost Kingdom of Numbers</p>
                <div class="title-buttons">
                    ${hasSave ? `<button class="btn btn-primary btn-lg" id="btn-continue">⚔️ Continue Adventure</button>` : ''}
                    <button class="btn ${hasSave ? 'btn-secondary' : 'btn-primary btn-lg'}" id="btn-new-game">🌟 New Adventure</button>
                </div>
                <p class="title-hint">Recover the Crystal fragments. Save Numeria!</p>
            </div>
        </div>`;
        if (hasSave) {
            document.getElementById('btn-continue').addEventListener('click', async () => {
                GameEngine.init();
                // Try to reload from server
                if (GameEngine.state.playerId) {
                    const serverState = await StorageManager.loadPlayer(GameEngine.state.playerId);
                    if (serverState) GameEngine.state = serverState;
                }
                this.showScreen('menu');
            });
        }
        document.getElementById('btn-new-game').addEventListener('click', () => {
            if (hasSave && !confirm('Start a new game? Current progress will be lost!')) return;
            StorageManager.deleteSave();
            const state = GameEngine.init();
            this._showNameEntry();
        });
    },

    _showNameEntry() {
        this.app.innerHTML = `
        <div class="screen name-screen">
            <div class="card glass-card name-card">
                <h2>🧭 Welcome, Explorer!</h2>
                <p>What shall we call you?</p>
                <input type="text" id="player-name-input" class="text-input" placeholder="Enter your name..." maxlength="20" autofocus />
                <button class="btn btn-primary" id="btn-start">Begin Your Quest! 🚀</button>
            </div>
        </div>`;
        const startGame = async () => {
            const name = document.getElementById('player-name-input').value.trim() || 'Explorer';
            // Create player on Flask backend
            const state = await StorageManager.createPlayer(name);
            GameEngine.state = state;
            this.showScreen('menu');
        };
        document.getElementById('btn-start').addEventListener('click', startGame);
        document.getElementById('player-name-input').addEventListener('keydown', e => { if (e.key === 'Enter') startGame(); });
    },

    // MAIN MENU
    _renderMainMenu() {
        const s = GameEngine.state;
        const char = GameData.characters.find(c => c.id === s.selectedCharacter);
        this.app.innerHTML = `
        <div class="screen menu-screen">
            <div class="menu-header">
                <div class="player-info glass-card">
                    <span class="player-avatar">${char?.emoji || '🧭'}</span>
                    <div>
                        <h3>${s.playerName}</h3>
                        <div class="stat-row">
                            <span>⭐ ${s.totalStars}</span>
                            <span>🪙 ${s.totalCoins}</span>
                            <span>💎 ${s.crystalFragments}/9</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="menu-grid">
                <button class="menu-card glass-card" id="btn-adventure">
                    <span class="menu-icon">🗺️</span>
                    <h3>Adventure</h3>
                    <p>Continue your quest</p>
                </button>
                <button class="menu-card glass-card" id="btn-worldmap">
                    <span class="menu-icon">🌍</span>
                    <h3>World Map</h3>
                    <p>Choose a world</p>
                </button>
                <button class="menu-card glass-card" id="btn-shop">
                    <span class="menu-icon">🛒</span>
                    <h3>Shop</h3>
                    <p>Unlock characters</p>
                </button>
                <button class="menu-card glass-card" id="btn-stats">
                    <span class="menu-icon">📊</span>
                    <h3>Stats</h3>
                    <p>Your progress</p>
                </button>
            </div>
        </div>`;
        document.getElementById('btn-adventure').addEventListener('click', () => {
            const next = GameEngine.getNextUnlockedLevel();
            this.showScreen('story', { levelNum: next });
        });
        document.getElementById('btn-worldmap').addEventListener('click', () => this.showScreen('worldmap'));
        document.getElementById('btn-shop').addEventListener('click', () => this.showScreen('shop'));
        document.getElementById('btn-stats').addEventListener('click', () => this.showScreen('stats'));
    },

    // WORLD MAP
    _renderWorldMap() {
        const s = GameEngine.state;
        let worldCards = GameData.worlds.map(w => {
            const unlocked = s.worldsUnlocked.includes(w.id);
            const progress = StorageManager.getWorldProgress(s, w.id);
            const defeated = s.bossesDefeated.includes(w.id);
            return `
            <button class="world-card glass-card ${unlocked ? '' : 'locked'} ${defeated ? 'completed' : ''}"
                    data-world="${w.id}" style="--world-color: ${w.color}; --world-gradient: ${w.gradient}">
                <h3>${w.name}</h3>
                <p>${unlocked ? w.description : '🔒 Complete previous world'}</p>
                ${unlocked ? `<div class="progress-bar"><div class="progress-fill" style="width:${progress.percentage}%"></div></div>
                <span class="progress-label">${progress.completed}/${progress.total} levels</span>` : ''}
                ${defeated ? '<div class="world-badge">💎 Complete</div>' : ''}
            </button>`;
        }).join('');

        this.app.innerHTML = `
        <div class="screen worldmap-screen">
            <div class="screen-header">
                <button class="btn btn-icon" id="btn-back-menu">← Back</button>
                <h2>🗺️ World Map</h2>
                <div class="header-stats">⭐ ${s.totalStars} | 🪙 ${s.totalCoins}</div>
            </div>
            <div class="world-path">
                <img src="/static/assets/world_map.png" alt="World Map" class="worldmap-bg" />
            </div>
            <div class="worlds-grid">${worldCards}</div>
        </div>`;
        document.getElementById('btn-back-menu').addEventListener('click', () => this.showScreen('menu'));
        document.querySelectorAll('.world-card:not(.locked)').forEach(btn => {
            btn.addEventListener('click', () => this.showScreen('levels', { worldId: parseInt(btn.dataset.world) }));
        });
    },

    //  LEVEL SELECT 
    _renderLevelSelect(data) {
        const world = GameData.worlds.find(w => w.id === data.worldId);
        const s = GameEngine.state;
        let levels = '';
        for (let i = world.levelStart; i <= world.levelEnd; i++) {
            const completed = s.levelsCompleted[i];
            const unlocked = GameEngine.isLevelUnlocked(i);
            const isBoss = i === world.bossLevel;
            const stars = completed ? '⭐'.repeat(completed.stars) + '☆'.repeat(3 - completed.stars) : '☆☆☆';
            levels += `
            <button class="level-btn ${unlocked ? '' : 'locked'} ${isBoss ? 'boss-level' : ''} ${completed ? 'completed' : ''}"
                    data-level="${i}" ${unlocked ? '' : 'disabled'}>
                <span class="level-num">${isBoss ? '⚔️' : i}</span>
                <span class="level-stars">${unlocked ? stars : '🔒'}</span>
            </button>`;
        }
        this.app.innerHTML = `
        <div class="screen levels-screen" style="--world-gradient: ${world.gradient}">
            <div class="screen-header">
                <button class="btn btn-icon" id="btn-back-worlds">← Back</button>
                <h2>${world.name}</h2>
                <div></div>
            </div>
            <p class="world-story">${world.story}</p>
            <div class="levels-grid">${levels}</div>
        </div>`;
        document.getElementById('btn-back-worlds').addEventListener('click', () => this.showScreen('worldmap'));
        document.querySelectorAll('.level-btn:not(.locked)').forEach(btn => {
            btn.addEventListener('click', () => this.showScreen('story', { levelNum: parseInt(btn.dataset.level) }));
        });
    },

    // STORY INTRO 
    async _renderStory(data) {
        const world = GameData.getWorld(data.levelNum);
        const isBoss = data.levelNum === world.bossLevel;
        const char = GameData.characters.find(c => c.id === GameEngine.state.selectedCharacter);
        // Use client-side data for the preview, server generates on start
        const previewData = QuestionGenerator.generate(data.levelNum);
        this.app.innerHTML = `
        <div class="screen story-screen" style="--world-gradient: ${world.gradient}">
            <div class="story-card glass-card">
                ${isBoss ? `<img src="/static/assets/lord_chaos.png" alt="Boss" class="story-img boss-img shake" />` :
                    `<img src="/static/assets/explorer.png" alt="Explorer" class="story-img" />`}
                <h2>${GameData.getLevelName(data.levelNum)}</h2>
                <div class="story-text typewriter" id="story-text">${previewData.storyIntro}</div>
                <div class="story-info">
                    <span>📝 ${previewData.questions.length} Questions</span>
                    <span>⏱️ ${previewData.timeLimit}s</span>
                    <span>💡 ${GameEngine.state.hintsRemaining} Hints</span>
                </div>
                <button class="btn btn-primary btn-lg" id="btn-start-level">
                    ${isBoss ? '⚔️ Fight Boss!' : '🚀 Start Level!'}
                </button>
                <button class="btn btn-secondary" id="btn-back-from-story">← Back</button>
            </div>
        </div>`;
        document.getElementById('btn-start-level').addEventListener('click', async () => {
            // Fetch questions from Flask backend
            await GameEngine.startLevel(data.levelNum);
            this.showScreen('gameplay', { levelNum: data.levelNum });
        });
        document.getElementById('btn-back-from-story').addEventListener('click', () => {
            const w = GameData.getWorld(data.levelNum);
            this.showScreen('levels', { worldId: w.id });
        });
    },

    // GAMEPLAY 
    _renderGameplay(data) {
        const level = GameEngine.currentLevel;
        const world = GameData.getWorld(data.levelNum);
        this.app.innerHTML = `
        <div class="screen gameplay-screen" style="--world-gradient: ${world.gradient}">
            <div class="game-hud">
                <div class="hud-left">
                    <span id="hud-progress">Q ${GameEngine.currentQuestionIndex + 1}/${level.questions.length}</span>
                    <span id="hud-streak" class="streak-badge" style="display:none">🔥 0</span>
                </div>
                <div class="hud-center">
                    <div class="timer-ring" id="timer-ring">
                        <span id="hud-timer">${GameEngine.timeRemaining}</span>
                    </div>
                </div>
                <div class="hud-right">
                    <button class="btn btn-hint" id="btn-hint" title="Use Hint">💡 ${GameEngine.state.hintsRemaining}</button>
                </div>
            </div>
            <div class="question-area" id="question-area"></div>
            <div id="feedback-overlay" class="feedback-overlay" style="display:none"></div>
        </div>`;

        GameEngine.onTick = (t) => {
            const el = document.getElementById('hud-timer');
            if (el) {
                el.textContent = t;
                if (t <= 10) el.classList.add('timer-warning');
            }
        };
        GameEngine.onComplete = async () => {
            const results = await GameEngine.completeLevelResults();
            this.showScreen('results', results);
        };

        document.getElementById('btn-hint').addEventListener('click', async () => {
            const hint = await GameEngine.useHint();
            if (hint) {
                this._showHintPopup(hint);
                document.getElementById('btn-hint').textContent = `💡 ${GameEngine.state.hintsRemaining}`;
            }
        });

        this._renderQuestion();
    },

    _renderQuestion() {
        const q = GameEngine.getCurrentQuestion();
        if (!q) return;
        const area = document.getElementById('question-area');
        if (!area) return;
        const progress = GameEngine.currentQuestionIndex + 1;
        const total = GameEngine.currentLevel.questions.length;
        document.getElementById('hud-progress').textContent = `Q ${progress}/${total}`;

        area.innerHTML = `
        <div class="question-card glass-card slide-in">
            <div class="question-type">${q.type}</div>
            <h2 class="question-text">${q.question}</h2>
            <div class="options-grid">
                ${q.options.map((opt, i) => `
                    <button class="option-btn" data-answer="${opt}" data-index="${i}">
                        <span class="option-letter">${'ABCD'[i]}</span>
                        <span class="option-text">${opt}</span>
                    </button>
                `).join('')}
            </div>
        </div>`;

        area.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => this._handleAnswer(btn, q));
        });
    },

    _handleAnswer(btn, q) {
        const allBtns = document.querySelectorAll('.option-btn');
        allBtns.forEach(b => b.disabled = true);

        const result = GameEngine.submitAnswer(btn.dataset.answer);
        if (!result) return;

        // Highlight correct/wrong
        allBtns.forEach(b => {
            if (b.dataset.answer === q.answer) b.classList.add('correct');
            else if (b === btn && !result.correct) b.classList.add('wrong');
        });

        // Streak display
        if (result.streak > 1) {
            const streakEl = document.getElementById('hud-streak');
            if (streakEl) { streakEl.style.display = 'inline'; streakEl.textContent = `🔥 ${result.streak}`; }
        }

        // Show feedback
        this._showFeedback(result.correct, result.hint);

        setTimeout(async () => {
            if (result.isLast) {
                const results = await GameEngine.completeLevelResults();
                this.showScreen('results', results);
            } else {
                this._renderQuestion();
            }
        }, result.correct ? 1200 : 2500);
    },

    _showFeedback(correct, hint) {
        const overlay = document.getElementById('feedback-overlay');
        if (!overlay) return;
        overlay.style.display = 'flex';
        overlay.className = `feedback-overlay ${correct ? 'feedback-correct' : 'feedback-wrong'}`;
        overlay.innerHTML = correct
            ? `<div class="feedback-content"><span class="feedback-icon">✅</span><p>${this._randomPraise()}</p></div>`
            : `<div class="feedback-content"><span class="feedback-icon">❌</span><p>Not quite!</p>${hint ? `<p class="feedback-hint">💡 ${hint}</p>` : ''}</div>`;
        setTimeout(() => { overlay.style.display = 'none'; }, correct ? 1000 : 2200);
    },

    _showHintPopup(hint) {
        const overlay = document.getElementById('feedback-overlay');
        if (!overlay) return;
        overlay.style.display = 'flex';
        overlay.className = 'feedback-overlay feedback-hint-popup';
        overlay.innerHTML = `<div class="feedback-content"><span class="feedback-icon">💡</span><p>${hint}</p></div>`;
        setTimeout(() => { overlay.style.display = 'none'; }, 3000);
        
        // Eliminate up to half of the wrong options
        const q = GameEngine.getCurrentQuestion();
        if (q) {
            const btns = Array.from(document.querySelectorAll('.option-btn:not([disabled])'));
            const wrongBtns = btns.filter(b => b.dataset.answer !== q.answer);
            
            // Randomly pick up to 2 wrong options to eliminate
            const eliminateCount = Math.min(2, Math.max(1, wrongBtns.length - 1)); 
            
            // Shuffle wrong buttons to pick random ones to eliminate
            const shuffled = wrongBtns.sort(() => 0.5 - Math.random());
            for (let i = 0; i < eliminateCount; i++) {
                if (shuffled[i]) {
                    shuffled[i].disabled = true;
                    shuffled[i].style.opacity = '0.3';
                    shuffled[i].style.textDecoration = 'line-through';
                }
            }
        }
    },

    // RESULTS 
    _renderResults(data) {
        const starsHTML = '⭐'.repeat(data.stars) + '☆'.repeat(3 - data.stars);
        const percentage = Math.round(data.accuracy * 100);
        this.app.innerHTML = `
        <div class="screen results-screen">
            <div class="results-card glass-card">
                ${data.bossDefeated ? `<div class="boss-defeated">⚔️ BOSS DEFEATED! 💎 Crystal Fragment Obtained!</div>` : ''}
                <h2>${data.stars >= 1 ? '🎉 Level Complete!' : '😔 Try Again!'}</h2>
                <div class="results-stars">${starsHTML}</div>
                <div class="results-stats">
                    <div class="result-stat"><span class="stat-label">Correct</span><span class="stat-value">${data.correctCount}/${data.totalQ}</span></div>
                    <div class="result-stat"><span class="stat-label">Accuracy</span><span class="stat-value">${percentage}%</span></div>
                    <div class="result-stat"><span class="stat-label">Time</span><span class="stat-value">${data.timeUsed}s</span></div>
                    <div class="result-stat"><span class="stat-label">Coins</span><span class="stat-value">🪙 +${data.coins}</span></div>
                </div>
                <div class="results-review">
                    <h3>📝 Review</h3>
                    ${data.answers.map((a, i) => `
                        <div class="review-item ${a.correct ? 'review-correct' : 'review-wrong'}">
                            <span>${a.correct ? '✅' : '❌'} Q${i + 1}: ${a.question.question}</span>
                            ${!a.correct ? `<span class="review-answer">Answer: ${a.question.answer}</span>` : ''}
                        </div>
                    `).join('')}
                </div>
                <div class="results-buttons">
                    ${data.stars < 3 ? `<button class="btn btn-primary" id="btn-retry">🔄 Retry</button>` : ''}
                    ${data.stars >= 1 ? `<button class="btn btn-primary" id="btn-next">▶️ Next Level</button>` : ''}
                    <button class="btn btn-secondary" id="btn-to-menu">🏠 Menu</button>
                </div>
            </div>
        </div>`;
        document.getElementById('btn-retry')?.addEventListener('click', () => {
            const lv = GameEngine.currentLevel.levelNum;
            this.showScreen('story', { levelNum: lv });
        });
        document.getElementById('btn-next')?.addEventListener('click', () => {
            const next = GameEngine.currentLevel.levelNum + 1;
            if (next <= 45) this.showScreen('story', { levelNum: next });
            else this.showScreen('menu');
        });
        document.getElementById('btn-to-menu').addEventListener('click', () => this.showScreen('menu'));
    },

    // SHOP 
    _renderShop() {
        const s = GameEngine.state;
        const chars = GameData.characters.map(c => {
            const owned = s.unlockedCharacters.includes(c.id);
            const selected = s.selectedCharacter === c.id;
            const canAfford = s.totalCoins >= c.cost;
            return `
            <div class="shop-item glass-card ${selected ? 'selected' : ''}">
                <span class="shop-emoji">${c.emoji}</span>
                <h3>${c.name}</h3>
                ${owned ? (selected ? '<span class="badge">✅ Active</span>'
                    : `<button class="btn btn-sm btn-primary" data-select="${c.id}">Select</button>`)
                    : `<button class="btn btn-sm ${canAfford ? 'btn-primary' : 'btn-disabled'}" 
                        data-buy="${c.id}" ${canAfford ? '' : 'disabled'}>🪙 ${c.cost}</button>`}
            </div>`;
        }).join('');

        this.app.innerHTML = `
        <div class="screen shop-screen">
            <div class="screen-header">
                <button class="btn btn-icon" id="btn-back-shop">← Back</button>
                <h2>🛒 Character Shop</h2>
                <div class="header-stats">🪙 ${s.totalCoins}</div>
            </div>
            <div class="shop-grid">${chars}</div>
        </div>`;
        document.getElementById('btn-back-shop').addEventListener('click', () => this.showScreen('menu'));
        document.querySelectorAll('[data-buy]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const success = await GameEngine.unlockCharacter(btn.dataset.buy);
                if (success) this._renderShop();
            });
        });
        document.querySelectorAll('[data-select]').forEach(btn => {
            btn.addEventListener('click', async () => {
                await GameEngine.selectCharacter(btn.dataset.select);
                this._renderShop();
            });
        });
    },

    // STATS 
    _renderStats() {
        const s = GameEngine.state;
        const acc = s.stats.totalQuestionsAnswered > 0 ? Math.round((s.stats.correctAnswers / s.stats.totalQuestionsAnswered) * 100) : 0;
        const completedLevels = Object.keys(s.levelsCompleted).length;
        this.app.innerHTML = `
        <div class="screen stats-screen">
            <div class="screen-header">
                <button class="btn btn-icon" id="btn-back-stats">← Back</button>
                <h2>📊 Your Stats</h2>
                <div></div>
            </div>
            <div class="stats-grid">
                <div class="stat-card glass-card"><span class="stat-big">⭐ ${s.totalStars}</span><span>Total Stars</span></div>
                <div class="stat-card glass-card"><span class="stat-big">🪙 ${s.totalCoins}</span><span>Total Coins</span></div>
                <div class="stat-card glass-card"><span class="stat-big">📝 ${completedLevels}/45</span><span>Levels Done</span></div>
                <div class="stat-card glass-card"><span class="stat-big">💎 ${s.crystalFragments}/9</span><span>Fragments</span></div>
                <div class="stat-card glass-card"><span class="stat-big">🎯 ${acc}%</span><span>Accuracy</span></div>
                <div class="stat-card glass-card"><span class="stat-big">🔥 ${s.stats.longestStreak}</span><span>Best Streak</span></div>
            </div>
            <h3 class="section-title">World Progress</h3>
            <div class="world-progress-list">
                ${GameData.worlds.map(w => {
                    const p = StorageManager.getWorldProgress(s, w.id);
                    return `<div class="world-progress-item glass-card">
                        <span>${w.name}</span>
                        <div class="progress-bar"><div class="progress-fill" style="width:${p.percentage}%;background:${w.gradient}"></div></div>
                        <span>${p.percentage}%</span>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
        document.getElementById('btn-back-stats').addEventListener('click', () => this.showScreen('menu'));
    },

    // HELPERS 
    _mathSymbols() {
        const syms = ['+', '−', '×', '÷', '=', 'π', '√', 'Σ', '∞', 'θ', 'Δ', '%', '∫', '≈'];
        return Array.from({ length: 30 }, () => {
            const s = syms[Math.floor(Math.random() * syms.length)];
            return `<span class="float-sym" style="left:${Math.random()*100}%;animation-delay:${Math.random()*10}s;font-size:${1+Math.random()*2}rem">${s}</span>`;
        }).join('');
    },

    _randomPraise() {
        const p = ['Excellent! 🎉', 'Brilliant! ✨', 'You got it! 🌟', 'Amazing! 🔥', 'Perfect! 💎',
            'Math genius! 🧠', 'Awesome! 🚀', 'Well done! 👏', 'Superb! 💥', 'Keep it up! 🎯'];
        return p[Math.floor(Math.random() * p.length)];
    },

    _addParticles() {
        const c = document.createElement('div');
        c.className = 'particles';
        c.innerHTML = Array.from({ length: 20 }, () =>
            `<div class="particle" style="left:${Math.random()*100}%;animation-duration:${3+Math.random()*7}s;animation-delay:${Math.random()*5}s"></div>`
        ).join('');
        document.body.appendChild(c);
    }
};

window.UI = UI;
