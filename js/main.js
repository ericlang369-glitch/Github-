/* =========================================================
   Vocab App v3 — Main Controller, Event Wiring & Bootstrap
   Classic static script loaded last after core, views-study, views-hub
   ========================================================= */
(function () {
  'use strict';

  const App = (window.VocabApp = window.VocabApp || {});

  // ---------- Header Theme & Audio Popover ----------
  function updateThemeButton() {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn || !App.ICONS) return;
    const isDark = document.documentElement.dataset.theme === 'dark';
    btn.innerHTML = isDark ? App.ICONS.sun : App.ICONS.moon;
    const label = isDark ? '切换到浅色模式' : '切换到深色模式';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
  }

  function renderAudioPopover() {
    const { state } = App;
    const popover = document.getElementById('audio-popover');
    const trigger = document.getElementById('audio-settings-btn');
    if (!popover) return;

    const isOpen = Boolean(state.audioMenuOpen);
    popover.classList.toggle('hidden', !isOpen);
    if (trigger) {
      trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      trigger.classList.toggle('active', isOpen);
    }

    if (!isOpen) return;

    const prefs = state.prefs || { accent: 'en-US', rate: 1.0, autoSpeak: false };
    const rate = Number(prefs.rate) || 1.0;

    popover.innerHTML = `
      <div class="popover-section">
        <div class="popover-label">发音口音</div>
        <div class="popover-pills">
          <button type="button" class="popover-pill ${prefs.accent === 'en-US' ? 'active' : ''}" data-pref-accent="en-US">美音</button>
          <button type="button" class="popover-pill ${prefs.accent === 'en-GB' ? 'active' : ''}" data-pref-accent="en-GB">英音</button>
        </div>
      </div>
      <div class="popover-section">
        <div class="popover-label">朗读语速</div>
        <div class="popover-pills">
          <button type="button" class="popover-pill ${Math.abs(rate - 0.75) < 0.01 ? 'active' : ''}" data-pref-rate="0.75">0.75x</button>
          <button type="button" class="popover-pill ${Math.abs(rate - 1.0) < 0.01 ? 'active' : ''}" data-pref-rate="1">1.0x</button>
          <button type="button" class="popover-pill ${Math.abs(rate - 1.2) < 0.01 ? 'active' : ''}" data-pref-rate="1.2">1.2x</button>
        </div>
      </div>
      <div class="popover-section popover-toggle-row">
        <label class="popover-toggle" for="pref-autospeak-checkbox">
          <span>翻卡/切卡自动朗读</span>
          <input type="checkbox" id="pref-autospeak-checkbox" ${prefs.autoSpeak ? 'checked' : ''}>
        </label>
      </div>
    `;
  }

  // ---------- Main Render ----------
  function render() {
    const { state } = App;
    const main = document.getElementById('app-main');
    if (!main) return;

    document.querySelectorAll('.nav-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === state.tab);
    });

    updateThemeButton();
    renderAudioPopover();

    if (state.tab === 'flashcard') {
      main.innerHTML = App.renderFlashcardView();
      App.attachFlashcardSwipe();
    } else if (state.tab === 'practice') {
      main.innerHTML = App.renderPracticeHubView();
    } else if (state.tab === 'sentence') {
      main.innerHTML = App.renderSentenceView();
    } else if (state.tab === 'browse') {
      main.innerHTML = App.renderBrowseView();
    } else if (state.tab === 'progress') {
      main.innerHTML = App.renderProgressView();
    } else {
      state.tab = 'flashcard';
      main.innerHTML = App.renderFlashcardView();
      App.attachFlashcardSwipe();
    }
  }

  // ---------- Progress Import Helper ----------
  function handleImportText(rawText, mode) {
    const { state } = App;
    try {
      const decoded = App.decodeProgressString(rawText);
      const summary = App.applyImportedProgress(decoded, mode);
      App.rebuildFlashcardDeck();
      App.rebuildQuizPool();
      App.rebuildSpellPool();
      App.rebuildSentencePool();
      App.updateHeaderProgress();
      state.importError = '';
      state.importSuccess = summary || (mode === 'merge' ? '已合并导入学习进度。' : '已覆盖导入学习进度。');
      render();
      App.showToast(mode === 'merge' ? '进度已合并导入' : '进度已覆盖导入');
    } catch (err) {
      state.importSuccess = '';
      state.importError = err && err.message ? err.message : '导入失败，请检查文本或文件格式';
      render();
    }
  }

  // ---------- Event Wiring ----------
  function bindEvents() {
    const { state } = App;

    // Header: theme toggle
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        App.toggleTheme();
        updateThemeButton();
        const isDark = document.documentElement.dataset.theme === 'dark';
        App.showToast(isDark ? '已切换为深色模式' : '已切换为浅色模式');
      });
    }

    // Header: audio popover trigger
    const audioBtn = document.getElementById('audio-settings-btn');
    if (audioBtn) {
      audioBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.audioMenuOpen = !state.audioMenuOpen;
        renderAudioPopover();
      });
    }

    // Header: audio popover controls
    const audioPopover = document.getElementById('audio-popover');
    if (audioPopover) {
      audioPopover.addEventListener('click', (e) => {
        e.stopPropagation();
        const accentBtn = e.target.closest('[data-pref-accent]');
        if (accentBtn) {
          state.prefs.accent = accentBtn.dataset.prefAccent;
          App.savePrefs();
          renderAudioPopover();
          App.showToast(state.prefs.accent === 'en-GB' ? '已切换为英音 (UK)' : '已切换为美音 (US)');
          return;
        }
        const rateBtn = e.target.closest('[data-pref-rate]');
        if (rateBtn) {
          const val = Number(rateBtn.dataset.prefRate);
          if (!Number.isNaN(val)) {
            state.prefs.rate = val;
            App.savePrefs();
            renderAudioPopover();
            App.showToast(`朗读语速已设为 ${val === 1 ? '1.0' : val}x`);
          }
          return;
        }
      });

      audioPopover.addEventListener('change', (e) => {
        if (e.target && e.target.id === 'pref-autospeak-checkbox') {
          state.prefs.autoSpeak = Boolean(e.target.checked);
          App.savePrefs();
          renderAudioPopover();
          App.showToast(state.prefs.autoSpeak ? '已开启自动朗读' : '已关闭自动朗读');
        }
      });
    }

    // Close audio popover when clicking outside
    document.addEventListener('click', (e) => {
      if (!state.audioMenuOpen) return;
      if (e.target.closest('#audio-popover') || e.target.closest('#audio-settings-btn')) return;
      state.audioMenuOpen = false;
      renderAudioPopover();
    });

    // Sync system theme preference changes if user left theme on 'system'
    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onSystemThemeChange = () => {
        if (state.prefs && state.prefs.theme === 'system') {
          App.applyTheme();
          updateThemeButton();
        }
      };
      if (typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', onSystemThemeChange);
      } else if (typeof mq.addListener === 'function') {
        mq.addListener(onSystemThemeChange);
      }
    }

    // Bottom 5-tab navigation
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) {
      bottomNav.addEventListener('click', (e) => {
        const btn = e.target.closest('.nav-btn');
        if (!btn || !btn.dataset.tab) return;
        if (typeof App.clearFlashcardTimers === 'function') {
          App.clearFlashcardTimers();
        }
        state.audioMenuOpen = false;
        state.tab = btn.dataset.tab;
        state.importError = '';
        state.importSuccess = '';
        render();
        window.scrollTo({ top: 0 });
      });
    }

    const main = document.getElementById('app-main');
    if (!main) return;

    // ---------- Delegated Click Events ----------
    main.addEventListener('click', (e) => {
      // Speaker button (TTS)
      const speakBtn = e.target.closest('.speak-btn');
      if (speakBtn) {
        e.stopPropagation();
        const text = speakBtn.dataset.speak;
        if (text) App.speakEnglish(text, speakBtn);
        return;
      }

      // Practice Hub segmented control
      const practiceSubBtn = e.target.closest('[data-practice-sub]');
      if (practiceSubBtn) {
        const sub = practiceSubBtn.dataset.practiceSub;
        if (sub && sub !== state.practiceSubTab) {
          state.practiceSubTab = sub;
          render();
        }
        return;
      }

      // ---- Flashcard Controls ----
      const fcUnit = e.target.closest('[data-fc-unit]');
      if (fcUnit) {
        state.flashcard.unit = fcUnit.dataset.fcUnit;
        App.rebuildFlashcardDeck();
        App.saveFlashcardState();
        render();
        return;
      }
      if (e.target.closest('#fc-shuffle-btn')) {
        App.shuffleFlashcardDeck();
        return;
      }
      if (e.target.closest('#fc-smart-toggle')) {
        state.flashcard.smartMode = !state.flashcard.smartMode;
        App.rebuildFlashcardDeck(true);
        App.saveFlashcardState();
        render();
        App.showToast(state.flashcard.smartMode ? '已开启智能复习排序' : '已切换为标准顺序');
        return;
      }
      if (e.target.closest('#fc-undo-btn')) {
        App.undoLastFlashcardRating();
        return;
      }
      const rateBtn = e.target.closest('[data-rate]');
      if (rateBtn) {
        App.rateFlashcard(rateBtn.dataset.rate);
        return;
      }

      // ---- Quiz Controls ----
      const quizUnit = e.target.closest('[data-quiz-unit]');
      if (quizUnit) {
        state.quiz.unit = quizUnit.dataset.quizUnit;
        App.rebuildQuizPool();
        render();
        return;
      }
      if (e.target.closest('#quiz-smart-toggle')) {
        state.quiz.smartMode = !state.quiz.smartMode;
        App.rebuildQuizPool();
        render();
        App.showToast(state.quiz.smartMode ? '四选一：已开启智能出题' : '四选一：已切换随机出题');
        return;
      }
      const quizOpt = e.target.closest('[data-quiz-opt]');
      if (quizOpt && state.quiz.selectedIndex === null) {
        App.answerQuizOption(Number(quizOpt.dataset.quizOpt));
        return;
      }
      if (e.target.closest('#quiz-next-btn')) {
        App.nextQuizQuestion();
        return;
      }

      // ---- Spell / Dictation Controls ----
      const spellUnit = e.target.closest('[data-spell-unit]');
      if (spellUnit) {
        state.spell.unit = spellUnit.dataset.spellUnit;
        App.rebuildSpellPool();
        render();
        return;
      }
      if (e.target.closest('#spell-dictation-toggle')) {
        state.spell.dictationOnly = !state.spell.dictationOnly;
        render();
        App.showToast(state.spell.dictationOnly ? '已开启听写模式（隐藏中文）' : '已关闭听写模式');
        if (state.spell.dictationOnly && state.spell.pool.length > 0 && !state.spell.submitted) {
          const w = state.wordMap.get(state.spell.pool[state.spell.index]);
          if (w) App.speakEnglish(w.en, document.querySelector('.spell-card .speak-btn'));
        }
        return;
      }
      if (e.target.closest('#spell-hint-btn')) {
        if (!state.spell.submitted) {
          state.spell.hintLevel = Math.min(2, (state.spell.hintLevel || 0) + 1);
          render();
          const inputEl = document.getElementById('spell-input');
          if (inputEl) inputEl.focus();
        }
        return;
      }
      if (e.target.closest('#spell-submit-btn')) {
        App.submitSpellAnswer();
        return;
      }
      if (e.target.closest('#spell-skip-btn')) {
        if (typeof App.skipSpellQuestion === 'function') {
          App.skipSpellQuestion();
        } else if (!state.spell.submitted) {
          const inputEl = document.getElementById('spell-input');
          if (inputEl) inputEl.value = '';
          state.spell.input = '';
          App.submitSpellAnswer();
        } else {
          App.nextSpellQuestion();
        }
        return;
      }
      if (e.target.closest('#spell-next-btn')) {
        App.nextSpellQuestion();
        return;
      }

      // ---- Mock Exam Controls ----
      const examScope = e.target.closest('[data-exam-scope]');
      if (examScope) {
        state.exam.scope = examScope.dataset.examScope;
        render();
        return;
      }
      if (e.target.closest('#exam-start-btn')) {
        App.startMockExam();
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

      // ---- Sentence Practice Controls ----
      const spUnit = e.target.closest('[data-sp-unit]');
      if (spUnit) {
        state.sentencePractice.unit = spUnit.dataset.spUnit;
        App.rebuildSentencePool();
        render();
        return;
      }
      if (e.target.closest('#sp-shuffle-btn')) {
        const sp = state.sentencePractice;
        const prevFirst = sp.order.length > 0 ? sp.order[0] : null;
        App.rebuildSentencePool();
        sp.order = App.cryptoShuffle(sp.order, prevFirst);
        sp.index = 0;
        sp.revealed = false;
        sp.editingId = null;
        render();
        App.showToast(`已随机打乱句子顺序（共 ${sp.order.length} 句）`);
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
        const nextSt = App.getSentenceMastery(sid) === st ? 'unlearned' : st;
        App.setSentenceMastery(sid, nextSt);
        if (nextSt !== 'unlearned' && typeof App.recordStudyActivity === 'function') {
          App.recordStudyActivity();
        }
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
          state.sentencePractice.editDraft = s ? App.getSentenceAnswer(s) : '';
        }
        render();
        return;
      }
      const spSaveBtn = e.target.closest('[data-sp-save]');
      if (spSaveBtn) {
        const sid = spSaveBtn.dataset.spSave;
        const ta = document.getElementById('sp-edit-textarea');
        const val = ta ? ta.value : state.sentencePractice.editDraft;
        if (!App.setSentenceEdit(sid, val)) {
          App.showToast('标准答案不能为空');
          return;
        }
        state.sentencePractice.editingId = null;
        render();
        App.showToast('标准答案已保存');
        return;
      }
      if (e.target.closest('[data-sp-cancel]')) {
        state.sentencePractice.editingId = null;
        render();
        return;
      }
      const spResetBtn = e.target.closest('[data-sp-reset]');
      if (spResetBtn) {
        App.resetSentenceEdit(spResetBtn.dataset.spReset);
        state.sentencePractice.editingId = null;
        render();
        App.showToast('已恢复默认标准答案');
        return;
      }

      // ---- Browse Controls ----
      const browseUnit = e.target.closest('[data-browse-unit]');
      if (browseUnit) {
        state.browse.unit = browseUnit.dataset.browseUnit;
        state.browse.limit = 80;
        render();
        return;
      }
      if (e.target.closest('#browse-toggle-ans')) {
        state.browse.showAnswers = !state.browse.showAnswers;
        if (state.browse.showAnswers && state.browse.revealedIds) {
          state.browse.revealedIds.clear();
        }
        render();
        return;
      }
      if (e.target.closest('#browse-clear-search')) {
        state.browse.search = '';
        state.browse.limit = 80;
        render();
        const searchEl = document.getElementById('browse-search-input');
        if (searchEl) searchEl.focus();
        return;
      }
      if (e.target.closest('#browse-load-more')) {
        state.browse.limit = (Number(state.browse.limit) || 80) + 80;
        App.updateBrowseResultsOnly();
        return;
      }
      const revealEl = e.target.closest('[data-reveal-id]');
      if (revealEl) {
        state.browse.revealedIds.add(revealEl.dataset.revealId);
        App.updateBrowseResultsOnly();
        return;
      }
      const browseRate = e.target.closest('[data-browse-rate]');
      if (browseRate) {
        const id = browseRate.dataset.browseRate;
        const st = browseRate.dataset.status;
        const current = App.getWordMastery(id);
        App.setWordMastery(id, current === st ? null : st);
        App.updateBrowseResultsOnly();
        return;
      }
      const brEditBtn = e.target.closest('[data-browse-edit]');
      if (brEditBtn) {
        const sid = brEditBtn.dataset.browseEdit;
        if (state.browse.editingSentenceId === sid) {
          state.browse.editingSentenceId = null;
        } else {
          const s = state.data.sentences.find((x) => x.id === sid);
          state.browse.editingSentenceId = sid;
          state.browse.editDraft = s ? App.getSentenceAnswer(s) : '';
        }
        App.updateBrowseResultsOnly();
        return;
      }
      const brSaveBtn = e.target.closest('[data-browse-save]');
      if (brSaveBtn) {
        const sid = brSaveBtn.dataset.browseSave;
        const ta = document.getElementById('browse-edit-textarea');
        const val = ta ? ta.value : state.browse.editDraft;
        if (!App.setSentenceEdit(sid, val)) {
          App.showToast('标准答案不能为空');
          return;
        }
        state.browse.editingSentenceId = null;
        App.updateBrowseResultsOnly();
        App.showToast('标准答案已保存');
        return;
      }
      if (e.target.closest('[data-browse-cancel]')) {
        state.browse.editingSentenceId = null;
        App.updateBrowseResultsOnly();
        return;
      }
      const brResetBtn = e.target.closest('[data-browse-reset]');
      if (brResetBtn) {
        App.resetSentenceEdit(brResetBtn.dataset.browseReset);
        state.browse.editingSentenceId = null;
        App.updateBrowseResultsOnly();
        App.showToast('已恢复默认标准答案');
        return;
      }

      // ---- Progress & Backup Controls ----
      if (e.target.closest('#copy-export-btn')) {
        const ta = document.getElementById('export-textarea');
        if (!ta) return;
        Promise.resolve(App.copyTextReliable(ta.value, ta)).then((ok) => {
          App.showToast(ok ? '已复制进度文本' : '复制受限，请长按文本框手动全选复制');
        });
        return;
      }
      if (e.target.closest('#download-json-btn')) {
        App.exportProgressJsonFile();
        App.showToast('已开始下载 .json 备份文件');
        return;
      }
      if (e.target.closest('#import-file-btn')) {
        const fileInput = document.getElementById('import-file-input');
        if (fileInput) fileInput.click();
        return;
      }
      if (e.target.closest('#import-merge-btn')) {
        const ta = document.getElementById('import-textarea');
        if (!ta) return;
        handleImportText(ta.value, 'merge');
        return;
      }
      if (e.target.closest('#import-overwrite-btn')) {
        const ta = document.getElementById('import-textarea');
        if (!ta) return;
        handleImportText(ta.value, 'overwrite');
        return;
      }
      if (e.target.closest('#reset-progress-btn')) {
        if (window.confirm('确定要清空所有本地学习进度吗？此操作不可撤销。')) {
          state.progress.mastery = {};
          state.progress.sentenceEdits = {};
          state.progress.sentenceMastery = {};
          state.progress.wordStats = {};
          state.progress.dailyLog = {};
          App.saveProgress();
          App.clearFlashcardState();
          state.flashcard.unit = 'all';
          state.flashcard.type = 'all';
          state.flashcard.mastery = 'all';
          state.flashcard.lastUndo = null;
          App.rebuildFlashcardDeck();
          App.rebuildQuizPool();
          App.rebuildSpellPool();
          App.rebuildSentencePool();
          App.updateHeaderProgress();
          state.importError = '';
          state.importSuccess = '已清空本地进度。';
          render();
          App.showToast('本地进度已清空');
        }
        return;
      }
    });

    // ---------- Delegated Change Events ----------
    main.addEventListener('change', (e) => {
      const target = e.target;
      if (!target) return;

      if (target.id === 'fc-autonext-checkbox') {
        state.flashcard.autoNext = Boolean(target.checked);
        App.saveFlashcardState();
        render();
      } else if (target.id === 'fc-type-select') {
        state.flashcard.type = target.value;
        App.rebuildFlashcardDeck();
        App.saveFlashcardState();
        render();
      } else if (target.id === 'fc-mastery-select') {
        state.flashcard.mastery = target.value;
        App.rebuildFlashcardDeck();
        App.saveFlashcardState();
        render();
      } else if (target.id === 'quiz-type-select') {
        state.quiz.type = target.value;
        App.rebuildQuizPool();
        render();
      } else if (target.id === 'quiz-mastery-select') {
        state.quiz.mastery = target.value;
        App.rebuildQuizPool();
        render();
      } else if (target.id === 'spell-type-select') {
        state.spell.type = target.value;
        App.rebuildSpellPool();
        render();
      } else if (target.id === 'spell-mastery-select') {
        state.spell.mastery = target.value;
        App.rebuildSpellPool();
        render();
      } else if (target.id === 'sp-mastery-select') {
        state.sentencePractice.mastery = target.value;
        App.rebuildSentencePool();
        render();
      } else if (target.id === 'browse-type-select') {
        state.browse.type = target.value;
        state.browse.limit = 80;
        render();
      } else if (target.id === 'browse-mastery-select') {
        state.browse.mastery = target.value;
        state.browse.limit = 80;
        render();
      } else if (target.id === 'import-file-input') {
        const file = target.files && target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const text = typeof reader.result === 'string' ? reader.result : '';
          target.value = '';
          handleImportText(text, 'merge');
        };
        reader.onerror = () => {
          target.value = '';
          state.importSuccess = '';
          state.importError = '读取文件失败，请重试或改为粘贴文本导入。';
          render();
        };
        reader.readAsText(file, 'utf-8');
      }
    });

    // ---------- iOS IME-safe Composition & Input Events ----------
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
        state.browse.limit = 80;
        App.updateBrowseResultsOnly();
      }
    });

    main.addEventListener('input', (e) => {
      const target = e.target;
      if (!target) return;

      if (target.id === 'browse-search-input') {
        if (e.isComposing || isComposing) return;
        state.browse.search = target.value;
        state.browse.limit = 80;
        App.updateBrowseResultsOnly();
      } else if (target.id === 'spell-input') {
        state.spell.input = target.value;
      } else if (target.dataset && target.dataset.examSentence) {
        state.exam.sentenceInputs[target.dataset.examSentence] = target.value;
        const bar = document.querySelector('.exam-sticky-bar span strong');
        if (bar) {
          const answeredWords = Object.keys(state.exam.wordAnswers).length;
          const answeredSentences = state.exam.sentenceQuestions.filter(
            (s) => (state.exam.sentenceInputs[s.id] || '').trim().length > 0
          ).length;
          bar.textContent = String(answeredWords + answeredSentences);
        }
      } else if (target.dataset && target.dataset.spDraft) {
        state.sentencePractice.drafts[target.dataset.spDraft] = target.value;
      } else if (target.id === 'sp-edit-textarea') {
        state.sentencePractice.editDraft = target.value;
      } else if (target.id === 'browse-edit-textarea') {
        state.browse.editDraft = target.value;
      }
    });

    // ---------- Global Keyboard Shortcuts ----------
    document.addEventListener('keydown', (e) => {
      if (e.target && e.target.id === 'spell-input') {
        if (e.key === 'Enter' && !e.isComposing) {
          e.preventDefault();
          if (!state.spell.submitted) {
            App.submitSpellAnswer();
          } else {
            App.nextSpellQuestion();
          }
        }
        return;
      }

      if (e.key === 'Escape' && state.audioMenuOpen) {
        state.audioMenuOpen = false;
        renderAudioPopover();
        return;
      }

      const tagName = (e.target && e.target.tagName) || '';
      if (
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT' ||
        (e.target && e.target.isContentEditable)
      ) {
        return;
      }

      if (state.tab === 'flashcard' && state.flashcard.order.length > 0) {
        if (e.code === 'Space' || e.key === 'Enter') {
          e.preventDefault();
          App.toggleFlashcardFlip();
        } else if (e.key === '1' || e.key === 'ArrowLeft') {
          e.preventDefault();
          App.rateFlashcard('unknown');
        } else if (e.key === '2' || e.key === 'ArrowDown') {
          e.preventDefault();
          App.rateFlashcard('fuzzy');
        } else if (e.key === '3' || e.key === 'ArrowRight') {
          e.preventDefault();
          App.rateFlashcard('known');
        } else if (e.key === 'p' || e.key === 'P' || e.key === 'Backspace') {
          e.preventDefault();
          App.prevFlashcard();
        } else if ((e.key === 'z' || e.key === 'Z') && state.flashcard.lastUndo) {
          e.preventDefault();
          App.undoLastFlashcardRating();
        } else if (e.key === 's' || e.key === 'S' || e.key === 'r' || e.key === 'R') {
          const word = state.wordMap.get(state.flashcard.order[state.flashcard.index]);
          if (word) {
            const btnSelector = state.flashcard.flipped
              ? '.flashcard-back .speak-btn'
              : '.flashcard-front .speak-btn';
            App.speakEnglish(
              word.en,
              document.querySelector(btnSelector) || document.querySelector('.flashcard-card .speak-btn')
            );
          }
        }
      } else if (state.tab === 'practice' && state.practiceSubTab === 'quiz' && state.quiz.pool.length > 0) {
        const keyMap = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, A: 0, b: 1, B: 1, c: 2, C: 2, d: 3, D: 3 };
        if (state.quiz.selectedIndex === null && keyMap[e.key] !== undefined) {
          const idx = keyMap[e.key];
          if (idx < state.quiz.currentOptions.length) {
            e.preventDefault();
            App.answerQuizOption(idx);
          }
        } else if (state.quiz.selectedIndex !== null && (e.key === 'Enter' || e.code === 'Space')) {
          e.preventDefault();
          App.nextQuizQuestion();
        } else if (e.key === 's' || e.key === 'S') {
          const word = state.wordMap.get(state.quiz.pool[state.quiz.index]);
          if (word) App.speakEnglish(word.en, document.querySelector('.quiz-card .speak-btn'));
        }
      } else if (state.tab === 'practice' && state.practiceSubTab === 'spell' && state.spell.pool.length > 0) {
        if (state.spell.submitted && (e.key === 'Enter' || e.code === 'Space')) {
          e.preventDefault();
          App.nextSpellQuestion();
        } else if (e.key === 's' || e.key === 'S') {
          const word = state.wordMap.get(state.spell.pool[state.spell.index]);
          if (word) App.speakEnglish(word.en, document.querySelector('.spell-card .speak-btn'));
        }
      }
    });
  }

  // ---------- Offline Badge & Service Worker ----------
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

  // ---------- Bootstrap ----------
  async function init() {
    const { state } = App;

    App.loadPrefs();
    App.applyTheme();
    updateThemeButton();
    setupPWA();
    bindEvents();
    App.loadProgress();

    try {
      const loaded = await App.loadUnitsData();
      state.units = loaded.units;
      state.data = {
        words: loaded.words,
        sentences: loaded.sentences
      };
      state.wordMap = new Map(state.data.words.map((w) => [w.id, w]));

      App.updateHeaderProgress();
      if (!App.restoreFlashcardState()) {
        App.rebuildFlashcardDeck();
      }
      App.rebuildQuizPool();
      App.rebuildSpellPool();
      App.rebuildSentencePool();
      render();
    } catch (err) {
      const main = document.getElementById('app-main');
      if (main) {
        main.innerHTML = `<div class="empty-box">词库加载失败：${App.escapeHtml(
          err && err.message ? err.message : '未知错误'
        )}</div>`;
      }
    }
  }

  Object.assign(App, {
    render,
    renderAudioPopover,
    updateThemeButton
  });

  init();
})();
