// MathQuest: Question Generator
// Procedurally generates math questions per world/level

const QuestionGenerator = {
    rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = this.rand(0, i); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; },

    generate(levelNum) {
        const world = GameData.getWorld(levelNum);
        if (!world) return null;
        const diff = this._difficulty(levelNum, world);
        const isBoss = levelNum === world.bossLevel;
        const count = isBoss ? 8 : 5;
        const questions = [];
        for (let i = 0; i < count; i++) {
            if (isBoss && world.id === 9 && i >= count - 3) {
                // Final boss: mixed from different worlds
                questions.push(this._makeQuestion(this.rand(1, 8), diff + 1));
            } else if (isBoss) {
                questions.push(this._makeQuestion(world.id, diff + 1));
            } else {
                questions.push(this._makeQuestion(world.id, diff));
            }
        }
        return {
            levelNum, worldId: world.id, isBoss, questions,
            timeLimit: isBoss ? 180 : 90,
            storyIntro: this._storyIntro(levelNum, world, isBoss)
        };
    },

    _difficulty(levelNum, world) {
        const pos = (levelNum - world.levelStart) / (world.levelEnd - world.levelStart);
        if (pos < 0.33) return 1;
        if (pos < 0.66) return 2;
        return 3;
    },

    _makeQuestion(worldId, diff) {
        const generators = {
            1: this._arithmetic, 2: this._multiplication, 3: this._fractions,
            4: this._algebra, 5: this._geometry, 6: this._coordinates,
            7: this._trigonometry, 8: this._probability
        };
        const gen = generators[worldId] || this._arithmetic;
        return gen.call(this, diff);
    },

    _arithmetic(diff) {
        const max = diff === 1 ? 20 : diff === 2 ? 100 : 500;
        const a = this.rand(1, max); const b = this.rand(1, max);
        const ops = diff >= 2 ? ['+', '-'] : ['+'];
        const op = ops[this.rand(0, ops.length - 1)];
        let answer, question, hint;
        if (op === '+') {
            answer = a + b; question = `${a} + ${b} = ?`;
            hint = `Try counting up from ${a} by ${b} more.`;
        } else {
            const big = Math.max(a, b); const small = Math.min(a, b);
            answer = big - small; question = `${big} - ${small} = ?`;
            hint = `Start at ${big} and count back ${small}.`;
        }
        return this._mcq(question, answer, hint, '🧮 Arithmetic Puzzle');
    },

    _multiplication(diff) {
        const max = diff === 1 ? 10 : diff === 2 ? 12 : 15;
        const a = this.rand(2, max); const b = this.rand(2, max);
        if (diff < 3 || this.rand(0, 1) === 0) {
            return this._mcq(`${a} × ${b} = ?`, a * b, `Think of ${a} groups of ${b}.`, '✖️ Multiplication');
        } else {
            const product = a * b;
            return this._mcq(`${product} ÷ ${a} = ?`, b, `How many groups of ${a} fit in ${product}?`, '➗ Division');
        }
    },

    _fractions(diff) {
        if (diff === 1) {
            const denom = [2, 4, 8][this.rand(0, 2)];
            const num = this.rand(1, denom - 1);
            const correctWord = num === 1 && denom === 2 ? 'one half' :
                num === 1 && denom === 4 ? 'one quarter' : `${num}/${denom}`;
            return this._mcq(`What fraction is ${num} out of ${denom} equal parts?`,
                `${num}/${denom}`, `If something is split into ${denom} equal parts, and you have ${num}...`,
                '🍕 Fraction Identification', true);
        } else if (diff === 2) {
            const d = [2, 3, 4, 6][this.rand(0, 3)];
            const n = this.rand(1, d - 1);
            const m = this.rand(2, 4);
            const equivN = n * m; const equivD = d * m;
            return this._mcq(`Which fraction is equivalent to ${n}/${d}?`,
                `${equivN}/${equivD}`, `Multiply both top and bottom by the same number.`,
                '⚖️ Equivalent Fractions', true);
        } else {
            const d = [4, 5, 8, 10][this.rand(0, 3)];
            const n = this.rand(1, d);
            const decimal = (n / d).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
            return this._mcq(`Convert ${n}/${d} to a decimal.`,
                decimal, `Divide ${n} by ${d}.`, '🔢 Decimal Conversion', true);
        }
    },

    _algebra(diff) {
        if (diff === 1) {
            const x = this.rand(1, 15); const b = this.rand(1, 20);
            const sum = x + b;
            return this._mcq(`Solve: x + ${b} = ${sum}`, x,
                `What number plus ${b} equals ${sum}?`, '🔤 Solve for x');
        } else if (diff === 2) {
            const x = this.rand(1, 10); const a = this.rand(2, 5);
            const product = a * x;
            return this._mcq(`Solve: ${a}x = ${product}`, x,
                `Divide both sides by ${a}.`, '🔤 Equation Solving');
        } else {
            const x = this.rand(1, 8); const a = this.rand(2, 5); const b = this.rand(1, 10);
            const result = a * x + b;
            return this._mcq(`Solve: ${a}x + ${b} = ${result}`, x,
                `First subtract ${b}, then divide by ${a}.`, '🔤 Two-Step Equation');
        }
    },

    _geometry(diff) {
        if (diff === 1) {
            const shapes = [
                { name: 'Triangle', sides: 3 }, { name: 'Square', sides: 4 },
                { name: 'Pentagon', sides: 5 }, { name: 'Hexagon', sides: 6 },
                { name: 'Octagon', sides: 8 }
            ];
            const s = shapes[this.rand(0, shapes.length - 1)];
            return this._mcq(`How many sides does a ${s.name} have?`, s.sides,
                `Think about the shape's name - it gives a clue!`, '📐 Shape Knowledge');
        } else if (diff === 2) {
            const l = this.rand(3, 15); const w = this.rand(3, 15);
            const type = this.rand(0, 1);
            if (type === 0) {
                return this._mcq(`Find the perimeter of a rectangle: length=${l}, width=${w}`,
                    2 * (l + w), `Perimeter = 2 × (length + width)`, '📏 Perimeter');
            }
            return this._mcq(`Find the area of a rectangle: length=${l}, width=${w}`,
                l * w, `Area = length × width`, '📐 Area');
        } else {
            const angles = [60, 90, 120, 45, 30];
            const a1 = angles[this.rand(0, angles.length - 1)];
            const a2 = angles[this.rand(0, angles.length - 1)];
            const a3 = 180 - a1 - a2;
            if (a3 > 0 && a3 < 180) {
                return this._mcq(`A triangle has angles ${a1}° and ${a2}°. What is the third angle?`,
                    a3, `All angles in a triangle add up to 180°.`, '📐 Angle Puzzle');
            }
            const side = this.rand(3, 12);
            return this._mcq(`Find the area of a square with side ${side}`,
                side * side, `Area of square = side × side`, '📐 Area');
        }
    },

    _coordinates(diff) {
        if (diff === 1) {
            const x = this.rand(-5, 5); const y = this.rand(-5, 5);
            const quadrant = x > 0 && y > 0 ? 1 : x < 0 && y > 0 ? 2 : x < 0 && y < 0 ? 3 : 4;
            return this._mcq(`Point (${x}, ${y}) is in which quadrant?`, quadrant,
                `Check if x and y are positive or negative.`, '📍 Quadrants');
        } else if (diff === 2) {
            const x1 = this.rand(0, 5); const y1 = this.rand(0, 5);
            const x2 = this.rand(0, 5); const y2 = this.rand(0, 5);
            const mx = ((x1 + x2) / 2); const my = ((y1 + y2) / 2);
            return this._mcq(`Find midpoint of (${x1},${y1}) and (${x2},${y2}). What is the x-coordinate?`,
                mx, `Midpoint x = (x₁ + x₂) / 2`, '📍 Midpoint', false, true);
        } else {
            const x1 = this.rand(0, 4); const y1 = this.rand(0, 4);
            const dx = this.rand(1, 5); const dy = this.rand(1, 5);
            const dist = Math.round(Math.sqrt(dx * dx + dy * dy) * 10) / 10;
            return this._mcq(`Distance from (${x1},${y1}) to (${x1 + dx},${y1 + dy})? (round to 1 decimal)`,
                dist, `Use √((x₂-x₁)² + (y₂-y₁)²)`, '📍 Distance', false, true);
        }
    },

    _trigonometry(diff) {
        if (diff === 1) {
            const sides = [
                { q: 'The side opposite to the right angle', a: 'Hypotenuse' },
                { q: 'The side opposite to angle θ', a: 'Opposite' },
                { q: 'The side next to angle θ (not hypotenuse)', a: 'Adjacent' }
            ];
            const s = sides[this.rand(0, sides.length - 1)];
            return this._mcq(`In a right triangle, what is: "${s.q}"?`, s.a, 'Think about the position relative to the angle.', '📐 Triangle Sides', true);
        } else if (diff === 2) {
            const defs = [
                { q: 'sin(θ) = ?', a: 'Opposite/Hypotenuse' },
                { q: 'cos(θ) = ?', a: 'Adjacent/Hypotenuse' },
                { q: 'tan(θ) = ?', a: 'Opposite/Adjacent' }
            ];
            const d = defs[this.rand(0, defs.length - 1)];
            return this._mcq(d.q, d.a, 'Remember: SOH-CAH-TOA!', '📐 Trig Ratios', true);
        } else {
            const angles = [
                { deg: 30, sin: 0.5, cos: 0.87, tan: 0.58 },
                { deg: 45, sin: 0.71, cos: 0.71, tan: 1 },
                { deg: 60, sin: 0.87, cos: 0.5, tan: 1.73 }
            ];
            const a = angles[this.rand(0, angles.length - 1)];
            const funcs = ['sin', 'cos', 'tan'];
            const f = funcs[this.rand(0, 2)];
            return this._mcq(`What is ${f}(${a.deg}°)? (round to 2 decimals)`,
                a[f], `Remember the standard trig values!`, '📐 Trig Values', false, true);
        }
    },

    _probability(diff) {
        if (diff === 1) {
            const data = Array.from({ length: 5 }, () => this.rand(1, 10));
            const sum = data.reduce((a, b) => a + b, 0);
            const mean = Math.round((sum / data.length) * 10) / 10;
            return this._mcq(`Find the mean of: ${data.join(', ')}`, mean,
                `Add all numbers and divide by how many there are.`, '📊 Mean', false, true);
        } else if (diff === 2) {
            const data = Array.from({ length: 5 }, () => this.rand(1, 10)).sort((a, b) => a - b);
            return this._mcq(`Find the median of: ${data.join(', ')}`, data[2],
                `The median is the middle number when sorted.`, '📊 Median');
        } else {
            const faces = 6; const target = this.rand(1, 6);
            return this._mcq(`Probability of rolling a ${target} on a fair die? (as fraction)`,
                '1/6', `Only 1 out of ${faces} outcomes is a ${target}.`, '🎲 Probability', true);
        }
    },

    _mcq(question, answer, hint, type, isTextAnswer = false, isDecimal = false) {
        let options;
        if (isTextAnswer) {
            options = this._textOptions(answer);
        } else if (isDecimal) {
            const numAns = parseFloat(answer);
            options = this.shuffle([
                answer.toString(),
                (numAns + this.rand(1, 3) * 0.1).toFixed(1),
                (numAns - this.rand(1, 3) * 0.1).toFixed(1),
                (numAns + this.rand(1, 5)).toString()
            ]);
        } else {
            const numAns = parseInt(answer);
            const offsets = this.shuffle([-3, -2, -1, 1, 2, 3, 5, 10].filter(o => numAns + o > 0));
            options = this.shuffle([
                numAns.toString(),
                (numAns + offsets[0]).toString(),
                (numAns + offsets[1]).toString(),
                (numAns + offsets[2]).toString()
            ]);
        }
        return { question, answer: answer.toString(), options, hint, type };
    },

    _textOptions(correct) {
        const pools = {
            'Hypotenuse': ['Opposite', 'Adjacent', 'Base'],
            'Opposite': ['Adjacent', 'Hypotenuse', 'Base'],
            'Adjacent': ['Opposite', 'Hypotenuse', 'Base'],
            'Opposite/Hypotenuse': ['Adjacent/Hypotenuse', 'Opposite/Adjacent', 'Hypotenuse/Opposite'],
            'Adjacent/Hypotenuse': ['Opposite/Hypotenuse', 'Opposite/Adjacent', 'Hypotenuse/Adjacent'],
            'Opposite/Adjacent': ['Opposite/Hypotenuse', 'Adjacent/Hypotenuse', 'Adjacent/Opposite'],
            '1/6': ['1/3', '1/2', '2/6']
        };
        const alts = pools[correct] || [correct + '?', 'None', 'Unknown'];
        return this.shuffle([correct, ...alts.slice(0, 3)]);
    },

    _storyIntro(levelNum, world, isBoss) {
        if (isBoss) return `⚔️ ${world.bossName} stands before you! Defeat them to claim the Crystal Fragment!`;
        const intros = [
            `Welcome to ${world.name}! ${world.story}`,
            `You venture deeper into ${world.name}...`,
            `A new challenge awaits in ${world.name}!`,
            `The path ahead is filled with puzzles...`,
            `Your math skills grow stronger! Keep going!`
        ];
        return intros[this.rand(0, intros.length - 1)];
    }
};

window.QuestionGenerator = QuestionGenerator;
