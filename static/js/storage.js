// MathQuest: Storage Manager (Flask API Version)
// Uses Flask REST API for persistence + localStorage as cache

const StorageManager = {
    CACHE_KEY: 'mathquest_cache',
    API_BASE: '/api',

    // ── API helpers ──
    async _fetch(url, options = {}) {
        try {
            const res = await fetch(this.API_BASE + url, {
                headers: { 'Content-Type': 'application/json' },
                ...options
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                console.error('API error:', err);
                return null;
            }
            return await res.json();
        } catch (e) {
            console.error('Network error:', e);
            return null;
        }
    },

    async _post(url, body) {
        return this._fetch(url, { method: 'POST', body: JSON.stringify(body) });
    },

    async _put(url, body) {
        return this._fetch(url, { method: 'PUT', body: JSON.stringify(body) });
    },

    // ── Local cache (fallback + speed) ───────────
    _cacheState(state) {
        try {
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(state));
        } catch (e) { /* ignore */ }
    },

    _getCachedState() {
        try {
            const d = localStorage.getItem(this.CACHE_KEY);
            return d ? JSON.parse(d) : null;
        } catch (e) { return null; }
    },

    // ── Public API ───────────────────────────────
    getDefaultSave() {
        return {
            playerId: null,
            playerName: '',
            currentWorld: 1,
            currentLevel: 1,
            totalCoins: 0,
            totalStars: 0,
            unlockedCharacters: ['explorer'],
            selectedCharacter: 'explorer',
            hintsRemaining: 10,
            levelsCompleted: {},
            worldsUnlocked: [1],
            bossesDefeated: [],
            crystalFragments: 0,
            settings: { soundEnabled: true, musicEnabled: true, difficulty: 'normal' },
            stats: {
                totalQuestionsAnswered: 0,
                correctAnswers: 0,
                totalTimePlayed: 0,
                longestStreak: 0,
                currentStreak: 0
            },
            achievements: [],
            lastPlayed: null
        };
    },

    async createPlayer(name) {
        const data = await this._post('/players', { name });
        if (data) {
            const state = { ...this.getDefaultSave(), ...data };
            this._cacheState(state);
            return state;
        }
        // Offline fallback
        const state = this.getDefaultSave();
        state.playerName = name;
        this._cacheState(state);
        return state;
    },

    async loadPlayer(playerId) {
        const data = await this._fetch(`/players/${playerId}`);
        if (data) {
            const state = { ...this.getDefaultSave(), ...data };
            this._cacheState(state);
            return state;
        }
        return this._getCachedState() || this.getDefaultSave();
    },

    async save(gameState) {
        this._cacheState(gameState);
        if (gameState.playerId) {
            await this._put(`/players/${gameState.playerId}`, gameState);
        }
        return true;
    },

    hasSave() {
        return this._getCachedState()?.playerId != null;
    },

    load() {
        return this._getCachedState() || this.getDefaultSave();
    },

    deleteSave() {
        localStorage.removeItem(this.CACHE_KEY);
    },

    async completeLevel(gameState, levelNum, stars, coins, timeUsed, isBoss, bossDefeated) {
        // Update local cache
        const existing = gameState.levelsCompleted[levelNum];
        gameState.levelsCompleted[levelNum] = {
            stars: Math.max(existing?.stars || 0, stars),
            coins: Math.max(existing?.coins || 0, coins),
            bestTime: existing ? Math.min(existing.bestTime, timeUsed) : timeUsed,
            completedAt: new Date().toISOString()
        };
        this._cacheState(gameState);

        // Sync to server
        if (gameState.playerId) {
            const data = await this._post(`/players/${gameState.playerId}/complete`, {
                levelNum, stars, coins, timeUsed, isBoss, bossDefeated,
                stats: gameState.stats
            });
            if (data) {
                Object.assign(gameState, data);
                this._cacheState(gameState);
            }
        }
    },

    async useHint(gameState) {
        if (gameState.playerId) {
            const result = await this._post(`/players/${gameState.playerId}/hint`, {});
            if (result) {
                gameState.hintsRemaining = result.hintsRemaining;
                this._cacheState(gameState);
                return true;
            }
        }
        // Fallback
        gameState.hintsRemaining--;
        this._cacheState(gameState);
        return true;
    },

    async unlockCharacter(gameState, charId) {
        if (gameState.playerId) {
            const data = await this._post(`/players/${gameState.playerId}/unlock`, { characterId: charId });
            if (data) {
                Object.assign(gameState, data);
                this._cacheState(gameState);
                return true;
            }
            return false;
        }
        return false;
    },

    async selectCharacter(gameState, charId) {
        if (gameState.playerId) {
            const data = await this._post(`/players/${gameState.playerId}/select`, { characterId: charId });
            if (data) {
                Object.assign(gameState, data);
                this._cacheState(gameState);
                return true;
            }
        }
        return false;
    },

    async generateQuestions(levelNum) {
        const data = await this._post('/questions', { levelNum });
        return data;
    },

    getTotalStars(gameState) {
        return Object.values(gameState.levelsCompleted)
            .reduce((sum, l) => sum + (l.stars || 0), 0);
    },

    getWorldProgress(gameState, worldId) {
        const worldData = window.GameData?.worlds?.find(w => w.id === worldId);
        if (!worldData) return { completed: 0, total: 0, percentage: 0 };
        const total = worldData.levelEnd - worldData.levelStart + 1;
        let completed = 0;
        for (let i = worldData.levelStart; i <= worldData.levelEnd; i++) {
            if (gameState.levelsCompleted[i]) completed++;
        }
        return { completed, total, percentage: Math.round((completed / total) * 100) };
    }
};
