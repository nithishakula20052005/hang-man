# Hangman (FastAPI + Web)

A complete web-based Hangman game with a Python (FastAPI) backend and a
plain HTML/CSS/JavaScript frontend. No frontend build step required.

## Project structure

```
hangman/
├── main.py              # FastAPI backend + game logic + REST API
├── requirements.txt     # Python dependencies
├── README.md
└── static/
    ├── index.html       # Page markup + SVG gallows
    ├── style.css        # Styling
    └── script.js        # Frontend logic, talks to the API
```

## Setup

```bash
cd hangman
python -m venv .venv
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# macOS / Linux:
# source .venv/bin/activate

pip install -r requirements.txt
```

## Run

```bash
uvicorn main:app --reload
```

Then open http://127.0.0.1:8000 in your browser.

## How to play

- A random word is chosen; you see one underscore per letter.
- Click letters (or type on your physical keyboard) to guess.
- Each wrong guess draws another part of the hangman.
- You have 6 wrong guesses before you lose.
- Click **New Game** to start over.

## API

| Method | Endpoint     | Body                              | Description            |
|--------|--------------|-----------------------------------|------------------------|
| POST   | `/api/new`   | –                                 | Start a new game       |
| POST   | `/api/guess` | `{ "game_id": "...", "letter": "a" }` | Submit a letter guess |

Interactive API docs are available at http://127.0.0.1:8000/docs

## Notes

Game state is stored in memory (`GAMES` dict in `main.py`), which is fine for a
single-process demo. For production or multiple workers, back it with Redis or a
database so state is shared and persistent.
