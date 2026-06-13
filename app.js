// Golf New Peoria Tool - Application Logic

// Default configuration
const DEFAULT_PARS = [4, 4, 3, 4, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5, 4, 3, 4, 5]; // 18 holes standard par (72)
const DEFAULT_HIDDEN_HOLES = [
  true, true, false, true, true, false, true, true, false, // OUT: 1, 2, 4, 5, 7, 8
  true, true, false, true, true, false, true, true, false  // IN: 10, 11, 13, 14, 16, 17
]; // Standard New Peoria 12 hidden holes (6 OUT, 6 IN, Par sum 48)

// App State
let state = {
  theme: 'dark',
  coursePars: [...DEFAULT_PARS],
  hiddenHoles: [...DEFAULT_HIDDEN_HOLES],
  rules: {
    cutLimit: 'double-par',
    maxHdcp: 36,
    minHdcp: 'none',
    tieBreaker: 'low-hdcp'
  },
  players: [],
  printTitle: 'ゴルフコンペ 結果発表'
};

let isRenderingScorecard = false;

// Realistic demo data names and scores (using completely generic, copyright-safe names)
const DEMO_PLAYERS = [
  { name: '佐藤 茂', scores: [4, 5, 3, 4, 5, 4, 3, 4, 5, 4, 5, 3, 4, 6, 4, 3, 4, 5] }, 
  { name: '田中 太郎', scores: [6, 5, 4, 5, 7, 5, 4, 5, 6, 5, 6, 4, 5, 6, 5, 3, 5, 6] }, 
  { name: '高橋 健二', scores: [5, 4, 3, 4, 5, 4, 3, 4, 6, 4, 4, 3, 4, 5, 5, 4, 4, 5] }, 
  { name: '渡辺 裕子', scores: [5, 6, 3, 5, 8, 4, 4, 5, 7, 6, 5, 4, 5, 7, 5, 3, 6, 5] }, 
  { name: '伊藤 淳', scores: [4, 4, 3, 5, 5, 4, 3, 4, 5, 5, 4, 3, 4, 5, 4, 3, 5, 5] }, 
  { name: '山本 恵子', scores: [5, 5, 3, 6, 6, 5, 4, 5, 6, 6, 5, 3, 5, 7, 6, 4, 5, 6] }, 
  { name: '中村 広志', scores: [7, 6, 4, 6, 7, 5, 5, 6, 8, 6, 7, 4, 5, 8, 6, 4, 6, 7] }, 
  { name: '小林 明美', scores: [5, 5, 4, 4, 6, 4, 3, 5, 5, 5, 4, 3, 4, 5, 4, 3, 4, 5] }  
];

// Initialize application on load
window.addEventListener('DOMContentLoaded', () => {
  loadStateFromLocalStorage();
  setupTheme();
  renderHoleSelectors();
  initPrintSettings();
  initEventListeners();
  updateCalculationsAndRender();
});

// Load state from LocalStorage
function loadStateFromLocalStorage() {
  const savedState = localStorage.getItem('golf_neopeoria_state');
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState);
      // Ensure backward compatibility or structure validation
      if (parsed.coursePars && parsed.coursePars.length === 18) state.coursePars = parsed.coursePars;
      if (parsed.hiddenHoles && parsed.hiddenHoles.length === 18) state.hiddenHoles = parsed.hiddenHoles;
      if (parsed.rules) state.rules = { ...state.rules, ...parsed.rules };
      if (parsed.players) state.players = parsed.players;
      if (parsed.theme) state.theme = parsed.theme;
      if (parsed.printTitle) state.printTitle = parsed.printTitle;
    } catch (e) {
      console.error('Failed to parse local storage state:', e);
    }
  }
}

// Save state to LocalStorage
function saveStateToLocalStorage() {
  localStorage.setItem('golf_neopeoria_state', JSON.stringify(state));
}

// Setup Theme
function setupTheme() {
  const html = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  
  if (state.theme === 'light') {
    html.setAttribute('data-theme', 'light');
    themeIcon.textContent = '🌙';
  } else {
    html.setAttribute('data-theme', 'dark');
    themeIcon.textContent = '☀️';
  }
}

// Handle Theme Toggle Click
function toggleTheme() {
  const html = document.documentElement;
  const themeIcon = document.getElementById('theme-icon');
  if (html.getAttribute('data-theme') === 'dark') {
    html.setAttribute('data-theme', 'light');
    themeIcon.textContent = '🌙';
    state.theme = 'light';
  } else {
    html.setAttribute('data-theme', 'dark');
    themeIcon.textContent = '☀️';
    state.theme = 'dark';
  }
  saveStateToLocalStorage();
}

// Render Hidden Hole configuration boxes
function renderHoleSelectors() {
  // Removed top-left card UI; hidden hole selectors are now rendered directly in scorecard editor header.
}

// Toggle hidden hole
function toggleHiddenHole(index) {
  state.hiddenHoles[index] = !state.hiddenHoles[index];
  
  updateCalculationsAndRender();
  saveStateToLocalStorage();
}

// Update counts & warning labels for hidden holes selection
function updateHiddenHolesSummary() {
  let outCount = 0;
  let inCount = 0;
  let hiddenParSum = 0;
  let totalCoursePar = 0;

  for (let i = 0; i < 18; i++) {
    totalCoursePar += state.coursePars[i];
    if (state.hiddenHoles[i]) {
      hiddenParSum += state.coursePars[i];
      if (i < 9) outCount++;
      else inCount++;
    }
  }

  const totalCourseParEl = document.getElementById('total-course-par');
  if (totalCourseParEl) totalCourseParEl.textContent = totalCoursePar;

  const hiddenHolesParSumEl = document.getElementById('hidden-holes-par-sum');
  if (hiddenHolesParSumEl) {
    hiddenHolesParSumEl.textContent = hiddenParSum;
    if (hiddenParSum === 48) {
      hiddenHolesParSumEl.style.color = '';
      hiddenHolesParSumEl.style.fontWeight = '700';
    } else {
      hiddenHolesParSumEl.style.color = '#ff4d4d'; // Red text for error
      hiddenHolesParSumEl.style.fontWeight = '800';
    }
  }

  const statsEl = document.getElementById('scorecard-title-stats');
  if (statsEl) {
    statsEl.innerHTML = `
      🔒 隠しホール: OUT <span class="fw-bold" style="color: ${outCount === 6 ? 'var(--primary-light)' : '#ff4d4d'}">${outCount}</span>/6 | 
      IN <span class="fw-bold" style="color: ${inCount === 6 ? 'var(--primary-light)' : '#ff4d4d'}">${inCount}</span>/6 | 
      Par合計: <span class="fw-bold" style="color: ${hiddenParSum === 48 ? 'var(--primary-light)' : '#ff4d4d'}">${hiddenParSum}</span> (推奨48)
    `;
  }
}

// Select standard 12 hidden holes automatically (randomized valid combination)
function selectAutoHiddenHoles() {
  const coursePars = state.coursePars;
  
  // Try to find a random combination of 6 OUT and 6 IN holes with par sum = 48, different from current
  let found = false;
  let attempts = 0;
  let selected = Array(18).fill(false);
  
  while (!found && attempts < 1000) {
    attempts++;
    selected = Array(18).fill(false);
    
    // Choose 6 random from OUT (indices 0-8)
    let outIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    for (let i = outIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [outIndices[i], outIndices[j]] = [outIndices[j], outIndices[i]];
    }
    for (let i = 0; i < 6; i++) {
      selected[outIndices[i]] = true;
    }
    
    // Choose 6 random from IN (indices 9-17)
    let inIndices = [9, 10, 11, 12, 13, 14, 15, 16, 17];
    for (let i = inIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [inIndices[i], inIndices[j]] = [inIndices[j], inIndices[i]];
    }
    for (let i = 0; i < 6; i++) {
      selected[inIndices[i]] = true;
    }
    
    // Calculate par sum
    let parSum = 0;
    for (let i = 0; i < 18; i++) {
      if (selected[i]) parSum += coursePars[i];
    }
    
    // Check if different from current selection
    let isIdentical = true;
    for (let i = 0; i < 18; i++) {
      if (selected[i] !== state.hiddenHoles[i]) {
        isIdentical = false;
        break;
      }
    }
    
    if (parSum === 48 && !isIdentical) {
      found = true;
    }
  }
  
  // Fallback if no par 48 combination is found (or if user customized pars radically)
  if (!found) {
    selected = Array(18).fill(false);
    let outIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    for (let i = outIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [outIndices[i], outIndices[j]] = [outIndices[j], outIndices[i]];
    }
    for (let i = 0; i < 6; i++) selected[outIndices[i]] = true;
    
    let inIndices = [9, 10, 11, 12, 13, 14, 15, 16, 17];
    for (let i = inIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [inIndices[i], inIndices[j]] = [inIndices[j], inIndices[i]];
    }
    for (let i = 0; i < 6; i++) selected[inIndices[i]] = true;
  }
  
  state.hiddenHoles = selected;
  updateCalculationsAndRender();
  saveStateToLocalStorage();
}

// Clear all selected hidden holes
function clearHiddenHoles() {
  state.hiddenHoles = Array(18).fill(false);
  updateCalculationsAndRender();
  saveStateToLocalStorage();
}

// Initialize general UI Event listeners
function initEventListeners() {
  // Theme toggle
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  // Hidden holes config actions
  document.getElementById('btn-auto-hidden').addEventListener('click', selectAutoHiddenHoles);
  document.getElementById('btn-clear-hidden').addEventListener('click', clearHiddenHoles);

  // Rule dropdown changes
  const rules = ['rule-cut-limit', 'rule-max-hdcp', 'rule-min-hdcp', 'rule-tie-breaker'];
  rules.forEach(id => {
    const element = document.getElementById(id);
    
    // Set initial value from state
    const ruleKey = id.replace('rule-', '').replace(/-([a-z])/g, g => g[1].toUpperCase());
    element.value = state.rules[ruleKey];

    element.addEventListener('change', (e) => {
      let val = e.target.value;
      if (val !== 'none' && !isNaN(val)) val = parseFloat(val);
      state.rules[ruleKey] = val;
      updateCalculationsAndRender();
      saveStateToLocalStorage();
    });
  });

  // Single player add
  document.getElementById('btn-add-player').addEventListener('click', handleAddPlayer);
  document.getElementById('new-player-name').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddPlayer();
  });

  // Bulk input toggle
  document.getElementById('btn-toggle-bulk').addEventListener('click', () => {
    document.getElementById('bulk-entry-container').style.display = 'block';
  });
  document.getElementById('btn-cancel-bulk').addEventListener('click', () => {
    document.getElementById('bulk-entry-container').style.display = 'none';
    document.getElementById('bulk-textarea').value = '';
  });
  document.getElementById('btn-import-bulk').addEventListener('click', handleBulkImport);

  // Demo data generation
  document.getElementById('btn-demo-data').addEventListener('click', generateDemoData);

  // Leaderboard actions
  document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
  document.getElementById('btn-print').addEventListener('click', () => window.print());
  document.getElementById('btn-clear-all').addEventListener('click', handleClearAllPlayers);

  // Modal close
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.getElementById('score-details-modal').addEventListener('click', (e) => {
    if (e.target.id === 'score-details-modal') closeModal();
  });

  // Manual recalculation action
  document.getElementById('btn-recalculate').addEventListener('click', () => {
    updateCalculationsAndRender();
    const btn = document.getElementById('btn-recalculate');
    const oldHTML = btn.innerHTML;
    btn.innerHTML = '✅ 計算完了';
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = oldHTML;
      btn.disabled = false;
    }, 1000);
  });
}

// Add a single player
function handleAddPlayer() {
  const nameInput = document.getElementById('new-player-name');
  const name = nameInput.value.trim();
  if (!name) {
    alert('プレイヤー名を入力してください。');
    return;
  }

  // Create player with empty scores
  const newPlayer = {
    id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    name: name,
    scores: Array(18).fill('') // Initialize empty
  };

  state.players.push(newPlayer);
  nameInput.value = '';
  
  updateCalculationsAndRender();
  saveStateToLocalStorage();

  // Scroll to the new player row
  setTimeout(() => {
    const newRow = document.getElementById(`row-${newPlayer.id}`);
    if (newRow) newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

// Bulk Import scores
function handleBulkImport() {
  const textarea = document.getElementById('bulk-textarea');
  const text = textarea.value.trim();
  if (!text) {
    alert('入力テキストが空です。');
    return;
  }

  const lines = text.split('\n');
  let importCount = 0;

  lines.forEach(line => {
    // Split by comma, tab, or semicolon
    const tokens = line.split(/[,\t;]/).map(t => t.trim());
    if (tokens.length === 0 || !tokens[0]) return;

    const name = tokens[0];
    const scores = [];

    // Extract up to 18 scores
    for (let i = 1; i <= 18; i++) {
      const scoreVal = tokens[i];
      if (scoreVal !== undefined && scoreVal !== '' && !isNaN(scoreVal)) {
        scores.push(parseInt(scoreVal, 10));
      } else {
        scores.push(''); // Fill empty
      }
    }

    // Pad with empty strings if not enough scores provided
    while (scores.length < 18) {
      scores.push('');
    }

    state.players.push({
      id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name: name,
      scores: scores
    });
    importCount++;
  });

  if (importCount > 0) {
    textarea.value = '';
    document.getElementById('bulk-entry-container').style.display = 'none';
    updateCalculationsAndRender();
    saveStateToLocalStorage();
    alert(`${importCount}人のプレイヤーをインポートしました。`);
  } else {
    alert('有効なデータが見つかりませんでした。フォーマットを確認してください。');
  }
}

// Clear all players
function handleClearAllPlayers() {
  if (state.players.length === 0) return;
  if (confirm('すべてのプレイヤーとスコアデータを削除してもよろしいですか？')) {
    state.players = [];
    updateCalculationsAndRender();
    saveStateToLocalStorage();
  }
}

// Generate Demo data
function generateDemoData() {
  state.players = DEMO_PLAYERS.map((p, idx) => ({
    id: `demo_${idx}_${Date.now()}`,
    name: p.name,
    scores: [...p.scores]
  }));
  
  // Make sure standard hidden holes are selected
  state.hiddenHoles = [...DEFAULT_HIDDEN_HOLES];
  renderHoleSelectors();
  
  updateCalculationsAndRender();
  saveStateToLocalStorage();
}

// Core calculation & rendering coordination
function updateCalculationsAndRender() {
  calculateScores();
  updateHiddenHolesSummary();
  renderScorecardEditor();
  renderLeaderboard();
}

// Calculate Gross, Handicap, and Net for all players
function calculateScores() {
  const coursePars = state.coursePars;
  const hiddenHoles = state.hiddenHoles;
  const rules = state.rules;

  const hiddenHoleIndices = [];
  hiddenHoles.forEach((h, idx) => { if (h) hiddenHoleIndices.push(idx); });

  const totalCoursePar = coursePars.reduce((a, b) => a + b, 0);

  state.players.forEach(player => {
    let grossOut = 0;
    let grossIn = 0;
    let hiddenAdjustedSum = 0;
    let scoresEnteredCount = 0;

    player.scores.forEach((sVal, idx) => {
      const par = coursePars[idx];
      let score = sVal !== '' ? parseInt(sVal, 10) : null;
      
      // If score is not entered, default to par for handicap calculation logic, 
      // but note that gross score will show this gap if they haven't finished typing.
      const calcScore = score !== null ? score : par;
      
      if (score !== null) scoresEnteredCount++;

      // Gross calculation
      if (idx < 9) {
        grossOut += (score !== null ? score : 0);
      } else {
        grossIn += (score !== null ? score : 0);
      }

      // Hidden Hole Calculation with double-par / triple-bogey adjustment
      if (hiddenHoles[idx]) {
        let adjustedVal = calcScore;
        if (rules.cutLimit === 'double-par') {
          const maxAllowed = par * 2;
          if (calcScore > maxAllowed) adjustedVal = maxAllowed;
        } else if (rules.cutLimit === 'triple-bogey') {
          const maxAllowed = par + 3;
          if (calcScore > maxAllowed) adjustedVal = maxAllowed;
        }
        hiddenAdjustedSum += adjustedVal;
      }
    });

    player.grossOut = grossOut;
    player.grossIn = grossIn;
    player.grossTotal = grossOut + grossIn;
    player.scoresEnteredCount = scoresEnteredCount;
    player.hiddenHoleAdjustedSum = hiddenAdjustedSum;

    // Calculate Handicap: (Sum * 1.5 - Course Par) * 0.8
    // If hidden holes selection is not exactly 12, adjust scaling factor dynamically
    const hiddenCount = hiddenHoleIndices.length;
    const scaleFactor = hiddenCount > 0 ? (18 / hiddenCount) : 1.5;
    
    let rawHdcp = (hiddenAdjustedSum * scaleFactor - totalCoursePar) * 0.8;
    
    // Apply Max Limit
    if (rules.maxHdcp !== 'none' && rawHdcp > rules.maxHdcp) {
      rawHdcp = rules.maxHdcp;
    }
    // Apply Min Limit
    if (rules.minHdcp !== 'none' && rawHdcp < rules.minHdcp) {
      rawHdcp = rules.minHdcp;
    }

    // Round to 1 decimal place
    player.handicap = Math.round(rawHdcp * 10) / 10;
    
    // Net Score
    player.netScore = Math.round((player.grossTotal - player.handicap) * 10) / 10;
  });
}

// Render the scoreboard editing grid
function renderScorecardEditor() {
  isRenderingScorecard = true;
  const container = document.getElementById('scorecard-rows-list');
  const emptyState = document.getElementById('empty-state-msg');
  
  // Store active element ID to restore focus after rendering
  const activeElId = document.activeElement ? document.activeElement.id : null;
  const activeElSelectionStart = document.activeElement ? document.activeElement.selectionStart : null;
  const activeElSelectionEnd = document.activeElement ? document.activeElement.selectionEnd : null;

  // Clear only scorecard rows (leaves emptyState msg intact)
  const existingRows = container.querySelectorAll('.scorecard-row');
  existingRows.forEach(row => row.remove());

  if (state.players.length === 0) {
    emptyState.style.display = 'block';
    isRenderingScorecard = false;
    return;
  }

  emptyState.style.display = 'none';

  // 1. Render Header Row (Hole numbers - clickable to toggle hidden status!)
  const headerRow = document.createElement('div');
  headerRow.className = 'scorecard-row header-row';
  headerRow.style.fontWeight = '700';
  headerRow.style.borderBottom = '2px solid var(--border-subtle)';
  headerRow.style.paddingBottom = '0.5rem';

  const headerMeta = document.createElement('div');
  headerMeta.className = 'player-meta';
  headerMeta.innerHTML = `<div style="font-size: 1rem; color: var(--text-secondary); font-weight: 700;">Hole / ホール</div>`;

  const headerInputs = document.createElement('div');
  headerInputs.className = 'scores-inputs-container';
  for (let i = 0; i < 18; i++) {
    const isHidden = state.hiddenHoles[i];
    const wrapper = document.createElement('div');
    wrapper.className = `score-input-wrapper ${isHidden ? 'score-wrapper-hidden' : ''}`;
    wrapper.style.cursor = 'pointer';
    wrapper.style.userSelect = 'none';
    wrapper.title = isHidden ? "クリックして隠しホールを解除" : "クリックして隠しホールに設定";
    
    // Display lock icon for hidden holes, and color differently
    wrapper.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.2;">
        <span style="font-size: 0.8rem; height: 1.2rem; display: flex; align-items: center; justify-content: center;">
          ${isHidden ? '🔒' : '&nbsp;'}
        </span>
        <span style="font-size: 0.95rem; font-weight: 800; color: ${isHidden ? 'var(--accent-gold)' : 'var(--text-secondary)'};">
          ${i + 1}
        </span>
      </div>
    `;

    // Click handler to toggle hidden hole status reactively
    wrapper.addEventListener('click', () => {
      toggleHiddenHole(i);
    });

    headerInputs.appendChild(wrapper);

    // Insert OUT subtotal header after hole 9 (index 8)
    if (i === 8) {
      const outSubHeader = document.createElement('div');
      outSubHeader.className = 'score-input-wrapper';
      outSubHeader.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.2;">
          <span style="font-size: 0.8rem; height: 1.2rem;">&nbsp;</span>
          <span style="font-size: 0.9rem; font-weight: 800; color: var(--accent-gold);">OUT</span>
        </div>
      `;
      headerInputs.appendChild(outSubHeader);
    }
    // Insert IN subtotal header after hole 18 (index 17)
    if (i === 17) {
      const inSubHeader = document.createElement('div');
      inSubHeader.className = 'score-input-wrapper';
      inSubHeader.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.2;">
          <span style="font-size: 0.8rem; height: 1.2rem;">&nbsp;</span>
          <span style="font-size: 0.9rem; font-weight: 800; color: var(--accent-gold);">IN</span>
        </div>
      `;
      headerInputs.appendChild(inSubHeader);
    }
  }

  const headerActions = document.createElement('div');
  headerActions.style.display = 'grid';
  headerActions.style.gridTemplateColumns = '50px 55px 55px 32px';
  headerActions.style.alignItems = 'center';
  headerActions.style.gap = '0.5rem';
  headerActions.style.justifyContent = 'end';
  headerActions.innerHTML = `
    <span style="font-size: 0.95rem; color: var(--text-muted); font-weight: 700; text-align: right; white-space: nowrap;">グロス</span>
    <span style="font-size: 0.95rem; color: var(--text-muted); font-weight: 700; text-align: right; white-space: nowrap;">ハンデ</span>
    <span style="font-size: 0.95rem; color: var(--text-muted); font-weight: 700; text-align: right; white-space: nowrap;">ネット</span>
    <div></div>
  `;

  headerRow.appendChild(headerMeta);
  headerRow.appendChild(headerInputs);
  headerRow.appendChild(headerActions);
  container.appendChild(headerRow);

  // 2. Render Par Row (Editable pars)
  const parRow = document.createElement('div');
  parRow.className = 'scorecard-row par-row';
  parRow.style.borderBottom = '2px solid var(--border-subtle)';
  parRow.style.background = 'rgba(255, 255, 255, 0.015)';

  const parMeta = document.createElement('div');
  parMeta.className = 'player-meta';
  parMeta.innerHTML = `
    <div style="font-weight: 700; font-size: 1.05rem; color: var(--accent-gold);">標準 Par</div>
  `;

  const parInputs = document.createElement('div');
  parInputs.className = 'scores-inputs-container';
  for (let i = 0; i < 18; i++) {
    const isHidden = state.hiddenHoles[i];
    const wrapper = document.createElement('div');
    wrapper.className = `score-input-wrapper ${isHidden ? 'score-wrapper-hidden' : ''}`;
    
    const input = document.createElement('input');
    input.type = 'number';
    input.id = `editor-par-input-${i}`;
    input.className = `score-input ${isHidden ? 'score-input-hidden-marked' : ''}`;
    input.style.borderColor = isHidden ? 'var(--accent-gold)' : 'var(--border-subtle)';
    input.style.color = isHidden ? 'var(--accent-gold)' : 'var(--text-muted)';
    input.value = state.coursePars[i];
    input.min = '1';
    input.max = '10';

    const handleParInput = (e) => {
      const val = e.target.value;
      if (val !== '' && !isNaN(val)) {
        const newPar = parseInt(val, 10);
        if (newPar > 0) {
          state.coursePars[i] = newPar;
          
          // Synchronize the other par input in Hidden Holes card
          const otherInput = document.getElementById(`hidden-par-input-${i}`);
          if (otherInput) otherInput.value = newPar;
          
          updateCalculationsAndRender();
          saveStateToLocalStorage();
        }
      }
    };
    input.addEventListener('input', handleParInput);
    input.addEventListener('change', handleParInput);

    wrapper.appendChild(input);
    parInputs.appendChild(wrapper);

    // Insert OUT par subtotal after hole 9 (index 8)
    if (i === 8) {
      const outSubWrapper = document.createElement('div');
      outSubWrapper.className = 'score-input-wrapper';
      const outSubBox = document.createElement('div');
      outSubBox.className = 'subtotal-box par-subtotal';
      outSubBox.id = 'par-out-subtotal';
      outSubBox.textContent = state.coursePars.slice(0, 9).reduce((a,b)=>a+b, 0);
      outSubWrapper.appendChild(outSubBox);
      parInputs.appendChild(outSubWrapper);
    }
    // Insert IN par subtotal after hole 18 (index 17)
    if (i === 17) {
      const inSubWrapper = document.createElement('div');
      inSubWrapper.className = 'score-input-wrapper';
      const inSubBox = document.createElement('div');
      inSubBox.className = 'subtotal-box par-subtotal';
      inSubBox.id = 'par-in-subtotal';
      inSubBox.textContent = state.coursePars.slice(9, 18).reduce((a,b)=>a+b, 0);
      inSubWrapper.appendChild(inSubBox);
      parInputs.appendChild(inSubWrapper);
    }
  }

  const parActions = document.createElement('div');
  parActions.style.display = 'grid';
  parActions.style.gridTemplateColumns = '50px 55px 55px 32px';
  parActions.style.alignItems = 'center';
  parActions.style.gap = '0.5rem';
  parActions.style.justifyContent = 'end';
  parActions.innerHTML = `
    <span style="font-weight: 800; font-size: 1.45rem; color: var(--accent-gold); text-align: right; white-space: nowrap;" id="editor-total-par-val">
      ${state.coursePars.reduce((a,b)=>a+b, 0)}
    </span>
    <span>&nbsp;</span>
    <span>&nbsp;</span>
    <div></div>
  `;

  parRow.appendChild(parMeta);
  parRow.appendChild(parInputs);
  parRow.appendChild(parActions);
  container.appendChild(parRow);

  // 3. Render Player Rows
  state.players.forEach(player => {
    const row = document.createElement('div');
    row.className = 'scorecard-row';
    row.id = `row-${player.id}`;

    const metaDiv = document.createElement('div');
    metaDiv.className = 'player-meta';
    metaDiv.innerHTML = `
      <div class="player-input-name">${escapeHTML(player.name)}</div>
    `;

    const inputsDiv = document.createElement('div');
    inputsDiv.className = 'scores-inputs-container';

    for (let i = 0; i < 18; i++) {
      const isHidden = state.hiddenHoles[i];
      const wrapper = document.createElement('div');
      wrapper.className = `score-input-wrapper ${isHidden ? 'score-wrapper-hidden' : ''}`;
      
      const input = document.createElement('input');
      input.type = 'number';
      input.id = `score-input-${player.id}-${i}`;
      input.className = `score-input ${isHidden ? 'score-input-hidden-marked' : ''}`;
      input.placeholder = '';
      input.value = player.scores[i];
      input.min = '1';
      input.max = '20';
      input.dataset.playerId = player.id;
      input.dataset.holeIdx = i;

      const handleScoreChange = (e) => {
        const val = e.target.value;
        const pId = e.target.dataset.playerId;
        const hIdx = parseInt(e.target.dataset.holeIdx, 10);
        
        const p = state.players.find(x => x.id === pId);
        if (p) {
          p.scores[hIdx] = val !== '' ? parseInt(val, 10) : '';
          
          calculateScores();
          
          // Update the Out, In, Gross, and Hidden counts instantly in actions column
          const outEl = document.getElementById(`out-subtotal-${pId}`);
          if (outEl) outEl.textContent = p.grossOut;
          const inEl = document.getElementById(`in-subtotal-${pId}`);
          if (inEl) inEl.textContent = p.grossIn;
          const grossEl = document.getElementById(`gross-display-${pId}`);
          if (grossEl) grossEl.textContent = p.grossTotal;
          const hdcpEl = document.getElementById(`hdcp-display-${pId}`);
          if (hdcpEl) hdcpEl.textContent = p.handicap.toFixed(1);
          const netEl = document.getElementById(`net-display-${pId}`);
          if (netEl) netEl.textContent = p.netScore.toFixed(1);
          
          renderLeaderboard();
          saveStateToLocalStorage();
        }
      };

      input.addEventListener('input', handleScoreChange);
      input.addEventListener('change', handleScoreChange);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (i < 17) {
            const nextInput = document.getElementById(`score-input-${player.id}-${i + 1}`);
            if (nextInput) {
              nextInput.focus();
              try { nextInput.select(); } catch (err) {}
            }
          } else {
            const playerIdx = state.players.findIndex(x => x.id === player.id);
            if (playerIdx !== -1 && playerIdx < state.players.length - 1) {
              const nextPlayer = state.players[playerIdx + 1];
              const nextPlayerInput = document.getElementById(`score-input-${nextPlayer.id}-0`);
              if (nextPlayerInput) {
                nextPlayerInput.focus();
                try { nextPlayerInput.select(); } catch (err) {}
              }
            } else {
              input.blur();
            }
          }
        }
      });
      input.addEventListener('blur', (e) => {
        if (isRenderingScorecard) return;
        if (e.relatedTarget && e.relatedTarget.classList.contains('score-input')) return;
        
        // Fully recalculate and sync layout when the user finishes editing and clicks away
        updateCalculationsAndRender();
      });

      wrapper.appendChild(input);
      inputsDiv.appendChild(wrapper);

      // Insert OUT score subtotal after hole 9 (index 8)
      if (i === 8) {
        const outSubWrapper = document.createElement('div');
        outSubWrapper.className = 'score-input-wrapper';
        const outSubBox = document.createElement('div');
        outSubBox.className = 'subtotal-box';
        outSubBox.id = `out-subtotal-${player.id}`;
        outSubBox.textContent = player.grossOut;
        outSubWrapper.appendChild(outSubBox);
        inputsDiv.appendChild(outSubWrapper);
      }
      // Insert IN score subtotal after hole 18 (index 17)
      if (i === 17) {
        const inSubWrapper = document.createElement('div');
        inSubWrapper.className = 'score-input-wrapper';
        const inSubBox = document.createElement('div');
        inSubBox.className = 'subtotal-box';
        inSubBox.id = `in-subtotal-${player.id}`;
        inSubBox.textContent = player.grossIn;
        inSubWrapper.appendChild(inSubBox);
        inputsDiv.appendChild(inSubWrapper);
      }
    }

    const actionsDiv = document.createElement('div');
    actionsDiv.style.display = 'grid';
    actionsDiv.style.gridTemplateColumns = '50px 55px 55px 32px';
    actionsDiv.style.alignItems = 'center';
    actionsDiv.style.gap = '0.5rem';
    actionsDiv.style.justifyContent = 'end';
    actionsDiv.innerHTML = `
      <span style="font-weight: 800; font-size: 1.4rem; color: var(--text-main); text-align: right; white-space: nowrap;" id="gross-display-${player.id}">
        ${player.grossTotal}
      </span>
      <span style="font-size: 1.25rem; color: var(--text-secondary); font-weight: 700; text-align: right; white-space: nowrap;" id="hdcp-display-${player.id}">
        ${player.handicap.toFixed(1)}
      </span>
      <span style="font-weight: 800; font-size: 1.4rem; color: var(--accent-gold); text-align: right; white-space: nowrap;" id="net-display-${player.id}">
        ${player.netScore.toFixed(1)}
      </span>
    `;
    
    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-danger btn-icon-only';
    delBtn.innerHTML = '✕';
    delBtn.title = 'プレイヤー削除';
    delBtn.addEventListener('click', () => {
      if (confirm(`${player.name} さんを削除しますか？`)) {
        state.players = state.players.filter(p => p.id !== player.id);
        updateCalculationsAndRender();
        saveStateToLocalStorage();
      }
    });

    actionsDiv.appendChild(delBtn);

    row.appendChild(metaDiv);
    row.appendChild(inputsDiv);
    row.appendChild(actionsDiv);
    
    container.appendChild(row);
  });

  // Restore Focus
  if (activeElId) {
    const el = document.getElementById(activeElId);
    if (el) {
      el.focus();
      if (activeElSelectionStart !== null && el.setSelectionRange) {
        try {
          el.setSelectionRange(activeElSelectionStart, activeElSelectionEnd);
        } catch (e) {
          // ignore error if selection range not supported on number input
        }
      }
    }
  }
  isRenderingScorecard = false;
}

// Render sorted leaderboard table & podium
function renderLeaderboard() {
  const tbody = document.getElementById('leaderboard-tbody');
  const podiumContainer = document.getElementById('podium-display');
  tbody.innerHTML = '';
  podiumContainer.innerHTML = '';

  if (state.players.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted" style="padding: 2rem 0;">
          順位を計算するプレイヤーデータがありません。スコアを入力してください。
        </td>
      </tr>
    `;
    return;
  }

  // Sort players
  const sortedPlayers = [...state.players].sort((a, b) => {
    // 1. Compare Net score (lower net ranks higher)
    if (a.netScore !== b.netScore) {
      return a.netScore - b.netScore;
    }
    
    // 2. Resolve Tie breaker from rules
    const tb = state.rules.tieBreaker;
    if (tb === 'low-hdcp') {
      if (a.handicap !== b.handicap) return a.handicap - b.handicap; // Lower handicap preferred
    } else if (tb === 'high-hdcp') {
      if (a.handicap !== b.handicap) return b.handicap - a.handicap; // Higher handicap preferred
    } else if (tb === 'low-gross') {
      if (a.grossTotal !== b.grossTotal) return a.grossTotal - b.grossTotal; // Lower gross preferred
    }
    
    // Fallback tie-breaker details (Secondary tie-breakers)
    // Always fall back to lower Gross if not already compared
    if (tb !== 'low-gross' && a.grossTotal !== b.grossTotal) {
      return a.grossTotal - b.grossTotal;
    }

    // 3. Countback from hole 18 backwards
    for (let i = 17; i >= 0; i--) {
      const scoreA = a.scores[i] !== '' ? parseInt(a.scores[i], 10) : state.coursePars[i];
      const scoreB = b.scores[i] !== '' ? parseInt(b.scores[i], 10) : state.coursePars[i];
      if (scoreA !== scoreB) {
        return scoreA - scoreB; // Lower score on back holes wins
      }
    }
    
    return 0; // Absolute tie
  });

  // Assign ranks (handling ties properly if exact score and matching countback)
  let currentRank = 1;
  const rankedPlayers = sortedPlayers.map((player, idx) => {
    if (idx > 0) {
      const prev = sortedPlayers[idx - 1];
      const sameNet = player.netScore === prev.netScore;
      const sameHdcp = player.handicap === prev.handicap;
      const sameGross = player.grossTotal === prev.grossTotal;
      
      // Check countback equality
      let sameCountback = true;
      for (let i = 17; i >= 0; i--) {
        const scoreCurr = player.scores[i] !== '' ? parseInt(player.scores[i], 10) : state.coursePars[i];
        const scorePrev = prev.scores[i] !== '' ? parseInt(prev.scores[i], 10) : state.coursePars[i];
        if (scoreCurr !== scorePrev) {
          sameCountback = false;
          break;
        }
      }

      if (!(sameNet && sameHdcp && sameGross && sameCountback)) {
        currentRank = idx + 1;
      }
    } else {
      currentRank = 1;
    }

    // Tag special prizes
    let prize = '';
    if (currentRank === 1) prize = 'winner';
    else if (idx === sortedPlayers.length - 2 && sortedPlayers.length > 2) prize = 'booby'; // Booby: Second to last
    else if (idx === sortedPlayers.length - 1 && sortedPlayers.length > 1) prize = 'boobymaker'; // Booby Maker: Last

    return { ...player, rank: currentRank, prize };
  });

  // Populate Podium (Top 3)
  const podiumTop3 = rankedPlayers.slice(0, 3);
  podiumTop3.forEach(player => {
    const card = document.createElement('div');
    let rankClass = '';
    let medal = '';
    
    if (player.rank === 1) { rankClass = 'podium-1st'; medal = '1'; }
    else if (player.rank === 2) { rankClass = 'podium-2nd'; medal = '2'; }
    else if (player.rank === 3) { rankClass = 'podium-3rd'; medal = '3'; }

    card.className = `podium-card ${rankClass}`;
    card.innerHTML = `
      <div class="rank-medal">${medal}</div>
      <div class="podium-name" title="${escapeHTML(player.name)}">${escapeHTML(player.name)}</div>
      <div class="podium-net-score">${player.netScore}<span>NET</span></div>
      <div class="podium-subdetails">
        <span>G: <strong>${player.grossTotal}</strong></span>
        <span>HD: <strong>${player.handicap}</strong></span>
      </div>
    `;
    podiumContainer.appendChild(card);
  });

  // Reorder podium display so 2nd is left, 1st is center, 3rd is right on desktop
  // Our CSS Flex order property handles this automatically (.podium-1st { order: 2; }, etc.)

  // Add print-only par row to leaderboard
  const parRow = document.createElement('tr');
  parRow.className = 'leaderboard-row leaderboard-par-row';
  
  let outParsHTML = '';
  for (let i = 0; i < 9; i++) {
    const isHidden = state.hiddenHoles[i];
    outParsHTML += `<td class="leaderboard-hole-col text-center ${isHidden ? 'hidden-hole-print' : ''}">${state.coursePars[i]}</td>`;
  }
  
  let inParsHTML = '';
  for (let i = 9; i < 18; i++) {
    const isHidden = state.hiddenHoles[i];
    inParsHTML += `<td class="leaderboard-hole-col text-center ${isHidden ? 'hidden-hole-print' : ''}">${state.coursePars[i]}</td>`;
  }
  
  const totalPar = state.coursePars.reduce((a,b)=>a+b, 0);
  const outPar = state.coursePars.slice(0, 9).reduce((a,b)=>a+b, 0);
  const inPar = state.coursePars.slice(9, 18).reduce((a,b)=>a+b, 0);
  const hiddenParsSum = state.coursePars.filter((p, idx) => state.hiddenHoles[idx]).reduce((a,b)=>a+b, 0);
  
  parRow.innerHTML = `
    <td class="text-center">-</td>
    <td style="font-weight: bold;">標準 Par</td>
    ${outParsHTML}
    <td class="text-right" style="font-weight: bold;">${outPar}</td>
    ${inParsHTML}
    <td class="text-right" style="font-weight: bold;">${inPar}</td>
    <td class="text-right" style="font-weight: bold;">${totalPar} <span style="font-size: 0.9rem; font-weight: normal; margin-left: 0.25rem;">(${hiddenParsSum})</span></td>
    <td class="text-right">-</td>
    <td class="text-right">-</td>
    <td class="text-center"></td>
  `;
  tbody.appendChild(parRow);

  // Populate Table Rows
  rankedPlayers.forEach(player => {
    const tr = document.createElement('tr');
    tr.className = 'leaderboard-row';
    
    // Rank medal badge
    let rankBadgeHTML = '';
    if (player.rank <= 3) {
      rankBadgeHTML = `<span class="rank-badge rank-badge-${player.rank}">${player.rank}</span>`;
    } else {
      rankBadgeHTML = `<span class="rank-badge rank-badge-other">${player.rank}</span>`;
    }

    // Name with Prize Tag if applicable
    let nameHTML = escapeHTML(player.name);
    if (player.prize === 'winner') {
      nameHTML += ` <span class="prize-tag prize-winner">優勝</span>`;
    } else if (player.prize === 'booby') {
      nameHTML += ` <span class="prize-tag prize-booby">BB賞</span>`;
    } else if (player.prize === 'boobymaker') {
      nameHTML += ` <span class="prize-tag prize-boobymaker">BM賞</span>`;
    }

    let outHolesHTML = '';
    for (let i = 0; i < 9; i++) {
      const scoreVal = player.scores[i];
      const isHidden = state.hiddenHoles[i];
      outHolesHTML += `<td class="leaderboard-hole-col text-center ${isHidden ? 'hidden-hole-print' : ''}">${scoreVal !== '' ? scoreVal : '-'}</td>`;
    }

    let inHolesHTML = '';
    for (let i = 9; i < 18; i++) {
      const scoreVal = player.scores[i];
      const isHidden = state.hiddenHoles[i];
      inHolesHTML += `<td class="leaderboard-hole-col text-center ${isHidden ? 'hidden-hole-print' : ''}">${scoreVal !== '' ? scoreVal : '-'}</td>`;
    }

    tr.innerHTML = `
      <td class="text-center">${rankBadgeHTML}</td>
      <td class="fw-bold">${nameHTML}</td>
      ${outHolesHTML}
      <td class="text-right">${player.grossOut}</td>
      ${inHolesHTML}
      <td class="text-right">${player.grossIn}</td>
      <td class="text-right fw-bold">${player.grossTotal} <span style="font-size: 1rem; color: var(--text-muted); font-weight: normal; margin-left: 0.25rem;">(${player.hiddenHoleAdjustedSum})</span></td>
      <td class="text-right">${player.handicap.toFixed(1)}</td>
      <td class="text-right fw-bold color-net">${player.netScore.toFixed(1)}</td>
      <td class="text-center">
        <button class="btn btn-secondary btn-sm" onclick="openPlayerDetails('${player.id}')">詳細</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Open player scorecard breakdown modal
window.openPlayerDetails = function(playerId) {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return;

  const modal = document.getElementById('score-details-modal');
  
  // Set name and prize badge
  document.getElementById('modal-player-name').textContent = player.name;
  
  // Compute Rank details dynamically
  const leaderboardTable = document.getElementById('leaderboard-tbody');
  const rows = Array.from(leaderboardTable.querySelectorAll('tr'));
  let rankStr = 'ランク外';
  let prizeTag = '';
  
  // Find player's rank/prize from table text contents
  rows.forEach(row => {
    if (row.cells[1].textContent.includes(player.name)) {
      const rankVal = row.cells[0].textContent.trim();
      rankStr = `${rankVal}位`;
      
      const badge = row.querySelector('.prize-tag');
      if (badge) prizeTag = badge.outerHTML;
    }
  });
  
  document.getElementById('modal-prize-badge').innerHTML = `
    <span class="badge badge-out">${rankStr}</span> ${prizeTag}
  `;

  // Render modal scorecard grids
  const outGrid = document.getElementById('modal-out-grid');
  const inGrid = document.getElementById('modal-in-grid');
  outGrid.innerHTML = '';
  inGrid.innerHTML = '';

  for (let i = 0; i < 18; i++) {
    const isHidden = state.hiddenHoles[i];
    const par = state.coursePars[i];
    const scoreVal = player.scores[i];
    const score = scoreVal !== '' ? parseInt(scoreVal, 10) : par;
    
    // Determine score mark (Japanese broadcast rules)
    let scoreMarkClass = 'score-par';
    const diff = score - par;
    if (diff <= -2) scoreMarkClass = 'score-eagle';
    else if (diff === -1) scoreMarkClass = 'score-birdie';
    else if (diff === 0) scoreMarkClass = 'score-par';
    else if (diff === 1) scoreMarkClass = 'score-bogey';
    else if (diff >= 2) scoreMarkClass = 'score-double-plus';

    const holeCard = document.createElement('div');
    holeCard.className = `visual-hole-card ${isHidden ? 'hidden-hole' : ''}`;
    holeCard.innerHTML = `
      <div class="hole-num" style="display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.2; margin-bottom: 0.25rem;">
        <span style="font-size: 0.85rem; height: 1.2rem; display: flex; align-items: center; justify-content: center;">
          ${isHidden ? '🔒' : '&nbsp;'}
        </span>
        <span style="font-size: 0.9rem; font-weight: 700; color: ${isHidden ? 'var(--accent-gold)' : 'var(--text-muted)'};">
          ${i + 1}
        </span>
      </div>
      <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.25rem;">Par ${par}</div>
      <div class="score-badge-indicator ${scoreMarkClass}">${scoreVal !== '' ? scoreVal : '-'}</div>
    `;

    if (i < 9) {
      outGrid.appendChild(holeCard);
      if (i === 8) {
        const outSubCard = document.createElement('div');
        outSubCard.className = 'visual-hole-card';
        outSubCard.innerHTML = `
          <div class="hole-num" style="display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.2; margin-bottom: 0.25rem;">
            <span style="font-size: 0.85rem; height: 1.2rem;">&nbsp;</span>
            <span style="font-size: 0.9rem; font-weight: 800; color: var(--accent-gold);">OUT</span>
          </div>
          <div style="font-size: 0.85rem; color: var(--accent-gold); margin-bottom: 0.25rem;">Par ${state.coursePars.slice(0, 9).reduce((a,b)=>a+b, 0)}</div>
          <div class="score-badge-indicator score-par" style="font-weight: 800; border: 2px solid var(--accent-gold); border-radius: 4px; color: var(--accent-gold);">${player.grossOut}</div>
        `;
        outGrid.appendChild(outSubCard);
      }
    } else {
      inGrid.appendChild(holeCard);
      if (i === 17) {
        const inSubCard = document.createElement('div');
        inSubCard.className = 'visual-hole-card';
        inSubCard.innerHTML = `
          <div class="hole-num" style="display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.2; margin-bottom: 0.25rem;">
            <span style="font-size: 0.85rem; height: 1.2rem;">&nbsp;</span>
            <span style="font-size: 0.9rem; font-weight: 800; color: var(--accent-gold);">IN</span>
          </div>
          <div style="font-size: 0.85rem; color: var(--accent-gold); margin-bottom: 0.25rem;">Par ${state.coursePars.slice(9, 18).reduce((a,b)=>a+b, 0)}</div>
          <div class="score-badge-indicator score-par" style="font-weight: 800; border: 2px solid var(--accent-gold); border-radius: 4px; color: var(--accent-gold);">${player.grossIn}</div>
        `;
        inGrid.appendChild(inSubCard);
      }
    }
  }

  // Set modal summary statistics
  document.getElementById('modal-stat-gross').textContent = player.grossTotal;
  document.getElementById('modal-stat-hidden-sum').textContent = player.hiddenHoleAdjustedSum;
  document.getElementById('modal-stat-handicap').textContent = player.handicap.toFixed(1);
  document.getElementById('modal-stat-net').textContent = player.netScore.toFixed(1);

  // Set modal header summary statistics
  document.getElementById('modal-summary-gross').textContent = player.grossTotal;
  document.getElementById('modal-summary-hdcp').textContent = player.handicap.toFixed(1);
  document.getElementById('modal-summary-net').textContent = player.netScore.toFixed(1);

  // Set formula explanations
  const cutRuleText = state.rules.cutLimit === 'double-par' ? 'ダブルパーカット（上限: ホールParの2倍）' : 
                      state.rules.cutLimit === 'triple-bogey' ? 'トリプルボギーカット（上限: ホールPar+3）' : 'カットなし';
  
  const hdcpCapText = state.rules.maxHdcp !== 'none' ? `上限: ${state.rules.maxHdcp.toFixed(1)}` : '上限なし';
  const scaleRatio = state.hiddenHoles.filter(x => x).length > 0 ? (18 / state.hiddenHoles.filter(x => x).length).toFixed(2) : '1.5';
  
  const formulaHTML = `
    <div><strong>スコア上限調整:</strong> ${cutRuleText}</div>
    <div><strong>隠しホール合計（調整後）:</strong> ${player.hiddenHoleAdjustedSum} 打</div>
    <div><strong>ハンディ計算式:</strong> (${player.hiddenHoleAdjustedSum} × ${scaleRatio} - ${state.coursePars.reduce((a,b)=>a+b, 0)}) × 0.8 = ${((player.hiddenHoleAdjustedSum * parseFloat(scaleRatio) - state.coursePars.reduce((a,b)=>a+b, 0)) * 0.8).toFixed(3)}</div>
    <div><strong>ハンディキャップ適用値:</strong> ${player.handicap.toFixed(1)} （${hdcpCapText}）</div>
    <div><strong>ネットスコア算出:</strong> ${player.grossTotal} (グロス) - ${player.handicap.toFixed(1)} (ハンディ) = <strong>${player.netScore.toFixed(1)}</strong></div>
  `;
  document.getElementById('modal-calc-formula').innerHTML = formulaHTML;

  // Open modal animation
  modal.classList.add('active');
};

// Close modal
function closeModal() {
  document.getElementById('score-details-modal').classList.remove('active');
}

// Export Leaderboard to CSV
function exportCSV() {
  if (state.players.length === 0) {
    alert('エクスポートするデータがありません。');
    return;
  }

  // Re-fetch sorted player list from UI table state to preserve ranking (filtering out standard par row)
  const rows = Array.from(document.getElementById('leaderboard-tbody').querySelectorAll('tr'))
    .filter(r => !r.classList.contains('leaderboard-par-row'));
    
  if (rows.length === 0 || rows[0].cells.length < 7) return;

  let csvContent = '\uFEFF'; // UTF-8 BOM for Japanese Excel compatibility
  csvContent += '順位,名前,1,2,3,4,5,6,7,8,9,OUT,10,11,12,13,14,15,16,17,18,IN,グロス,ハンディキャップ,ネット\r\n';

  rows.forEach(row => {
    const rank = row.cells[0].innerText || row.cells[0].textContent;
    let name = row.cells[1].innerText || row.cells[1].textContent;
    name = name.replace(/優勝|BB賞|BM賞/g, '').trim();

    let rowData = [rank, name];
    
    // Add hole scores 1-9
    for (let i = 2; i <= 10; i++) {
      rowData.push(row.cells[i].textContent);
    }
    // Add OUT
    rowData.push(row.cells[11].textContent);
    
    // Add hole scores 10-18
    for (let i = 12; i <= 20; i++) {
      rowData.push(row.cells[i].textContent);
    }
    // Add IN
    rowData.push(row.cells[21].textContent);
    
    // Add Gross, Handicap, Net
    rowData.push(row.cells[22].textContent);
    rowData.push(row.cells[23].textContent);
    rowData.push(row.cells[24].textContent);

    csvContent += rowData.map(val => `"${val.trim()}"`).join(',') + '\r\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `golf_new_peoria_results_${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Initialize print header settings (Title & Date)
function initPrintSettings() {
  const printDateInput = document.getElementById('print-date-input');
  if (printDateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    printDateInput.value = `${yyyy}-${mm}-${dd}`;
  }

  const titleInput = document.getElementById('print-title-input');
  const dateInput = document.getElementById('print-date-input');
  const titleDisplay = document.getElementById('print-title-display');
  const dateDisplay = document.getElementById('print-date-display');

  const updatePrintHeader = () => {
    if (titleDisplay && titleInput) {
      titleDisplay.textContent = titleInput.value.trim() || 'ゴルフコンペ 結果発表';
    }
    if (dateDisplay && dateInput) {
      if (dateInput.value) {
        const d = new Date(dateInput.value);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const day = d.getDate();
        dateDisplay.textContent = `開催日: ${y}年${m}月${day}日`;
      } else {
        dateDisplay.textContent = '';
      }
    }
  };

  if (titleInput) {
    titleInput.value = state.printTitle || 'ゴルフコンペ 結果発表';
    titleInput.addEventListener('input', (e) => {
      state.printTitle = e.target.value;
      saveStateToLocalStorage();
      updatePrintHeader();
    });
  }
  if (dateInput) {
    dateInput.addEventListener('change', updatePrintHeader);
  }
  
  updatePrintHeader();
}

// Utility HTML escape helper
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
