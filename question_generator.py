"""
MathQuest: Server-Side Question Generator
Generates math questions for all 9 worlds with difficulty scaling.
"""

import random
import math

# World definitions 
WORLDS = [
    {'id': 1, 'name': 'Arithmetic Village','levelStart': 1,'levelEnd': 5,'bossLevel': 5},
    {'id': 2, 'name': 'Multiplication Village','levelStart': 6,'levelEnd': 10,'bossLevel': 10},
    {'id': 3, 'name': 'Fraction Village','levelStart': 11,'levelEnd': 15,'bossLevel': 15},
    {'id': 4, 'name': 'Algebra Village','levelStart': 16,'levelEnd': 20,'bossLevel': 20},
    {'id': 5, 'name': 'Geometry Village','levelStart': 21,'levelEnd': 25,'bossLevel': 25},
    {'id': 6, 'name': 'Coordinate Village','levelStart': 26,'levelEnd': 30,'bossLevel': 30},
    {'id': 7, 'name': 'Trigonometry Village','levelStart': 31,'levelEnd': 35,'bossLevel': 35},
    {'id': 8, 'name': 'Probability Village','levelStart': 36,'levelEnd': 40,'bossLevel': 40},
    {'id': 9, 'name': 'Chaos Village','levelStart': 41,'levelEnd': 45,'bossLevel': 45},
]

STORY_INTROS = [
    "Welcome, Explorer! The village needs your help...",
    "You venture deeper into the village...",
    "A new village challenge blocks your path!",
    "The village elders are counting on you...",
    "Your math skills are needed to restore the village!",
]

BOSS_NAMES = {
    1: 'The Number Goblin', 2: 'The Factor Beast', 3: 'The Slice Sorcerer',
    4: 'The Unknown X', 5: 'The Shape Shifter', 6: 'The Void Navigator',
    7: 'The Angle Demon', 8: 'Dr. Random', 9: 'Lord Chaos'
}

def get_world(level_num):
    for w in WORLDS:
        if w['levelStart'] <= level_num <= w['levelEnd']:
            return w
    return None

def _difficulty(level_num, world):
    span = world['levelEnd'] - world['levelStart']
    if span == 0:
        return 3
    pos = (level_num - world['levelStart']) / span
    if pos < 0.33:
        return 1
    if pos < 0.66:
        return 2
    return 3

def _shuffle(lst):
    result = lst[:]
    random.shuffle(result)
    return result

def _mcq(question, answer, hint, qtype, is_text=False, is_decimal=False):
    """Build a multiple-choice question with 4 options."""
    answer_str = str(answer)
    if is_text:
        options = _text_options(answer_str)
    elif is_decimal:
        num_ans = float(answer)
        opts = {answer_str}
        for _ in range(20):
            offset = random.choice([-0.3, -0.2, -0.1, 0.1, 0.2, 0.3, 1, 2])
            candidate = round(num_ans + offset, 2)
            s = str(candidate)
            if s != answer_str:
                opts.add(s)
            if len(opts) >= 4:
                break
        while len(opts) < 4:
            opts.add(str(round(num_ans + random.randint(1, 5), 1)))
        options = _shuffle(list(opts)[:4])
    else:
        num_ans = int(float(answer))
        offsets = _shuffle([o for o in [-3, -2, -1, 1, 2, 3, 5, 10] if num_ans + o > 0])
        opts = {str(num_ans)}
        for o in offsets:
            opts.add(str(num_ans + o))
            if len(opts) >= 4:
                break
        while len(opts) < 4:
            opts.add(str(num_ans + random.randint(1, 10)))
        options = _shuffle(list(opts)[:4])

    return {
        'question': question,
        'answer': answer_str,
        'options': options,
        'hint': hint,
        'type': qtype
    }

def _text_options(correct):
    pools = {
        'Hypotenuse': ['Opposite', 'Adjacent', 'Base'],
        'Opposite': ['Adjacent', 'Hypotenuse', 'Base'],
        'Adjacent': ['Opposite', 'Hypotenuse', 'Base'],
        'Opposite/Hypotenuse': ['Adjacent/Hypotenuse', 'Opposite/Adjacent', 'Hypotenuse/Opposite'],
        'Adjacent/Hypotenuse': ['Opposite/Hypotenuse', 'Opposite/Adjacent', 'Hypotenuse/Adjacent'],
        'Opposite/Adjacent': ['Opposite/Hypotenuse', 'Adjacent/Hypotenuse', 'Adjacent/Opposite'],
        '1/6': ['1/3', '1/2', '2/6'],
    }
    alts = pools.get(correct, ['None', 'Unknown', f'{correct}?'])
    return _shuffle([correct] + alts[:3])

# Question generators per world 
def _arithmetic(diff):
    mx = {1: 20, 2: 100, 3: 500}[diff]
    a, b = random.randint(1, mx), random.randint(1, mx)
    
    use_word_problem = random.random() > 0.3

    if diff >= 2 and random.random() > 0.5:
        big, small = max(a, b), min(a, b)
        if use_word_problem:
            templates = [
                f"The village had {big} sheep, but {small} wandered away. How many sheep are left?",
                f"You need {big} wooden planks to fix the village bridge. You already have {small}. How many more do you need?",
                f"The village well had {big} buckets of water. The villagers used {small} buckets. How many are left?",
                f"A merchant brought {big} gems to the village, and traded {small} of them. How many gems does he have now?"
            ]
            question = random.choice(templates)
            q_type = 'Word Problem'
        else:
            question = f'{big} − {small} = ?'
            q_type = 'Arithmetic Puzzle'
            
        return _mcq(question, big - small,
                     f'Start at {big} and count back {small} to get {big - small}.', q_type)
                     
    if use_word_problem:
        templates = [
            f"The village has {a} banyan trees and {b} tamarind trees. How many trees are there altogether?",
            f"The village bakery baked {a} loaves of bread in the morning and {b} in the evening. How many loaves did they make in total?",
            f"You collected {a} apples and the village elder gave you {b} more. How many apples do you have?",
            f"There are {a} houses on the east side of the village and {b} houses on the west side. How many houses are there?"
        ]
        question = random.choice(templates)
        q_type = 'Word Problem'
    else:
        question = f'{a} + {b} = ?'
        q_type = 'Arithmetic Puzzle'
        
    return _mcq(question, a + b,
                f'Start at {a} and count up by {b} to get {a + b}.', q_type)

def _multiplication(diff):
    mx = {1: 10, 2: 12, 3: 15}[diff]
    a, b = random.randint(2, mx), random.randint(2, mx)
    
    use_word_problem = random.random() > 0.3
    
    if diff >= 3 and random.random() > 0.5:
        product = a * b
        if use_word_problem:
            templates = [
                f"The village harvested {product} apples and wants to divide them equally into {a} baskets. How many apples go into each basket?",
                f"{a} villagers are sharing {product} gold coins equally. How many coins does each villager get?",
                f"The village guards need to split into {a} equal patrols. If there are {product} guards total, how many are in each patrol?",
            ]
            question = random.choice(templates)
            q_type = 'Word Problem'
        else:
            question = f'{product} ÷ {a} = ?'
            q_type = 'Division'
            
        return _mcq(question, b,
                     f'Since {a} × {b} = {product}, the answer is {b}.', q_type)
                     
    if use_word_problem:
        templates = [
            f"There are {a} village farms, and each farm has {b} cows. How many cows are there in total?",
            f"The village guard works for {a} hours a day. In {b} days, how many hours do they work?",
            f"You planted {a} rows of corn, with {b} plants in each row. How many corn plants are there?",
        ]
        question = random.choice(templates)
        q_type = 'Word Problem'
    else:
        question = f'{a} × {b} = ?'
        q_type = 'Multiplication'
        
    return _mcq(question, a * b,
                f'{a} groups of {b} makes {a * b}.', q_type)

def _fractions(diff):
    if diff == 1:
        denom = random.choice([2, 4, 8])
        num = random.randint(1, denom - 1)
        templates = [
            f'What fraction is {num} out of {denom} equal parts?',
            f'The village baker cut a pie into {denom} equal slices and sold {num} of them. What fraction of the pie was sold?',
            f'The village elder divided a field into {denom} equal parts. {num} parts are planted with wheat. What fraction is planted?'
        ]
        return _mcq(random.choice(templates),
                     f'{num}/{denom}',
                     f'The top number is {num} and the bottom is {denom}, so it is {num}/{denom}.',
                     'Fraction Identification', is_text=True)
    elif diff == 2:
        d = random.choice([2, 3, 4, 6])
        n = random.randint(1, d - 1)
        m = random.randint(2, 4)
        templates = [
            f'Which fraction is equivalent to {n}/{d}?',
            f'The village recipe calls for {n}/{d} cups of flour. Which fraction is the same amount?',
            f'A farmer owns {n}/{d} of the village land. What is an equivalent fraction for his share?'
        ]
        return _mcq(random.choice(templates),
                     f'{n*m}/{d*m}',
                     f'Multiply top ({n}) and bottom ({d}) by {m} to get {n*m}/{d*m}.',
                     'Equivalent Fractions', is_text=True)
    else:
        d = random.choice([4, 5, 8, 10])
        n = random.randint(1, d)
        decimal = f'{n/d:.2f}'.rstrip('0').rstrip('.')
        return _mcq(f'Convert {n}/{d} to a decimal.',
                     decimal, f'Divide {n} by {d} to get {decimal}.',
                     'Decimal Conversion', is_text=True)

def _algebra(diff):
    if diff == 1:
        x = random.randint(1, 15)
        b = random.randint(1, 20)
        return _mcq(f'Solve: x + {b} = {x + b}', x,
                     f'{x + b} - {b} = {x}, so x is {x}.', 'Solve for x')
    elif diff == 2:
        x = random.randint(1, 10)
        a = random.randint(2, 5)
        return _mcq(f'Solve: {a}x = {a * x}', x,
                     f'{a * x} ÷ {a} = {x}, so x is {x}.', 'Equation Solving')
    else:
        x = random.randint(1, 8)
        a = random.randint(2, 5)
        b = random.randint(1, 10)
        result = a * x + b
        return _mcq(f'Solve: {a}x + {b} = {result}', x,
                     f'Subtract {b} to get {a}x = {result - b}, then divide by {a} to get x = {x}.', 'Two-Step Equation')

def _geometry(diff):
    if diff == 1:
        shapes = [('Triangle', 3), ('Square', 4), ('Pentagon', 5),
                  ('Hexagon', 6), ('Octagon', 8)]
        name, sides = random.choice(shapes)
        return _mcq(f'How many sides does a {name} have?', sides,
                     f'A {name} has exactly {sides} sides.', 'Shape Knowledge')
    elif diff == 2:
        l, w = random.randint(3, 15), random.randint(3, 15)
        if random.random() > 0.5:
            return _mcq(f'Find the perimeter of a rectangle: length={l}, width={w}',
                        2 * (l + w), f'Perimeter = 2 × ({l} + {w}) = {2 * (l + w)}.', 'Perimeter')
        return _mcq(f'Find the area of a rectangle: length={l}, width={w}',
                    l * w, f'Area = {l} × {w} = {l * w}.', 'Area')
    else:
        angles = [60, 90, 120, 45, 30]
        a1 = random.choice(angles)
        a2 = random.choice(angles)
        a3 = 180 - a1 - a2
        if 0 < a3 < 180:
            return _mcq(f'A triangle has angles {a1}° and {a2}°. What is the third angle?',
                        a3, f'180° - {a1}° - {a2}° = {a3}°. The third angle is {a3}°. All add to 180°.', 'Angle Puzzle')
        side = random.randint(3, 12)
        return _mcq(f'Find the area of a square with side {side}',
                    side * side, f'Area of square = {side} × {side} = {side * side}.', 'Area')

def _coordinates(diff):
    if diff == 1:
        x, y = random.randint(1, 10), random.randint(1, 10)
        signs = random.choice([(1, 1, 1), (-1, 1, 2), (-1, -1, 3), (1, -1, 4)])
        xv, yv, q = x * signs[0], y * signs[1], signs[2]
        return _mcq(f'Point ({xv}, {yv}) is in which quadrant?', q,
                    f'The point has x={xv} and y={yv}, which places it in quadrant {q}.', 'Quadrants')
    elif diff == 2:
        x1, y1 = random.randint(0, 5), random.randint(0, 5)
        x2, y2 = random.randint(0, 5), random.randint(0, 5)
        mx = (x1 + x2) / 2
        return _mcq(f'Find midpoint of ({x1},{y1}) and ({x2},{y2}). What is the x-coordinate?',
                    mx, f'Midpoint x = ({x1} + {x2}) / 2 = {mx}.', 'Midpoint', is_decimal=True)
    else:
        x1, y1 = random.randint(0, 4), random.randint(0, 4)
        dx, dy = random.randint(1, 5), random.randint(1, 5)
        dist = round(math.sqrt(dx*dx + dy*dy), 1)
        return _mcq(f'Distance from ({x1},{y1}) to ({x1+dx},{y1+dy})? (round to 1 decimal)',
                    dist, f'Distance = √( ({x1+dx}-{x1})² + ({y1+dy}-{y1})² ) = √({dx}² + {dy}²) = {dist}.', 'Distance', is_decimal=True)

def _trigonometry(diff):
    if diff == 1:
        sides = [
            ('The side opposite to the right angle', 'Hypotenuse', 'The side opposite the right angle is always the Hypotenuse.'),
            ('The side opposite to angle θ', 'Opposite', 'The side directly across from angle θ is the Opposite.'),
            ('The side next to angle θ (not hypotenuse)', 'Adjacent', 'The side next to angle θ, other than the hypotenuse, is the Adjacent.'),
        ]
        q, a, hint = random.choice(sides)
        return _mcq(f'In a right triangle, what is: "{q}"?', a,
                    hint, 'Triangle Sides', is_text=True)
    elif diff == 2:
        defs = [
            ('sin(θ) = ?', 'Opposite/Hypotenuse', 'SOH: sin = Opposite / Hypotenuse.'),
            ('cos(θ) = ?', 'Adjacent/Hypotenuse', 'CAH: cos = Adjacent / Hypotenuse.'),
            ('tan(θ) = ?', 'Opposite/Adjacent', 'TOA: tan = Opposite / Adjacent.'),
        ]
        q, a, hint = random.choice(defs)
        return _mcq(q, a, hint, 'Trig Ratios', is_text=True)
    else:
        angles = [
            {'deg': 30, 'sin': 0.5,  'cos': 0.87, 'tan': 0.58},
            {'deg': 45, 'sin': 0.71, 'cos': 0.71, 'tan': 1},
            {'deg': 60, 'sin': 0.87, 'cos': 0.5,  'tan': 1.73},
        ]
        ang = random.choice(angles)
        f = random.choice(['sin', 'cos', 'tan'])
        return _mcq(f'What is {f}({ang["deg"]}°)? (round to 2 decimals)',
                    ang[f], f'The {f} of {ang["deg"]}° evaluates to {ang[f]}.',
                    'Trig Values', is_decimal=True)

def _probability(diff):
    if diff == 1:
        data = [random.randint(1, 10) for _ in range(5)]
        mean = round(sum(data) / len(data), 1)
        return _mcq(f'Find the mean of: {", ".join(map(str, data))}', mean,
                    f'Sum is {sum(data)}. {sum(data)} ÷ {len(data)} = {mean}. The mean is {mean}.',
                    'Mean', is_decimal=True)
    elif diff == 2:
        data = sorted([random.randint(1, 10) for _ in range(5)])
        return _mcq(f'Find the median of: {", ".join(map(str, data))}', data[2],
                    f'The sorted numbers are {", ".join(map(str, data))}. The middle one is {data[2]}.', 'Median')
    else:
        target = random.randint(1, 6)
        return _mcq(f'Probability of rolling a {target} on a fair die? (as fraction)',
                    '1/6', f'There is 1 favorable outcome ({target}) out of 6 possible outcomes, so 1/6.',
                    'Probability', is_text=True)

GENERATORS = {
    1: _arithmetic, 2: _multiplication, 3: _fractions,
    4: _algebra, 5: _geometry, 6: _coordinates,
    7: _trigonometry, 8: _probability,
}

def generate_level(level_num, asked_history=None, custom_pool=None):
    """Generate a complete level with unique questions, potentially including custom ones."""
    world = get_world(level_num)
    if not world:
        return None

    if asked_history is None:
        asked_history = []
    
    if custom_pool is None:
        custom_pool = []

    diff = _difficulty(level_num, world)
    is_boss = level_num == world['bossLevel']
    count = 8 if is_boss else 5

    questions = []
    current_asked = asked_history[:]
    
    # 1. Try to pick questions from Custom Pool first (if they match this world)
    world_customs = [q for q in custom_pool if q.get('worldId') == world['id']]
    random.shuffle(world_customs)
    
    for q_data in world_customs:
        if len(questions) >= count: break
        if q_data['question'] not in current_asked:
            questions.append(q_data)
            current_asked.append(q_data['question'])

    # 2. Fill the rest with randomly generated questions
    while len(questions) < count:
        best_q = None
        retries = 0
        
        while retries < 20:
            if world['id'] == 9:
                wid = random.randint(1, 8)
                gen = GENERATORS.get(wid, _arithmetic)
                q = gen(diff)
            elif is_boss:
                gen = GENERATORS.get(world['id'], _arithmetic)
                q = gen(min(diff + 1, 3))
            else:
                gen = GENERATORS.get(world['id'], _arithmetic)
                q = gen(diff)
                
            if q['question'] not in current_asked:
                best_q = q
                break
            retries += 1
            
        if not best_q:
            best_q = q # Fallback if we really can't find a unique one
            
        questions.append(best_q)
        current_asked.append(best_q['question'])

    # Final shuffle so custom questions are mixed in
    random.shuffle(questions)

    if is_boss:
        story = f'⚔️ {BOSS_NAMES.get(world["id"], "Boss")} stands before you! Defeat them to claim the Crystal Fragment!'
    else:
        story = random.choice(STORY_INTROS)

    return {
        'levelNum': level_num,
        'worldId': world['id'],
        'worldName': world['name'],
        'isBoss': is_boss,
        'questions': questions,
        'timeLimit': 180 if is_boss else 90,
        'storyIntro': story,
        'questionCount': count
    }