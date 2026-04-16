const COLORS = 5;

let players = [];
let history = [];
let colorIdx = 0;

// ----------------------
// THEME
// ----------------------
function applyTheme(theme) {
  const btn = document.getElementById("themeBtn");

  if (theme === "dark") {
    document.body.classList.add("dark");
    btn.textContent = "☀️";
  } else {
    document.body.classList.remove("dark");
    btn.textContent = "🌙";
  }
}

function toggleTheme() {
  const isDark = document.body.classList.contains("dark");
  const newTheme = isDark ? "light" : "dark";
  localStorage.setItem("pc-theme", newTheme);
  applyTheme(newTheme);
}

function loadTheme() {
  const saved = localStorage.getItem("pc-theme");

  if (saved === "dark" || saved === "light") {
    applyTheme(saved);
    return;
  }

  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  applyTheme(prefersDark ? "dark" : "light");
}

// ----------------------
// STORAGE
// ----------------------
function savePlayers() {
  try {
    localStorage.setItem("pc-players", JSON.stringify(players));
  } catch (e) {}
}

function saveHistory() {
  try {
    localStorage.setItem("pc-history", JSON.stringify(history));
  } catch (e) {}
}

function loadStorage() {
  try {
    const p = localStorage.getItem("pc-players");
    const h = localStorage.getItem("pc-history");

    if (p) {
      players = JSON.parse(p);
      colorIdx = players.length % COLORS;
    }

    if (h) {
      history = JSON.parse(h);
    }
  } catch (e) {
    players = [];
    history = [];
  }
}

// ----------------------
// HELPERS
// ----------------------
function initials(name) {
  return name
    .trim()
    .split(" ")
    .filter(w => w.length > 0)
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate() {
  return new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

// ----------------------
// TABS
// ----------------------
function switchTab(tab) {
  const gameTab = document.getElementById("tab-game");
  const historyTab = document.getElementById("tab-history");

  gameTab.classList.toggle("hidden", tab !== "game");
  historyTab.classList.toggle("hidden", tab !== "history");

  document.querySelectorAll(".tab").forEach((t, i) => {
    t.classList.toggle("active", (i === 0) === (tab === "game"));
  });

  if (tab === "history") renderHistory();
}

// ----------------------
// PLAYERS
// ----------------------
function addPlayer() {
  const inp = document.getElementById("nameInput");
  const name = inp.value.trim();

  if (!name) return;

  players.push({
    name,
    score: 0,
    color: colorIdx % COLORS
  });

  colorIdx++;
  inp.value = "";

  savePlayers();
  renderPlayers();
}

function removePlayer(i) {
  players.splice(i, 1);
  savePlayers();
  renderPlayers();
}

function changeScore(i, delta) {
  players[i].score += delta;
  savePlayers();
  renderPlayers();
}

function setScore(i, val) {
  const n = parseInt(val, 10);

  if (!isNaN(n)) {
    players[i].score = n;
    savePlayers();
  }
}

function resetScores() {
  players.forEach(p => (p.score = 0));
  savePlayers();
  renderPlayers();
}

// ----------------------
// MODAL
// ----------------------
function openSaveModal() {
  if (!players.length) return;

  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("gameNameInput").focus();
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

function saveGame() {
  if (!players.length) return;

  const inp = document.getElementById("gameNameInput");
  const gameName = inp.value.trim() || `Game ${history.length + 1}`;

  inp.value = "";

  history.unshift({
    name: gameName,
    date: formatDate(),
    players: players.map(p => ({ ...p }))
  });

  saveHistory();
  closeModal();
  resetScores();
  switchTab("history");
}

function deleteGame(i) {
  history.splice(i, 1);
  saveHistory();
  renderHistory();
}

// ----------------------
// RENDER
// ----------------------
function renderPlayers() {
  const el = document.getElementById("players");

  if (!players.length) {
    el.innerHTML = `<p class="empty">No players yet — add one below</p>`;
    return;
  }

  el.innerHTML = players
    .map(
      (p, i) => `
      <div class="player-card">
        <div class="avatar c${p.color}">${initials(p.name)}</div>
        <span class="player-name">${p.name}</span>

        <div class="controls">
          <button class="btn" onclick="changeScore(${i},-1)">−</button>

          <input class="score-input" type="number" value="${p.score}"
            onchange="setScore(${i},this.value)"
            onblur="setScore(${i},this.value);renderPlayers()" />

          <button class="btn" onclick="changeScore(${i},1)">+</button>
          <button class="btn btn-del" onclick="removePlayer(${i})">×</button>
        </div>
      </div>
    `
    )
    .join("");
}

function renderHistory() {
  const el = document.getElementById("history");
  const empty = document.getElementById("history-empty");

  if (!history.length) {
    el.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");

  el.innerHTML = history
    .map((g, gi) => {
      const maxScore = Math.max(...g.players.map(p => p.score));

      const rows = g.players
        .slice()
        .sort((a, b) => b.score - a.score)
        .map(
          p => `
          <div class="game-row">
            <div class="game-av c${p.color}">${initials(p.name)}</div>
            <span class="game-player">${p.name}</span>
            ${p.score === maxScore ? `<span class="winner-badge">winner</span>` : ""}
            <span class="game-score">${p.score}</span>
          </div>
        `
        )
        .join("");

      return `
        <div class="game-card">
          <div class="game-header">
            <div>
              <div class="game-name">${g.name}</div>
              <div class="game-date">${g.date}</div>
            </div>
            <button class="del-game" onclick="deleteGame(${gi})">×</button>
          </div>
          <div class="game-scores">${rows}</div>
        </div>
      `;
    })
    .join("");
}

// ----------------------
// EVENTS
// ----------------------
function initEvents() {
  document.getElementById("themeBtn").addEventListener("click", toggleTheme);

  document.getElementById("tabGameBtn").addEventListener("click", () => {
    switchTab("game");
  });

  document.getElementById("tabHistoryBtn").addEventListener("click", () => {
    switchTab("history");
  });

  document.getElementById("addPlayerBtn").addEventListener("click", addPlayer);

  document.getElementById("resetBtn").addEventListener("click", resetScores);

  document.getElementById("saveGameBtn").addEventListener("click", openSaveModal);

  document.getElementById("cancelModalBtn").addEventListener("click", closeModal);

  document.getElementById("confirmSaveBtn").addEventListener("click", saveGame);

  document.getElementById("nameInput").addEventListener("keydown", e => {
    if (e.key === "Enter") addPlayer();
  });

  document.getElementById("gameNameInput").addEventListener("keydown", e => {
    if (e.key === "Enter") saveGame();
  });

  document.getElementById("modal").addEventListener("click", e => {
    if (e.target === document.getElementById("modal")) closeModal();
  });
}

// ----------------------
// INIT
// ----------------------
function init() {
  loadTheme();
  loadStorage();
  initEvents();
  renderPlayers();
}

init();