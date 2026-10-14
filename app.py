from flask import Flask, render_template, jsonify, session, request
import random
import sqlite3
from collections import Counter
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'dev-secret-key-change-later'

DB_NAME = 'leaderboard.db'

CATEGORIES = [
    'ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
    'three_kind', 'four_kind', 'full_house',
    'small_straight', 'large_straight', 'yahtzee', 'chance'
]

CATEGORY_LABELS = {
    'ones': 'Ones', 'twos': 'Twos', 'threes': 'Threes',
    'fours': 'Fours', 'fives': 'Fives', 'sixes': 'Sixes',
    'three_kind': '3 of a Kind', 'four_kind': '4 of a Kind',
    'full_house': 'Full House', 'small_straight': 'Small Straight',
    'large_straight': 'Large Straight', 'yahtzee': 'Yahtzee', 'chance': 'Chance'
}


def init_db():
    conn = sqlite3.connect(DB_NAME)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS leaderboard (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_name TEXT NOT NULL,
            score INTEGER NOT NULL,
            date TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()


def score_category(dice, category):
    counts = Counter(dice)
    if category == 'ones':
        return dice.count(1) * 1
    if category == 'twos':
        return dice.count(2) * 2
    if category == 'threes':
        return dice.count(3) * 3
    if category == 'fours':
        return dice.count(4) * 4
    if category == 'fives':
        return dice.count(5) * 5
    if category == 'sixes':
        return dice.count(6) * 6
    if category == 'three_kind':
        return sum(dice) if max(counts.values()) >= 3 else 0
    if category == 'four_kind':
        return sum(dice) if max(counts.values()) >= 4 else 0
    if category == 'full_house':
        vals = sorted(counts.values())
        return 25 if vals == [2, 3] else 0
    if category == 'small_straight':
        s = set(dice)
        straights = [{1, 2, 3, 4}, {2, 3, 4, 5}, {3, 4, 5, 6}]
        return 30 if any(st.issubset(s) for st in straights) else 0
    if category == 'large_straight':
        s = set(dice)
        return 40 if s in ({1, 2, 3, 4, 5}, {2, 3, 4, 5, 6}) else 0
    if category == 'yahtzee':
        return 50 if len(set(dice)) == 1 else 0
    if category == 'chance':
        return sum(dice)
    return 0


def new_scorecard():
    return {cat: None for cat in CATEGORIES}


def calc_total(scorecard):
    upper = sum(scorecard[c] or 0 for c in ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'])
    bonus = 35 if upper >= 63 else 0
    lower = sum(scorecard[c] or 0 for c in
                ['three_kind', 'four_kind', 'full_house', 'small_straight', 'large_straight', 'yahtzee', 'chance'])
    return upper + bonus + lower


def active_game():
    return 'players' in session


def get_public_state():
    return {
        'players': session['players'],
        'scorecards': session['scorecards'],
        'current_player': session['current_player'],
        'dice': session['dice'],
        'held': session['held'],
        'rolls_left': session['rolls_left'],
        'has_rolled': session['has_rolled'],
        'game_over': session['game_over'],
        'totals': [calc_total(sc) for sc in session['scorecards']],
        'category_labels': CATEGORY_LABELS,
        'categories': CATEGORIES,
    }


init_db()


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/api/new_game', methods=['POST'])
def new_game():
    data = request.get_json() or {}
    p1 = (data.get('player1') or 'Player 1').strip() or 'Player 1'
    p2 = (data.get('player2') or 'Player 2').strip() or 'Player 2'

    session['players'] = [p1, p2]
    session['scorecards'] = [new_scorecard(), new_scorecard()]
    session['current_player'] = 0
    session['dice'] = [1, 1, 1, 1, 1]
    session['held'] = [False] * 5
    session['rolls_left'] = 3
    session['has_rolled'] = False
    session['game_over'] = False

    return jsonify(get_public_state())


@app.route('/api/roll', methods=['POST'])
def roll():
    if not active_game() or session['game_over']:
        return jsonify({'error': 'No active game'}), 400
    if session['rolls_left'] <= 0:
        return jsonify({'error': 'No rolls left. Choose a category.'}), 400

    dice = list(session['dice'])
    held = session['held']
    for i in range(5):
        if not held[i]:
            dice[i] = random.randint(1, 6)

    session['dice'] = dice
    session['rolls_left'] -= 1
    session['has_rolled'] = True
    session.modified = True

    return jsonify(get_public_state())


@app.route('/api/toggle_hold', methods=['POST'])
def toggle_hold():
    if not active_game():
        return jsonify({'error': 'No active game'}), 400
    if not session['has_rolled'] or session['rolls_left'] == 0:
        return jsonify({'error': 'Roll first'}), 400

    index = request.get_json().get('index')
    held = list(session['held'])
    held[index] = not held[index]
    session['held'] = held
    session.modified = True

    return jsonify(get_public_state())


@app.route('/api/score', methods=['POST'])
def score():
    if not active_game() or session['game_over']:
        return jsonify({'error': 'No active game'}), 400
    if not session['has_rolled']:
        return jsonify({'error': 'Roll first'}), 400

    category = request.get_json().get('category')
    current = session['current_player']

    # Work on a fresh copy so Flask detects the change
    scorecards = [dict(sc) for sc in session['scorecards']]
    scorecard = scorecards[current]

    if category not in CATEGORIES or scorecard[category] is not None:
        return jsonify({'error': 'Invalid or already used category'}), 400

    scorecard[category] = score_category(session['dice'], category)
    scorecards[current] = scorecard
    session['scorecards'] = scorecards

    all_done = all(
        all(v is not None for v in sc.values())
        for sc in session['scorecards']
    )

    if all_done:
        session['game_over'] = True
        for name, sc in zip(session['players'], session['scorecards']):
            save_score(name, calc_total(sc))
    else:
        session['current_player'] = (current + 1) % len(session['players'])
        session['dice'] = [1, 1, 1, 1, 1]
        session['held'] = [False] * 5
        session['rolls_left'] = 3
        session['has_rolled'] = False

    session.modified = True
    return jsonify(get_public_state())


def save_score(player_name, score_value):
    conn = sqlite3.connect(DB_NAME)
    conn.execute(
        'INSERT INTO leaderboard (player_name, score, date) VALUES (?, ?, ?)',
        (player_name, score_value, datetime.now().strftime('%Y-%m-%d %H:%M'))
    )
    conn.commit()
    conn.close()


@app.route('/api/leaderboard')
def leaderboard():
    conn = sqlite3.connect(DB_NAME)
    rows = conn.execute(
        'SELECT player_name, score, date FROM leaderboard ORDER BY score DESC LIMIT 10'
    ).fetchall()
    conn.close()
    return jsonify([{'player_name': r[0], 'score': r[1], 'date': r[2]} for r in rows])


if __name__ == '__main__':
    app.run(debug=True)