(() => {
  'use strict';

  const STORAGE_KEY = 'vocab-app-progress-v1';
  const MASTERY_LABELS = {
    known: '认识',
    fuzzy: '模糊',
    unknown: '不认识'
  };
  const TYPE_LABELS = {
    star: '★ 重点',
    plain: '无星词',
    phrase: '短语',
    sentence: '句子'
  };

  const state = {
    data: { words: [], sentences: [] },
    wordMap: new Map(),
    tab: 'flashcard',
    progress: {
      version: 1,
      updatedAt: '',
      mastery: {}
    },
    flashcard: {
      unit: 'all',
      type: 'all',
      mastery: 'all',
      order: [],
      index: 0,
      flipped: false
    },
    quiz: {
      unit: 'all',
      type: 'all',
      mastery: 'all',
      pool: [],
      index: 0,
      currentOptions: [],
      selectedIndex: null
    },
    exam: {
      scope: 'all',
      phase: 'setup', // 'setup' | 'taking' | 'result'
      wordQuestions: [],
      sentenceQuestions: [],
      wordAnswers: {},
      sentenceInputs: {},
      sentenceGrades: {} // 'right' (1) | 'partial' (0.5) | 'wrong' (0)
    },
    browse: {
      unit: 'all',
      type: 'all',
      mastery: 'all',
      search: '',
      showAnswers: true,
      revealedIds: new Set()
    },
    importError: '',
    importSuccess: ''
  };

  let toastTimer = null;

  // ---------- Utilities ----------
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove('show');
    }, 2600);
  }

  // ---------- Hint Highlighter for F4 Sentences ----------
  const IRREGULAR_MAP = {
    go: 'go|goes|went|gone|going',
    lose: 'lose|loses|lost|losing',
    break: 'break|breaks|broke|broken|breaking',
    get: 'get|gets|got|gotten|getting',
    solve: 'solve|solves|solved|solving',
    orient: 'orient|orients|oriented|orienting',
    quote: 'quote|quotes|quoted|quoting'
  };

  function buildHintRegex(phrase) {
    const tokens = phrase
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .filter((t) => !/^(sb\.|sth\.|one's|oneself)$/i.test(t));

    if (tokens.length === 0) return null;

    // Build flexible pattern allowing inflection, possessives/reflexives, or short inserted words (like "a" -> "the dormitory")
    const parts = phrase
      .trim()
      .split(/\s+/)
      .map((raw) => {
        const clean = raw.toLowerCase();
        if (clean === "one's") return "(?:my|your|his|her|its|our|their|[a-z]+'s)";
        if (clean === 'oneself') return '(?:myself|yourself|himself|herself|itself|ourselves|themselves|oneself)';
        if (clean === 'sb.' || clean === 'sth.') return '[A-Za-z][A-Za-z\\s]{0,20}';
        if (clean === 'a' || clean === 'an') return '(?:a|an|the)(?:\\s+[a-z-]+)?';
        const base = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (IRREGULAR_MAP[clean]) return `(?:${IRREGULAR_MAP[clean]})`;
        return `${base}(?:s|es|ed|ing)?`;
      });

    try {
      return new RegExp(`\\b(${parts.join('\\s+')})\\b`, 'gi');
    } catch {
      return null;
    }
  }

  function highlightHints(answerText, hintStr) {
    if (!hintStr) return escapeHtml(answerText);
    const phrases = hintStr
      .split(/[;；]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const ranges = [];
    for (const p of phrases) {
      const re = buildHintRegex(p);
      if (!re) continue;
      let match;
      while ((match = re.exec(answerText)) !== null) {
        ranges.push([match.index, match.index + match[0].length]);
        if (match[0].length === 0) break;
      }
    }

    if (ranges.length === 0) {
      return escapeHtml(answerText);
    }

    // Merge overlapping ranges
    ranges.sort((a, b) => a[0] - b[0]);
    const merged = [ranges[0]];
    for (let i = 1; i < ranges.length; i++) {
      const prev = merged[merged.length - 1];
      if (ranges[i][0] <= prev[1]) {
        prev[1] = Math.max(prev[1], ranges[i][1]);
      } else {
        merged.push(ranges[i]);
      }
    }

    let out = '';
    let cursor = 0;
    for (const [start, end] of merged) {
      if (start > cursor) out += escapeHtml(answerText.slice(cursor, start));
      out += `<mark class="hint-highlight">${escapeHtml(answerText.slice(start, end))}</mark>`;
      cursor = end;
    }
    if (cursor < answerText.length) out += escapeHtml(answerText.slice(cursor));
    return out;
  }

  // ---------- F6 Progress Persistence ----------
  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.mastery && typeof parsed.mastery === 'object') {
        const clean = {};
        for (const [id, status] of Object.entries(parsed.mastery)) {
          if (status === 'known' || status === 'fuzzy' || status === 'unknown') {
            clean[id] = status;
          }
        }
        state.progress = {
          version: 1,
          updatedAt: parsed.updatedAt || '',
          mastery: clean
        };
      }
    } catch {
      // Ignore corrupted localStorage
    }
  }

  function saveProgress() {
    state.progress.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
    } catch {
      showToast('保存进度失败，可能是浏览器存储空间已满');
    }
    updateHeaderProgress();
  }

  function setWordMastery(wordId, status) {
    if (!status) {
      delete state.progress.mastery[wordId];
    } else {
      state.progress.mastery[wordId] = status;
    }
    saveProgress();
  }

  function getWordMastery(wordId) {
    return state.progress.mastery[wordId] || 'unlearned';
  }

  function updateHeaderProgress() {
    const total = state.data.words.length;
    const knownCount = state.data.words.filter((w) => state.progress.mastery[w.id] === 'known').length;
    const pill = document.getElementById('header-progress-pill');
    if (pill) {
      pill.textContent = `已认识 ${knownCount}/${total}`;
    }
  }

  function encodeProgressString() {
    const payload = JSON.stringify({
      v: 1,
      t: state.progress.updatedAt || new Date().toISOString(),
      m: state.progress.mastery
    });
    const bytes = new TextEncoder().encode(payload);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) {
      bin += String.fromCharCode(bytes[i]);
    }
    return 'VOCAB1:' + btoa(bin);
  }

  function decodeProgressString(input) {
    const text = input.trim();
    if (!text) {
      throw new Error('请先粘贴导出的进度文本');
    }

    let jsonStr = text;
    if (text.startsWith('VOCAB1:')) {
      const b64 = text.slice('VOCAB1:'.length).trim();
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      jsonStr = new TextDecoder().decode(bytes);
    } else if (!text.startsWith('{')) {
      // Also try plain base64 without prefix
      const bin = atob(text);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      jsonStr = new TextDecoder().decode(bytes);
    }

    const obj = JSON.parse(jsonStr);
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      throw new Error('进度格式不正确');
    }
    const masteryRaw = obj.m || obj.mastery;
    if (!masteryRaw || typeof masteryRaw !== 'object' || Array.isArray(masteryRaw)) {
      throw new Error('缺少有效的掌握状态数据');
    }

    const validIds = new Set(state.data.words.map((w) => w.id));
    const imported = {};
    let count = 0;
    for (const [id, val] of Object.entries(masteryRaw)) {
      if (val !== 'known' && val !== 'fuzzy' && val !== 'unknown') {
        throw new Error(`存在无效的状态值：${val}`);
      }
      if (validIds.has(id)) {
        imported[id] = val;
        count++;
      }
    }
    return { imported, count };
  }

  // ---------- F3 Speech Synthesis ----------
  function speakEnglish(text, btnEl) {
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      showToast('当前环境不支持语音朗读，请使用系统浏览器或 Chrome/Safari');
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
      const enUs = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en-us'));
      const enGb = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en-gb'));
      const anyEn = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
      const chosen = enUs || enGb || anyEn || null;
      if (chosen) {
        utter.voice = chosen;
        utter.lang = chosen.lang;
      } else {
        utter.lang = 'en-US';
      }
      utter.rate = 0.95;

      if (btnEl) btnEl.classList.add('speaking');
      utter.onend = () => {
        if (btnEl) btnEl.classList.remove('speaking');
      };
      utter.onerror = () => {
        if (btnEl) btnEl.classList.remove('speaking');
        showToast('语音朗读失败，请检查设备音量或系统语音引擎');
      };
      window.speechSynthesis.speak(utter);
    } catch {
      if (btnEl) btnEl.classList.remove('speaking');
      showToast('当前环境无法启动语音朗读');
    }
  }

  // ---------- Shared Word Filtering & Distractors ----------
  function filterWords(unit, type, mastery) {
    return state.data.words.filter((w) => {
      if (unit !== 'all' && String(w.unit) !== String(unit)) return false;
      if (type !== 'all' && w.type !== type) return false;
      if (mastery !== 'all' && getWordMastery(w.id) !== mastery) return false;
      return true;
    });
  }

  function buildWordOptions(targetWord) {
    // Strictly same unit and same type, deduplicated by Chinese meaning
    const sameBucket = state.data.words.filter(
      (w) =>
        w.unit === targetWord.unit &&
        w.type === targetWord.type &&
        w.id !== targetWord.id &&
        w.zh !== targetWord.zh
    );

    const seenZh = new Set([targetWord.zh]);
    const uniquePool = [];
    for (const candidate of shuffle(sameBucket)) {
      if (!seenZh.has(candidate.zh)) {
        seenZh.add(candidate.zh);
        uniquePool.push(candidate);
      }
      if (uniquePool.length === 3) break;
    }

    const options = [
      { id: targetWord.id, zh: targetWord.zh, isCorrect: true },
      ...uniquePool.map((d) => ({ id: d.id, zh: d.zh, isCorrect: false }))
    ];
    return shuffle(options);
  }

  function renderUnitChips(current, attrName) {
    return [
      { v: 'all', label: '全部单元' },
      { v: '1', label: 'Unit 1' },
      { v: '2', label: 'Unit 2' }
    ]
      .map(
        (opt) =>
          `<button type="button" class="chip-btn ${current === opt.v ? 'active' : ''}" data-${attrName}="${opt.v}">${opt.label}</button>`
      )
      .join('');
  }

  function renderTypeBadge(type) {
    const cls =
      type === 'star'
        ? 'badge-star'
        : type === 'plain'
          ? 'badge-plain'
          : type === 'phrase'
            ? 'badge-phrase'
            : 'badge-sentence';
    return `<span class="badge ${cls}">${TYPE_LABELS[type] || type}</span>`;
  }

  function renderMasteryBadge(status) {
    if (!status || status === 'unlearned') return '';
    return `<span class="badge badge-${status}">${MASTERY_LABELS[status]}</span>`;
  }

  // ---------- F1 Flashcard View ----------
  function rebuildFlashcardDeck(keepCurrentId = false) {
    const prevId = keepCurrentId ? state.flashcard.order[state.flashcard.index] : null;
    const list = filterWords(state.flashcard.unit, state.flashcard.type, state.flashcard.mastery);
    state.flashcard.order = list.map((w) => w.id);
    if (prevId && state.flashcard.order.includes(prevId)) {
      state.flashcard.index = state.flashcard.order.indexOf(prevId);
    } else {
      state.flashcard.index = 0;
    }
    state.flashcard.flipped = false;
  }

  function rateFlashcard(status) {
    const { order, index } = state.flashcard;
    if (order.length === 0) return;
    const wordId = order[index];
    setWordMastery(wordId, status);

    // Move to next card; if filtering by mastery and word no longer matches, remove it from current deck
    if (state.flashcard.mastery !== 'all' && state.flashcard.mastery !== status) {
      state.flashcard.order.splice(index, 1);
      if (state.flashcard.index >= state.flashcard.order.length) {
        state.flashcard.index = 0;
      }
    } else {
      state.flashcard.index = (index + 1) % order.length;
    }
    state.flashcard.flipped = false;
    render();
  }

  function renderFlashcardView() {
    const fc = state.flashcard;
    const total = fc.order.length;
    const currentWord = total > 0 ? state.wordMap.get(fc.order[fc.index]) : null;
    const currentStatus = currentWord ? getWordMastery(currentWord.id) : 'unlearned';

    return `
      <section class="filter-panel">
        <div class="filter-row">
          <div class="chip-group">${renderUnitChips(fc.unit, 'fc-unit')}</div>
        </div>
        <div class="filter-row">
          <select id="fc-type-select" class="select-sm" aria-label="按题型筛选">
            <option value="all" ${fc.type === 'all' ? 'selected' : ''}>全部词型</option>
            <option value="star" ${fc.type === 'star' ? 'selected' : ''}>★ 重点词</option>
            <option value="plain" ${fc.type === 'plain' ? 'selected' : ''}>无星词</option>
            <option value="phrase" ${fc.type === 'phrase' ? 'selected' : ''}>短语</option>
          </select>
          <select id="fc-mastery-select" class="select-sm" aria-label="按掌握状态筛选">
            <option value="all" ${fc.mastery === 'all' ? 'selected' : ''}>全部状态</option>
            <option value="unlearned" ${fc.mastery === 'unlearned' ? 'selected' : ''}>未学</option>
            <option value="unknown" ${fc.mastery === 'unknown' ? 'selected' : ''}>不认识</option>
            <option value="fuzzy" ${fc.mastery === 'fuzzy' ? 'selected' : ''}>模糊</option>
            <option value="known" ${fc.mastery === 'known' ? 'selected' : ''}>认识</option>
          </select>
          <button type="button" id="fc-shuffle-btn" class="btn-ghost">🔀 打乱</button>
        </div>
      </section>

      ${
        !currentWord
          ? `<div class="empty-box">当前筛选条件下没有卡片，请切换筛选条件。</div>`
          : `
        <div class="fc-meta-bar">
          <span>第 <strong>${fc.index + 1}</strong> / ${total} 张</span>
          <span>右滑认识 · 上滑模糊 · 左滑不认识</span>
        </div>

        <div class="fc-stage">
          <div id="fc-card" class="fc-card" tabindex="0" role="button" aria-label="闪卡，点击翻面">
            <span id="fc-swipe-tag" class="fc-swipe-tag"></span>
            <div class="fc-top">
              <div class="fc-badges">
                <span class="badge badge-unit">Unit ${currentWord.unit}</span>
                ${renderTypeBadge(currentWord.type)}
                ${renderMasteryBadge(currentStatus)}
              </div>
              <button type="button" class="speak-btn" data-speak="${escapeHtml(currentWord.en)}" aria-label="朗读英文">🔊 读</button>
            </div>

            <div class="fc-center">
              <h2 class="fc-word">${escapeHtml(currentWord.en)}</h2>
              ${currentWord.pos ? `<div class="fc-pos">${escapeHtml(currentWord.pos)}</div>` : ''}
              ${
                fc.flipped
                  ? `<div class="fc-back-box"><div class="fc-zh">${escapeHtml(currentWord.zh)}</div></div>`
                  : ''
              }
            </div>

            <div class="fc-hint-line">
              ${fc.flipped ? '已翻面：请选择掌握程度或滑动切卡' : '点击卡片或按空格键查看中文释义'}
            </div>
          </div>
        </div>

        <div class="fc-actions">
          <button type="button" class="action-btn btn-unknown" data-rate="unknown">
            <span>不认识</span>
          </button>
          <button type="button" class="action-btn btn-fuzzy" data-rate="fuzzy">
            <span>模糊</span>
          </button>
          <button type="button" class="action-btn btn-known" data-rate="known">
            <span>认识</span>
          </button>
        </div>

        <div class="fc-sub-actions">
          <button type="button" id="fc-prev-btn" class="btn-ghost">← 上一张</button>
          <span class="kbd-tip">快捷键：空格翻面 · 1不认识 2模糊 3认识 · S朗读</span>
        </div>
      `
      }
    `;
  }

  function attachFlashcardSwipe() {
    const card = document.getElementById('fc-card');
    const tag = document.getElementById('fc-swipe-tag');
    if (!card) return;

    let startX = 0;
    let startY = 0;
    let dx = 0;
    let dy = 0;
    let tracking = false;
    let moved = false;

    const resetCard = () => {
      card.classList.remove('dragging', 'swipe-known', 'swipe-unknown', 'swipe-fuzzy');
      card.style.transform = '';
      if (tag) tag.textContent = '';
    };

    card.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.speak-btn')) return;
      tracking = true;
      moved = false;
      startX = e.clientX;
      startY = e.clientY;
      dx = 0;
      dy = 0;
      card.classList.add('dragging');
    });

    card.addEventListener('pointermove', (e) => {
      if (!tracking) return;
      dx = e.clientX - startX;
      dy = e.clientY - startY;
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) moved = true;

      card.classList.remove('swipe-known', 'swipe-unknown', 'swipe-fuzzy');
      if (Math.abs(dx) >= Math.abs(dy)) {
        const rot = Math.max(-12, Math.min(12, dx * 0.05));
        card.style.transform = `translate3d(${dx}px, 0, 0) rotate(${rot}deg)`;
        if (dx > 45) {
          card.classList.add('swipe-known');
          if (tag) tag.textContent = '认识 ✓';
        } else if (dx < -45) {
          card.classList.add('swipe-unknown');
          if (tag) tag.textContent = '不认识 ✕';
        }
      } else if (dy < 0) {
        card.style.transform = `translate3d(0, ${Math.max(-110, dy)}px, 0)`;
        if (dy < -45) {
          card.classList.add('swipe-fuzzy');
          if (tag) tag.textContent = '模糊 ?';
        }
      }
    });

    const finishDrag = () => {
      if (!tracking) return;
      tracking = false;
      if (Math.abs(dx) >= Math.abs(dy) && dx > 65) {
        resetCard();
        rateFlashcard('known');
        return;
      }
      if (Math.abs(dx) >= Math.abs(dy) && dx < -65) {
        resetCard();
        rateFlashcard('unknown');
        return;
      }
      if (Math.abs(dy) > Math.abs(dx) && dy < -65) {
        resetCard();
        rateFlashcard('fuzzy');
        return;
      }
      resetCard();
      if (!moved) {
        state.flashcard.flipped = !state.flashcard.flipped;
        render();
      }
    };

    card.addEventListener('pointerup', finishDrag);
    card.addEventListener('pointercancel', () => {
      tracking = false;
      resetCard();
    });
  }

  // ---------- F2 Quiz View ----------
  function rebuildQuizPool() {
    const list = shuffle(filterWords(state.quiz.unit, state.quiz.type, state.quiz.mastery));
    state.quiz.pool = list.map((w) => w.id);
    state.quiz.index = 0;
    state.quiz.selectedIndex = null;
    prepareQuizQuestion();
  }

  function prepareQuizQuestion() {
    if (state.quiz.pool.length === 0) {
      state.quiz.currentOptions = [];
      return;
    }
    const word = state.wordMap.get(state.quiz.pool[state.quiz.index]);
    state.quiz.currentOptions = buildWordOptions(word);
    state.quiz.selectedIndex = null;
  }

  function nextQuizQuestion() {
    if (state.quiz.pool.length === 0) return;
    state.quiz.index = (state.quiz.index + 1) % state.quiz.pool.length;
    prepareQuizQuestion();
    render();
  }

  function renderQuizView() {
    const q = state.quiz;
    const word = q.pool.length > 0 ? state.wordMap.get(q.pool[q.index]) : null;
    const answered = q.selectedIndex !== null;
    const letters = ['A', 'B', 'C', 'D'];

    return `
      <section class="filter-panel">
        <div class="filter-row">
          <div class="chip-group">${renderUnitChips(q.unit, 'quiz-unit')}</div>
        </div>
        <div class="filter-row">
          <select id="quiz-type-select" class="select-sm" aria-label="按题型筛选">
            <option value="all" ${q.type === 'all' ? 'selected' : ''}>全部词型</option>
            <option value="star" ${q.type === 'star' ? 'selected' : ''}>★ 重点词</option>
            <option value="plain" ${q.type === 'plain' ? 'selected' : ''}>无星词</option>
            <option value="phrase" ${q.type === 'phrase' ? 'selected' : ''}>短语</option>
          </select>
          <select id="quiz-mastery-select" class="select-sm" aria-label="按掌握状态筛选">
            <option value="all" ${q.mastery === 'all' ? 'selected' : ''}>全部状态</option>
            <option value="unlearned" ${q.mastery === 'unlearned' ? 'selected' : ''}>未学</option>
            <option value="unknown" ${q.mastery === 'unknown' ? 'selected' : ''}>不认识</option>
            <option value="fuzzy" ${q.mastery === 'fuzzy' ? 'selected' : ''}>模糊</option>
            <option value="known" ${q.mastery === 'known' ? 'selected' : ''}>认识</option>
          </select>
        </div>
      </section>

      ${
        !word
          ? `<div class="empty-box">当前筛选条件下没有题目，请调整筛选条件。</div>`
          : `
        <div class="quiz-card">
          <div class="fc-top">
            <div class="fc-badges">
              <span class="badge badge-unit">Unit ${word.unit}</span>
              ${renderTypeBadge(word.type)}
              <span class="badge badge-plain">${q.index + 1} / ${q.pool.length}</span>
            </div>
            <button type="button" class="speak-btn" data-speak="${escapeHtml(word.en)}" aria-label="朗读英文">🔊 读</button>
          </div>

          <div class="quiz-prompt-row">
            <div>
              <h2 class="quiz-word">${escapeHtml(word.en)}</h2>
              ${word.pos ? `<div class="quiz-pos">${escapeHtml(word.pos)}</div>` : ''}
            </div>
          </div>

          <div class="option-list">
            ${q.currentOptions
              .map((opt, idx) => {
                let cls = '';
                if (answered) {
                  if (opt.isCorrect) cls = 'correct';
                  else if (idx === q.selectedIndex) cls = 'wrong';
                }
                return `
                  <button type="button" class="option-btn ${cls}" data-quiz-opt="${idx}" ${answered ? 'disabled' : ''}>
                    <span class="option-key">${letters[idx]}</span>
                    <span>${escapeHtml(opt.zh)}</span>
                  </button>
                `;
              })
              .join('')}
          </div>

          <div class="quiz-footer">
            ${
              answered
                ? `<button type="button" id="quiz-next-btn" class="btn-primary">下一题 →</button>`
                : `<div class="kbd-tip">快捷键：1-4 或 A-D 选择 · S 朗读 · 选完按回车下一题</div>`
            }
          </div>
        </div>
      `
      }
    `;
  }

  // ---------- F4 Mock Exam View ----------
  function startMockExam() {
    const scope = state.exam.scope;
    const unitFilter = (item) => scope === 'all' || String(item.unit) === scope;

    const unitWords = state.data.words.filter(unitFilter);
    const starWords = shuffle(unitWords.filter((w) => w.type === 'star'));
    const otherWords = shuffle(unitWords.filter((w) => w.type !== 'star'));

    const chosenStar = starWords.slice(0, 15);
    const chosenOther = otherWords.slice(0, 5);
    const chosenSet = new Set([...chosenStar, ...chosenOther].map((w) => w.id));

    if (chosenSet.size < 20) {
      const remaining = shuffle(unitWords.filter((w) => !chosenSet.has(w.id)));
      for (const w of remaining) {
        if (chosenSet.size >= 20) break;
        chosenSet.add(w.id);
      }
    }

    const finalWords = shuffle(unitWords.filter((w) => chosenSet.has(w.id)));
    const wordQuestions = finalWords.map((w) => ({
      word: w,
      options: buildWordOptions(w)
    }));

    const unitSentences = shuffle(state.data.sentences.filter(unitFilter)).slice(0, 2);

    state.exam.phase = 'taking';
    state.exam.wordQuestions = wordQuestions;
    state.exam.sentenceQuestions = unitSentences;
    state.exam.wordAnswers = {};
    state.exam.sentenceInputs = {};
    state.exam.sentenceGrades = {};
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderExamView() {
    const ex = state.exam;
    if (ex.phase === 'setup') {
      return `
        <div class="exam-setup-card">
          <h2 class="exam-setup-title">模拟考试设置</h2>
          <p class="exam-desc">
            默认抽取 <strong>20 道单词四选一</strong>（约 15 个 ★ 重点词 + 5 个无星词/短语，自动判分）+ <strong>2 道中译英句子</strong>（交卷后对照参考答案与易错点自评）。
          </p>
          <div class="scope-grid">
            <button type="button" class="scope-btn ${ex.scope === '1' ? 'active' : ''}" data-exam-scope="1">Unit 1</button>
            <button type="button" class="scope-btn ${ex.scope === '2' ? 'active' : ''}" data-exam-scope="2">Unit 2</button>
            <button type="button" class="scope-btn ${ex.scope === 'all' ? 'active' : ''}" data-exam-scope="all">全部范围</button>
          </div>
          <button type="button" id="exam-start-btn" class="btn-primary">开始模拟考试</button>
        </div>
      `;
    }

    const letters = ['A', 'B', 'C', 'D'];
    if (ex.phase === 'taking') {
      const answeredWords = Object.keys(ex.wordAnswers).length;
      const answeredSentences = ex.sentenceQuestions.filter(
        (s) => (ex.sentenceInputs[s.id] || '').trim().length > 0
      ).length;
      const totalQ = ex.wordQuestions.length + ex.sentenceQuestions.length;

      return `
        <div class="exam-sticky-bar">
          <span>已答 <strong>${answeredWords + answeredSentences}</strong> / ${totalQ} 题</span>
          <button type="button" id="exam-submit-btn" class="btn-primary">交卷评分</button>
        </div>

        ${ex.wordQuestions
          .map(
            (q, qi) => `
          <div class="exam-q-card">
            <div class="fc-top">
              <div class="fc-badges">
                <span class="badge badge-unit">第 ${qi + 1} 题</span>
                <span class="badge badge-plain">Unit ${q.word.unit}</span>
                ${renderTypeBadge(q.word.type)}
              </div>
              <button type="button" class="speak-btn" data-speak="${escapeHtml(q.word.en)}" aria-label="朗读英文">🔊</button>
            </div>
            <div class="quiz-prompt-row" style="margin:10px 0 12px;">
              <div>
                <div class="quiz-word" style="font-size:22px;">${escapeHtml(q.word.en)}</div>
                ${q.word.pos ? `<div class="quiz-pos">${escapeHtml(q.word.pos)}</div>` : ''}
              </div>
            </div>
            <div class="option-list">
              ${q.options
                .map(
                  (opt, oi) => `
                <button type="button" class="option-btn ${ex.wordAnswers[q.word.id] === oi ? 'selected' : ''}" data-exam-word="${escapeHtml(q.word.id)}" data-exam-opt="${oi}">
                  <span class="option-key">${letters[oi]}</span>
                  <span>${escapeHtml(opt.zh)}</span>
                </button>
              `
                )
                .join('')}
            </div>
          </div>
        `
          )
          .join('')}

        ${ex.sentenceQuestions
          .map(
            (s, si) => `
          <div class="exam-q-card">
            <div class="fc-badges" style="margin-bottom:8px;">
              <span class="badge badge-sentence">中译英 ${si + 1}</span>
              <span class="badge badge-unit">Unit ${s.unit}</span>
            </div>
            <div style="font-size:16px;font-weight:700;line-height:1.5;">${escapeHtml(s.zh)}</div>
            <div class="hint-box">提示词：${escapeHtml(s.hint)}</div>
            <textarea class="sentence-textarea" data-exam-sentence="${escapeHtml(s.id)}" placeholder="请输入英文翻译，注意使用提示词...">${escapeHtml(ex.sentenceInputs[s.id] || '')}</textarea>
          </div>
        `
          )
          .join('')}

        <button type="button" id="exam-submit-bottom-btn" class="btn-primary">交卷评分</button>
      `;
    }

    // Result phase
    let wordScore = 0;
    for (const q of ex.wordQuestions) {
      const sel = ex.wordAnswers[q.word.id];
      if (sel !== undefined && q.options[sel] && q.options[sel].isCorrect) {
        wordScore += 1;
      }
    }

    let sentenceScore = 0;
    for (const s of ex.sentenceQuestions) {
      const g = ex.sentenceGrades[s.id];
      if (g === 'right') sentenceScore += 1;
      else if (g === 'partial') sentenceScore += 0.5;
    }

    const maxScore = ex.wordQuestions.length + ex.sentenceQuestions.length;
    const totalScore = wordScore + sentenceScore;

    return `
      <div class="exam-summary-card">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
          <div>
            <div style="font-size:13px;color:var(--text-muted);">模拟考成绩（句子自评后自动更新）</div>
            <div class="score-big">${totalScore} / ${maxScore}</div>
            <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">
              单词自动判分：${wordScore}/${ex.wordQuestions.length} · 句子自评：${sentenceScore}/${ex.sentenceQuestions.length}
            </div>
          </div>
          <button type="button" id="exam-restart-btn" class="btn-ghost">再考一次</button>
        </div>
      </div>

      ${ex.sentenceQuestions
        .map((s, si) => {
          const g = ex.sentenceGrades[s.id];
          const userAns = (ex.sentenceInputs[s.id] || '').trim();
          return `
          <div class="exam-q-card">
            <div class="fc-top" style="margin-bottom:8px;">
              <div class="fc-badges">
                <span class="badge badge-sentence">中译英 ${si + 1}</span>
                <span class="badge badge-unit">Unit ${s.unit}</span>
              </div>
              <button type="button" class="speak-btn" data-speak="${escapeHtml(s.answer)}" aria-label="朗读参考答案">🔊 读</button>
            </div>
            <div style="font-size:15px;font-weight:700;margin-bottom:6px;">${escapeHtml(s.zh)}</div>
            <div class="hint-box">提示词：${escapeHtml(s.hint)}</div>

            <div style="margin-top:10px;font-size:13px;color:var(--text-muted);">你的作答：</div>
            <div style="padding:8px 10px;border-radius:8px;background:var(--bg);margin-top:4px;font-size:14px;">
              ${userAns ? escapeHtml(userAns) : '<em>（未作答）</em>'}
            </div>

            <div style="margin-top:10px;font-size:13px;color:var(--text-muted);">参考答案（已高亮提示词）：</div>
            <div style="padding:10px 12px;border-radius:10px;background:var(--success-soft);margin-top:4px;font-size:15px;line-height:1.55;">
              ${highlightHints(s.answer, s.hint)}
            </div>

            ${
              Array.isArray(s.pitfalls) && s.pitfalls.length > 0
                ? `<div class="pitfalls-box">
                    <strong>易错点：</strong>
                    <ul>${s.pitfalls.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}</ul>
                  </div>`
                : ''
            }

            <div class="self-grade-row">
              <button type="button" class="grade-btn ${g === 'right' ? 'active-right' : ''}" data-grade-s="${escapeHtml(s.id)}" data-grade-val="right">对 (1分)</button>
              <button type="button" class="grade-btn ${g === 'partial' ? 'active-partial' : ''}" data-grade-s="${escapeHtml(s.id)}" data-grade-val="partial">部分对 (0.5分)</button>
              <button type="button" class="grade-btn ${g === 'wrong' ? 'active-wrong' : ''}" data-grade-s="${escapeHtml(s.id)}" data-grade-val="wrong">错 (0分)</button>
            </div>
          </div>
        `;
        })
        .join('')}

      ${ex.wordQuestions
        .map((q, qi) => {
          const sel = ex.wordAnswers[q.word.id];
          const isRight = sel !== undefined && q.options[sel] && q.options[sel].isCorrect;
          return `
          <div class="exam-q-card">
            <div class="fc-top" style="margin-bottom:8px;">
              <div class="fc-badges">
                <span class="badge ${isRight ? 'badge-known' : 'badge-unknown'}">第 ${qi + 1} 题 · ${isRight ? '正确' : '错误'}</span>
                <span class="badge badge-unit">Unit ${q.word.unit}</span>
              </div>
              <button type="button" class="speak-btn" data-speak="${escapeHtml(q.word.en)}" aria-label="朗读英文">🔊</button>
            </div>
            <div style="font-size:18px;font-weight:700;margin-bottom:8px;">
              ${escapeHtml(q.word.en)} <span style="font-size:13px;color:var(--text-muted);font-weight:500;">${escapeHtml(q.word.pos || '')}</span>
            </div>
            <div class="option-list">
              ${q.options
                .map((opt, oi) => {
                  let cls = '';
                  if (opt.isCorrect) cls = 'correct';
                  else if (oi === sel) cls = 'wrong';
                  return `
                    <div class="option-btn ${cls}" style="cursor:default;">
                      <span class="option-key">${letters[oi]}</span>
                      <span>${escapeHtml(opt.zh)}</span>
                    </div>
                  `;
                })
                .join('')}
            </div>
          </div>
        `;
        })
        .join('')}
    `;
  }

  // ---------- F5 Browse & Search View ----------
  function renderBrowseView() {
    const b = state.browse;
    const kw = b.search.trim().toLowerCase();

    const items = [];
    if (b.type === 'all' || b.type === 'sentence') {
      for (const s of state.data.sentences) {
        if (b.unit !== 'all' && String(s.unit) !== b.unit) continue;
        if (b.mastery !== 'all') continue;
        if (kw) {
          const hay = `${s.zh} ${s.hint} ${s.answer}`.toLowerCase();
          if (!hay.includes(kw)) continue;
        }
        items.push({ kind: 'sentence', data: s });
      }
    }

    if (b.type !== 'sentence') {
      for (const w of state.data.words) {
        if (b.unit !== 'all' && String(w.unit) !== b.unit) continue;
        if (b.type !== 'all' && w.type !== b.type) continue;
        const st = getWordMastery(w.id);
        if (b.mastery !== 'all' && st !== b.mastery) continue;
        if (kw) {
          const hay = `${w.en} ${w.zh} ${w.pos || ''}`.toLowerCase();
          if (!hay.includes(kw)) continue;
        }
        items.push({ kind: 'word', data: w, mastery: st });
      }
    }

    return `
      <section class="filter-panel">
        <div class="filter-row">
          <div class="chip-group">${renderUnitChips(b.unit, 'browse-unit')}</div>
        </div>
        <div class="filter-row">
          <select id="browse-type-select" class="select-sm" aria-label="按题型筛选">
            <option value="all" ${b.type === 'all' ? 'selected' : ''}>全部题型</option>
            <option value="star" ${b.type === 'star' ? 'selected' : ''}>★ 重点词</option>
            <option value="plain" ${b.type === 'plain' ? 'selected' : ''}>无星词</option>
            <option value="phrase" ${b.type === 'phrase' ? 'selected' : ''}>短语</option>
            <option value="sentence" ${b.type === 'sentence' ? 'selected' : ''}>句子（中译英）</option>
          </select>
          <select id="browse-mastery-select" class="select-sm" aria-label="按掌握状态筛选">
            <option value="all" ${b.mastery === 'all' ? 'selected' : ''}>全部状态</option>
            <option value="unlearned" ${b.mastery === 'unlearned' ? 'selected' : ''}>未学</option>
            <option value="unknown" ${b.mastery === 'unknown' ? 'selected' : ''}>不认识</option>
            <option value="fuzzy" ${b.mastery === 'fuzzy' ? 'selected' : ''}>模糊</option>
            <option value="known" ${b.mastery === 'known' ? 'selected' : ''}>认识</option>
          </select>
          <button type="button" id="browse-toggle-ans" class="btn-ghost">
            ${b.showAnswers ? '🙈 隐藏答案' : '👁️ 显示答案'}
          </button>
        </div>
        <div class="search-row">
          <div class="search-input-wrap">
            <input id="browse-search-input" class="search-input" type="search" value="${escapeHtml(b.search)}" placeholder="搜索英文、中文或提示词...">
            ${b.search ? `<button type="button" id="browse-clear-search" class="clear-btn" aria-label="清空搜索">✕</button>` : ''}
          </div>
          <span style="font-size:13px;color:var(--text-muted);white-space:nowrap;">共 ${items.length} 条</span>
        </div>
      </section>

      ${
        items.length === 0
          ? `<div class="empty-box">没有找到匹配的词条或句子。</div>`
          : `<div class="browse-list">
              ${items
                .map((item) => {
                  if (item.kind === 'word') {
                    const w = item.data;
                    const visible = b.showAnswers || b.revealedIds.has(w.id);
                    return `
                      <article class="browse-item">
                        <div class="browse-head">
                          <div>
                            <span class="browse-en">${escapeHtml(w.en)}</span>
                            ${w.pos ? `<span class="browse-pos">${escapeHtml(w.pos)}</span>` : ''}
                          </div>
                          <button type="button" class="speak-btn" data-speak="${escapeHtml(w.en)}" aria-label="朗读英文">🔊</button>
                        </div>
                        ${
                          visible
                            ? `<div class="browse-zh">${escapeHtml(w.zh)}</div>`
                            : `<div class="browse-zh masked" data-reveal-id="${escapeHtml(w.id)}">点击查看释义</div>`
                        }
                        <div class="browse-footer">
                          <div class="fc-badges">
                            <span class="badge badge-unit">Unit ${w.unit}</span>
                            ${renderTypeBadge(w.type)}
                          </div>
                          <div class="mastery-pills">
                            ${['known', 'fuzzy', 'unknown']
                              .map(
                                (st) =>
                                  `<button type="button" class="m-pill ${item.mastery === st ? `active-${st}` : ''}" data-browse-rate="${escapeHtml(w.id)}" data-status="${st}">${MASTERY_LABELS[st]}</button>`
                              )
                              .join('')}
                          </div>
                        </div>
                      </article>
                    `;
                  }
                  const s = item.data;
                  const visible = b.showAnswers || b.revealedIds.has(s.id);
                  return `
                    <article class="browse-item">
                      <div class="browse-head">
                        <div class="fc-badges">
                          <span class="badge badge-unit">Unit ${s.unit}</span>
                          <span class="badge badge-sentence">中译英</span>
                        </div>
                        <button type="button" class="speak-btn" data-speak="${escapeHtml(s.answer)}" aria-label="朗读参考答案">🔊</button>
                      </div>
                      <div style="margin-top:8px;font-size:15px;font-weight:700;line-height:1.5;">${escapeHtml(s.zh)}</div>
                      <div class="hint-box">提示词：${escapeHtml(s.hint)}</div>
                      ${
                        visible
                          ? `
                            <div class="browse-zh" style="margin-top:10px;padding:8px 10px;background:var(--success-soft);border-radius:8px;">
                              ${highlightHints(s.answer, s.hint)}
                            </div>
                            ${
                              Array.isArray(s.pitfalls) && s.pitfalls.length > 0
                                ? `<div class="pitfalls-box">
                                    <strong>易错点：</strong>
                                    <ul>${s.pitfalls.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}</ul>
                                  </div>`
                                : ''
                            }
                          `
                          : `<div style="margin-top:8px;"><span class="browse-zh masked" data-reveal-id="${escapeHtml(s.id)}">点击查看参考答案与易错点</span></div>`
                      }
                    </article>
                  `;
                })
                .join('')}
            </div>`
      }
    `;
  }

  // ---------- F6 Progress View ----------
  function renderProgressView() {
    const counts = { known: 0, fuzzy: 0, unknown: 0, unlearned: 0 };
    for (const w of state.data.words) {
      counts[getWordMastery(w.id)] += 1;
    }
    const exportedText = encodeProgressString();

    return `
      <div class="card-box">
        <h2>当前掌握情况</h2>
        <div style="font-size:13px;color:var(--text-muted);">
          进度仅保存在当前浏览器的本地存储中（key: <code>${STORAGE_KEY}</code>）。
        </div>
        <div class="stat-grid">
          <div class="stat-cell">
            <div class="stat-num" style="color:var(--success);">${counts.known}</div>
            <div class="stat-lbl">认识</div>
          </div>
          <div class="stat-cell">
            <div class="stat-num" style="color:var(--warning);">${counts.fuzzy}</div>
            <div class="stat-lbl">模糊</div>
          </div>
          <div class="stat-cell">
            <div class="stat-num" style="color:var(--danger);">${counts.unknown}</div>
            <div class="stat-lbl">不认识</div>
          </div>
          <div class="stat-cell">
            <div class="stat-num" style="color:var(--text-muted);">${counts.unlearned}</div>
            <div class="stat-lbl">未学</div>
          </div>
        </div>
      </div>

      <div class="card-box">
        <h2>导出进度（跨设备迁移）</h2>
        <div style="font-size:13px;color:var(--text-muted);">复制下面这段文字，发送到另一台设备粘贴导入即可恢复进度。</div>
        <textarea id="export-textarea" class="data-textarea" readonly>${escapeHtml(exportedText)}</textarea>
        <div class="btn-row">
          <button type="button" id="copy-export-btn" class="btn-primary">📋 一键复制进度</button>
        </div>
      </div>

      <div class="card-box">
        <h2>导入进度</h2>
        <div style="font-size:13px;color:var(--text-muted);">粘贴之前导出的文本（支持 <code>VOCAB1:</code> 编码或 JSON）。</div>
        <textarea id="import-textarea" class="data-textarea" placeholder="在此粘贴导出的进度文本..."></textarea>
        ${state.importError ? `<div style="color:var(--danger);font-size:13px;margin-bottom:8px;">${escapeHtml(state.importError)}</div>` : ''}
        ${state.importSuccess ? `<div style="color:var(--success);font-size:13px;margin-bottom:8px;">${escapeHtml(state.importSuccess)}</div>` : ''}
        <div class="btn-row">
          <button type="button" id="import-apply-btn" class="btn-primary">📥 导入并覆盖当前进度</button>
          <button type="button" id="reset-progress-btn" class="btn-ghost" style="color:var(--danger);">🗑 清空本地进度</button>
        </div>
      </div>
    `;
  }

  // ---------- Main Render ----------
  function render() {
    const main = document.getElementById('app-main');
    if (!main) return;

    document.querySelectorAll('.nav-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === state.tab);
    });

    if (state.tab === 'flashcard') {
      main.innerHTML = renderFlashcardView();
      attachFlashcardSwipe();
    } else if (state.tab === 'quiz') {
      main.innerHTML = renderQuizView();
    } else if (state.tab === 'exam') {
      main.innerHTML = renderExamView();
    } else if (state.tab === 'browse') {
      main.innerHTML = renderBrowseView();
    } else if (state.tab === 'progress') {
      main.innerHTML = renderProgressView();
    }
  }

  // ---------- Event Delegation ----------
  function bindEvents() {
    document.querySelector('.bottom-nav').addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-btn');
      if (!btn) return;
      state.tab = btn.dataset.tab;
      state.importError = '';
      state.importSuccess = '';
      render();
      window.scrollTo({ top: 0 });
    });

    const main = document.getElementById('app-main');

    main.addEventListener('click', (e) => {
      // Speaker button (F3)
      const speakBtn = e.target.closest('.speak-btn');
      if (speakBtn) {
        e.stopPropagation();
        const text = speakBtn.dataset.speak;
        if (text) speakEnglish(text, speakBtn);
        return;
      }

      // Flashcard controls (F1)
      const fcUnit = e.target.closest('[data-fc-unit]');
      if (fcUnit) {
        state.flashcard.unit = fcUnit.dataset.fcUnit;
        rebuildFlashcardDeck();
        render();
        return;
      }
      if (e.target.closest('#fc-shuffle-btn')) {
        state.flashcard.order = shuffle(state.flashcard.order);
        state.flashcard.index = 0;
        state.flashcard.flipped = false;
        render();
        showToast('已随机打乱卡片顺序');
        return;
      }
      const rateBtn = e.target.closest('[data-rate]');
      if (rateBtn) {
        rateFlashcard(rateBtn.dataset.rate);
        return;
      }
      if (e.target.closest('#fc-prev-btn')) {
        const len = state.flashcard.order.length;
        if (len > 0) {
          state.flashcard.index = (state.flashcard.index - 1 + len) % len;
          state.flashcard.flipped = false;
          render();
        }
        return;
      }

      // Quiz controls (F2)
      const quizUnit = e.target.closest('[data-quiz-unit]');
      if (quizUnit) {
        state.quiz.unit = quizUnit.dataset.quizUnit;
        rebuildQuizPool();
        render();
        return;
      }
      const quizOpt = e.target.closest('[data-quiz-opt]');
      if (quizOpt && state.quiz.selectedIndex === null) {
        state.quiz.selectedIndex = Number(quizOpt.dataset.quizOpt);
        render();
        return;
      }
      if (e.target.closest('#quiz-next-btn')) {
        nextQuizQuestion();
        return;
      }

      // Exam controls (F4)
      const examScope = e.target.closest('[data-exam-scope]');
      if (examScope) {
        state.exam.scope = examScope.dataset.examScope;
        render();
        return;
      }
      if (e.target.closest('#exam-start-btn')) {
        startMockExam();
        return;
      }
      const examWordBtn = e.target.closest('[data-exam-word]');
      if (examWordBtn) {
        const wId = examWordBtn.dataset.examWord;
        const optIdx = Number(examWordBtn.dataset.examOpt);
        state.exam.wordAnswers[wId] = optIdx;
        render();
        return;
      }
      if (e.target.closest('#exam-submit-btn') || e.target.closest('#exam-submit-bottom-btn')) {
        const unanswered =
          state.exam.wordQuestions.length - Object.keys(state.exam.wordAnswers).length;
        if (unanswered > 0 && !window.confirm(`还有 ${unanswered} 道单词题未选，确定现在交卷吗？`)) {
          return;
        }
        state.exam.phase = 'result';
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const gradeBtn = e.target.closest('[data-grade-s]');
      if (gradeBtn) {
        state.exam.sentenceGrades[gradeBtn.dataset.gradeS] = gradeBtn.dataset.gradeVal;
        render();
        return;
      }
      if (e.target.closest('#exam-restart-btn')) {
        state.exam.phase = 'setup';
        render();
        return;
      }

      // Browse controls (F5)
      const browseUnit = e.target.closest('[data-browse-unit]');
      if (browseUnit) {
        state.browse.unit = browseUnit.dataset.browseUnit;
        render();
        return;
      }
      if (e.target.closest('#browse-toggle-ans')) {
        state.browse.showAnswers = !state.browse.showAnswers;
        if (state.browse.showAnswers) state.browse.revealedIds.clear();
        render();
        return;
      }
      if (e.target.closest('#browse-clear-search')) {
        state.browse.search = '';
        render();
        return;
      }
      const revealEl = e.target.closest('[data-reveal-id]');
      if (revealEl) {
        state.browse.revealedIds.add(revealEl.dataset.revealId);
        render();
        return;
      }
      const browseRate = e.target.closest('[data-browse-rate]');
      if (browseRate) {
        const id = browseRate.dataset.browseRate;
        const st = browseRate.dataset.status;
        const current = getWordMastery(id);
        setWordMastery(id, current === st ? null : st);
        render();
        return;
      }

      // Progress controls (F6)
      if (e.target.closest('#copy-export-btn')) {
        const ta = document.getElementById('export-textarea');
        if (!ta) return;
        const val = ta.value;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard
            .writeText(val)
            .then(() => showToast('已复制进度文本'))
            .catch(() => {
              ta.select();
              document.execCommand('copy');
              showToast('已复制进度文本');
            });
        } else {
          ta.select();
          document.execCommand('copy');
          showToast('已复制进度文本');
        }
        return;
      }
      if (e.target.closest('#import-apply-btn')) {
        const ta = document.getElementById('import-textarea');
        if (!ta) return;
        try {
          const { imported, count } = decodeProgressString(ta.value);
          state.progress.mastery = imported;
          saveProgress();
          rebuildFlashcardDeck();
          state.importError = '';
          state.importSuccess = `导入成功，共恢复 ${count} 条单词掌握状态。`;
          render();
          showToast(`已导入 ${count} 条记录`);
        } catch (err) {
          state.importSuccess = '';
          state.importError = err && err.message ? err.message : '导入失败，请检查文本格式';
          render();
        }
        return;
      }
      if (e.target.closest('#reset-progress-btn')) {
        if (window.confirm('确定要清空所有本地学习进度吗？此操作不可撤销。')) {
          state.progress.mastery = {};
          saveProgress();
          rebuildFlashcardDeck();
          state.importError = '';
          state.importSuccess = '已清空本地进度。';
          render();
          showToast('本地进度已清空');
        }
      }
    });

    main.addEventListener('change', (e) => {
      const target = e.target;
      if (target.id === 'fc-type-select') {
        state.flashcard.type = target.value;
        rebuildFlashcardDeck();
        render();
      } else if (target.id === 'fc-mastery-select') {
        state.flashcard.mastery = target.value;
        rebuildFlashcardDeck();
        render();
      } else if (target.id === 'quiz-type-select') {
        state.quiz.type = target.value;
        rebuildQuizPool();
        render();
      } else if (target.id === 'quiz-mastery-select') {
        state.quiz.mastery = target.value;
        rebuildQuizPool();
        render();
      } else if (target.id === 'browse-type-select') {
        state.browse.type = target.value;
        render();
      } else if (target.id === 'browse-mastery-select') {
        state.browse.mastery = target.value;
        render();
      }
    });

    main.addEventListener('input', (e) => {
      const target = e.target;
      if (target.id === 'browse-search-input') {
        state.browse.search = target.value;
        const pos = target.selectionStart;
        render();
        const nextInput = document.getElementById('browse-search-input');
        if (nextInput) {
          nextInput.focus();
          if (typeof pos === 'number') nextInput.setSelectionRange(pos, pos);
        }
      } else if (target.dataset.examSentence) {
        state.exam.sentenceInputs[target.dataset.examSentence] = target.value;
        // Update sticky answered count without full re-render
        const bar = document.querySelector('.exam-sticky-bar span strong');
        if (bar) {
          const answeredWords = Object.keys(state.exam.wordAnswers).length;
          const answeredSentences = state.exam.sentenceQuestions.filter(
            (s) => (state.exam.sentenceInputs[s.id] || '').trim().length > 0
          ).length;
          bar.textContent = String(answeredWords + answeredSentences);
        }
      }
    });

    // Keyboard shortcuts for desktop
    document.addEventListener('keydown', (e) => {
      const tagName = (e.target && e.target.tagName) || '';
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') return;

      if (state.tab === 'flashcard' && state.flashcard.order.length > 0) {
        if (e.code === 'Space' || e.key === 'Enter') {
          e.preventDefault();
          state.flashcard.flipped = !state.flashcard.flipped;
          render();
        } else if (e.key === '1' || e.key === 'ArrowLeft') {
          e.preventDefault();
          rateFlashcard('unknown');
        } else if (e.key === '2' || e.key === 'ArrowDown') {
          e.preventDefault();
          rateFlashcard('fuzzy');
        } else if (e.key === '3' || e.key === 'ArrowRight') {
          e.preventDefault();
          rateFlashcard('known');
        } else if (e.key === 'p' || e.key === 'P' || e.key === 'Backspace') {
          e.preventDefault();
          const len = state.flashcard.order.length;
          state.flashcard.index = (state.flashcard.index - 1 + len) % len;
          state.flashcard.flipped = false;
          render();
        } else if (e.key === 's' || e.key === 'S' || e.key === 'r' || e.key === 'R') {
          const word = state.wordMap.get(state.flashcard.order[state.flashcard.index]);
          if (word) speakEnglish(word.en, document.querySelector('.fc-card .speak-btn'));
        }
      } else if (state.tab === 'quiz' && state.quiz.pool.length > 0) {
        const keyMap = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, A: 0, b: 1, B: 1, c: 2, C: 2, d: 3, D: 3 };
        if (state.quiz.selectedIndex === null && keyMap[e.key] !== undefined) {
          const idx = keyMap[e.key];
          if (idx < state.quiz.currentOptions.length) {
            e.preventDefault();
            state.quiz.selectedIndex = idx;
            render();
          }
        } else if (state.quiz.selectedIndex !== null && (e.key === 'Enter' || e.code === 'Space')) {
          e.preventDefault();
          nextQuizQuestion();
        } else if (e.key === 's' || e.key === 'S') {
          const word = state.wordMap.get(state.quiz.pool[state.quiz.index]);
          if (word) speakEnglish(word.en, document.querySelector('.quiz-card .speak-btn'));
        }
      }
    });
  }

  // ---------- Offline & SW ----------
  function setupPWA() {
    const offlineBadge = document.getElementById('offline-badge');
    const syncOnline = () => {
      if (offlineBadge) offlineBadge.classList.toggle('hidden', navigator.onLine);
    };
    window.addEventListener('online', syncOnline);
    window.addEventListener('offline', syncOnline);
    syncOnline();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {
        // Ignore registration error in unsupported contexts (e.g. file://)
      });
    }
  }

  // ---------- Init ----------
  async function init() {
    setupPWA();
    bindEvents();
    loadProgress();

    try {
      const res = await fetch('./data.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      state.data = {
        words: Array.isArray(data.words) ? data.words : [],
        sentences: Array.isArray(data.sentences) ? data.sentences : []
      };
      state.wordMap = new Map(state.data.words.map((w) => [w.id, w]));

      updateHeaderProgress();
      rebuildFlashcardDeck();
      rebuildQuizPool();
      render();
    } catch (err) {
      const main = document.getElementById('app-main');
      if (main) {
        main.innerHTML = `<div class="empty-box">词库加载失败：${escapeHtml(err && err.message ? err.message : '未知错误')}</div>`;
      }
    }
  }

  init();
})();
