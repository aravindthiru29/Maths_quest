// MathQuest: Game Engine
// Core game mechanics, scoring, progression

const GameEngine = {
    state: null,
    currentLevel: null,
    currentQuestionIndex: 0,
    answers: [],
    timer: null,
    timeRemaining: 0,
    streak: 0,
    hintsUsedThisLevel: 0,
    onTick: null,
    onComplete: null,

    init() {
        this.state = StorageManager.load();
        return this.state;
    },

    async startLevel(levelNum) {
        // Fetch questions from Flask backend
        const levelData = await StorageManager.generateQuestions(levelNum);
        if (!levelData) {
            // Fallback to client-side generation
            const fallback = QuestionGenerator.generate(levelNum);
            if (!fallback) return null;
            this.currentLevel = fallback;
        } else {
            this.currentLevel = levelData;
        }
        this.currentQuestionIndex = 0;
        this.answers = [];
        this.timeRemaining = this.currentLevel.timeLimit;
        this.streak = 0;
        this.hintsUsedThisLevel = 0;
        this._startTimer();
        return this.currentLevel;
    },

    getCurrentQuestion() {
        if (!this.currentLevel) return null;
        return this.currentLevel.questions[this.currentQuestionIndex] || null;
    },

    submitAnswer(selectedAnswer) {
        const q = this.getCurrentQuestion();
        if (!q) return null;
        const correct = selectedAnswer.toString().trim() === q.answer.toString().trim();
        if (correct) {
            this.streak++;
            this.state.stats.currentStreak++;
            if (this.state.stats.currentStreak > this.state.stats.longestStreak) {
                this.state.stats.longestStreak = this.state.stats.currentStreak;
            }
        } else {
            this.streak = 0;
            this.state.stats.currentStreak = 0;
        }
        this.state.stats.totalQuestionsAnswered++;
        if (correct) this.state.stats.correctAnswers++;
        this.answers.push({ question: q, selectedAnswer, correct, timeSpent: 0 });
        this.currentQuestionIndex++;
        const isLast = this.currentQuestionIndex >= this.currentLevel.questions.length;
        if (isLast) this._stopTimer();
        return { correct, isLast, streak: this.streak, hint: correct ? null : q.hint };
    },

    async useHint() {
        if (this.state.hintsRemaining <= 0) return null;
        const q = this.getCurrentQuestion();
        if (!q) return null;
        await StorageManager.useHint(this.state);
        this.hintsUsedThisLevel++;
        return q.hint;
    },

    async completeLevelResults() {
        if (!this.currentLevel) return null;
        const totalQ = this.currentLevel.questions.length;
        const correctCount = this.answers.filter(a => a.correct).length;
        const accuracy = correctCount / totalQ;
        const timeUsed = this.currentLevel.timeLimit - this.timeRemaining;

        // Star calculation
        let stars = 0;
        if (accuracy >= 0.4) stars = 1;
        if (accuracy >= 0.7) stars = 2;
        if (accuracy >= 0.9 && this.hintsUsedThisLevel <= 1) stars = 3;

        // Coin rewards
        let coins = correctCount * 10;
        if (stars === 3) coins += 50;
        if (this.currentLevel.isBoss) coins *= 2;
        coins += Math.max(0, this.streak * 5);

        const levelNum = this.currentLevel.levelNum;
        const world = GameData.getWorld(levelNum);
        const isBoss = this.currentLevel.isBoss;
        const bossDefeated = isBoss && stars >= 1;

        // Sync with server via API
        await StorageManager.completeLevel(
            this.state, levelNum, stars, coins, timeUsed, isBoss, bossDefeated
        );

        // Also update local state for immediate UI feedback
        this.state.totalCoins += coins;
        if (stars >= 1) {
            const nextLevel = levelNum + 1;
            if (nextLevel <= 45) {
                const nextWorld = GameData.getWorld(nextLevel);
                if (nextWorld && !this.state.worldsUnlocked.includes(nextWorld.id)) {
                    this.state.worldsUnlocked.push(nextWorld.id);
                }
            }
            if (bossDefeated && !this.state.bossesDefeated.includes(world.id)) {
                this.state.bossesDefeated.push(world.id);
                this.state.crystalFragments++;
            }
        }
        this.state.totalStars = StorageManager.getTotalStars(this.state);
        StorageManager.save(this.state);

        return {
            stars, coins, correctCount, totalQ, accuracy, timeUsed,
            isBoss, bossDefeated,
            worldName: world?.name,
            answers: this.answers
        };
    },

    async unlockCharacter(charId) {
        const char = GameData.characters.find(c => c.id === charId);
        if (!char || this.state.unlockedCharacters.includes(charId)) return false;
        if (this.state.totalCoins < char.cost) return false;
        const success = await StorageManager.unlockCharacter(this.state, charId);
        return success;
    },

    async selectCharacter(charId) {
        if (!this.state.unlockedCharacters.includes(charId)) return false;
        await StorageManager.selectCharacter(this.state, charId);
        this.state.selectedCharacter = charId;
        return true;
    },

    getNextUnlockedLevel() {
        for (let i = 1; i <= 45; i++) {
            if (!this.state.levelsCompleted[i]) return i;
        }
        return 45;
    },

    isLevelUnlocked(levelNum) {
        if (levelNum === 1) return true;
        
        // Also unlock if it's the first level of its world and the world is unlocked
        const world = GameData.getWorld(levelNum);
        if (world && world.levelStart === levelNum && this.state.worldsUnlocked.includes(world.id)) {
            return true;
        }

        return !!this.state.levelsCompleted[levelNum - 1];
    },

    _startTimer() {
        this._stopTimer();
        this.timer = setInterval(() => {
            this.timeRemaining--;
            if (this.onTick) this.onTick(this.timeRemaining);
            if (this.timeRemaining <= 0) {
                this._stopTimer();
                if (this.onComplete) this.onComplete();
            }
        }, 1000);
    },

    _stopTimer() {
        if (this.timer) { clearInterval(this.timer); this.timer = null; }
    }
};

window.GameEngine = GameEngine;
