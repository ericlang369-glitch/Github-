(() => {
  'use strict';

  const STORAGE_KEY = 'vocab-app-progress-v1';
  const FLASHCARD_STORAGE_KEY = 'vocab-app-flashcard-v1';
  const MASTERY_LABELS = {
    known: '认识',
    fuzzy: '模糊',
    unknown: '不认识'
  };
  const TYPE_LABELS = {
    star: '重点',
    plain: '无星词',
    phrase: '短语',
    sentence: '句子'
  };

  const ICONS = {
    speaker:
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
    star:
      '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    check:
      '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
    x:
      '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    help:
      '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    shuffle:
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>',
    arrowLeft:
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
    arrowRight:
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    eye:
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff:
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
    copy:
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    download:
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    trash:
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
  };

  function renderSpeakButton(text, label = '', ariaLabel = '朗读英文') {
    return `<button type="button" class="speak-btn" data-speak="${escapeHtml(text)}" aria-label="${escapeHtml(ariaLabel)}"><span class="tts-icon">${ICONS.speaker}</span><span class="tts-bars hidden" aria-hidden="true"><span class="tts-bar"></span><span class="tts-bar"></span><span class="tts-bar"></span></span>${label ? `<span>${escapeHtml(label)}</span>` : ''}</button>`;
  }

  const state = {
    units: [],
    data: { words: [], sentences: [] },
    wordMap: new Map(),
    tab: 'flashcard',
    progress: {
      version: 1,
      updatedAt: '',
      mastery: {},
      sentenceEdits: {},
      sentenceMastery: {}
    },
    flashcard: {
      unit: 'all',
      type: 'all',
      mastery: 'all',
      order: [],
      index: 0,
      flipped: false,
      autoNext: false,
      enterDir: null
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
    sentencePractice: {
      unit: 'all',
      mastery: 'all',
      order: [],
      index: 0,
      revealed: false,
      drafts: {},
      editingId: null,
      editDraft: ''
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
      revealedIds: new Set(),
      editingSentenceId: null,
      editDraft: ''
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
        const cleanEdits = {};
        if (parsed.sentenceEdits && typeof parsed.sentenceEdits === 'object') {
          for (const [id, text] of Object.entries(parsed.sentenceEdits)) {
            if (typeof text === 'string' && text.trim()) {
              cleanEdits[id] = text.trim();
            }
          }
        }
        const cleanSentenceMastery = {};
        if (parsed.sentenceMastery && typeof parsed.sentenceMastery === 'object') {
          for (const [id, st] of Object.entries(parsed.sentenceMastery)) {
            if (st === 'known' || st === 'fuzzy') {
              cleanSentenceMastery[id] = st;
            }
          }
        }
        state.progress = {
          version: 1,
          updatedAt: parsed.updatedAt || '',
          mastery: clean,
          sentenceEdits: cleanEdits,
          sentenceMastery: cleanSentenceMastery
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

  function getSentenceAnswer(s) {
    if (!s) return '';
    const custom = state.progress.sentenceEdits && state.progress.sentenceEdits[s.id];
    return custom && custom.trim() ? custom.trim() : s.answer;
  }

  function isSentenceEdited(s) {
    return Boolean(s && state.progress.sentenceEdits && state.progress.sentenceEdits[s.id]);
  }

  function setSentenceEdit(sentenceId, newAnswer) {
    const trimmed = String(newAnswer || '').trim();
    if (!trimmed) return false;
    if (!state.progress.sentenceEdits) state.progress.sentenceEdits = {};
    state.progress.sentenceEdits[sentenceId] = trimmed;
    saveProgress();
    return true;
  }

  function resetSentenceEdit(sentenceId) {
    if (state.progress.sentenceEdits && state.progress.sentenceEdits[sentenceId]) {
      delete state.progress.sentenceEdits[sentenceId];
      saveProgress();
    }
  }

  function getSentenceMastery(sentenceId) {
    return (state.progress.sentenceMastery && state.progress.sentenceMastery[sentenceId]) || 'unlearned';
  }

  function setSentenceMastery(sentenceId, status) {
    if (!state.progress.sentenceMastery) state.progress.sentenceMastery = {};
    if (!status || status === 'unlearned') {
      delete state.progress.sentenceMastery[sentenceId];
    } else {
      state.progress.sentenceMastery[sentenceId] = status;
    }
    saveProgress();
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
      m: state.progress.mastery,
      se: state.progress.sentenceEdits || {},
      sm: state.progress.sentenceMastery || {}
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
    const validSentenceIds = new Set(state.data.sentences.map((s) => s.id));
    const importedEdits = {};
    const rawEdits = obj.se || obj.sentenceEdits;
    if (rawEdits && typeof rawEdits === 'object' && !Array.isArray(rawEdits)) {
      for (const [id, val] of Object.entries(rawEdits)) {
        if (validSentenceIds.has(id) && typeof val === 'string' && val.trim()) {
          importedEdits[id] = val.trim();
        }
      }
    }
    const importedSentenceMastery = {};
    const rawSM = obj.sm || obj.sentenceMastery;
    if (rawSM && typeof rawSM === 'object' && !Array.isArray(rawSM)) {
      for (const [id, val] of Object.entries(rawSM)) {
        if (validSentenceIds.has(id) && (val === 'known' || val === 'fuzzy')) {
          importedSentenceMastery[id] = val;
        }
      }
    }
    return { imported, count, importedEdits, importedSentenceMastery };
  }

  // ---------- F3 Speech Synthesis ----------
  let activeSpeakBtn = null;

  function setSpeakBtnActive(btnEl, isActive) {
    if (!btnEl) return;
    btnEl.classList.toggle('tts-speaking', isActive);
    btnEl.classList.toggle('speaking', isActive);
    const iconEl = btnEl.querySelector('.tts-icon');
    const barsEl = btnEl.querySelector('.tts-bars');
    if (iconEl) iconEl.classList.toggle('hidden', isActive);
    if (barsEl) barsEl.classList.toggle('hidden', !isActive);
  }

  function speakEnglish(text, btnEl) {
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      showToast('当前环境不支持语音朗读，请使用系统浏览器或 Chrome/Safari');
      return;
    }
    try {
      if (activeSpeakBtn && activeSpeakBtn !== btnEl) {
        setSpeakBtnActive(activeSpeakBtn, false);
      }
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

      activeSpeakBtn = btnEl || null;
      setSpeakBtnActive(btnEl, true);

      utter.onstart = () => {
        activeSpeakBtn = btnEl || null;
        setSpeakBtnActive(btnEl, true);
      };
      utter.onend = () => {
        setSpeakBtnActive(btnEl, false);
        if (activeSpeakBtn === btnEl) activeSpeakBtn = null;
      };
      utter.onerror = () => {
        setSpeakBtnActive(btnEl, false);
        if (activeSpeakBtn === btnEl) activeSpeakBtn = null;
        showToast('语音朗读失败，请检查设备音量或系统语音引擎');
      };
      window.speechSynthesis.speak(utter);
    } catch {
      setSpeakBtnActive(btnEl, false);
      if (activeSpeakBtn === btnEl) activeSpeakBtn = null;
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
    const opts = [
      { v: 'all', label: '全部单元', title: '' },
      ...state.units.map((u) => ({
        v: String(u.id),
        label: u.title || `Unit ${u.id}`,
        title: u.subtitle || ''
      }))
    ];
    return opts
      .map(
        (opt) =>
          `<button type="button" class="chip-btn unit-pill ${current === opt.v ? 'active' : ''}" data-${attrName}="${escapeHtml(opt.v)}"${opt.title ? ` title="${escapeHtml(opt.title)}"` : ''}>${escapeHtml(opt.label)}</button>`
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
    const icon = type === 'star' ? ICONS.star : '';
    return `<span class="badge ${cls}">${icon}${escapeHtml(TYPE_LABELS[type] || type)}</span>`;
  }

  function renderMasteryBadge(status) {
    if (!status || status === 'unlearned') return '';
    return `<span class="badge badge-${status}">${MASTERY_LABELS[status]}</span>`;
  }

  // ---------- F1 Flashcard View ----------
  let fcAutoNextTimer = null;
  let fcFlyOutTimer = null;

  function clearFlashcardTimers() {
    if (fcAutoNextTimer) {
      clearTimeout(fcAutoNextTimer);
      fcAutoNextTimer = null;
    }
    if (fcFlyOutTimer) {
      clearTimeout(fcFlyOutTimer);
      fcFlyOutTimer = null;
    }
  }

  function saveFlashcardState() {
    try {
      const { unit, type, mastery, order, index, autoNext } = state.flashcard;
      localStorage.setItem(
        FLASHCARD_STORAGE_KEY,
        JSON.stringify({ unit, type, mastery, order, index, autoNext })
      );
    } catch {
      // Ignore storage write errors
    }
  }

  function clearFlashcardState() {
    try {
      localStorage.removeItem(FLASHCARD_STORAGE_KEY);
    } catch {
      // Ignore storage remove errors
    }
  }

  function restoreFlashcardState() {
    try {
      const raw = localStorage.getItem(FLASHCARD_STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.order)) {
        return false;
      }

      const validOrder = parsed.order.filter((id) => typeof id === 'string' && state.wordMap.has(id));
      if (validOrder.length === 0) return false;

      const rawIndex = Number.isInteger(parsed.index) ? parsed.index : 0;
      const clampedIndex = Math.max(0, Math.min(rawIndex, validOrder.length - 1));

      state.flashcard.unit = typeof parsed.unit === 'string' ? parsed.unit : 'all';
      state.flashcard.type = typeof parsed.type === 'string' ? parsed.type : 'all';
      state.flashcard.mastery = typeof parsed.mastery === 'string' ? parsed.mastery : 'all';
      state.flashcard.order = validOrder;
      state.flashcard.index = clampedIndex;
      state.flashcard.flipped = false;
      state.flashcard.autoNext = Boolean(parsed.autoNext);
      state.flashcard.enterDir = null;
      return true;
    } catch {
      return false;
    }
  }

  function prevFlashcard() {
    const len = state.flashcard.order.length;
    if (len === 0) return;
    clearFlashcardTimers();
    state.flashcard.index = (state.flashcard.index - 1 + len) % len;
    state.flashcard.flipped = false;
    state.flashcard.enterDir = 'prev';
    saveFlashcardState();
    updateFlashcardDeckOnly();
  }

  function nextFlashcard() {
    const len = state.flashcard.order.length;
    if (len === 0) return;
    clearFlashcardTimers();
    state.flashcard.index = (state.flashcard.index + 1) % len;
    state.flashcard.flipped = false;
    state.flashcard.enterDir = 'next';
    saveFlashcardState();
    updateFlashcardDeckOnly();
  }

  function rebuildFlashcardDeck(keepCurrentId = false) {
    clearFlashcardTimers();
    const prevId = keepCurrentId ? state.flashcard.order[state.flashcard.index] : null;
    const list = filterWords(state.flashcard.unit, state.flashcard.type, state.flashcard.mastery);
    state.flashcard.order = list.map((w) => w.id);
    if (prevId && state.flashcard.order.includes(prevId)) {
      state.flashcard.index = state.flashcard.order.indexOf(prevId);
    } else {
      state.flashcard.index = 0;
    }
    state.flashcard.flipped = false;
    state.flashcard.enterDir = null;
  }

  function rateFlashcard(status) {
    const { order, index } = state.flashcard;
    if (order.length === 0) return;
    clearFlashcardTimers();
    const wordId = order[index];
    setWordMastery(wordId, status);
    saveFlashcardState();
    updateFlashcardDeckOnly();

    if (!state.flashcard.autoNext) {
      return;
    }

    fcAutoNextTimer = setTimeout(() => {
      fcAutoNextTimer = null;
      const slideWrap = document.getElementById('fc-slide-wrap') || document.getElementById('fc-card');
      if (slideWrap && state.tab === 'flashcard') {
        slideWrap.classList.add('fly-left');
      }
      fcFlyOutTimer = setTimeout(() => {
        fcFlyOutTimer = null;
        if (state.tab !== 'flashcard' || state.flashcard.order.length === 0) return;
        state.flashcard.index = (state.flashcard.index + 1) % state.flashcard.order.length;
        state.flashcard.flipped = false;
        state.flashcard.enterDir = 'next';
        saveFlashcardState();
        updateFlashcardDeckOnly();
      }, 220);
    }, 280);
  }

  function toggleFlashcardFlip() {
    state.flashcard.flipped = !state.flashcard.flipped;
    const card = document.getElementById('fc-card');
    if (card) {
      card.classList.toggle('is-flipped', state.flashcard.flipped);
    } else {
      render();
    }
  }

  function renderFlashcardDeckHtml() {
    const fc = state.flashcard;
    const total = fc.order.length;
    const currentWord = total > 0 ? state.wordMap.get(fc.order[fc.index]) : null;
    const currentStatus = currentWord ? getWordMastery(currentWord.id) : 'unlearned';
    const badgesHtml = currentWord
      ? `
        <span class="badge badge-unit">Unit ${escapeHtml(currentWord.unit)}</span>
        ${renderTypeBadge(currentWord.type)}
        ${renderMasteryBadge(currentStatus)}
      `
      : '';

    const enterClass =
      fc.enterDir === 'next' ? 'enter-from-right' : fc.enterDir === 'prev' ? 'enter-from-left' : '';
    fc.enterDir = null;

    if (!currentWord) {
      return `<div class="empty-box">当前筛选条件下没有卡片，请切换筛选条件。</div>`;
    }

    return `
      <div class="fc-meta-bar">
        <span>第 <strong>${fc.index + 1}</strong> / ${total} 张</span>
        <span>左滑下一个 · 右滑上一个 · 点击翻面</span>
      </div>

      <div class="flashcard-stage">
        <span class="swipe-badge swipe-badge-know" aria-hidden="true">${ICONS.arrowLeft} 上一个</span>
        <span class="swipe-badge swipe-badge-unknown" aria-hidden="true">下一个 ${ICONS.arrowRight}</span>
        <div id="fc-slide-wrap" class="fc-slide-wrap ${enterClass}">
          <div id="fc-card" class="flashcard-card ${fc.flipped ? 'is-flipped' : ''}" tabindex="0" role="button" aria-label="闪卡，点击翻面">
            <div class="flashcard-front">
              <div class="fc-top">
                <div class="fc-badges">${badgesHtml}</div>
                ${renderSpeakButton(currentWord.en, '读')}
              </div>

              <div class="fc-center">
                <h2 class="fc-word">${escapeHtml(currentWord.en)}</h2>
                ${currentWord.ipa ? `<div class="ipa-text fc-ipa">${escapeHtml(currentWord.ipa)}</div>` : ''}
                ${currentWord.pos ? `<div class="fc-pos">${escapeHtml(currentWord.pos)}</div>` : ''}
              </div>

              <div class="fc-hint-line">点击卡片或按空格键查看中文释义</div>
            </div>

            <div class="flashcard-back">
              <div class="fc-top">
                <div class="fc-badges">${badgesHtml}</div>
                ${renderSpeakButton(currentWord.en, '读')}
              </div>

              <div class="fc-center">
                <h2 class="fc-word">${escapeHtml(currentWord.en)}</h2>
                ${currentWord.ipa ? `<div class="ipa-text fc-ipa">${escapeHtml(currentWord.ipa)}</div>` : ''}
                ${currentWord.pos ? `<div class="fc-pos">${escapeHtml(currentWord.pos)}</div>` : ''}
                <div class="fc-back-box">
                  <div class="fc-zh">${escapeHtml(currentWord.zh)}</div>
                </div>
              </div>

              <div class="fc-hint-line">已翻面：请选择掌握程度或滑动切卡</div>
            </div>
          </div>
        </div>
      </div>

      <div class="fc-actions">
        <button type="button" class="action-btn btn-unknown ${currentStatus === 'unknown' ? 'is-active' : ''}" data-rate="unknown">
          <span>不认识</span>
        </button>
        <button type="button" class="action-btn btn-fuzzy ${currentStatus === 'fuzzy' ? 'is-active' : ''}" data-rate="fuzzy">
          <span>模糊</span>
        </button>
        <button type="button" class="action-btn btn-known ${currentStatus === 'known' ? 'is-active' : ''}" data-rate="known">
          <span>认识</span>
        </button>
      </div>

      <div class="fc-sub-actions">
        <label class="fc-autonext-toggle">
          <input type="checkbox" id="fc-autonext-checkbox" ${fc.autoNext ? 'checked' : ''} />
          <span>标记后自动下一张</span>
        </label>
        <span class="kbd-tip">快捷键：空格翻面 · 1不认识 2模糊 3认识 · S朗读</span>
      </div>
    `;
  }

  function updateFlashcardDeckOnly() {
    const deckEl = document.getElementById('fc-deck-area');
    if (deckEl && state.tab === 'flashcard') {
      deckEl.innerHTML = renderFlashcardDeckHtml();
      attachFlashcardSwipe();
    } else {
      render();
    }
  }

  function renderFlashcardView() {
    const fc = state.flashcard;
    return `
      <section class="filter-panel">
        <div class="filter-row">
          <div class="unit-pills">${renderUnitChips(fc.unit, 'fc-unit')}</div>
        </div>
        <div class="filter-row">
          <select id="fc-type-select" class="select-sm" aria-label="按题型筛选">
            <option value="all" ${fc.type === 'all' ? 'selected' : ''}>全部词型</option>
            <option value="star" ${fc.type === 'star' ? 'selected' : ''}>重点词</option>
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
          <button type="button" id="fc-shuffle-btn" class="btn-ghost">${ICONS.shuffle} 打乱</button>
        </div>
      </section>

      <div id="fc-deck-area">${renderFlashcardDeckHtml()}</div>
    `;
  }

  function attachFlashcardSwipe() {
    const card = document.getElementById('fc-card');
    const slideWrap = document.getElementById('fc-slide-wrap');
    if (!card || !slideWrap) return;
    const stage = card.closest('.flashcard-stage');
    const badgePrev = stage ? stage.querySelector('.swipe-badge-know') : null;
    const badgeNext = stage ? stage.querySelector('.swipe-badge-unknown') : null;

    let startX = 0;
    let startY = 0;
    let dx = 0;
    let dy = 0;
    let tracking = false;
    let moved = false;
    let lockedHorizontal = false;
    let flyingOut = false;

    const clearSwipeVisuals = () => {
      slideWrap.classList.remove('is-swiping');
      slideWrap.style.transform = '';
      slideWrap.style.opacity = '';
      card.classList.remove('swipe-known', 'swipe-unknown', 'swipe-fuzzy');
      if (badgePrev) badgePrev.classList.remove('is-visible');
      if (badgeNext) badgeNext.classList.remove('is-visible');
    };

    const triggerFlyOut = (flyClass, navFn) => {
      flyingOut = true;
      slideWrap.classList.remove('is-swiping');
      slideWrap.style.transform = '';
      slideWrap.style.opacity = '';
      slideWrap.classList.add(flyClass);
      setTimeout(() => {
        navFn();
      }, 210);
    };

    card.addEventListener('pointerdown', (e) => {
      if (flyingOut || e.target.closest('.speak-btn')) return;
      tracking = true;
      moved = false;
      lockedHorizontal = false;
      startX = e.clientX;
      startY = e.clientY;
      dx = 0;
      dy = 0;
    });

    card.addEventListener('pointermove', (e) => {
      if (!tracking || flyingOut) return;
      dx = e.clientX - startX;
      dy = e.clientY - startY;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        moved = true;
      }
      if (!lockedHorizontal) {
        if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
          lockedHorizontal = true;
          slideWrap.classList.add('is-swiping');
          try {
            card.setPointerCapture(e.pointerId);
          } catch {
            // Ignore pointer capture errors
          }
        } else if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
          tracking = false;
          clearSwipeVisuals();
          return;
        }
      }
      if (!lockedHorizontal) return;

      card.classList.remove('swipe-known', 'swipe-unknown', 'swipe-fuzzy');
      if (badgePrev) badgePrev.classList.remove('is-visible');
      if (badgeNext) badgeNext.classList.remove('is-visible');

      slideWrap.style.transform = `translate3d(${dx}px, 0, 0)`;
      slideWrap.style.opacity = String(Math.max(0.45, 1 - Math.abs(dx) / 420));
      if (dx > 36) {
        card.classList.add('swipe-known');
        if (badgePrev) badgePrev.classList.add('is-visible');
      } else if (dx < -36) {
        card.classList.add('swipe-unknown');
        if (badgeNext) badgeNext.classList.add('is-visible');
      }
    });

    const finishDrag = (e) => {
      if (!tracking || flyingOut) return;
      tracking = false;
      try {
        if (e && typeof e.pointerId === 'number' && card.hasPointerCapture(e.pointerId)) {
          card.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore pointer capture release errors
      }
      const THRESHOLD = 80;
      if (lockedHorizontal && dx > THRESHOLD) {
        triggerFlyOut('fly-right', prevFlashcard);
        return;
      }
      if (lockedHorizontal && dx < -THRESHOLD) {
        triggerFlyOut('fly-left', nextFlashcard);
        return;
      }
      clearSwipeVisuals();
      if (!moved) {
        toggleFlashcardFlip();
      }
    };

    card.addEventListener('pointerup', finishDrag);
    card.addEventListener('pointercancel', (e) => {
      tracking = false;
      try {
        if (e && typeof e.pointerId === 'number' && card.hasPointerCapture(e.pointerId)) {
          card.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore
      }
      clearSwipeVisuals();
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
          <div class="unit-pills">${renderUnitChips(q.unit, 'quiz-unit')}</div>
        </div>
        <div class="filter-row">
          <select id="quiz-type-select" class="select-sm" aria-label="按题型筛选">
            <option value="all" ${q.type === 'all' ? 'selected' : ''}>全部词型</option>
            <option value="star" ${q.type === 'star' ? 'selected' : ''}>重点词</option>
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
              <span class="badge badge-unit">Unit ${escapeHtml(word.unit)}</span>
              ${renderTypeBadge(word.type)}
              <span class="badge badge-plain">${q.index + 1} / ${q.pool.length}</span>
            </div>
            ${renderSpeakButton(word.en, '读')}
          </div>

          <div class="quiz-prompt-row">
            <div>
              <h2 class="quiz-word">${escapeHtml(word.en)}</h2>
              ${word.ipa ? `<div class="ipa-text" style="margin-top:4px;">${escapeHtml(word.ipa)}</div>` : ''}
              ${word.pos ? `<div class="quiz-pos">${escapeHtml(word.pos)}</div>` : ''}
            </div>
          </div>

          <div class="option-list">
            ${q.currentOptions
              .map((opt, idx) => {
                let cls = '';
                if (answered) {
                  if (opt.isCorrect) {
                    cls = idx === q.selectedIndex ? 'correct opt-pop' : 'correct';
                  } else if (idx === q.selectedIndex) {
                    cls = 'wrong opt-shake';
                  }
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
                ? `<button type="button" id="quiz-next-btn" class="btn-primary">下一题 ${ICONS.arrowRight}</button>`
                : `<div class="kbd-tip">快捷键：1-4 或 A-D 选择 · S 朗读 · 选完按回车下一题</div>`
            }
          </div>
        </div>
      `
      }
    `;
  }

  // ---------- Sentence Translation Practice View ----------
  function rebuildSentencePool(keepCurrentId = false) {
    const sp = state.sentencePractice;
    const prevId = keepCurrentId ? sp.order[sp.index] : null;
    const list = state.data.sentences.filter((s) => {
      if (sp.unit !== 'all' && String(s.unit) !== sp.unit) return false;
      if (sp.mastery !== 'all' && getSentenceMastery(s.id) !== sp.mastery) return false;
      return true;
    });
    sp.order = list.map((s) => s.id);
    if (prevId && sp.order.includes(prevId)) {
      sp.index = sp.order.indexOf(prevId);
    } else {
      sp.index = 0;
    }
    sp.revealed = false;
    sp.editingId = null;
  }

  function renderSentenceView() {
    const sp = state.sentencePractice;
    const total = sp.order.length;
    const currentId = total > 0 ? sp.order[sp.index] : null;
    const s = currentId ? state.data.sentences.find((x) => x.id === currentId) : null;
    const effectiveAnswer = s ? getSentenceAnswer(s) : '';
    const edited = s ? isSentenceEdited(s) : false;
    const mastery = s ? getSentenceMastery(s.id) : 'unlearned';
    const userDraft = s ? sp.drafts[s.id] || '' : '';
    const isEditing = s && sp.editingId === s.id;

    return `
      <section class="filter-panel">
        <div class="filter-row">
          <div class="unit-pills">${renderUnitChips(sp.unit, 'sp-unit')}</div>
        </div>
        <div class="filter-row">
          <select id="sp-mastery-select" class="select-sm" aria-label="按掌握状态筛选">
            <option value="all" ${sp.mastery === 'all' ? 'selected' : ''}>全部状态</option>
            <option value="unlearned" ${sp.mastery === 'unlearned' ? 'selected' : ''}>未练</option>
            <option value="fuzzy" ${sp.mastery === 'fuzzy' ? 'selected' : ''}>需加强</option>
            <option value="known" ${sp.mastery === 'known' ? 'selected' : ''}>已掌握</option>
          </select>
          <button type="button" id="sp-shuffle-btn" class="btn-ghost">${ICONS.shuffle} 打乱</button>
        </div>
      </section>

      ${
        !s
          ? `<div class="empty-box">当前筛选条件下没有句子，请切换筛选条件。</div>`
          : `
        <div class="fc-meta-bar">
          <span>第 <strong>${sp.index + 1}</strong> / ${total} 句</span>
          <span>中译英专项练习</span>
        </div>

        <article class="sp-card">
          <div class="fc-top">
            <div class="fc-badges">
              <span class="badge badge-unit">Unit ${escapeHtml(s.unit)}</span>
              <span class="badge badge-sentence">中译英</span>
              ${edited ? `<span class="badge badge-edited">已自定义</span>` : ''}
              ${mastery === 'known' ? `<span class="badge badge-known">已掌握</span>` : ''}
              ${mastery === 'fuzzy' ? `<span class="badge badge-fuzzy">需加强</span>` : ''}
            </div>
            <div class="sp-top-actions">
              <button type="button" class="btn-inline-edit" data-sp-quick-answer>${sp.revealed ? '收起答案' : '看答案'}</button>
              ${sp.revealed ? renderSpeakButton(effectiveAnswer, '读', '朗读参考答案') : ''}
            </div>
          </div>

          <div class="sp-zh">${escapeHtml(s.zh)}</div>
          <div class="hint-box">提示词：${escapeHtml(s.hint)}</div>

          <textarea id="sp-user-input" class="sp-textarea" data-sp-draft="${escapeHtml(s.id)}" placeholder="在这里先试着写出英文翻译...">${escapeHtml(userDraft)}</textarea>

          <div class="sp-btn-row">
            <button type="button" id="sp-toggle-answer-btn" class="btn-primary">${sp.revealed ? '隐藏标准答案' : '查看标准答案'}</button>
            <button type="button" id="sp-clear-draft-btn" class="btn-ghost">清空作答</button>
          </div>

          ${
            sp.revealed
              ? `
            <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border);">
              <div class="sp-answer-head">
                <span style="font-size:13px;color:var(--text-muted);font-weight:600;">参考答案（已高亮提示词）：</span>
                <button type="button" class="btn-inline-edit" data-sp-edit="${escapeHtml(s.id)}">${isEditing ? '收起编辑' : '编辑标准答案'}</button>
              </div>

              ${
                isEditing
                  ? `
                <div class="sentence-edit-box">
                  <textarea id="sp-edit-textarea" class="sentence-edit-textarea" placeholder="输入你认可的标准答案...">${escapeHtml(sp.editDraft)}</textarea>
                  <div class="sentence-edit-actions">
                    <button type="button" class="btn-primary" data-sp-save="${escapeHtml(s.id)}">保存标准答案</button>
                    <button type="button" class="btn-ghost" data-sp-cancel>取消</button>
                    ${edited ? `<button type="button" class="btn-ghost" style="color:var(--danger);" data-sp-reset="${escapeHtml(s.id)}">恢复默认</button>` : ''}
                  </div>
                </div>
              `
                  : `
                <div style="padding:10px 12px;border-radius:10px;background:var(--success-soft);font-size:15px;line-height:1.55;">
                  ${highlightHints(effectiveAnswer, s.hint)}
                </div>
              `
              }

              ${
                Array.isArray(s.pitfalls) && s.pitfalls.length > 0
                  ? `<div class="pitfalls-box">
                      <strong>易错点：</strong>
                      <ul>${s.pitfalls.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}</ul>
                    </div>`
                  : ''
              }

              <div class="self-grade-row" style="margin-top:12px;">
                <button type="button" class="grade-btn ${mastery === 'fuzzy' ? 'active-partial' : ''}" data-sp-rate="${escapeHtml(s.id)}" data-sp-status="fuzzy">需加强</button>
                <button type="button" class="grade-btn ${mastery === 'known' ? 'active-right' : ''}" data-sp-rate="${escapeHtml(s.id)}" data-sp-status="known">已掌握</button>
              </div>
            </div>
          `
              : ''
          }
        </article>

        <div class="fc-sub-actions" style="margin-top:12px;">
          <button type="button" id="sp-prev-btn" class="btn-ghost">${ICONS.arrowLeft} 上一句</button>
          <button type="button" id="sp-next-btn" class="btn-ghost">下一句 ${ICONS.arrowRight}</button>
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
      const scopeButtons = [
        ...state.units.map((u) => ({
          v: String(u.id),
          label: u.title || `Unit ${u.id}`
        })),
        { v: 'all', label: '全部范围' }
      ];
      return `
        <div class="exam-setup-card">
          <h2 class="exam-setup-title">模拟考试设置</h2>
          <p class="exam-desc">
            默认抽取 <strong>20 道单词四选一</strong>（约 15 个重点词 + 5 个无星词/短语，自动判分）+ <strong>2 道中译英句子</strong>（交卷后对照参考答案与易错点自评）。
          </p>
          <div class="scope-grid">
            ${scopeButtons
              .map(
                (s) =>
                  `<button type="button" class="scope-btn ${ex.scope === s.v ? 'active' : ''}" data-exam-scope="${escapeHtml(s.v)}">${escapeHtml(s.label)}</button>`
              )
              .join('')}
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
              ${renderSpeakButton(q.word.en)}
            </div>
            <div class="quiz-prompt-row" style="margin:10px 0 12px;">
              <div>
                <div class="quiz-word" style="font-size:22px;">${escapeHtml(q.word.en)}</div>
                ${q.word.ipa ? `<div class="ipa-text" style="margin-top:3px;">${escapeHtml(q.word.ipa)}</div>` : ''}
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
              ${renderSpeakButton(getSentenceAnswer(s), '读', '朗读参考答案')}
            </div>
            <div style="font-size:15px;font-weight:700;margin-bottom:6px;">${escapeHtml(s.zh)}</div>
            <div class="hint-box">提示词：${escapeHtml(s.hint)}</div>

            <div style="margin-top:10px;font-size:13px;color:var(--text-muted);">你的作答：</div>
            <div style="padding:8px 10px;border-radius:8px;background:var(--bg);margin-top:4px;font-size:14px;">
              ${userAns ? escapeHtml(userAns) : '<em>（未作答）</em>'}
            </div>

            <div style="margin-top:10px;font-size:13px;color:var(--text-muted);">参考答案（已高亮提示词）：</div>
            <div style="padding:10px 12px;border-radius:10px;background:var(--success-soft);margin-top:4px;font-size:15px;line-height:1.55;">
              ${highlightHints(getSentenceAnswer(s), s.hint)}
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
              ${renderSpeakButton(q.word.en)}
            </div>
            <div style="font-size:18px;font-weight:700;margin-bottom:8px;">
              ${escapeHtml(q.word.en)} ${q.word.ipa ? `<span class="ipa-text" style="margin-left:6px;font-size:13px;">${escapeHtml(q.word.ipa)}</span>` : ''} <span style="font-size:13px;color:var(--text-muted);font-weight:500;">${escapeHtml(q.word.pos || '')}</span>
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
  function getBrowseFilteredItems() {
    const b = state.browse;
    const kw = b.search.trim().toLowerCase();

    const items = [];
    if (b.type === 'all' || b.type === 'sentence') {
      for (const s of state.data.sentences) {
        if (b.unit !== 'all' && String(s.unit) !== b.unit) continue;
        if (b.mastery !== 'all') continue;
        if (kw) {
          const hay = `${s.zh} ${s.hint} ${getSentenceAnswer(s)}`.toLowerCase();
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
    return items;
  }

  function renderBrowseResultsHtml(items) {
    const b = state.browse;
    if (items.length === 0) {
      return `<div class="empty-box">没有找到匹配的词条或句子。</div>`;
    }
    return `<div class="browse-list">
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
                            ${w.ipa ? `<span class="ipa-text browse-ipa">${escapeHtml(w.ipa)}</span>` : ''}
                            ${w.pos ? `<span class="browse-pos">${escapeHtml(w.pos)}</span>` : ''}
                          </div>
                          ${renderSpeakButton(w.en)}
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
                  const ansText = getSentenceAnswer(s);
                  const edited = isSentenceEdited(s);
                  const isEditing = b.editingSentenceId === s.id;
                  return `
                    <article class="browse-item">
                      <div class="browse-head">
                        <div class="fc-badges">
                          <span class="badge badge-unit">Unit ${s.unit}</span>
                          <span class="badge badge-sentence">中译英</span>
                          ${edited ? `<span class="badge badge-edited">已自定义</span>` : ''}
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;">
                          <button type="button" class="btn-inline-edit" data-browse-edit="${escapeHtml(s.id)}">${isEditing ? '收起' : '编辑答案'}</button>
                          ${renderSpeakButton(ansText, '', '朗读参考答案')}
                        </div>
                      </div>
                      <div style="margin-top:8px;font-size:15px;font-weight:700;line-height:1.5;">${escapeHtml(s.zh)}</div>
                      <div class="hint-box">提示词：${escapeHtml(s.hint)}</div>
                      ${
                        isEditing
                          ? `
                            <div class="sentence-edit-box">
                              <textarea id="browse-edit-textarea" class="sentence-edit-textarea" placeholder="输入你认可的标准答案...">${escapeHtml(b.editDraft)}</textarea>
                              <div class="sentence-edit-actions">
                                <button type="button" class="btn-primary" data-browse-save="${escapeHtml(s.id)}">保存标准答案</button>
                                <button type="button" class="btn-ghost" data-browse-cancel>取消</button>
                                ${edited ? `<button type="button" class="btn-ghost" style="color:var(--danger);" data-browse-reset="${escapeHtml(s.id)}">恢复默认</button>` : ''}
                              </div>
                            </div>
                          `
                          : visible
                          ? `
                            <div class="browse-zh" style="margin-top:10px;padding:8px 10px;background:var(--success-soft);border-radius:8px;">
                              ${highlightHints(ansText, s.hint)}
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
            </div>`;
  }

  function updateBrowseResultsOnly() {
    const items = getBrowseFilteredItems();
    const resultsEl = document.getElementById('browse-results');
    if (resultsEl) resultsEl.innerHTML = renderBrowseResultsHtml(items);
    const countEl = document.getElementById('browse-count');
    if (countEl) countEl.textContent = `共 ${items.length} 条`;
    const clearEl = document.getElementById('browse-clear-search');
    if (clearEl) clearEl.classList.toggle('hidden', !state.browse.search);
  }

  function renderBrowseView() {
    const b = state.browse;
    const items = getBrowseFilteredItems();

    return `
      <section class="filter-panel">
        <div class="filter-row">
          <div class="unit-pills">${renderUnitChips(b.unit, 'browse-unit')}</div>
        </div>
        <div class="filter-row">
          <select id="browse-type-select" class="select-sm" aria-label="按题型筛选">
            <option value="all" ${b.type === 'all' ? 'selected' : ''}>全部题型</option>
            <option value="star" ${b.type === 'star' ? 'selected' : ''}>重点词</option>
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
            ${b.showAnswers ? `${ICONS.eyeOff} 隐藏答案` : `${ICONS.eye} 显示答案`}
          </button>
        </div>
        <div class="search-row">
          <div class="search-input-wrap">
            <input id="browse-search-input" class="search-input" type="search" value="${escapeHtml(b.search)}" placeholder="搜索英文、中文或提示词..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
            <button type="button" id="browse-clear-search" class="clear-btn ${b.search ? '' : 'hidden'}" aria-label="清空搜索">${ICONS.x}</button>
          </div>
          <span id="browse-count" style="font-size:13px;color:var(--text-muted);white-space:nowrap;">共 ${items.length} 条</span>
        </div>
      </section>

      <div id="browse-results">${renderBrowseResultsHtml(items)}</div>
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
          <button type="button" id="copy-export-btn" class="btn-primary">${ICONS.copy} 一键复制进度</button>
        </div>
      </div>

      <div class="card-box">
        <h2>导入进度</h2>
        <div style="font-size:13px;color:var(--text-muted);">粘贴之前导出的文本（支持 <code>VOCAB1:</code> 编码或 JSON）。</div>
        <textarea id="import-textarea" class="data-textarea" placeholder="在此粘贴导出的进度文本..."></textarea>
        ${state.importError ? `<div style="color:var(--danger);font-size:13px;margin-bottom:8px;">${escapeHtml(state.importError)}</div>` : ''}
        ${state.importSuccess ? `<div style="color:var(--success);font-size:13px;margin-bottom:8px;">${escapeHtml(state.importSuccess)}</div>` : ''}
        <div class="btn-row">
          <button type="button" id="import-apply-btn" class="btn-primary">${ICONS.download} 导入并覆盖</button>
          <button type="button" id="reset-progress-btn" class="btn-ghost" style="color:var(--danger);">${ICONS.trash} 清空本地进度</button>
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
    } else if (state.tab === 'sentence') {
      main.innerHTML = renderSentenceView();
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
        saveFlashcardState();
        render();
        return;
      }
      if (e.target.closest('#fc-shuffle-btn')) {
        state.flashcard.order = shuffle(state.flashcard.order);
        state.flashcard.index = 0;
        state.flashcard.flipped = false;
        saveFlashcardState();
        render();
        showToast('已随机打乱卡片顺序');
        return;
      }
      const rateBtn = e.target.closest('[data-rate]');
      if (rateBtn) {
        rateFlashcard(rateBtn.dataset.rate);
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

      // Sentence translation practice controls
      const spUnit = e.target.closest('[data-sp-unit]');
      if (spUnit) {
        state.sentencePractice.unit = spUnit.dataset.spUnit;
        rebuildSentencePool();
        render();
        return;
      }
      if (e.target.closest('#sp-shuffle-btn')) {
        state.sentencePractice.order = shuffle(state.sentencePractice.order);
        state.sentencePractice.index = 0;
        state.sentencePractice.revealed = false;
        state.sentencePractice.editingId = null;
        render();
        showToast('已随机打乱句子顺序');
        return;
      }
      if (e.target.closest('#sp-toggle-answer-btn') || e.target.closest('[data-sp-quick-answer]')) {
        state.sentencePractice.revealed = !state.sentencePractice.revealed;
        state.sentencePractice.editingId = null;
        render();
        return;
      }
      if (e.target.closest('#sp-clear-draft-btn')) {
        const curId = state.sentencePractice.order[state.sentencePractice.index];
        if (curId) delete state.sentencePractice.drafts[curId];
        render();
        return;
      }
      if (e.target.closest('#sp-prev-btn')) {
        const len = state.sentencePractice.order.length;
        if (len > 0) {
          state.sentencePractice.index = (state.sentencePractice.index - 1 + len) % len;
          state.sentencePractice.revealed = false;
          state.sentencePractice.editingId = null;
          render();
        }
        return;
      }
      if (e.target.closest('#sp-next-btn')) {
        const len = state.sentencePractice.order.length;
        if (len > 0) {
          state.sentencePractice.index = (state.sentencePractice.index + 1) % len;
          state.sentencePractice.revealed = false;
          state.sentencePractice.editingId = null;
          render();
        }
        return;
      }
      const spRateBtn = e.target.closest('[data-sp-rate]');
      if (spRateBtn) {
        const sid = spRateBtn.dataset.spRate;
        const st = spRateBtn.dataset.spStatus;
        setSentenceMastery(sid, getSentenceMastery(sid) === st ? 'unlearned' : st);
        render();
        return;
      }
      const spEditBtn = e.target.closest('[data-sp-edit]');
      if (spEditBtn) {
        const sid = spEditBtn.dataset.spEdit;
        if (state.sentencePractice.editingId === sid) {
          state.sentencePractice.editingId = null;
        } else {
          const s = state.data.sentences.find((x) => x.id === sid);
          state.sentencePractice.editingId = sid;
          state.sentencePractice.editDraft = s ? getSentenceAnswer(s) : '';
        }
        render();
        return;
      }
      const spSaveBtn = e.target.closest('[data-sp-save]');
      if (spSaveBtn) {
        const sid = spSaveBtn.dataset.spSave;
        const ta = document.getElementById('sp-edit-textarea');
        const val = ta ? ta.value : state.sentencePractice.editDraft;
        if (!setSentenceEdit(sid, val)) {
          showToast('标准答案不能为空');
          return;
        }
        state.sentencePractice.editingId = null;
        render();
        showToast('标准答案已保存');
        return;
      }
      if (e.target.closest('[data-sp-cancel]')) {
        state.sentencePractice.editingId = null;
        render();
        return;
      }
      const spResetBtn = e.target.closest('[data-sp-reset]');
      if (spResetBtn) {
        resetSentenceEdit(spResetBtn.dataset.spReset);
        state.sentencePractice.editingId = null;
        render();
        showToast('已恢复默认标准答案');
        return;
      }

      // Browse sentence inline edit controls
      const brEditBtn = e.target.closest('[data-browse-edit]');
      if (brEditBtn) {
        const sid = brEditBtn.dataset.browseEdit;
        if (state.browse.editingSentenceId === sid) {
          state.browse.editingSentenceId = null;
        } else {
          const s = state.data.sentences.find((x) => x.id === sid);
          state.browse.editingSentenceId = sid;
          state.browse.editDraft = s ? getSentenceAnswer(s) : '';
        }
        render();
        return;
      }
      const brSaveBtn = e.target.closest('[data-browse-save]');
      if (brSaveBtn) {
        const sid = brSaveBtn.dataset.browseSave;
        const ta = document.getElementById('browse-edit-textarea');
        const val = ta ? ta.value : state.browse.editDraft;
        if (!setSentenceEdit(sid, val)) {
          showToast('标准答案不能为空');
          return;
        }
        state.browse.editingSentenceId = null;
        render();
        showToast('标准答案已保存');
        return;
      }
      if (e.target.closest('[data-browse-cancel]')) {
        state.browse.editingSentenceId = null;
        render();
        return;
      }
      const brResetBtn = e.target.closest('[data-browse-reset]');
      if (brResetBtn) {
        resetSentenceEdit(brResetBtn.dataset.browseReset);
        state.browse.editingSentenceId = null;
        render();
        showToast('已恢复默认标准答案');
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
        window.scrollTo(0, 0);
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
          const { imported, count, importedEdits, importedSentenceMastery } = decodeProgressString(ta.value);
          state.progress.mastery = imported;
          state.progress.sentenceEdits = importedEdits || {};
          state.progress.sentenceMastery = importedSentenceMastery || {};
          saveProgress();
          rebuildFlashcardDeck();
          rebuildSentencePool();
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
          state.progress.sentenceEdits = {};
          state.progress.sentenceMastery = {};
          saveProgress();
          clearFlashcardState();
          state.flashcard.unit = 'all';
          state.flashcard.type = 'all';
          state.flashcard.mastery = 'all';
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
      if (target.id === 'fc-autonext-checkbox') {
        state.flashcard.autoNext = target.checked;
        saveFlashcardState();
        render();
      } else if (target.id === 'fc-type-select') {
        state.flashcard.type = target.value;
        rebuildFlashcardDeck();
        saveFlashcardState();
        render();
      } else if (target.id === 'fc-mastery-select') {
        state.flashcard.mastery = target.value;
        rebuildFlashcardDeck();
        saveFlashcardState();
        render();
      } else if (target.id === 'quiz-type-select') {
        state.quiz.type = target.value;
        rebuildQuizPool();
        render();
      } else if (target.id === 'quiz-mastery-select') {
        state.quiz.mastery = target.value;
        rebuildQuizPool();
        render();
      } else if (target.id === 'sp-mastery-select') {
        state.sentencePractice.mastery = target.value;
        rebuildSentencePool();
        render();
      } else if (target.id === 'browse-type-select') {
        state.browse.type = target.value;
        render();
      } else if (target.id === 'browse-mastery-select') {
        state.browse.mastery = target.value;
        render();
      }
    });

    let isComposing = false;

    main.addEventListener('compositionstart', (e) => {
      if (e.target && e.target.id === 'browse-search-input') {
        isComposing = true;
      }
    });

    main.addEventListener('compositionend', (e) => {
      if (e.target && e.target.id === 'browse-search-input') {
        isComposing = false;
        state.browse.search = e.target.value;
        updateBrowseResultsOnly();
      }
    });

    main.addEventListener('input', (e) => {
      const target = e.target;
      if (target.id === 'browse-search-input') {
        if (e.isComposing || isComposing) return;
        state.browse.search = target.value;
        updateBrowseResultsOnly();
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
      } else if (target.dataset.spDraft) {
        state.sentencePractice.drafts[target.dataset.spDraft] = target.value;
      } else if (target.id === 'sp-edit-textarea') {
        state.sentencePractice.editDraft = target.value;
      } else if (target.id === 'browse-edit-textarea') {
        state.browse.editDraft = target.value;
      }
    });

    // Keyboard shortcuts for desktop
    document.addEventListener('keydown', (e) => {
      const tagName = (e.target && e.target.tagName) || '';
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') return;

      if (state.tab === 'flashcard' && state.flashcard.order.length > 0) {
        if (e.code === 'Space' || e.key === 'Enter') {
          e.preventDefault();
          toggleFlashcardFlip();
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
          prevFlashcard();
        } else if (e.key === 's' || e.key === 'S' || e.key === 'r' || e.key === 'R') {
          const word = state.wordMap.get(state.flashcard.order[state.flashcard.index]);
          if (word) {
            const btnSelector = state.flashcard.flipped
              ? '.flashcard-back .speak-btn'
              : '.flashcard-front .speak-btn';
            speakEnglish(
              word.en,
              document.querySelector(btnSelector) || document.querySelector('.flashcard-card .speak-btn')
            );
          }
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

  // ---------- Data Loading ----------
  async function loadUnitsData() {
    try {
      const manifestRes = await fetch('./data/units.json');
      if (!manifestRes.ok) throw new Error(`HTTP ${manifestRes.status}`);
      const manifest = await manifestRes.json();
      if (!manifest || !Array.isArray(manifest.units) || manifest.units.length === 0) {
        throw new Error('Invalid units manifest');
      }

      const unitPayloads = await Promise.all(
        manifest.units.map(async (u) => {
          const unitRes = await fetch(u.file);
          if (!unitRes.ok) throw new Error(`HTTP ${unitRes.status} for ${u.file}`);
          return unitRes.json();
        })
      );

      const words = [];
      const sentences = [];
      for (const payload of unitPayloads) {
        if (Array.isArray(payload.words)) words.push(...payload.words);
        if (Array.isArray(payload.sentences)) sentences.push(...payload.sentences);
      }

      return {
        units: manifest.units.map((u) => ({
          id: u.id,
          title: u.title || `Unit ${u.id}`,
          subtitle: u.subtitle || '',
          file: u.file
        })),
        words,
        sentences
      };
    } catch {
      // Fallback to legacy ./data.json only if units.json fails
      const res = await fetch('./data.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const words = Array.isArray(data.words) ? data.words : [];
      const sentences = Array.isArray(data.sentences) ? data.sentences : [];
      const unitIds = Array.from(
        new Set([...words.map((w) => w.unit), ...sentences.map((s) => s.unit)].filter((id) => id !== undefined && id !== null))
      ).sort((a, b) => Number(a) - Number(b));

      return {
        units: unitIds.map((id) => ({ id, title: `Unit ${id}`, subtitle: '' })),
        words,
        sentences
      };
    }
  }

  // ---------- Init ----------
  async function init() {
    setupPWA();
    bindEvents();
    loadProgress();

    try {
      const loaded = await loadUnitsData();
      state.units = loaded.units;
      state.data = {
        words: loaded.words,
        sentences: loaded.sentences
      };
      state.wordMap = new Map(state.data.words.map((w) => [w.id, w]));

      updateHeaderProgress();
      if (!restoreFlashcardState()) {
        rebuildFlashcardDeck();
      }
      rebuildQuizPool();
      rebuildSentencePool();
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
