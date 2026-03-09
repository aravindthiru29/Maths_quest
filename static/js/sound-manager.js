/**
 * MathQuest: Sound Manager
 * Handles all audio effects and background music
 */

const SoundManager = {
    sounds: {},
    music: null,
    isMuted: false,
    isMusicMuted: false,

    // High-quality sound effects from Mixkit
    SFX: {
        BUTTON_CLICK: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
        CORRECT: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
        WRONG: 'https://assets.mixkit.co/active_storage/sfx/2015/2015-preview.mp3',
        LEVEL_COMPLETE: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
        BOSS_DEFEAT: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Reuse for now
        TICK: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
        HINT: 'https://assets.mixkit.co/active_storage/sfx/2281/2281-preview.mp3'
    },

    // Ambient loopable music
    MUSIC_URL: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3', // More ambient-ish

    init() {
        // Initialize settings from Storage
        const state = window.GameEngine?.state || window.StorageManager?.load();
        if (state && state.settings) {
            this.isMuted = !state.settings.soundEnabled;
            this.isMusicMuted = !state.settings.musicEnabled;
        }

        // Preload sounds
        for (const [key, url] of Object.entries(this.SFX)) {
            const audio = new Audio(url);
            audio.preload = 'auto';
            audio.volume = 0.4;
            this.sounds[key] = audio;
        }

        // Initialize music
        this.music = new Audio(this.MUSIC_URL);
        this.music.loop = true;
        this.music.volume = 0.2;

        // Auto-play music if enabled (browsers might block this until first interaction)
        if (!this.isMusicMuted) {
            document.addEventListener('click', () => {
                if (!this.isMusicMuted && this.music.paused) {
                    this.music.play().catch(e => console.log('Music autoplay blocked'));
                }
            }, { once: true });
        }
    },

    play(sfxKey) {
        if (this.isMuted) return;
        const sound = this.sounds[sfxKey];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log('SFX play error', e));
        }
    },

    toggleMute() {
        this.isMuted = !this.isMuted;
        this._updateSettings();
        return this.isMuted;
    },

    toggleMusic() {
        this.isMusicMuted = !this.isMusicMuted;
        if (this.isMusicMuted) {
            this.music.pause();
        } else {
            this.music.play().catch(e => console.log('Music play error'));
        }
        this._updateSettings();
        return this.isMusicMuted;
    },

    _updateSettings() {
        const state = window.GameEngine?.state;
        if (state) {
            state.settings.soundEnabled = !this.isMuted;
            state.settings.musicEnabled = !this.isMusicMuted;
            window.StorageManager?.save(state);
        }
    }
};

window.SoundManager = SoundManager;
