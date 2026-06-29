const wordEl = document.getElementById("word");
const messageEl = document.getElementById("message");
const wrongLeftEl = document.getElementById("wrong-left");
const keyboardEl = document.getElementById("keyboard");
const newGameBtn = document.getElementById("new-game");
const parts = document.querySelectorAll(".figure .part");

let gameId = null;

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

// Build the on-screen keyboard once.
function buildKeyboard() {
    keyboardEl.innerHTML = "";
    for (const letter of LETTERS) {
        const btn = document.createElement("button");
        btn.textContent = letter;
        btn.dataset.letter = letter;
        btn.addEventListener("click", () => guess(letter));
        keyboardEl.appendChild(btn);
    }
}

function setMessage(text, kind = "") {
    messageEl.textContent = text || " ";
    messageEl.className = "message" + (kind ? " " + kind : "");
}

// Render the masked word as underscores / revealed letters.
function renderWord(masked) {
    wordEl.innerHTML = "";
    for (const ch of masked) {
        const span = document.createElement("span");
        span.textContent = ch === "_" ? "" : ch;
        wordEl.appendChild(span);
    }
}

// Reveal hangman body parts based on number of wrong guesses.
function renderFigure(wrong) {
    parts.forEach((part) => {
        const idx = Number(part.dataset.part);
        part.classList.toggle("show", idx < wrong);
    });
}

// Update keyboard button states from the guessed list + current word.
function renderKeyboard(state) {
    const guessed = new Set(state.guessed);
    const inWord = new Set(state.masked_word.filter((c) => c !== "_"));
    keyboardEl.querySelectorAll("button").forEach((btn) => {
        const letter = btn.dataset.letter;
        const used = guessed.has(letter);
        btn.disabled = used || state.finished;
        btn.classList.toggle("correct", used && inWord.has(letter));
        btn.classList.toggle("wrong", used && !inWord.has(letter));
    });
}

function render(state) {
    gameId = state.game_id;
    renderWord(state.masked_word);
    renderFigure(state.wrong);
    renderKeyboard(state);
    wrongLeftEl.textContent = state.wrong_left;

    if (state.won) {
        setMessage("🎉 You won!", "win");
    } else if (state.lost) {
        setMessage(`💀 You lost! The word was "${state.word}".`, "lose");
    } else {
        setMessage("");
    }
}

async function api(path, body) {
    const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Request failed" }));
        throw new Error(err.detail || "Request failed");
    }
    return res.json();
}

async function newGame() {
    try {
        const state = await api("/api/new");
        render(state);
    } catch (e) {
        setMessage(e.message, "lose");
    }
}

async function guess(letter) {
    if (!gameId) return;
    try {
        const state = await api("/api/guess", { game_id: gameId, letter });
        render(state);
    } catch (e) {
        setMessage(e.message, "lose");
    }
}

// Allow physical keyboard input too.
document.addEventListener("keydown", (e) => {
    const letter = e.key.toLowerCase();
    if (LETTERS.includes(letter)) {
        const btn = keyboardEl.querySelector(`button[data-letter="${letter}"]`);
        if (btn && !btn.disabled) guess(letter);
    }
});

newGameBtn.addEventListener("click", newGame);

buildKeyboard();
newGame();
