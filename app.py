"""
MathQuest: The Lost Kingdom of Numbers
Flask Backend Application

Routes:
  GET  /                          → Serve the game
  GET  /api/worlds                → Get all world data
  GET  /api/characters            → Get all characters
  POST /api/questions             → Generate questions for a level
  POST /api/players               → Create a new player
  GET  /api/players/<id>          → Load player data
  PUT  /api/players/<id>          → Update player data (full sync)
  POST /api/players/<id>/complete → Record level completion
  POST /api/players/<id>/hint     → Use a hint
  POST /api/players/<id>/unlock   → Unlock a character
  POST /api/players/<id>/select   → Select a character
"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_cors import CORS
from models import db, Player, LevelCompletion, CustomQuestion
from question_generator import generate_level, WORLDS, BOSS_NAMES
import json
import os

# App Setup 
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mathquest.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'mathquest-secret-key-2026'

CORS(app)
db.init_app(app)

with app.app_context():
    db.create_all()

# Characters
CHARACTERS = [
    {'id': 'explorer', 'name': 'Math Explorer', 'emoji': '🧭', 'cost': 0},
    {'id': 'wizard',   'name': 'Number Wizard',  'emoji': '🧙', 'cost': 500},
    {'id': 'knight',   'name': 'Equation Knight', 'emoji': '⚔️', 'cost': 1000},
    {'id': 'fairy',    'name': 'Geometry Fairy',  'emoji': '🧚', 'cost': 1500},
    {'id': 'robot',    'name': 'Calc-Bot 3000',   'emoji': '🤖', 'cost': 2500},
    {'id': 'dragon',   'name': 'Data Dragon',     'emoji': '🐉', 'cost': 5000},
]

# Page Routes
@app.route('/')
def index():
    return render_template('index.html')

# API: World & Character Data 
@app.route('/api/worlds', methods=['GET'])
def get_worlds():
    worlds = []
    for w in WORLDS:
        worlds.append({
            'id': w['id'],
            'name': w['name'],
            'levelStart': w['levelStart'],
            'levelEnd': w['levelEnd'],
            'bossLevel': w['bossLevel'],
            'bossName': BOSS_NAMES.get(w['id'], 'Boss'),
            'icon': ['', '🏘️', '⛰️', '👑', '🏙️', '🌿', '🌌', '🗼', '🔬', '🏰'][w['id']],
            'color': ['', '#2ecc71', '#3498db', '#9b59b6', '#e67e22',
                       '#1abc9c', '#2c3e50', '#c0392b', '#00bcd4', '#4a0e4e'][w['id']],
            'gradient': [
                '',
                'linear-gradient(135deg, #2ecc71, #f1c40f)',
                'linear-gradient(135deg, #3498db, #8e44ad)',
                'linear-gradient(135deg, #9b59b6, #e91e63)',
                'linear-gradient(135deg, #e67e22, #e74c3c)',
                'linear-gradient(135deg, #1abc9c, #2ecc71)',
                'linear-gradient(135deg, #2c3e50, #3498db)',
                'linear-gradient(135deg, #c0392b, #f39c12)',
                'linear-gradient(135deg, #00bcd4, #7c4dff)',
                'linear-gradient(135deg, #4a0e4e, #c0392b)',
            ][w['id']],
            'description': [
                '',
                'Master addition and subtraction to rebuild the village!',
                'Conquer the village with multiplication and division!',
                'Unite the Fraction Village with equal parts!',
                'Decode the mysteries of variables and equations!',
                'Navigate shapes and angles in the wild village!',
                'Plot your course through the village!',
                'Unlock the village secrets using angles and ratios!',
                'Predict the unpredictable in the probability village!',
                'Face Lord Chaos and restore the village of Knowledge!',
            ][w['id']],
            'story': [
                '',
                'The villagers have lost count of everything! Help them restore order.',
                'The village bridges are broken. Only multiplication can rebuild them!',
                'The village is divided! Use fractions to bring the pieces together.',
                'The village runs on equations, but the variables have gone missing!',
                'The village paths form mysterious shapes. Decode them!',
                'The village maps are scrambled! Use coordinates to navigate.',
                'Each part of the village is locked with trigonometric puzzles!',
                'The village experiments are out of control! Use probability to fix them.',
                'The final battle awaits in the Chaos Village. All your math skills will be tested!',
            ][w['id']],
        })
    return jsonify(worlds)

@app.route('/api/characters', methods=['GET'])
def get_characters():
    return jsonify(CHARACTERS)

@app.route('/api/questions', methods=['POST'])
def gen_questions():
    data = request.get_json()
    level_num = data.get('levelNum', 1)

    if not 1 <= level_num <= 45:
        return jsonify({'error': 'Level must be between 1 and 45'}), 400

    player_id = data.get('playerId')
    player = Player.query.get(player_id) if player_id else None
    asked_history = player.get_asked_questions() if player else []

    # Include custom questions if any for this world
    world = next((w for w in WORLDS if w['levelStart'] <= level_num <= w['levelEnd']), None)
    custom_pool = []
    if world:
        customs = CustomQuestion.query.filter_by(world_id=world['id']).all()
        custom_pool = [q.to_dict() for q in customs]

    result = generate_level(level_num, asked_history=asked_history, custom_pool=custom_pool)
    if not result:
        return jsonify({'error': 'Failed to generate level'}), 500

    # Persist the new questions to player history to avoid repeats in next sessions
    if player:
        new_asked = list(set(asked_history + [q['question'] for q in result['questions']]))
        player.set_asked_questions(new_asked)
        db.session.commit()

    return jsonify(result)

# Admin Routes 
ADMIN_PASSWORD = "arav456" # Simple password for demonstration

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        if request.form.get('password') == ADMIN_PASSWORD:
            session['admin_logged_in'] = True
            return redirect(url_for('admin_dashboard'))
        return render_template('admin_login.html', error="Invalid password")
    return render_template('admin_login.html')

@app.route('/admin')
def admin_dashboard():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_login'))
    
    questions = CustomQuestion.query.all()
    return render_template('admin.html', questions=questions, worlds=WORLDS)

@app.route('/admin/logout')
def admin_logout():
    session.pop('admin_logged_in', None)
    return redirect(url_for('index'))

@app.route('/api/admin/questions', methods=['POST'])
def admin_add_question():
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    q = CustomQuestion(
        world_id=data['worldId'],
        question=data['question'],
        answer=data['answer'],
        options=json.dumps(data['options']),
        hint=data.get('hint', ''),
        q_type=data.get('type', 'Admin Question')
    )
    db.session.add(q)
    db.session.commit()
    return jsonify(q.to_dict()), 201

@app.route('/api/admin/questions/<int:qid>', methods=['DELETE'])
def admin_delete_question(qid):
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    q = CustomQuestion.query.get_or_404(qid)
    db.session.delete(q)
    db.session.commit()
    return '', 204

# API: Player Management 
@app.route('/api/players', methods=['POST'])
def create_player():
    data = request.get_json()
    name = data.get('name', 'Explorer').strip()[:50] or 'Explorer'
    player = Player(name=name)
    db.session.add(player)
    db.session.commit()

    return jsonify(player.to_dict()), 201

@app.route('/api/players/<int:player_id>', methods=['GET'])
def get_player(player_id):
    player = Player.query.get_or_404(player_id)
    return jsonify(player.to_dict())

@app.route('/api/players/<int:player_id>', methods=['PUT'])
def update_player(player_id):
    """Full state sync from frontend."""
    player = Player.query.get_or_404(player_id)
    data = request.get_json()

    if 'selectedCharacter' in data:
        player.selected_character = data['selectedCharacter']
    if 'totalCoins' in data:
        player.total_coins = data['totalCoins']
    if 'totalStars' in data:
        player.total_stars = data['totalStars']
    if 'hintsRemaining' in data:
        player.hints_remaining = data['hintsRemaining']
    if 'crystalFragments' in data:
        player.crystal_fragments = data['crystalFragments']
    if 'unlockedCharacters' in data:
        player.set_unlocked_characters(data['unlockedCharacters'])
    if 'worldsUnlocked' in data:
        player.set_worlds_unlocked(data['worldsUnlocked'])
    if 'bossesDefeated' in data:
        player.set_bosses_defeated(data['bossesDefeated'])
    if 'stats' in data:
        s = data['stats']
        player.total_questions_answered = s.get('totalQuestionsAnswered', player.total_questions_answered)
        player.correct_answers = s.get('correctAnswers', player.correct_answers)
        player.longest_streak = s.get('longestStreak', player.longest_streak)
        player.current_streak = s.get('currentStreak', player.current_streak)

    db.session.commit()
    return jsonify(player.to_dict())

@app.route('/api/players/<int:player_id>/complete', methods=['POST'])
def complete_level(player_id):
    """Record a level completion."""
    player = Player.query.get_or_404(player_id)
    data = request.get_json()

    level_num = data.get('levelNum')
    stars = data.get('stars', 0)
    coins = data.get('coins', 0)
    best_time = data.get('timeUsed', 0)
    is_boss = data.get('isBoss', False)
    boss_defeated = data.get('bossDefeated', False)

    # Check for existing completion
    existing = LevelCompletion.query.filter_by(
        player_id=player_id, level_num=level_num
    ).first()

    if existing:
        existing.stars = max(existing.stars, stars)
        existing.coins = max(existing.coins, coins)
        existing.best_time = min(existing.best_time, best_time) if existing.best_time > 0 else best_time
    else:
        lc = LevelCompletion(
            player_id=player_id,
            level_num=level_num,
            stars=stars,
            coins=coins,
            best_time=best_time
        )
        db.session.add(lc)

    # Update player state
    player.total_coins += coins
    player.total_stars = sum(lc.stars for lc in player.level_completions) + (stars if not existing else 0)

    # Unlock next world if needed
    if stars >= 1:
        next_level = level_num + 1
        if next_level <= 45:
            for w in WORLDS:
                if w['levelStart'] <= next_level <= w['levelEnd']:
                    worlds = player.get_worlds_unlocked()
                    if w['id'] not in worlds:
                        worlds.append(w['id'])
                        player.set_worlds_unlocked(worlds)
                    break

        if boss_defeated:
            for w in WORLDS:
                if w['bossLevel'] == level_num:
                    bosses = player.get_bosses_defeated()
                    if w['id'] not in bosses:
                        bosses.append(w['id'])
                        player.set_bosses_defeated(bosses)
                        player.crystal_fragments += 1
                    break

    # Update stats from request
    if 'stats' in data:
        s = data['stats']
        player.total_questions_answered = s.get('totalQuestionsAnswered', player.total_questions_answered)
        player.correct_answers = s.get('correctAnswers', player.correct_answers)
        player.longest_streak = s.get('longestStreak', player.longest_streak)
        player.current_streak = s.get('currentStreak', player.current_streak)

    db.session.commit()

    # Recalculate total stars
    player.total_stars = sum(lc.stars for lc in player.level_completions)
    db.session.commit()

    return jsonify(player.to_dict())

@app.route('/api/players/<int:player_id>/hint', methods=['POST'])
def use_hint(player_id):
    player = Player.query.get_or_404(player_id)
    if player.hints_remaining <= 0:
        return jsonify({'error': 'No hints remaining'}), 400
    player.hints_remaining -= 1
    db.session.commit()
    return jsonify({'hintsRemaining': player.hints_remaining})

@app.route('/api/players/<int:player_id>/unlock', methods=['POST'])
def unlock_character(player_id):
    player = Player.query.get_or_404(player_id)
    data = request.get_json()
    char_id = data.get('characterId')

    char = next((c for c in CHARACTERS if c['id'] == char_id), None)
    if not char:
        return jsonify({'error': 'Character not found'}), 404

    chars = player.get_unlocked_characters()
    if char_id in chars:
        return jsonify({'error': 'Already unlocked'}), 400
    if player.total_coins < char['cost']:
        return jsonify({'error': 'Not enough coins'}), 400

    player.total_coins -= char['cost']
    chars.append(char_id)
    player.set_unlocked_characters(chars)
    db.session.commit()

    return jsonify(player.to_dict())

@app.route('/api/players/<int:player_id>/select', methods=['POST'])
def select_character(player_id):
    player = Player.query.get_or_404(player_id)
    data = request.get_json()
    char_id = data.get('characterId')

    if char_id not in player.get_unlocked_characters():
        return jsonify({'error': 'Character not unlocked'}), 400

    player.selected_character = char_id
    db.session.commit()
    return jsonify(player.to_dict())

# Run 
if __name__ == '__main__':
    app.run(debug=True, port=5000)
