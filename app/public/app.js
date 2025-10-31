const navEl = document.getElementById('nav');
const quizEl = document.getElementById('quiz');

let state = {
  index: null, // loaded index.json
  view: 'categories',
  current: {
    category: null,
    subcategory: null,
    questions: [],
    currentIdx: 0,
    correct: 0,
    incorrect: 0,
    answered: false
  }
};

async function loadIndex() {
  // Add cache-busting to always get the latest index
  const res = await fetch(`/data/index.json?t=${Date.now()}`);
  if (!res.ok) throw new Error('Failed to load index');
  state.index = await res.json();
}

function renderCategories() {
  quizEl.classList.add('hidden');
  navEl.classList.remove('hidden');
  const cats = Object.keys(state.index.categories);
  navEl.innerHTML = `
    <h2 style="margin-top:0">Categories</h2>
    <div class="grid">
      ${cats.map(cat => {
        const sub = state.index.categories[cat];
        const total = Object.values(sub).reduce((a,b)=>a + (b.count||0), 0);
        return `<div class="card" data-cat="${cat}">
          <div style="font-weight:600">${cat}</div>
          <div class="muted">${total} total questions</div>
        </div>`;
      }).join('')}
    </div>
  `;
  navEl.querySelectorAll('.card').forEach(el => {
    el.addEventListener('click', () => {
      const cat = el.getAttribute('data-cat');
      renderSubcategories(cat);
    });
  });
}

function renderSubcategories(category) {
  quizEl.classList.add('hidden');
  navEl.classList.remove('hidden');
  const subs = state.index.categories[category] || {};
  const subKeys = Object.keys(subs);
  navEl.innerHTML = `
    <button class="btn" id="backRoot">← Back</button>
    <h2 style="margin:8px 0 0 0">${category}</h2>
    <div style="margin-top:8px; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
      <button class="btn" id="selectAll">Select All</button>
      <button class="btn" id="clearAll">Clear</button>
      <button class="btn primary" id="startCustom" disabled>Start Custom Test</button>
    </div>
    <div class="grid" style="margin-top:12px">
      ${subKeys.map(sub => {
        const c = subs[sub].count || 0;
        return `<div class="card" data-sub="${sub}">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
            <div>
              <div style="font-weight:600">${sub}</div>
              <div class="muted">${c} questions</div>
            </div>
            <input type="checkbox" class="subchk" data-sub="${sub}" />
          </div>
        </div>`;
      }).join('')}
    </div>
  `;
  document.getElementById('backRoot').onclick = renderCategories;
  // click card starts single quiz (excluding checkbox click)
  navEl.querySelectorAll('.card').forEach(el => {
    el.addEventListener('click', async (e) => {
      if (e.target && (e.target.classList.contains('subchk') || e.target.tagName === 'INPUT' )) return;
      const sub = el.getAttribute('data-sub');
      await startQuiz(category, sub);
    });
  });

  const startBtn = document.getElementById('startCustom');
  const updateStartState = () => {
    const selected = Array.from(navEl.querySelectorAll('.subchk:checked')).map(i => i.getAttribute('data-sub'));
    startBtn.disabled = selected.length === 0;
  };
  navEl.querySelectorAll('.subchk').forEach(cb => cb.addEventListener('change', updateStartState));
  document.getElementById('selectAll').onclick = () => {
    navEl.querySelectorAll('.subchk').forEach(cb => cb.checked = true);
    updateStartState();
  };
  document.getElementById('clearAll').onclick = () => {
    navEl.querySelectorAll('.subchk').forEach(cb => cb.checked = false);
    updateStartState();
  };
  startBtn.onclick = async () => {
    const selected = Array.from(navEl.querySelectorAll('.subchk:checked')).map(i => i.getAttribute('data-sub'));
    if (selected.length) await startCustomTest(category, selected);
  };
}

async function startQuiz(category, subcategory) {
  const url = `/categories/${encodeURIComponent(category)}/${encodeURIComponent(subcategory)}/questions.json`;
  const res = await fetch(url);
  const questions = await res.json();
  state.current = {
    category,
    subcategory,
    questions,
    currentIdx: 0,
    correct: 0,
    incorrect: 0,
    answered: false
  };
  renderQuiz();
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function startCustomTest(category, subcategories) {
  const all = [];
  for (const sub of subcategories) {
    const url = `/categories/${encodeURIComponent(category)}/${encodeURIComponent(sub)}/questions.json`;
    const res = await fetch(url);
    if (res.ok) {
      const qs = await res.json();
      if (Array.isArray(qs)) all.push(...qs);
    }
  }
  shuffleInPlace(all);
  state.current = {
    category: `${category}`,
    subcategory: `Custom (${subcategories.length} sets)`,
    questions: all,
    currentIdx: 0,
    correct: 0,
    incorrect: 0,
    answered: false
  };
  renderQuiz();
}

function renderQuiz() {
  navEl.classList.add('hidden');
  quizEl.classList.remove('hidden');
  const cur = state.current;
  const total = cur.questions.length;
  const idx = cur.currentIdx;
  const q = cur.questions[idx];
  const progressPct = total ? Math.round(((idx) / total) * 100) : 0;
  const answered = cur.answered;
  const scorePct = Math.round((cur.correct / Math.max(1, (idx))) * 100);

  quizEl.innerHTML = `
    <div class="toolbar">
      <button class="btn" id="backSubs">← Back</button>
      <div class="progress" style="flex:1"><div style="width:${Math.min(progressPct,100)}%"></div></div>
      <div class="score">${cur.correct}✔ / ${cur.incorrect}✖ (${isFinite(scorePct)?scorePct:0}%)</div>
    </div>
    <div class="muted quiz-meta">${cur.category} / ${cur.subcategory} — Question ${idx + 1} of ${total}</div>
    <div class="question">${q.question}${q.difficulty ? ` <span class="badge ${q.difficulty}">${q.difficulty}</span>` : ''}</div>
    <div class="choices">
      ${q.choices.map((c, i) => {
        const cls = answered ? (i === q.answerIndex ? 'correct' : (i === cur._chosen ? 'incorrect' : '')) : '';
        return `<div class="choice ${cls}" data-idx="${i}">${c}</div>`;
      }).join('')}
    </div>
    ${answered ? `<div class="feedback ${cur._chosen === q.answerIndex ? 'correct' : 'incorrect'}">${cur._chosen === q.answerIndex ? 'Correct!' : 'Incorrect!'}</div>` : ''}
    ${answered && q.explanation ? `<div class="explanation"><strong>Explanation:</strong> ${q.explanation}</div>` : ''}
    <div style="margin-top:12px; display:flex; gap:8px">
      <button class="btn" id="resetQuiz">Reset</button>
      <button class="btn primary" id="nextBtn" ${!answered ? 'disabled' : ''}>${idx + 1 === total ? 'Finish' : 'Next'}</button>
    </div>
  `;

  document.getElementById('backSubs').onclick = () => renderSubcategories(cur.category);
  document.getElementById('resetQuiz').onclick = () => { cur.currentIdx = 0; cur.correct = 0; cur.incorrect = 0; cur.answered = false; cur._chosen = undefined; renderQuiz(); };
  document.getElementById('nextBtn').onclick = () => {
    if (!cur.answered) return;
    if (cur.currentIdx + 1 < total) {
      cur.currentIdx += 1; cur.answered = false; cur._chosen = undefined; renderQuiz();
    } else {
      // finish
      alert(`Completed! Score: ${cur.correct}/${total} (${Math.round((cur.correct/Math.max(1,total))*100)}%)`);
      renderSubcategories(cur.category);
    }
  };

  quizEl.querySelectorAll('.choice').forEach(el => {
    el.addEventListener('click', () => {
      if (cur.answered) return;
      const chosen = Number(el.getAttribute('data-idx'));
      cur._chosen = chosen;
      cur.answered = true;
      if (chosen === q.answerIndex) cur.correct += 1; else cur.incorrect += 1;
      renderQuiz();
    });
  });
}

(async function init() {
  try {
    await loadIndex();
    renderCategories();
  } catch (e) {
    navEl.innerHTML = `<div class="muted">Failed to load index. Did you run <code>node tools/scan.js</code>?</div>`;
  }
})();


