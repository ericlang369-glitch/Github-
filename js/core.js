(() => {
  'use strict';

  const VocabApp = (window.VocabApp = window.VocabApp || {});

  // ---------- Constants ----------
  const STORAGE_KEY = 'vocab-app-progress-v1';
  const FLASHCARD_STORAGE_KEY = 'vocab-app-flashcard-v1';
  const PREFS_STORAGE_KEY = 'vocab-app-prefs-v1';

  const TYPE_LABELS = {
    star: '重点',
    plain: '无星',
    phrase: '短语',
    sentence: '中译英'
  };

  const MASTERY_LABELS = {
    known: '认识',
    fuzzy: '模糊',
    unknown: '不认识',
    unlearned: '未学'
  };

  const ICONS = {
    star:
      '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    speaker:
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
    shuffle:
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>',
    eye:
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff:
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
    copy:
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    download:
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    upload:
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    trash:
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    check:
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
    x:
      '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    help:
      '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    arrowLeft:
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
    arrowRight:
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    sun:
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/></svg>',
    moon:
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    sliders:
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>',
    undo:
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>',
    spark:
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/><path d="M19 3v4"/><path d="M21 5h-4"/></svg>',
    edit:
      '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    flame:
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
    fileDown:
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/></svg>',
    fileUp:
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="12" x2="12" y2="18"/><polyline points="9 15 12 12 15 15"/></svg>',
    link:
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    clipboard:
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>',
    uploadCloud:
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>',
    fileJson:
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1"/><path d="M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1"/></svg>',
    shieldCheck:
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>'
  };

  // ---------- Application State ----------
  const state = {
    tab: 'flashcard', // 'flashcard' | 'practice' | 'sentence' | 'browse' | 'progress'
    practiceSubTab: 'quiz', // 'quiz' | 'spell' | 'exam'
    units: [],
    data: { words: [], sentences: [] },
    wordMap: new Map(),
    prefs: { theme: 'system', accent: 'en-US', rate: 1.0, autoSpeak: false },
    audioMenuOpen: false,
    progress: {
      version: 2,
      updatedAt: '',
      mastery: {}, // { [wordId]: 'known' | 'fuzzy' | 'unknown' }
      sentenceEdits: {}, // { [sentenceId]: string }
      sentenceMastery: {}, // { [sentenceId]: 'known' | 'fuzzy' }
      wordStats: {}, // { [wordId]: { right, wrong, streak, lastSeen } }
      dailyLog: {} // { 'YYYY-MM-DD': count }
    },
    flashcard: {
      unit: 'all',
      type: 'all',
      mastery: 'all',
      smartMode: false,
      order: [],
      index: 0,
      flipped: false,
      autoNext: false,
      lastUndo: null // { wordId, prevStatus, index }
    },
    quiz: {
      unit: 'all',
      type: 'all',
      mastery: 'all',
      smartMode: true,
      pool: [],
      index: 0,
      currentOptions: [],
      selectedIndex: null,
      lastFeedback: ''
    },
    spell: {
      unit: 'all',
      type: 'all',
      mastery: 'all',
      smartMode: true,
      dictationOnly: false,
      pool: [],
      index: 0,
      input: '',
      hintLevel: 0,
      submitted: false,
      isCorrect: false,
      lastFeedback: ''
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
      sentenceGrades: {}
    },
    browse: {
      unit: 'all',
      type: 'all',
      mastery: 'all',
      search: '',
      showAnswers: true,
      revealedIds: new Set(),
      editingSentenceId: null,
      editDraft: '',
      limit: 80
    },
    progressSubTab: 'sync', // 'sync' | 'manual'
    importDraft: '',
    importFileMeta: null, // { name, size } | null
    importPreview: null, // result of buildImportPreview(decoded) | null
    pendingSyncModal: null, // result of buildImportPreview(decoded) | null
    importError: '',
    importSuccess: ''
  };

  let toastTimer = null;
  let themeMediaListenerBound = false;
  const flashButtonStates = new WeakMap();

  // ---------- Core Utilities ----------
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function cryptoRandomInt(max) {
    const n = Math.floor(Number(max));
    if (!Number.isFinite(n) || n <= 1) return 0;

    if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.getRandomValues === 'function') {
      const buf = new Uint32Array(1);
      const limit = Math.floor(0x100000000 / n) * n;
      let val = 0;
      do {
        window.crypto.getRandomValues(buf);
        val = buf[0];
      } while (val >= limit);
      return val % n;
    }

    return Math.floor(Math.random() * n);
  }

  function cryptoShuffle(arr, avoidFirstItem = null) {
    if (!Array.isArray(arr)) return [];
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = cryptoRandomInt(i + 1);
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    if (
      copy.length > 1 &&
      avoidFirstItem !== null &&
      avoidFirstItem !== undefined &&
      copy[0] === avoidFirstItem
    ) {
      const swapIdx = 1 + cryptoRandomInt(copy.length - 1);
      const tmp = copy[0];
      copy[0] = copy[swapIdx];
      copy[swapIdx] = tmp;
    }
    return copy;
  }

  function todayKey(dateObj) {
    const d = dateObj instanceof Date ? dateObj : new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = String(msg || '');
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove('show');
    }, 2600);
  }

  function renderBarsSpinner(size = 16) {
    const safeSize = Math.max(10, Math.min(64, Math.floor(Number(size) || 16)));
    let lines = '';
    for (let i = 0; i < 12; i++) {
      const deg = i * 30;
      const delay = (-1.2 + i * 0.1).toFixed(1);
      lines += `<line x1="12" y1="2.5" x2="12" y2="6.5" transform="rotate(${deg} 12 12)" style="animation-delay:${delay}s"/>`;
    }
    return `<svg class="bars-spinner" viewBox="0 0 24 24" width="${safeSize}" height="${safeSize}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">${lines}</svg>`;
  }

  function flashButtonDone(btnEl, doneText = '已完成') {
    if (!btnEl || typeof btnEl.innerHTML !== 'string') return;
    const prev = flashButtonStates.get(btnEl);
    let originalHtml;
    if (prev) {
      clearTimeout(prev.timer);
      originalHtml = prev.originalHtml;
    } else {
      originalHtml = btnEl.innerHTML;
    }

    btnEl.classList.add('is-done');
    btnEl.innerHTML = `<span class="icon-check-pop">${ICONS.check}</span><span>${escapeHtml(doneText)}</span>`;

    const timer = setTimeout(() => {
      btnEl.classList.remove('is-done');
      btnEl.innerHTML = originalHtml;
      flashButtonStates.delete(btnEl);
    }, 1400);

    flashButtonStates.set(btnEl, { timer, originalHtml });
  }

  // ---------- Theme & Audio Preferences ----------
  function getEffectiveTheme() {
    if (state.prefs.theme === 'dark') return 'dark';
    if (state.prefs.theme === 'light') return 'light';
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(PREFS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (parsed.theme === 'system' || parsed.theme === 'light' || parsed.theme === 'dark') {
            state.prefs.theme = parsed.theme;
          }
          if (parsed.accent === 'en-US' || parsed.accent === 'en-GB') {
            state.prefs.accent = parsed.accent;
          }
          const rateNum = Number(parsed.rate);
          if (Number.isFinite(rateNum) && rateNum >= 0.5 && rateNum <= 2.0) {
            state.prefs.rate = rateNum;
          }
          state.prefs.autoSpeak = Boolean(parsed.autoSpeak);
        }
      }
    } catch {
      // Ignore corrupted prefs
    }

    if (!themeMediaListenerBound && typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      themeMediaListenerBound = true;
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = () => {
        if (state.prefs.theme === 'system') {
          applyTheme();
        }
      };
      if (typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', onChange);
      } else if (typeof mq.addListener === 'function') {
        mq.addListener(onChange);
      }
    }
  }

  function savePrefs() {
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(state.prefs));
    } catch {
      // Ignore storage write errors
    }
  }

  function applyTheme() {
    const effective = getEffectiveTheme();
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = effective;
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', effective === 'dark' ? '#0B0D12' : '#FFFFFF');
      }
    }
    return effective;
  }

  function toggleTheme() {
    const current = getEffectiveTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    state.prefs.theme = next;
    savePrefs();
    applyTheme();
    return next;
  }

  // ---------- Progress Persistence ----------
  function normalizeMasteryValue(val) {
    if (val === 'mastered' || val === 'known') return 'known';
    if (val === 'fuzzy') return 'fuzzy';
    if (val === 'unknown') return 'unknown';
    return null;
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;

      const cleanMastery = {};
      if (parsed.mastery && typeof parsed.mastery === 'object') {
        for (const [id, status] of Object.entries(parsed.mastery)) {
          const norm = normalizeMasteryValue(status);
          if (norm) cleanMastery[id] = norm;
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
          if (st === 'known' || st === 'mastered') {
            cleanSentenceMastery[id] = 'known';
          } else if (st === 'fuzzy') {
            cleanSentenceMastery[id] = 'fuzzy';
          }
        }
      }

      const cleanWordStats = {};
      if (parsed.wordStats && typeof parsed.wordStats === 'object') {
        for (const [id, st] of Object.entries(parsed.wordStats)) {
          if (st && typeof st === 'object') {
            cleanWordStats[id] = {
              right: Math.max(0, Math.floor(Number(st.right) || 0)),
              wrong: Math.max(0, Math.floor(Number(st.wrong) || 0)),
              streak: Math.max(0, Math.floor(Number(st.streak) || 0)),
              lastSeen: Math.max(0, Number(st.lastSeen) || 0)
            };
          }
        }
      }

      const cleanDailyLog = {};
      if (parsed.dailyLog && typeof parsed.dailyLog === 'object') {
        for (const [day, count] of Object.entries(parsed.dailyLog)) {
          if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
            const n = Math.floor(Number(count) || 0);
            if (n > 0) cleanDailyLog[day] = n;
          }
        }
      }

      state.progress = {
        version: 2,
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
        mastery: cleanMastery,
        sentenceEdits: cleanEdits,
        sentenceMastery: cleanSentenceMastery,
        wordStats: cleanWordStats,
        dailyLog: cleanDailyLog
      };
    } catch {
      // Ignore corrupted localStorage
    }
  }

  function updateHeaderProgress() {
    const total = state.data.words.length;
    const knownCount = state.data.words.filter((w) => state.progress.mastery[w.id] === 'known').length;
    const pill = document.getElementById('header-progress-pill');
    if (pill) {
      pill.textContent = `已认识 ${knownCount}/${total}`;
    }
  }

  function saveProgress() {
    state.progress.version = 2;
    state.progress.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
    } catch {
      showToast('保存进度失败，可能是浏览器存储空间已满');
    }
    updateHeaderProgress();
  }

  function getWordMastery(wordId) {
    return (state.progress.mastery && state.progress.mastery[wordId]) || 'unlearned';
  }

  function setWordMastery(wordId, status) {
    if (!state.progress.mastery) state.progress.mastery = {};
    if (!status || status === 'unlearned') {
      delete state.progress.mastery[wordId];
    } else {
      const norm = normalizeMasteryValue(status);
      if (norm) {
        state.progress.mastery[wordId] = norm;
      }
    }
    saveProgress();
  }

  // ---------- Smart Review Engine & Activity Stats ----------
  function recordStudyActivity() {
    if (!state.progress.dailyLog || typeof state.progress.dailyLog !== 'object') {
      state.progress.dailyLog = {};
    }
    const key = todayKey();
    state.progress.dailyLog[key] = (Math.floor(Number(state.progress.dailyLog[key]) || 0)) + 1;

    // Trim logs older than 90 days
    const cutoffDate = new Date();
    cutoffDate.setHours(12, 0, 0, 0);
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    const cutoffKey = todayKey(cutoffDate);

    for (const dayKey of Object.keys(state.progress.dailyLog)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey) || dayKey < cutoffKey) {
        delete state.progress.dailyLog[dayKey];
      }
    }

    saveProgress();
  }

  function getTodayCount() {
    if (!state.progress.dailyLog) return 0;
    return Math.floor(Number(state.progress.dailyLog[todayKey()]) || 0);
  }

  function getStreakDays() {
    const log = state.progress.dailyLog || {};
    const cursor = new Date();
    cursor.setHours(12, 0, 0, 0);

    const todayCnt = Math.floor(Number(log[todayKey(cursor)]) || 0);
    if (todayCnt <= 0) {
      cursor.setDate(cursor.getDate() - 1);
      const yestCnt = Math.floor(Number(log[todayKey(cursor)]) || 0);
      if (yestCnt <= 0) return 0;
    }

    let streak = 0;
    for (let guard = 0; guard < 3650; guard++) {
      const cnt = Math.floor(Number(log[todayKey(cursor)]) || 0);
      if (cnt <= 0) break;
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function recordPracticeOutcome(wordId, isCorrect) {
    if (!wordId) return '';
    if (!state.progress.wordStats || typeof state.progress.wordStats !== 'object') {
      state.progress.wordStats = {};
    }
    if (!state.progress.mastery || typeof state.progress.mastery !== 'object') {
      state.progress.mastery = {};
    }

    const prev = state.progress.wordStats[wordId];
    const stat = {
      right: Math.max(0, Math.floor(Number(prev && prev.right) || 0)),
      wrong: Math.max(0, Math.floor(Number(prev && prev.wrong) || 0)),
      streak: Math.max(0, Math.floor(Number(prev && prev.streak) || 0)),
      lastSeen: Date.now()
    };

    const currentMastery = getWordMastery(wordId);
    let feedback = '';

    if (isCorrect) {
      stat.right += 1;
      stat.streak += 1;
      if (currentMastery === 'unknown') {
        state.progress.mastery[wordId] = 'fuzzy';
        feedback = '掌握度自动提升：不认识 → 模糊';
      } else if (currentMastery === 'fuzzy' && stat.streak >= 2) {
        state.progress.mastery[wordId] = 'known';
        feedback = '连续答对，自动升级为「认识」';
      } else if (currentMastery === 'unlearned') {
        state.progress.mastery[wordId] = 'known';
        feedback = '答对，已标记为「认识」';
      }
    } else {
      stat.wrong += 1;
      stat.streak = 0;
      if (currentMastery === 'known') {
        state.progress.mastery[wordId] = 'fuzzy';
        feedback = '已自动调整为「模糊」以便回炉';
      } else if (currentMastery === 'fuzzy' || currentMastery === 'unlearned') {
        state.progress.mastery[wordId] = 'unknown';
        feedback = '已标记为「不认识」加入错题回炉';
      }
    }

    state.progress.wordStats[wordId] = stat;
    recordStudyActivity();
    return feedback;
  }

  const SMART_BASE_SCORES = {
    unknown: 100,
    fuzzy: 65,
    unlearned: 40,
    known: 5
  };

  function smartSortWords(words) {
    if (!Array.isArray(words) || words.length <= 1) {
      return Array.isArray(words) ? words.slice() : [];
    }
    const now = Date.now();
    const statsMap = state.progress.wordStats || {};

    const scored = words.map((word) => {
      const status = getWordMastery(word.id);
      const base = SMART_BASE_SCORES[status] !== undefined ? SMART_BASE_SCORES[status] : 40;
      const stat = statsMap[word.id];
      const wrong = stat ? Math.max(0, Number(stat.wrong) || 0) : 0;
      const wrongBonus = wrong * 14;

      let stalenessBonus = 0;
      if (stat && stat.lastSeen && stat.lastSeen > 0 && now > stat.lastSeen) {
        const hoursSinceLastSeen = (now - stat.lastSeen) / 3600000;
        stalenessBonus = Math.min(25, hoursSinceLastSeen * 0.8);
      }

      const jitter = cryptoRandomInt(19); // [0, 18]
      return {
        word,
        score: base + wrongBonus + stalenessBonus + jitter
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map((item) => item.word);
  }

  // ---------- Sentence Answers & Mastery ----------
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
    } else if (status === 'known' || status === 'fuzzy') {
      state.progress.sentenceMastery[sentenceId] = status;
    }
    saveProgress();
  }

  // ---------- Bulletproof Progress Export / Import ----------
  function encodeUtf8Base64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) {
      bin += String.fromCharCode(bytes[i]);
    }
    return btoa(bin);
  }

  function decodeBase64Utf8(rawB64) {
    let b64 = String(rawB64 || '')
      .replace(/\s+/g, '')
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    if (!b64) {
      throw new Error('进度编码为空');
    }

    const rem = b64.length % 4;
    if (rem === 2) b64 += '==';
    else if (rem === 3) b64 += '=';
    else if (rem === 1) throw new Error('进度编码长度损坏，请确认是否完整复制');

    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }

  function encodeProgressString() {
    const payload = JSON.stringify({
      v: 2,
      t: state.progress.updatedAt || new Date().toISOString(),
      m: state.progress.mastery || {},
      se: state.progress.sentenceEdits || {},
      sm: state.progress.sentenceMastery || {},
      ws: state.progress.wordStats || {},
      dl: state.progress.dailyLog || {}
    });
    return 'VOCAB1:' + encodeUtf8Base64(payload);
  }

  function buildSyncUrl() {
    const base =
      typeof window !== 'undefined' && window.location
        ? window.location.origin && window.location.origin !== 'null'
          ? `${window.location.origin}${window.location.pathname}`
          : String(window.location.href || '').split('#')[0]
        : '';
    return `${base}#sync=${encodeProgressString()}`;
  }

  function decodePercentSafe(str) {
    const s = String(str || '');
    if (!/%[0-9A-Fa-f]{2}/.test(s)) return s;
    try {
      return decodeURIComponent(s);
    } catch {
      return s.replace(/%[0-9A-Fa-f]{2}/g, (match) => {
        try {
          return decodeURIComponent(match);
        } catch {
          return match;
        }
      });
    }
  }

  function parseJsonFromCandidate(text) {
    const trimmed = text.trim();
    const vocabMatch = trimmed.match(/VOCAB1:([A-Za-z0-9+/=_\-\s]+)/i);
    if (vocabMatch) {
      const captured = vocabMatch[1];
      try {
        return JSON.parse(decodeBase64Utf8(captured));
      } catch {
        // Handle trailing non-base64 English notes separated by whitespace/newline after padding or payload
        const eqIdx = captured.indexOf('=');
        if (eqIdx !== -1) {
          const uptoPad = captured.slice(0, eqIdx + 2).replace(/[^A-Za-z0-9+/=_\-\s].*$/, '');
          try {
            return JSON.parse(decodeBase64Utf8(uptoPad));
          } catch {
            // Continue to line fallback
          }
        }
        const firstToken = captured.trim().split(/\s+/)[0];
        if (firstToken && firstToken !== captured.replace(/\s+/g, '')) {
          try {
            return JSON.parse(decodeBase64Utf8(firstToken));
          } catch {
            // Fall through to standard error
          }
        }
        throw new Error('VOCAB1 进度文本解析失败，请确认是否完整复制（勿漏掉开头或结尾）');
      }
    }

    if (trimmed.includes('{') && trimmed.includes('}')) {
      try {
        return JSON.parse(trimmed);
      } catch {
        const start = trimmed.indexOf('{');
        const end = trimmed.lastIndexOf('}');
        if (start !== -1 && end > start) {
          try {
            return JSON.parse(trimmed.slice(start, end + 1));
          } catch {
            // Fall through
          }
        }
        throw new Error('JSON 备份格式解析失败，请确认文件内容完整');
      }
    }

    try {
      return JSON.parse(decodeBase64Utf8(trimmed));
    } catch {
      throw new Error('无法识别进度文本格式，请粘贴以 VOCAB1: 开头的备份码或导入 .json 文件');
    }
  }

  function decodeProgressString(input) {
    let cleaned = String(input || '')
      .replace(/：/g, ':')
      .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '')
      .trim();

    if (!cleaned) {
      throw new Error('请先粘贴导出的进度文本或选择备份文件');
    }

    const syncIdx = cleaned.search(/#sync=/i);
    if (syncIdx !== -1) {
      const rawSyncPart = cleaned.slice(syncIdx + 6).trim();
      if (!rawSyncPart) {
        throw new Error('同步链接中缺少进度数据');
      }
      cleaned = decodePercentSafe(rawSyncPart)
        .replace(/：/g, ':')
        .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '')
        .trim();
    } else if (/VOCAB1%3A/i.test(cleaned)) {
      cleaned = decodePercentSafe(cleaned).trim();
    }

    const obj = parseJsonFromCandidate(cleaned);
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      throw new Error('进度格式不正确');
    }

    const masteryRaw = obj.m !== undefined ? obj.m : obj.mastery;
    if (!masteryRaw || typeof masteryRaw !== 'object' || Array.isArray(masteryRaw)) {
      throw new Error('缺少有效的掌握状态数据');
    }

    const validIds = new Set(state.data.words.map((w) => w.id));
    const imported = {};
    let count = 0;

    for (const [id, rawVal] of Object.entries(masteryRaw)) {
      if (rawVal === 'unlearned' || rawVal === '' || rawVal === null) continue;
      const norm = normalizeMasteryValue(rawVal);
      if (!norm) {
        throw new Error(`存在无效的状态值：${rawVal}`);
      }
      if (validIds.has(id)) {
        imported[id] = norm;
        count++;
      }
    }

    const validSentenceIds = new Set(state.data.sentences.map((s) => s.id));

    const importedEdits = {};
    let editsCount = 0;
    const rawEdits = obj.se !== undefined ? obj.se : obj.sentenceEdits;
    if (rawEdits && typeof rawEdits === 'object' && !Array.isArray(rawEdits)) {
      for (const [id, val] of Object.entries(rawEdits)) {
        if (validSentenceIds.has(id) && typeof val === 'string' && val.trim()) {
          importedEdits[id] = val.trim();
          editsCount++;
        }
      }
    }

    const importedSentenceMastery = {};
    let smCount = 0;
    const rawSM = obj.sm !== undefined ? obj.sm : obj.sentenceMastery;
    if (rawSM && typeof rawSM === 'object' && !Array.isArray(rawSM)) {
      for (const [id, val] of Object.entries(rawSM)) {
        if (!validSentenceIds.has(id)) continue;
        if (val === 'known' || val === 'mastered') {
          importedSentenceMastery[id] = 'known';
          smCount++;
        } else if (val === 'fuzzy') {
          importedSentenceMastery[id] = 'fuzzy';
          smCount++;
        }
      }
    }

    const importedStats = {};
    const rawStats = obj.ws !== undefined ? obj.ws : obj.wordStats;
    if (rawStats && typeof rawStats === 'object' && !Array.isArray(rawStats)) {
      for (const [id, st] of Object.entries(rawStats)) {
        if (validIds.has(id) && st && typeof st === 'object' && !Array.isArray(st)) {
          importedStats[id] = {
            right: Math.max(0, Math.floor(Number(st.right) || 0)),
            wrong: Math.max(0, Math.floor(Number(st.wrong) || 0)),
            streak: Math.max(0, Math.floor(Number(st.streak) || 0)),
            lastSeen: Math.max(0, Number(st.lastSeen) || 0)
          };
        }
      }
    }

    const importedDailyLog = {};
    const rawDaily = obj.dl !== undefined ? obj.dl : obj.dailyLog;
    if (rawDaily && typeof rawDaily === 'object' && !Array.isArray(rawDaily)) {
      for (const [day, cnt] of Object.entries(rawDaily)) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
          const n = Math.floor(Number(cnt) || 0);
          if (n > 0) importedDailyLog[day] = n;
        }
      }
    }

    return {
      imported,
      count,
      importedEdits,
      editsCount,
      importedSentenceMastery,
      smCount,
      importedStats,
      importedDailyLog
    };
  }

  const MASTERY_RANK = { unlearned: 0, unknown: 1, fuzzy: 2, known: 3 };
  const SENTENCE_MASTERY_RANK = { unlearned: 0, fuzzy: 1, known: 2 };

  function buildImportPreview(decoded) {
    const safeDecoded = decoded || {};
    const imported = safeDecoded.imported || {};
    const importedEdits = safeDecoded.importedEdits || {};
    const importedSentenceMastery = safeDecoded.importedSentenceMastery || {};
    const importedDailyLog = safeDecoded.importedDailyLog || {};

    let known = 0;
    let fuzzy = 0;
    let unknown = 0;
    for (const st of Object.values(imported)) {
      if (st === 'known') known++;
      else if (st === 'fuzzy') fuzzy++;
      else if (st === 'unknown') unknown++;
    }

    const counts = {
      known,
      fuzzy,
      unknown,
      totalWords: known + fuzzy + unknown,
      sentenceEdits: Object.keys(importedEdits).length,
      sentenceMastery: Object.keys(importedSentenceMastery).length,
      days: Object.keys(importedDailyLog).length
    };

    const curMastery = (state.progress && state.progress.mastery) || {};
    const curEdits = (state.progress && state.progress.sentenceEdits) || {};
    const hasWordMap = state.wordMap && state.wordMap.size > 0;

    let currentKnown = 0;
    const simulatedMastery = {};
    for (const [id, st] of Object.entries(curMastery)) {
      simulatedMastery[id] = st;
      if (st === 'known' && (!hasWordMap || state.wordMap.has(id))) {
        currentKnown++;
      }
    }

    let upgradedWords = 0;
    for (const [id, st] of Object.entries(imported)) {
      const cur = simulatedMastery[id] || 'unlearned';
      if ((MASTERY_RANK[st] || 0) > (MASTERY_RANK[cur] || 0)) {
        simulatedMastery[id] = st;
        upgradedWords++;
      }
    }

    let afterMergeKnown = 0;
    for (const [id, st] of Object.entries(simulatedMastery)) {
      if (st === 'known' && (!hasWordMap || state.wordMap.has(id))) {
        afterMergeKnown++;
      }
    }

    let addedEdits = 0;
    for (const [id, text] of Object.entries(importedEdits)) {
      if (typeof text === 'string' && text.trim() && curEdits[id] !== text.trim()) {
        addedEdits++;
      }
    }

    const mergeDiff = {
      currentKnown,
      afterMergeKnown,
      addedKnown: Math.max(0, afterMergeKnown - currentKnown),
      upgradedWords,
      addedEdits
    };

    const overwriteDiff = {
      currentKnown,
      afterOverwriteKnown: known
    };

    return {
      decoded: safeDecoded,
      counts,
      mergeDiff,
      overwriteDiff
    };
  }

  function checkIncomingSyncHash() {
    if (typeof window === 'undefined' || !window.location) return false;
    const hash = String(window.location.hash || '');
    if (!/^#sync=/i.test(hash)) return false;

    const clearHash = () => {
      try {
        if (window.history && typeof window.history.replaceState === 'function') {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        } else {
          window.location.hash = '';
        }
      } catch {
        // Ignore history.replaceState restrictions
      }
    };

    try {
      const decoded = decodeProgressString(hash);
      state.pendingSyncModal = buildImportPreview(decoded);
      clearHash();
      return true;
    } catch (err) {
      state.pendingSyncModal = null;
      clearHash();
      showToast(err && err.message ? `同步链接无效：${err.message}` : '同步链接无效或已损坏');
      return false;
    }
  }

  function applyImportedProgress(decoded, mode = 'merge') {
    const safeDecoded = decoded || {};
    const imported = safeDecoded.imported || {};
    const importedEdits = safeDecoded.importedEdits || {};
    const importedSentenceMastery = safeDecoded.importedSentenceMastery || {};
    const importedStats = safeDecoded.importedStats || {};
    const importedDailyLog = safeDecoded.importedDailyLog || {};

    if (mode === 'overwrite') {
      state.progress.mastery = { ...imported };
      state.progress.sentenceEdits = { ...importedEdits };
      state.progress.sentenceMastery = { ...importedSentenceMastery };
      const nextStats = {};
      for (const [id, st] of Object.entries(importedStats)) {
        nextStats[id] = { ...st };
      }
      state.progress.wordStats = nextStats;
      state.progress.dailyLog = { ...importedDailyLog };
    } else {
      if (!state.progress.mastery) state.progress.mastery = {};
      if (!state.progress.sentenceEdits) state.progress.sentenceEdits = {};
      if (!state.progress.sentenceMastery) state.progress.sentenceMastery = {};
      if (!state.progress.wordStats) state.progress.wordStats = {};
      if (!state.progress.dailyLog) state.progress.dailyLog = {};

      for (const [id, st] of Object.entries(imported)) {
        const cur = state.progress.mastery[id] || 'unlearned';
        if ((MASTERY_RANK[st] || 0) > (MASTERY_RANK[cur] || 0)) {
          state.progress.mastery[id] = st;
        }
      }

      for (const [id, text] of Object.entries(importedEdits)) {
        if (typeof text === 'string' && text.trim()) {
          state.progress.sentenceEdits[id] = text.trim();
        }
      }

      for (const [id, st] of Object.entries(importedSentenceMastery)) {
        const cur = state.progress.sentenceMastery[id] || 'unlearned';
        if ((SENTENCE_MASTERY_RANK[st] || 0) > (SENTENCE_MASTERY_RANK[cur] || 0)) {
          state.progress.sentenceMastery[id] = st;
        }
      }

      for (const [id, st] of Object.entries(importedStats)) {
        const cur = state.progress.wordStats[id];
        if (!cur) {
          state.progress.wordStats[id] = { ...st };
        } else {
          state.progress.wordStats[id] = {
            right: Math.max(Number(cur.right) || 0, Number(st.right) || 0),
            wrong: Math.max(Number(cur.wrong) || 0, Number(st.wrong) || 0),
            streak: Math.max(Number(cur.streak) || 0, Number(st.streak) || 0),
            lastSeen: Math.max(Number(cur.lastSeen) || 0, Number(st.lastSeen) || 0)
          };
        }
      }

      for (const [day, cnt] of Object.entries(importedDailyLog)) {
        state.progress.dailyLog[day] = Math.max(
          Math.floor(Number(state.progress.dailyLog[day]) || 0),
          Math.floor(Number(cnt) || 0)
        );
      }
    }

    saveProgress();
    clearFlashcardState();

    const modeLabel = mode === 'overwrite' ? '覆盖导入成功' : '合并导入成功';
    const parts = [`${safeDecoded.count || 0} 条词条掌握度`];
    if (safeDecoded.editsCount > 0) parts.push(`${safeDecoded.editsCount} 条自定义句译`);
    if (safeDecoded.smCount > 0) parts.push(`${safeDecoded.smCount} 条句子掌握状态`);
    return `${modeLabel}：已处理 ${parts.join('、')}`;
  }

  function exportProgressJsonFile() {
    const payload = {
      v: 2,
      t: state.progress.updatedAt || new Date().toISOString(),
      m: state.progress.mastery || {},
      se: state.progress.sentenceEdits || {},
      sm: state.progress.sentenceMastery || {},
      ws: state.progress.wordStats || {},
      dl: state.progress.dailyLog || {}
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const filename = `vocab-progress-${todayKey()}.json`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1500);
  }

  async function copyTextReliable(text, fallbackTextareaEl) {
    const str = String(text || '');
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(str);
        return true;
      } catch {
        // Fall through to execCommand fallback for iOS Safari / WeChat WebView
      }
    }

    if (fallbackTextareaEl && typeof fallbackTextareaEl.focus === 'function') {
      const wasReadOnly = fallbackTextareaEl.readOnly;
      try {
        fallbackTextareaEl.value = str;
        fallbackTextareaEl.readOnly = false;
        fallbackTextareaEl.focus();
        if (typeof fallbackTextareaEl.setSelectionRange === 'function') {
          fallbackTextareaEl.setSelectionRange(0, Math.max(str.length, 999999));
        } else if (typeof fallbackTextareaEl.select === 'function') {
          fallbackTextareaEl.select();
        }
        const ok = document.execCommand('copy');
        fallbackTextareaEl.readOnly = wasReadOnly;
        if (ok) return true;
      } catch {
        fallbackTextareaEl.readOnly = wasReadOnly;
      }
    }

    try {
      const ta = document.createElement('textarea');
      ta.value = str;
      ta.setAttribute('aria-hidden', 'true');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.width = '2em';
      ta.style.height = '2em';
      ta.style.padding = '0';
      ta.style.border = 'none';
      ta.style.outline = 'none';
      ta.style.boxShadow = 'none';
      ta.style.background = 'transparent';
      ta.style.opacity = '0';
      ta.style.fontSize = '16px'; // Prevent iOS Safari zoom on focus
      document.body.appendChild(ta);
      ta.focus();
      if (typeof ta.setSelectionRange === 'function') {
        ta.setSelectionRange(0, Math.max(str.length, 999999));
      } else {
        ta.select();
      }
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return Boolean(ok);
    } catch {
      return false;
    }
  }

  // ---------- Speech Synthesis (TTS) ----------
  let activeSpeakBtn = null;
  let cachedVoices = [];

  function refreshVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.getVoices) {
      const list = window.speechSynthesis.getVoices();
      if (Array.isArray(list) && list.length > 0) {
        cachedVoices = list;
      }
    }
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    refreshVoices();
    if (typeof window.speechSynthesis.addEventListener === 'function') {
      window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
    }
  }

  function pickBestVoice(voices, preferredAccent) {
    if (!Array.isArray(voices) || voices.length === 0) return null;
    const target = String(preferredAccent || 'en-US').toLowerCase();
    const alt = target === 'en-gb' ? 'en-us' : 'en-gb';

    const matchesLocale = (voice, locale) => {
      const lang = String((voice && voice.lang) || '').toLowerCase().replace('_', '-');
      return lang === locale || lang.startsWith(locale + '-');
    };

    const scoreVoice = (voice) => {
      let s = 0;
      const name = String((voice && voice.name) || '').toLowerCase();
      if (voice.localService) s += 3;
      if (voice.default) s += 2;
      if (/enhanced|premium|natural|samantha|alex|daniel|serena|google|aria|guy/.test(name)) s += 4;
      return s;
    };

    const pickFrom = (candidates) => {
      if (candidates.length === 0) return null;
      return candidates.slice().sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
    };

    const exact = voices.filter((v) => matchesLocale(v, target));
    if (exact.length > 0) return pickFrom(exact);

    const secondary = voices.filter((v) => matchesLocale(v, alt));
    if (secondary.length > 0) return pickFrom(secondary);

    const anyEn = voices.filter((v) => String((v && v.lang) || '').toLowerCase().startsWith('en'));
    return pickFrom(anyEn);
  }

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
    if (!text) return;
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      showToast('当前环境不支持语音朗读，请使用系统浏览器或 Chrome/Safari');
      return;
    }

    try {
      if (activeSpeakBtn && activeSpeakBtn !== btnEl) {
        setSpeakBtnActive(activeSpeakBtn, false);
      }
      window.speechSynthesis.cancel();

      const accent = (state.prefs && state.prefs.accent) || 'en-US';
      const rawRate = Number(state.prefs && state.prefs.rate);
      const rate = Number.isFinite(rawRate) ? Math.max(0.5, Math.min(2.0, rawRate)) : 1.0;

      const utter = new SpeechSynthesisUtterance(String(text));
      refreshVoices();
      const voices = cachedVoices.length > 0
        ? cachedVoices
        : (window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : []);
      const chosen = pickBestVoice(voices, accent);

      if (chosen) {
        utter.voice = chosen;
        utter.lang = chosen.lang;
      } else {
        utter.lang = accent;
      }
      utter.rate = rate;

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
      utter.onerror = (ev) => {
        setSpeakBtnActive(btnEl, false);
        if (activeSpeakBtn === btnEl) activeSpeakBtn = null;
        const errCode = ev && ev.error;
        if (errCode !== 'canceled' && errCode !== 'interrupted') {
          showToast('语音朗读失败，请检查设备音量或系统语音引擎');
        }
      };

      window.speechSynthesis.speak(utter);
    } catch {
      setSpeakBtnActive(btnEl, false);
      if (activeSpeakBtn === btnEl) activeSpeakBtn = null;
      showToast('当前环境无法启动语音朗读');
    }
  }

  // ---------- Hint Highlighter for Sentences ----------
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
    const safeAnswer = String(answerText || '');
    if (!hintStr) return escapeHtml(safeAnswer);

    const phrases = String(hintStr)
      .split(/[;；]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const ranges = [];
    for (const p of phrases) {
      const re = buildHintRegex(p);
      if (!re) continue;
      let match;
      while ((match = re.exec(safeAnswer)) !== null) {
        ranges.push([match.index, match.index + match[0].length]);
        if (match[0].length === 0) break;
      }
    }

    if (ranges.length === 0) {
      return escapeHtml(safeAnswer);
    }

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
      if (start > cursor) out += escapeHtml(safeAnswer.slice(cursor, start));
      out += `<mark class="hint-highlight">${escapeHtml(safeAnswer.slice(start, end))}</mark>`;
      cursor = end;
    }
    if (cursor < safeAnswer.length) out += escapeHtml(safeAnswer.slice(cursor));
    return out;
  }

  // ---------- Shared Filtering & Render Helpers ----------
  function filterWords(unit, type, mastery) {
    return state.data.words.filter((w) => {
      if (unit !== 'all' && String(w.unit) !== String(unit)) return false;
      if (type !== 'all' && w.type !== type) return false;
      if (mastery !== 'all' && getWordMastery(w.id) !== mastery) return false;
      return true;
    });
  }

  function renderUnitChips(activeUnit, attrName) {
    const current = String(activeUnit === undefined || activeUnit === null ? 'all' : activeUnit);
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
    return `<span class="badge badge-${escapeHtml(status)}">${escapeHtml(MASTERY_LABELS[status] || status)}</span>`;
  }

  function renderSpeakButton(text, label = '', ariaLabel = '朗读英文') {
    return `<button type="button" class="speak-btn" data-speak="${escapeHtml(text)}" aria-label="${escapeHtml(ariaLabel)}"><span class="tts-icon">${ICONS.speaker}</span><span class="tts-bars hidden" aria-hidden="true"><span class="tts-bar"></span><span class="tts-bar"></span><span class="tts-bar"></span></span>${label ? `<span>${escapeHtml(label)}</span>` : ''}</button>`;
  }

  // ---------- Flashcard State Persistence ----------
  function saveFlashcardState() {
    try {
      const { unit, type, mastery, smartMode, order, index, autoNext } = state.flashcard;
      localStorage.setItem(
        FLASHCARD_STORAGE_KEY,
        JSON.stringify({ unit, type, mastery, smartMode, order, index, autoNext })
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
      state.flashcard.smartMode = Boolean(parsed.smartMode);
      state.flashcard.order = validOrder;
      state.flashcard.index = clampedIndex;
      state.flashcard.flipped = false;
      state.flashcard.autoNext = Boolean(parsed.autoNext);
      state.flashcard.lastUndo = null;
      return true;
    } catch {
      return false;
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
      const res = await fetch('./data.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const words = Array.isArray(data.words) ? data.words : [];
      const sentences = Array.isArray(data.sentences) ? data.sentences : [];
      const unitIds = Array.from(
        new Set(
          [...words.map((w) => w.unit), ...sentences.map((s) => s.unit)].filter(
            (id) => id !== undefined && id !== null
          )
        )
      ).sort((a, b) => Number(a) - Number(b));

      return {
        units: unitIds.map((id) => ({ id, title: `Unit ${id}`, subtitle: '' })),
        words,
        sentences
      };
    }
  }

  // ---------- Export onto window.VocabApp ----------
  Object.assign(VocabApp, {
    STORAGE_KEY,
    FLASHCARD_STORAGE_KEY,
    PREFS_STORAGE_KEY,
    TYPE_LABELS,
    MASTERY_LABELS,
    ICONS,
    state,
    escapeHtml,
    cryptoRandomInt,
    cryptoShuffle,
    todayKey,
    showToast,
    renderBarsSpinner,
    flashButtonDone,
    loadPrefs,
    savePrefs,
    applyTheme,
    toggleTheme,
    loadProgress,
    saveProgress,
    updateHeaderProgress,
    getWordMastery,
    setWordMastery,
    recordStudyActivity,
    getTodayCount,
    getStreakDays,
    recordPracticeOutcome,
    smartSortWords,
    getSentenceAnswer,
    isSentenceEdited,
    setSentenceEdit,
    resetSentenceEdit,
    getSentenceMastery,
    setSentenceMastery,
    encodeProgressString,
    buildSyncUrl,
    decodeProgressString,
    buildImportPreview,
    checkIncomingSyncHash,
    applyImportedProgress,
    exportProgressJsonFile,
    speakEnglish,
    highlightHints,
    filterWords,
    renderUnitChips,
    renderTypeBadge,
    renderMasteryBadge,
    renderSpeakButton,
    saveFlashcardState,
    clearFlashcardState,
    restoreFlashcardState,
    loadUnitsData,
    copyTextReliable
  });
})();
