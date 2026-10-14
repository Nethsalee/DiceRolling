/* =========================================================
   Yahtzee — Game Logic
   ========================================================= */

'use strict';

// ── State ──────────────────────────────────────────────────
let state = null;

// ── Player avatar colours ───────────────────────────────────
const AVATAR_COLORS = [
  { bg: 'linear-gradient(135deg,#7c5cfc,#4f46e5)', text: '#fff' },
  { bg: 'linear-gradient(135deg,#06b6d4,#0891b2)', text: '#fff' },
];

// ── Category metadata (icons + tooltips) ───────────────────
const CAT_META = {
  ones:           { icon: '①', tip: 'Sum of all 1s' },
  twos:           { icon: '②', tip: 'Sum of all 2s' },
  threes:         { icon: '③', tip: 'Sum of all 3s' },
  fours:          { icon: '④', tip: 'Sum of all 4s' },
  fives:          { icon: '⑤', tip: 'Sum of all 5s' },
  sixes:          { icon: '⑥', tip: 'Sum of all 6s' },
  three_kind:     { icon: '🎯', tip: '3 of a kind → sum of all dice' },
  four_kind:      { icon: '🎯', tip: '4 of a kind → sum of all dice' },
  full_house:     { icon: '🏠', tip: '3 of one + 2 of another → 25 pts' },
  small_straight: { icon: '📈', tip: '4 sequential numbers → 30 pts' },
  large_straight: { icon: '📊', tip: '5 sequential numbers → 40 pts' },
  yahtzee:        { icon: '⭐', tip: 'All 5 dice the same → 50 pts!' },
  chance:         { icon: '🎲', tip: 'Any roll → sum of all dice' },
};

// ── Client-side scoring (mirrors server logic) ─────────────
function clientScore(dice, category) {
  const counts = {};
  dice.forEach(d => { counts[d] = (counts[d] || 0) + 1; });
  const vals = Object.values(counts);
  const sum  = dice.reduce((a, b) => a + b, 0);
  const set  = new Set(dice);

  if (category === 'ones')    return dice.filter(d => d === 1).length * 1;
  if (category === 'twos')    return dice.filter(d => d === 2).length * 2;
  if (category === 'threes')  return dice.filter(d => d === 3).length * 3;
  if (category === 'fours')   return dice.filter(d => d === 4).length * 4;
  if (category === 'fives')   return dice.filter(d => d === 5).length * 5;
  if (category === 'sixes')   return dice.filter(d => d === 6).length * 6;
  if (category === 'three_kind')     return Math.max(...vals) >= 3 ? sum : 0;
  if (category === 'four_kind')      return Math.max(...vals) >= 4 ? sum : 0;
  if (category === 'full_house') {
    const sv = vals.sort((a,b)=>a-b);
    return (sv[0]===2 && sv[1]===3) ? 25 : 0;
  }
  if (category === 'small_straight') {
    const straights = [[1,2,3,4],[2,3,4,5],[3,4,5,6]];
    return straights.some(s => s.every(n => set.has(n))) ? 30 : 0;
  }
  if (category === 'large_straight') {
    return (set.size === 5 && (set.has(1)&&set.has(5) || set.has(2)&&set.has(6))) ? 40 : 0;
  }
  if (category === 'yahtzee') return set.size === 1 ? 50 : 0;
  if (category === 'chance')  return sum;
  return 0;
}

// ── SVG Dice Faces ──────────────────────────────────────────
const PIP_LAYOUTS = {
  1: [[50,50]],
  2: [[28,28],[72,72]],
  3: [[28,28],[50,50],[72,72]],
  4: [[28,28],[72,28],[28,72],[72,72]],
  5: [[28,28],[72,28],[50,50],[28,72],[72,72]],
  6: [[28,22],[72,22],[28,50],[72,50],[28,78],[72,78]],
};

function diceSVG(value, isHeld) {
  const pips = PIP_LAYOUTS[value] || [];
  const pipColor = isHeld ? '#10b981' : '#f0eeff';
  const pipsHTML = pips.map(([cx,cy]) =>
    `<circle cx="${cx}" cy="${cy}" r="7" fill="${pipColor}"/>`
  ).join('');
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${pipsHTML}</svg>`;
}

// ── Screen management ───────────────────────────────────────
function showScreen(id) {
  ['start-screen','game-screen','leaderboard-screen'].forEach(s => {
    document.getElementById(s).classList.toggle('hidden', s !== id);
  });
}

// ── Toast notifications ─────────────────────────────────────
function showToast(msg, special = false) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast' + (special ? ' special' : '');
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.35s ease forwards';
    setTimeout(() => toast.remove(), 350);
  }, 2400);
}

// ── Confetti burst ──────────────────────────────────────────
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = Array.from({length: 140}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * -canvas.height * 0.5,
    vx: (Math.random() - 0.5) * 7,
    vy: Math.random() * 4 + 2,
    w: Math.random() * 10 + 5,
    h: Math.random() * 6 + 3,
    rot: Math.random() * 360,
    rotV: (Math.random() - 0.5) * 8,
    color: ['#7c5cfc','#a78bfa','#38bdf8','#fde68a','#f59e0b','#10b981','#f43f5e'][Math.floor(Math.random()*7)],
    alpha: 1,
  }));

  let frame;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    pieces.forEach(p => {
      if (p.alpha <= 0) return;
      alive = true;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.rotV;
      p.vy += 0.08;
      if (p.y > canvas.height * 0.8) p.alpha -= 0.02;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      ctx.restore();
    });
    if (alive) frame = requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  draw();
  setTimeout(() => { cancelAnimationFrame(frame); ctx.clearRect(0,0,canvas.width,canvas.height); }, 4000);
}

// ── Render roll pips ────────────────────────────────────────
function renderRollPips(left) {
  const container = document.getElementById('roll-pips');
  container.innerHTML = [0,1,2].map(i =>
    `<div class="roll-pip${i >= left ? ' used' : ''}"></div>`
  ).join('');
}

// ── Render player panels ────────────────────────────────────
function renderPlayers() {
  [0, 1].forEach(p => {
    const panel     = document.getElementById(`player-panel-${p}`);
    const nameEl    = document.getElementById(`player-name-${p}`);
    const avatarEl  = document.getElementById(`player-avatar-${p}`);
    const totalEl   = document.getElementById(`player-total-${p}`);

    if (nameEl)   nameEl.textContent   = state.players[p];
    if (avatarEl) avatarEl.textContent = state.players[p].charAt(0).toUpperCase();

    const isActive = p === state.current_player && !state.game_over;
    panel.className = 'player-panel' + (isActive ? ' active' : '');

    if (state.game_over && state.totals[p] > state.totals[1 - p]) {
      panel.classList.add('winner');
    }

    if (totalEl) totalEl.textContent = state.totals[p];
  });
}

// ── Render dice ─────────────────────────────────────────────
function renderDice(animate = false) {
  const row = document.getElementById('dice-row');
  row.innerHTML = state.dice.map((val, i) => {
    const held   = state.held[i];
    const locked = !state.has_rolled;
    const wrapClass = 'die-wrap' + (held ? ' held' : '');
    const dieClass  = 'die' + (locked ? ' locked' : '');
    const inner = state.has_rolled
      ? diceSVG(val, held)
      : `<span class="die-question">?</span>`;
    return `
      <div class="${wrapClass}" id="die-wrap-${i}">
        <div class="${dieClass}" id="die-${i}" onclick="toggleHold(${i})">
          ${inner}
        </div>
        <span class="die-held-label">HELD</span>
      </div>`;
  }).join('');

  if (animate) {
    state.dice.forEach((_, i) => {
      if (!state.held[i]) {
        const el = document.getElementById(`die-${i}`);
        if (el) {
          el.classList.add('rolling');
          el.addEventListener('animationend', () => el.classList.remove('rolling'), {once: true});
        }
      }
    });
  }
}

// ── Upper section bonus tracker ─────────────────────────────
function upperTotal(scorecard) {
  return ['ones','twos','threes','fours','fives','sixes']
    .reduce((s, c) => s + (scorecard[c] ?? 0), 0);
}

// ── Render scorecard ────────────────────────────────────────
function renderScorecard() {
  // Headers
  document.getElementById('sc-p1-name').textContent = state.players[0];
  document.getElementById('sc-p2-name').textContent = state.players[1];

  const cur  = state.current_player;
  const sc   = state.scorecards;
  const dice = state.dice;

  // Bonus trackers
  [0,1].forEach(p => {
    const up  = upperTotal(sc[p]);
    const el  = document.getElementById(`bonus-tracker-${p}`);
    const initial = state.players[p].charAt(0).toUpperCase();
    if (el) {
      if (up >= 63) {
        el.textContent = `${initial}: +35 ✓`;
        el.className = 'bonus-tracker earned';
      } else {
        el.textContent = `${initial}: ${up}/63`;
        el.className = 'bonus-tracker';
      }
    }
  });

  const categories = state.categories;

  function buildRows(cats) {
    return cats.map(cat => {
      const meta  = CAT_META[cat] || { icon:'🎲', tip:'' };
      const label = state.category_labels[cat];
      const cells = [0,1].map(p => {
        const val    = sc[p][cat];
        const filled = val !== null;
        const isCur  = p === cur && !state.game_over;
        const canClick = !filled && isCur && state.has_rolled;
        const preview  = canClick ? clientScore(dice, cat) : null;

        let cls  = 'score-cell';
        if (filled)  cls += ' filled';
        else if (isCur && state.has_rolled) cls += ' available';

        const displayVal = filled
          ? val
          : (preview !== null ? `<span class="preview-val">${preview}</span>` : '—');

        const click = canClick ? `onclick="chooseCategory('${cat}')"` : '';
        return `<td class="${cls}" ${click}>${displayVal}</td>`;
      }).join('');

      const tipHTML = meta.tip
        ? `<span class="tooltip-wrap"><span class="tooltip-icon">?</span><span class="tooltip-text">${meta.tip}</span></span>`
        : '';

      return `<tr>
        <td class="cat"><span class="cat-icon">${meta.icon}</span>${label}${tipHTML}</td>
        ${cells}
      </tr>`;
    }).join('');
  }

  const upper = ['ones','twos','threes','fours','fives','sixes'];
  const lower = ['three_kind','four_kind','full_house','small_straight','large_straight','yahtzee','chance'];

  document.getElementById('upper-rows').innerHTML = buildRows(upper);
  document.getElementById('lower-rows').innerHTML = buildRows(lower);

  document.getElementById('p1-total').textContent = state.totals[0];
  document.getElementById('p2-total').textContent = state.totals[1];
}

// ── Main render ─────────────────────────────────────────────
function render(animateDice = false) {
  renderPlayers();
  renderDice(animateDice);
  renderRollPips(state.rolls_left);
  renderScorecard();

  // Turn badge
  const banner = document.getElementById('turn-banner');
  if (state.game_over) {
    banner.innerHTML = `<span class="turn-badge">🏁 Game Over!</span>`;
  } else {
    const name = state.players[state.current_player];
    const rollsLeft = state.rolls_left;
    const rollText = rollsLeft === 3 ? 'Roll to start your turn' : `${rollsLeft} roll${rollsLeft !== 1 ? 's' : ''} left`;
    banner.innerHTML = `<span class="turn-badge">✨ ${name}'s turn · ${rollText}</span>`;
  }

  // Roll button
  const rollBtn = document.getElementById('roll-btn');
  rollBtn.disabled = state.rolls_left === 0 || state.game_over;
  if (state.rolls_left === 0 && !state.game_over) {
    setMessage('Choose a category to score!');
  }
}

// ── Message ─────────────────────────────────────────────────
function setMessage(msg) {
  const el = document.getElementById('message');
  el.textContent = msg;
}

// ── API helpers ──────────────────────────────────────────────
async function api(path, body = null) {
  const opts = body
    ? { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) }
    : { method: 'POST' };
  const res = await fetch(path, opts);
  return res.json();
}

// ── Actions ──────────────────────────────────────────────────
async function startGame() {
  const p1 = document.getElementById('player1').value.trim() || 'Player 1';
  const p2 = document.getElementById('player2').value.trim() || 'Player 2';
  const data = await api('/api/new_game', { player1: p1, player2: p2 });
  state = data;
  showScreen('game-screen');
  setMessage('');
  render(false);
}

async function roll() {
  const btn = document.getElementById('roll-btn');
  btn.classList.add('shaking');
  btn.addEventListener('animationend', () => btn.classList.remove('shaking'), {once: true});

  const data = await api('/api/roll');
  if (data.error) { showToast(data.error); return; }
  state = data;
  setMessage('');
  render(true);

  // Check for Yahtzee
  if (state.has_rolled && new Set(state.dice).size === 1) {
    setTimeout(() => {
      showToast('🎉 YAHTZEE!! Amazing roll!', true);
      launchConfetti();
    }, 500);
  }
}

async function toggleHold(index) {
  if (!state.has_rolled || state.rolls_left === 0) return;
  const data = await api('/api/toggle_hold', { index });
  if (data.error) { showToast(data.error); return; }
  state = data;
  renderDice(false);
}

async function chooseCategory(category) {
  if (!state.has_rolled) { showToast('Roll the dice first!'); return; }
  const cur = state.current_player;
  if (state.scorecards[cur][category] !== null) return;

  // Detect upper bonus before scoring
  const wasBonus = upperTotal(state.scorecards[cur]) >= 63;

  const data = await api('/api/score', { category });
  if (data.error) { showToast(data.error); return; }
  state = data;

  // Bonus earned?
  const prevPlayer = cur; // same player index before turn change
  const isBonus = upperTotal(state.scorecards[prevPlayer]) >= 63;
  if (!wasBonus && isBonus) showToast('🎊 Upper Bonus +35 earned!', true);

  setMessage('');

  if (data.game_over) {
    render(false);
    setTimeout(showGameOverModal, 600);
  } else {
    render(false);
    const nextName = state.players[state.current_player];
    showToast(`${nextName}'s turn!`);
  }
}

// ── Game Over Modal ──────────────────────────────────────────
function showGameOverModal() {
  const [t0, t1] = state.totals;
  const [n0, n1] = state.players;
  let winnerText, isTie = false;
  if (t0 > t1)       winnerText = n0;
  else if (t1 > t0)  winnerText = n1;
  else               { winnerText = 'It\'s a Tie!'; isTie = true; }

  document.getElementById('modal-winner-text').textContent = isTie ? 'It\'s a Tie!' : `🎉 ${winnerText} Wins!`;
  document.getElementById('modal-p1-name').textContent  = n0;
  document.getElementById('modal-p1-score').textContent = t0;
  document.getElementById('modal-p2-name').textContent  = n1;
  document.getElementById('modal-p2-score').textContent = t1;

  const c0 = document.getElementById('modal-score-0');
  const c1 = document.getElementById('modal-score-1');
  c0.className = 'modal-score-card' + (t0 >= t1 && !isTie ? ' winner' : '');
  c1.className = 'modal-score-card' + (t1 >= t0 && !isTie ? ' winner' : '');

  document.getElementById('game-over-modal').classList.remove('hidden');
  if (!isTie) launchConfetti();
}

function closeModal() {
  document.getElementById('game-over-modal').classList.add('hidden');
}

// ── Leaderboard ──────────────────────────────────────────────
async function showLeaderboard() {
  const rows = await fetch('/api/leaderboard').then(r => r.json());
  const medals = ['🥇','🥈','🥉'];
  const tbody  = document.getElementById('lb-body');

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="lb-empty">No games finished yet. Play one!</td></tr>`;
  } else {
    tbody.innerHTML = rows.map((row, i) => `
      <tr>
        <td class="lb-rank">
          ${i < 3 ? `<span class="rank-medal">${medals[i]}</span>` : `<span class="rank-num">#${i+1}</span>`}
        </td>
        <td class="lb-name">${escHtml(row.player_name)}</td>
        <td class="lb-score">${row.score}</td>
        <td class="lb-date">${row.date}</td>
      </tr>`).join('');
  }
  showScreen('leaderboard-screen');
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function showStart() { showScreen('start-screen'); }

// ── Keyboard shortcuts ───────────────────────────────────────
document.addEventListener('keydown', e => {
  if (!state || state.game_over) return;
  if (e.key === ' ' || e.key === 'Enter') {
    const btn = document.getElementById('roll-btn');
    if (!btn.disabled) { e.preventDefault(); roll(); }
  }
  // Hold dice with keys 1-5
  if (e.key >= '1' && e.key <= '5') {
    const idx = parseInt(e.key) - 1;
    toggleHold(idx);
  }
});

// ── Enter key on player name inputs ─────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  ['player1','player2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') startGame(); });
  });
});
