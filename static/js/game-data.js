// MathQuest: Game Data - World & Level Definitionss

const GameData = {
    worlds: [
        {
            id: 1, name: 'Arithmetic Village', levelStart: 1, levelEnd: 5,
            color: '#2ecc71', gradient: 'linear-gradient(135deg, #2ecc71, #f1c40f)',
            description: 'Master addition and subtraction to rebuild the village!',
            story: 'The villagers have lost count of everything! Help them restore order with your arithmetic skills.',
            bossName: 'The Number Goblin', bossLevel: 5
        },
        {
            id: 2, name: 'Multiplication Village', levelStart: 6, levelEnd: 10,
            color: '#3498db', gradient: 'linear-gradient(135deg, #3498db, #8e44ad)',
            description: 'Conquer the village with multiplication and division!',
            story: 'The village bridges are broken. Only multiplication can rebuild them!',
            bossName: 'The Factor Beast', bossLevel: 10
        },
        {
            id: 3, name: 'Fraction Village', levelStart: 11, levelEnd: 15,
            color: '#9b59b6', gradient: 'linear-gradient(135deg, #9b59b6, #e91e63)',
            description: 'Unite the Fraction Village with equal parts!',
            story: 'The village is divided! Use fractions to bring the pieces together.',
            bossName: 'The Slice Sorcerer', bossLevel: 15
        },
        {
            id: 4, name: 'Algebra Village', levelStart: 16, levelEnd: 20,
            color: '#e67e22', gradient: 'linear-gradient(135deg, #e67e22, #e74c3c)',
            description: 'Decode the mysteries of variables and equations!',
            story: 'The village runs on equations, but the variables have gone missing!',
            bossName: 'The Unknown X', bossLevel: 20
        },
        {
            id: 5, name: 'Geometry Village', levelStart: 21, levelEnd: 25,
            color: '#1abc9c', gradient: 'linear-gradient(135deg, #1abc9c, #2ecc71)',
            description: 'Navigate shapes and angles in the wild village!',
            story: 'The village paths form mysterious shapes. Decode them to find your way!',
            bossName: 'The Shape Shifter', bossLevel: 25
        },
        {
            id: 6, name: 'Coordinate Village', levelStart: 26, levelEnd: 30,
            color: '#2c3e50', gradient: 'linear-gradient(135deg, #2c3e50, #3498db)',
            description: 'Plot your course through the village!',
            story: 'The village maps are scrambled! Use coordinates to navigate the village.',
            bossName: 'The Void Navigator', bossLevel: 30
        },
        {
            id: 7, name: 'Trigonometry Village', levelStart: 31, levelEnd: 35,
            color: '#c0392b', gradient: 'linear-gradient(135deg, #c0392b, #f39c12)',
            description: 'Unlock the village secrets using angles and ratios!',
            story: 'Each part of the village is locked with trigonometric puzzles!',
            bossName: 'The Angle Demon', bossLevel: 35
        },
        {
            id: 8, name: 'Probability Village', levelStart: 36, levelEnd: 40,
            color: '#00bcd4', gradient: 'linear-gradient(135deg, #00bcd4, #7c4dff)',
            description: 'Predict the unpredictable in the probability village!',
            story: 'The village experiments are out of control! Use probability to restore order.',
            bossName: 'Dr. Random', bossLevel: 40
        },
        {
            id: 9, name: 'Chaos Village', levelStart: 41, levelEnd: 45,
            color: '#4a0e4e', gradient: 'linear-gradient(135deg, #4a0e4e, #c0392b)',
            description: 'Face Lord Chaos and restore the village of Knowledge!',
            story: 'The final battle awaits in the Chaos Village. All your math skills will be tested!',
            bossName: 'Lord Chaos', bossLevel: 45
        }
    ],

    characters: [
        { id: 'explorer', name: 'Math Explorer', emoji: '🧭', cost: 0 },
        { id: 'wizard', name: 'Number Wizard', emoji: '🧙', cost: 500 },
        { id: 'knight', name: 'Equation Knight', emoji: '⚔️', cost: 1000 },
        { id: 'fairy', name: 'Geometry Fairy', emoji: '🧚', cost: 1500 },
        { id: 'robot', name: 'Calc-Bot', emoji: '🤖', cost: 2500 },
        { id: 'dragon', name: 'Data Dragon', emoji: '🐉', cost: 5000 }
    ],

    getWorld(levelNum) {
        return this.worlds.find(w => levelNum >= w.levelStart && levelNum <= w.levelEnd);
    },

    getLevelName(levelNum) {
        const world = this.getWorld(levelNum);
        if (!world) return `Level ${levelNum}`;
        const localLevel = levelNum - world.levelStart + 1;
        if (levelNum === world.bossLevel) return `⚔️ BOSS: ${world.bossName}`;
        return `${world.name} - Stage ${localLevel}`;
    }
};

window.GameData = GameData;
