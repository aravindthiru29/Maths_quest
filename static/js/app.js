// MathQuest: App Entry Point

document.addEventListener('DOMContentLoaded', () => {
    GameEngine.init();
    SoundManager.init();
    UI.init();
    UI.showScreen('title');
});
