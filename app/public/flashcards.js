const navEl = document.getElementById('fc-nav');
const viewEl = document.getElementById('fc-view');

const fcState = {
  index: [], // [{ id, title, path, count }]
  deck: null, // { id, title, path, cards: [] }
  cards: [], // working set (possibly shuffled)
  idx: 0,
  flipped: false,
  mode: 'term-first', // or 'definition-first'
  topKey: null, // e.g., 'DevOps'
  subKey: null, // e.g., 'DevOps/Docker'
  selectedDeckIds: [] // for multi-select within a subtopic
};

async function loadFlashcardIndex() {
  const res = await fetch(`/data/flashcards/index.json?t=${Date.now()}`);
  if (!res.ok) throw new Error('Failed to load flashcards index');
  fcState.index = await res.json();
}

function splitId(id) {
  return String(id || '').split('/').filter(Boolean);
}

function getTopGroups(decks) {
  const groups = new Map();
  for (const d of decks) {
    const [top] = splitId(d.id);
    const key = top || 'Other';
    if (!groups.has(key)) groups.set(key, { key, label: key, decks: [], totalCount: 0 });
    const g = groups.get(key);
    g.decks.push(d);
    g.totalCount += Number(d.count || 0);
  }
  return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label));
}

function getSubGroups(decks, topKey) {
  const groups = new Map();
  for (const d of decks) {
    const segs = splitId(d.id);
    if (segs[0] !== topKey) continue;
    const sub = segs[1];
    const key = sub ? `${segs[0]}/${sub}` : `${segs[0]}/_misc`;
    const label = sub ? sub : '+ Misc';
    if (!groups.has(key)) groups.set(key, { key, label, decks: [], totalCount: 0 });
    const g = groups.get(key);
    g.decks.push(d);
    g.totalCount += Number(d.count || 0);
  }
  return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label));
}

function renderTopGroups() {
  viewEl.classList.add('hidden');
  navEl.classList.remove('hidden');
  const decks = fcState.index;
  if (!Array.isArray(decks) || decks.length === 0) {
    navEl.innerHTML = `
      <h2 style="margin-top:0">Flashcard Decks</h2>
      <div class="panel" style="background:#f9fafb; border:1px dashed #e5e7eb;">
        <div class="muted" style="margin-bottom:8px;">No decks found.</div>
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <a class="btn primary" href="/public/import.html">➕ Import Flashcards (JSON)</a>
          <a class="btn" href="/public/import.html" title="Switch to Flashcards and use the prompt helper">💬 Generate Flashcard JSON Prompt</a>
        </div>
      </div>
    `;
    return;
  }
  const groups = getTopGroups(decks);
  navEl.innerHTML = `
    <h2 style="margin-top:0">Topics</h2>
    <div class="panel">
      <div class="grid">
      ${groups.map(g => `
          <div class="card" data-top="${encodeURIComponent(g.key)}">
            <div style="font-weight:600; text-transform: capitalize;">${g.label}</div>
            <div class="muted">${g.decks.length} deck(s) • ${g.totalCount} cards</div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="panel" style="margin-top:12px;">
      <div style="font-weight:600; margin-bottom:6px;">Preview</div>
      <div class="grid">
        ${groups.map(g => `
          <div class="panel" style="cursor: default;">
            <div class="muted" style="text-transform: capitalize;">${g.label}</div>
            <div style="margin-top:6px; display:flex; flex-direction:column; gap:4px;">
              ${getSubGroups(decks, g.key).map(sg => `<div class=\"muted\" style=\"text-transform: capitalize;\">• ${sg.label}</div>`).join('') || '<div class=\"muted\">No subcategories</div>'}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  navEl.querySelectorAll('[data-top]').forEach(el => {
    el.addEventListener('click', () => {
      const key = decodeURIComponent(el.getAttribute('data-top'));
      const group = groups.find(g => g.key === key);
      if (group) renderSubGroups(group);
    });
  });
}

function renderSubGroups(group) {
  fcState.topKey = group.key;
  fcState.subKey = null;
  viewEl.classList.add('hidden');
  navEl.classList.remove('hidden');
  navEl.innerHTML = `
    <div class="toolbar" style="margin-bottom:12px;">
      <button class="btn" id="fc-back-topics">← Topics</button>
    </div>
    <div class="panel">
      <div style="font-weight:600; margin-bottom:6px; text-transform: capitalize;">${group.label}</div>
      <div class="grid">
        ${getSubGroups(fcState.index, group.key).map(sg => `
          <div class="card" data-sub="${encodeURIComponent(sg.key)}">
            <div style="font-weight:600; text-transform: capitalize;">${sg.label}</div>
            <div class="muted">${sg.decks.length} deck(s) • ${sg.totalCount} cards</div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="panel" style="margin-top:12px;">
      <div class="muted" style="margin-bottom:6px;">Preview</div>
      <div class="grid">
        ${getSubGroups(fcState.index, group.key).map(sg => `
          <div class="panel" style="cursor: default;">
            <div class="muted" style="text-transform: capitalize;">${sg.label}</div>
            <div style="margin-top:6px; display:flex; flex-direction:column; gap:4px;">
              ${sg.decks.map(d => `<div class=\"muted\" style=\"text-transform: capitalize;\">• ${d.title.split('/').slice(-1)[0].trim()}</div>`).join('') || '<div class=\"muted\">No decks</div>'}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  document.getElementById('fc-back-topics').onclick = () => { fcState.topKey = null; fcState.subKey = null; renderTopGroups(); };
  navEl.querySelectorAll('[data-sub]').forEach(el => {
    el.addEventListener('click', () => {
      const key = decodeURIComponent(el.getAttribute('data-sub'));
      const sub = getSubGroups(fcState.index, group.key).find(sg => sg.key === key);
      if (sub) renderDecksForSubGroup(sub);
    });
  });
}

function renderDecksForSubGroup(subGroup) {
  fcState.subKey = subGroup.key;
  fcState.selectedDeckIds = [];
  viewEl.classList.add('hidden');
  navEl.classList.remove('hidden');
  navEl.innerHTML = `
    <div class="toolbar" style="margin-bottom:12px;">
      <button class="btn" id="fc-back-groups">← ${fcState.topKey}</button>
      <div style="font-weight:600">${fcState.topKey} / ${subGroup.label}</div>
    </div>
    <div style="margin: 4px 0 12px; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
      <button class="btn" id="fc-select-all">Select All</button>
      <button class="btn" id="fc-clear">Clear</button>
      <button class="btn primary" id="fc-start-combined" disabled>Start Combined Study</button>
      <span class="muted" id="fc-selected-count">0 selected</span>
    </div>
    <div class="grid">
      ${subGroup.decks.map(d => `
        <div class="card" data-id="${encodeURIComponent(d.id)}">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
            <div>
              <div style="font-weight:600; text-transform: capitalize;">${d.title.split('/').slice(-1)[0].trim()}</div>
              <div class="muted">${d.count || 0} cards</div>
            </div>
            <input type="checkbox" class="fc-deck-chk" data-id="${encodeURIComponent(d.id)}" />
          </div>
        </div>
      `).join('')}
    </div>
  `;
  document.getElementById('fc-back-groups').onclick = () => {
    const group = { key: fcState.topKey, label: fcState.topKey };
    renderSubGroups(group);
  };
  navEl.querySelectorAll('[data-id]').forEach(el => {
    el.addEventListener('click', async () => {
      // Ignore clicks originating from the checkbox itself
      if (event && (event.target && (event.target.classList.contains('fc-deck-chk') || event.target.tagName === 'INPUT'))) return;
      const id = decodeURIComponent(el.getAttribute('data-id'));
      const deck = fcState.index.find(x => x.id === id);
      if (deck) await startDeck(deck);
    });
  });
  function updateSelectionUI() {
    const count = fcState.selectedDeckIds.length;
    const startBtn = document.getElementById('fc-start-combined');
    const counter = document.getElementById('fc-selected-count');
    if (startBtn) startBtn.disabled = count === 0;
    if (counter) counter.textContent = `${count} selected`;
  }
  navEl.querySelectorAll('.fc-deck-chk').forEach(chk => {
    chk.addEventListener('change', () => {
      const id = decodeURIComponent(chk.getAttribute('data-id'));
      const idx = fcState.selectedDeckIds.indexOf(id);
      if (chk.checked && idx === -1) fcState.selectedDeckIds.push(id);
      if (!chk.checked && idx !== -1) fcState.selectedDeckIds.splice(idx, 1);
      updateSelectionUI();
    });
  });
  document.getElementById('fc-select-all').onclick = () => {
    fcState.selectedDeckIds = subGroup.decks.map(d => d.id);
    navEl.querySelectorAll('.fc-deck-chk').forEach(chk => chk.checked = true);
    updateSelectionUI();
  };
  document.getElementById('fc-clear').onclick = () => {
    fcState.selectedDeckIds = [];
    navEl.querySelectorAll('.fc-deck-chk').forEach(chk => chk.checked = false);
    updateSelectionUI();
  };
  document.getElementById('fc-start-combined').onclick = async () => {
    if (!fcState.selectedDeckIds.length) return;
    const metas = fcState.index.filter(d => fcState.selectedDeckIds.includes(d.id));
    try {
      const all = await Promise.all(metas.map(async m => {
        const res = await fetch(`${m.path}?t=${Date.now()}`);
        if (!res.ok) return [];
        const js = await res.json();
        return Array.isArray(js) ? js : [];
      }));
      const merged = all.flat();
      // Shuffle merged cards for variety
      shuffleInPlace(merged);
      fcState.deck = { id: `combined:${fcState.topKey}/${subGroup.label}`, title: `${fcState.topKey} / ${subGroup.label} — Combined (${metas.length} decks)`, path: null };
      fcState.cards = merged;
      fcState.idx = 0;
      fcState.flipped = false;
      renderFlashcards();
    } catch (e) {
      alert('Failed to start combined study');
    }
  };
}

async function startDeck(deckMeta) {
  const res = await fetch(`${deckMeta.path}?t=${Date.now()}`);
  if (!res.ok) throw new Error('Failed to load deck');
  const cards = await res.json();
  fcState.deck = deckMeta;
  fcState.cards = Array.isArray(cards) ? cards.slice() : [];
  fcState.idx = 0;
  fcState.flipped = false;
  renderFlashcards();
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderFlashcards() {
  navEl.classList.add('hidden');
  viewEl.classList.remove('hidden');
  const deck = fcState.deck;
  const total = fcState.cards.length;
  const idx = fcState.idx;
  const card = fcState.cards[idx];
  const showFrontTerm = fcState.mode === 'term-first';
  const front = showFrontTerm ? `<div class=\"fc-term\">${escapeHtml(card?.term || '')}</div>` : `<div class=\"fc-def\">${escapeHtml(card?.definition || '')}</div>`;
  const back = showFrontTerm ? `<div class=\"fc-def\">${escapeHtml(card?.definition || '')}</div>` : `<div class=\"fc-term\">${escapeHtml(card?.term || '')}</div>`;
  const isFlippedClass = fcState.flipped ? ' is-flipped' : '';

  viewEl.innerHTML = `
    <div class="fc-wrap">
      <div class="fc-toolbar">
        <button class="btn" id="fc-back">← ${fcState.subKey ? 'Decks' : (fcState.topKey ? 'Subtopics' : 'Topics')}</button>
        <div class="muted">${deck.title}</div>
        <div class="fc-mode">
          <label class="muted" for="fc-mode-select">Mode</label>
          <select id="fc-mode-select" class="btn" style="padding:6px 8px;">
            <option value="term-first" ${fcState.mode === 'term-first' ? 'selected' : ''}>Term → Definition</option>
            <option value="definition-first" ${fcState.mode === 'definition-first' ? 'selected' : ''}>Definition → Term</option>
          </select>
        </div>
      </div>
      <div class="fc-progress">Card ${Math.min(idx + 1, total)} of ${total}</div>
      <div class="fc-stage">
        <div class="fc-card${isFlippedClass}" id="fc-card" role="button" tabindex="0" aria-pressed="${fcState.flipped ? 'true' : 'false'}" aria-label="Flashcard. Click or press Space/Enter to flip.">
          <div class="fc-inner">
            <div class="fc-face fc-front">${front}</div>
            <div class="fc-face fc-back">${back}</div>
          </div>
        </div>
      </div>
      <div class="fc-toolbar">
        <button class="btn" id="fc-shuffle" title="Shuffle deck">Shuffle</button>
        <div style="flex:1"></div>
        <button class="btn" id="fc-prev">⟨ Prev</button>
        <button class="btn primary" id="fc-next">Next ⟩</button>
      </div>
    </div>
  `;

  document.getElementById('fc-back').onclick = () => {
    fcState.deck = null;
    if (fcState.subKey) {
      const group = { key: fcState.topKey, label: fcState.topKey };
      return renderSubGroups(group);
    }
    if (fcState.topKey) {
      return renderTopGroups();
    }
    renderTopGroups();
  };
  const modeSel = document.getElementById('fc-mode-select');
  modeSel.onchange = (e) => { fcState.mode = e.target.value; fcState.flipped = false; renderFlashcards(); };

  const cardEl = document.getElementById('fc-card');
  function flip() {
    fcState.flipped = !fcState.flipped;
    cardEl.classList.toggle('is-flipped', fcState.flipped);
    cardEl.setAttribute('aria-pressed', fcState.flipped ? 'true' : 'false');
  }
  cardEl.addEventListener('click', flip);
  cardEl.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });

  function next() {
    if (fcState.idx + 1 < total) { fcState.idx += 1; fcState.flipped = false; renderFlashcards(); }
  }
  function prev() {
    if (fcState.idx > 0) { fcState.idx -= 1; fcState.flipped = false; renderFlashcards(); }
  }
  document.getElementById('fc-next').onclick = next;
  document.getElementById('fc-prev').onclick = prev;
  document.getElementById('fc-shuffle').onclick = () => { shuffleInPlace(fcState.cards); fcState.idx = 0; fcState.flipped = false; renderFlashcards(); };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

(async function initFlashcards() {
  try {
    await loadFlashcardIndex();
    renderTopGroups();
  } catch (e) {
    navEl.innerHTML = `<div class="muted">Failed to load flashcards. Create <code>app/data/flashcards/index.json</code> and at least one deck.</div>`;
  }
})();


