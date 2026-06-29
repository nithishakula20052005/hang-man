"""FastAPI backend for a web-based Hangman game.

Run with:  uvicorn main:app --reload
Then open: http://127.0.0.1:8000
"""
import random
import uuid
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(title="Hangman")

WORDS = [
    "python", "hangman", "computer", "keyboard", "developer",
    "function", "variable", "algorithm", "database", "network",
    "rainbow", "elephant", "mountain", "library", "treasure",
    "fastapi", "frontend", "backend", "javascript", "internet",
]

MAX_WRONG = 6

# In-memory store of active games keyed by game id.
# (For a single-process demo this is fine; use Redis/DB for production.)
GAMES: dict[str, dict] = {}


class GuessRequest(BaseModel):
    game_id: str
    letter: str


def public_state(game: dict) -> dict:
    """Return the game state that is safe to send to the client."""
    word = game["word"]
    guessed = game["guessed"]
    won = all(c in guessed for c in word)
    lost = game["wrong"] >= MAX_WRONG

    # Mask unguessed letters as underscores
    masked = [c if c in guessed else "_" for c in word]

    return {
        "game_id": game["id"],
        "masked_word": masked,
        "guessed": sorted(guessed),
        "wrong": game["wrong"],
        "wrong_left": MAX_WRONG - game["wrong"],
        "max_wrong": MAX_WRONG,
        "won": won,
        "lost": lost,
        "finished": won or lost,
        # Only reveal the answer once the game is over
        "word": word if (won or lost) else None,
    }


@app.post("/api/new")
def new_game() -> dict:
    """Start a new game and return its initial state."""
    game_id = uuid.uuid4().hex
    game = {
        "id": game_id,
        "word": random.choice(WORDS),
        "guessed": set(),
        "wrong": 0,
    }
    GAMES[game_id] = game
    return public_state(game)


@app.post("/api/guess")
def guess(req: GuessRequest) -> dict:
    """Process a single-letter guess for an existing game."""
    game = GAMES.get(req.game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found. Start a new game.")

    letter = req.letter.strip().lower()
    if len(letter) != 1 or not letter.isalpha():
        raise HTTPException(status_code=400, detail="Please guess a single letter.")

    won = all(c in game["guessed"] for c in game["word"])
    if won or game["wrong"] >= MAX_WRONG:
        raise HTTPException(status_code=400, detail="Game is already finished.")

    if letter not in game["guessed"]:
        game["guessed"].add(letter)
        if letter not in game["word"]:
            game["wrong"] += 1

    # Clean up finished games to avoid unbounded memory growth
    state = public_state(game)
    if state["finished"]:
        GAMES.pop(game["id"], None)

    return state


# --- Static frontend ---
STATIC_DIR = Path(__file__).parent / "static"


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
