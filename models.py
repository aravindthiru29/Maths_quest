"""MathQuest: Database Models SQLAlchemy models for player progress, level completions, and achievements."""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class Player(db.Model):
    """Stores player profile and aggregated stats."""
    __tablename__ = 'players'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    selected_character = db.Column(db.String(30), default='explorer')
    total_coins = db.Column(db.Integer, default=0)
    total_stars = db.Column(db.Integer, default=0)
    hints_remaining = db.Column(db.Integer, default=10)
    crystal_fragments = db.Column(db.Integer, default=0)
    # JSON-encoded lists
    unlocked_characters = db.Column(db.Text, default='["explorer"]')
    worlds_unlocked = db.Column(db.Text, default='[1, 2, 3, 4, 5, 6, 7, 8, 9]')
    bosses_defeated = db.Column(db.Text, default='[]')
    # Stats
    total_questions_answered = db.Column(db.Integer, default=0)
    correct_answers = db.Column(db.Integer, default=0)
    longest_streak = db.Column(db.Integer, default=0)
    current_streak = db.Column(db.Integer, default=0)
    # Asked questions to ensure uniqueness
    asked_questions = db.Column(db.Text, default='[]')
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_played = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    level_completions = db.relationship('LevelCompletion', backref='player', lazy=True)

    def get_unlocked_characters(self):
        return json.loads(self.unlocked_characters or '["explorer"]')

    def set_unlocked_characters(self, chars):
        self.unlocked_characters = json.dumps(chars)

    def get_worlds_unlocked(self):
        return json.loads(self.worlds_unlocked or '[1, 2, 3, 4, 5, 6, 7, 8, 9]')

    def set_worlds_unlocked(self, worlds):
        self.worlds_unlocked = json.dumps(worlds)

    def get_bosses_defeated(self):
        return json.loads(self.bosses_defeated or '[]')

    def set_bosses_defeated(self, bosses):
        self.bosses_defeated = json.dumps(bosses)

    def get_asked_questions(self):
        return json.loads(self.asked_questions or '[]')

    def set_asked_questions(self, asked):
        self.asked_questions = json.dumps(asked)

    def to_dict(self):
        """Convert to the same format the frontend expects."""
        levels_completed = {}
        for lc in self.level_completions:
            levels_completed[str(lc.level_num)] = {
                'stars': lc.stars,
                'coins': lc.coins,
                'bestTime': lc.best_time,
                'completedAt': lc.completed_at.isoformat() if lc.completed_at else None
            }

        return {
            'playerId': self.id,
            'playerName': self.name,
            'selectedCharacter': self.selected_character,
            'totalCoins': self.total_coins,
            'totalStars': self.total_stars,
            'hintsRemaining': self.hints_remaining,
            'crystalFragments': self.crystal_fragments,
            'unlockedCharacters': self.get_unlocked_characters(),
            'worldsUnlocked': self.get_worlds_unlocked(),
            'bossesDefeated': self.get_bosses_defeated(),
            'levelsCompleted': levels_completed,
            'stats': {
                'totalQuestionsAnswered': self.total_questions_answered,
                'correctAnswers': self.correct_answers,
                'longestStreak': self.longest_streak,
                'currentStreak': self.current_streak
            },
            'lastPlayed': self.last_played.isoformat() if self.last_played else None
        }

class LevelCompletion(db.Model):
    """Stores per-level completion records."""
    __tablename__ = 'level_completions'

    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('players.id'), nullable=False)
    level_num = db.Column(db.Integer, nullable=False)
    stars = db.Column(db.Integer, default=0)
    coins = db.Column(db.Integer, default=0)
    best_time = db.Column(db.Float, default=0)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('player_id', 'level_num', name='uq_player_level'),
    )