# 🎲 Dice Rolling — Yahtzee Game

A two-player web-based Yahtzee game built with **Python (Flask)** and vanilla HTML/JS.

---

## Features

- Full Yahtzee scorecard (13 categories per player)
- Hold/re-roll individual dice up to 3 times per turn
- Persistent leaderboard stored in SQLite
- Clean, responsive UI

---

## Project Structure

```
DiceRolling/
├── app.py                  # Flask app & API routes
├── dice_rolling_game.py    # Standalone CLI dice game (original prototype)
├── leaderboard.db          # SQLite database (auto-created, git-ignored)
├── templates/
│   └── index.html          # Single-page frontend
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variable template
├── .gitignore
└── README.md
```

---

## Quick Start

### 1. Clone & create a virtual environment
```bash
git clone <your-repo-url>
cd DiceRolling
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env and set a proper FLASK_SECRET_KEY
```

### 4. Run the development server
```bash
python app.py
```

Open **http://localhost:5000** in your browser.

---

## How to Play

1. Enter two player names and click **Start Game**.
2. Click **Roll** to roll all five dice (up to 3 rolls per turn).
3. Click any die to **hold** it before re-rolling.
4. Click a category in the scorecard to score your dice.
5. The game ends when every category is filled — highest total wins!

---

## Yahtzee Scoring

| Category       | Score                                    |
|----------------|------------------------------------------|
| Ones – Sixes   | Sum of matching dice                     |
| 3 of a Kind    | Sum of all dice                          |
| 4 of a Kind    | Sum of all dice                          |
| Full House     | 25 pts (three of one + two of another)   |
| Small Straight | 30 pts (4 sequential dice)               |
| Large Straight | 40 pts (5 sequential dice)               |
| Yahtzee        | 50 pts (all five dice the same)          |
| Chance         | Sum of all dice                          |
| **Upper Bonus**| +35 pts if upper section total ≥ 63      |

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first.

---

## License

MIT
