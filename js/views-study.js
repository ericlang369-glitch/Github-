(function () {
  'use strict';

  const App = (window.VocabApp = window.VocabApp || {});

  function callRender() {
    if (typeof App.render === 'function') {
      App.render();
    }
  }

  function shuffleArray(arr, avoidFirstItem) {
    if (typeof App.cryptoShuffle === 'function') {
      return App.cryptoShuffle(arr, avoidFirstItem);
    }
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  // ---------- Shared 4-Choice Distractor Builder ----------
  function buildWordOptions(targetWord) {
    const words = App.state.data.words || [];
    const seenZh = new Set([targetWord.zh]);
    const uniquePool = [];

    const pickFrom = (candidates) => {
      if (uniquePool.length >= 3) return;
      for (const candidate of shuffleArray(candidates)) {
        if (!seenZh.has(candidate.zh)) {
          seenZh.add(candidate.zh);
          uniquePool.push(candidate);
        }
        if (uniquePool.length === 3) break;
      }
    };

    // Pass 1: same unit + same type
    pickFrom(
      words.filter(
        (w) =>
          w.unit === targetWord.unit &&
          w.type === targetWord.type &&
          w.id !== targetWord.id &&
          w.zh !== targetWord.zh
      )
    );

    // Pass 2: fallback to same unit (any type)
    if (uniquePool.length < 3) {
      pickFrom(
        words.filter(
          (w) =>
            w.unit === targetWord.unit &&
            w.id !== targetWord.id &&
            !seenZh.has(w.zh)
        )
      );
    }

    // Pass 3: fallback to global pool
    if (uniquePool.length < 3) {
      pickFrom(
        words.filter((w) => w.id !== targetWord.id && !seenZh.has(w.zh))
      );
    }

    const options = [
      { id: targetWord.id, zh: targetWord.zh, isCorrect: true },
      ...uniquePool.map((d) => ({ id: d.id, zh: d.zh, isCorrect: false }))
    ];
    return shuffleArray(options);
  }

  // ---------- Flashcard Mode ----------
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

  function maybeAutoSpeakCurrentCard() {
    const state = App.state;
    if (!state.prefs || !state.prefs.autoSpeak) return;
    const fc = state.flashcard;
    if (!fc.order.length) return;
    const word = state.wordMap.get(fc.order[fc.index]);
    if (word && word.en && typeof App.speakEnglish === 'function') {
      App.speakEnglish(word.en);
    }
  }

  function rebuildFlashcardDeck(keepCurrentId = false) {
    clearFlashcardTimers();
    const fc = App.state.flashcard;
    const prevId = keepCurrentId ? fc.order[fc.index] : null;
    let list = App.filterWords(fc.unit, fc.type, fc.mastery);
    if (fc.smartMode && typeof App.smartSortWords === 'function') {
      list = App.smartSortWords(list);
    }
    fc.order = list.map((w) => w.id);
    if (prevId && fc.order.includes(prevId)) {
      fc.index = fc.order.indexOf(prevId);
    } else {
      fc.index = 0;
    }
    fc.flipped = false;
    fc.lastUndo = null;
  }

  function shuffleFlashcardDeck() {
    clearFlashcardTimers();
    const fc = App.state.flashcard;
    const prevFirstId =
      fc.order.length > 0 ? fc.order[fc.index] || fc.order[0] : null;

    // Bug 1 fix: always re-filter freshly from latest mastery tags first
    const freshList = App.filterWords(fc.unit, fc.type, fc.mastery);
    const freshIds = freshList.map((w) => w.id);

    fc.order = shuffleArray(freshIds, prevFirstId);
    fc.index = 0;
    fc.flipped = false;
    fc.lastUndo = null;

    App.saveFlashcardState();
    updateFlashcardDeckOnly();
    App.showToast('已按最新标签重筛并打乱（共 ' + freshIds.length + ' 张）');
  }

  function animateTrackTo(direction, onDone) {
    const track = document.getElementById('fc-track');
    if (!track || App.state.tab !== 'flashcard') {
      if (onDone) onDone();
      return;
    }
    const targetTransform =
      direction === 'next'
        ? 'translate3d(calc(-100% - 12px), 0, 0)'
        : 'translate3d(calc(100% + 12px), 0, 0)';
    track.classList.add('is-animating');
    void track.offsetWidth;
    track.style.transform = targetTransform;
    fcFlyOutTimer = setTimeout(() => {
      fcFlyOutTimer = null;
      if (onDone) onDone();
    }, 260);
  }

  function prevFlashcard() {
    const fc = App.state.flashcard;
    const len = fc.order.length;
    if (len === 0) return;
    clearFlashcardTimers();
    fc.index = (fc.index - 1 + len) % len;
    fc.flipped = false;
    App.saveFlashcardState();
    updateFlashcardDeckOnly();
    maybeAutoSpeakCurrentCard();
  }

  function nextFlashcard() {
    const fc = App.state.flashcard;
    const len = fc.order.length;
    if (len === 0) return;
    clearFlashcardTimers();
    fc.index = (fc.index + 1) % len;
    fc.flipped = false;
    App.saveFlashcardState();
    updateFlashcardDeckOnly();
    maybeAutoSpeakCurrentCard();
  }

  function rateFlashcard(status) {
    const fc = App.state.flashcard;
    if (fc.order.length === 0) return;
    clearFlashcardTimers();
    const wordId = fc.order[fc.index];
    const prevStatus = App.getWordMastery(wordId);

    fc.lastUndo = {
      wordId,
      prevStatus,
      index: fc.index
    };

    App.setWordMastery(wordId, status);
    if (typeof App.recordStudyActivity === 'function') {
      App.recordStudyActivity();
    }
    App.saveFlashcardState();
    updateFlashcardDeckOnly();

    if (!fc.autoNext) {
      return;
    }

    fcAutoNextTimer = setTimeout(() => {
      fcAutoNextTimer = null;
      if (App.state.tab !== 'flashcard' || fc.order.length === 0) return;
      animateTrackTo('next', () => {
        if (App.state.tab !== 'flashcard' || fc.order.length === 0) return;
        fc.index = (fc.index + 1) % fc.order.length;
        fc.flipped = false;
        App.saveFlashcardState();
        updateFlashcardDeckOnly();
        maybeAutoSpeakCurrentCard();
      });
    }, 260);
  }

  function undoLastFlashcardRating() {
    const fc = App.state.flashcard;
    if (!fc.lastUndo) return;
    clearFlashcardTimers();

    const { wordId, prevStatus, index } = fc.lastUndo;
    App.setWordMastery(
      wordId,
      !prevStatus || prevStatus === 'unlearned' ? null : prevStatus
    );

    if (fc.order[index] === wordId) {
      fc.index = index;
    } else {
      const foundIdx = fc.order.indexOf(wordId);
      if (foundIdx !== -1) {
        fc.index = foundIdx;
      }
    }

    fc.flipped = false;
    fc.lastUndo = null;
    App.saveFlashcardState();
    updateFlashcardDeckOnly();
    App.showToast('已撤回');
  }

  function toggleFlashcardFlip() {
    const fc = App.state.flashcard;
    if (fc.order.length === 0) return;
    fc.flipped = !fc.flipped;
    const card = document.getElementById('fc-card');
    if (card) {
      card.classList.toggle('is-flipped', fc.flipped);
    } else {
      callRender();
    }
    maybeAutoSpeakCurrentCard();
  }

  function renderSingleCardFaceHtml(word, isCurrent, flipped) {
    if (!word) return '';
    const status = App.getWordMastery(word.id);
    const badgesHtml = `
      <span class="badge badge-unit">Unit ${App.escapeHtml(word.unit)}</span>
      ${App.renderTypeBadge(word.type)}
      ${App.renderMasteryBadge(status)}
    `;
    const cardAttrs = isCurrent
      ? 'id="fc-card" tabindex="0" role="button" aria-label="闪卡，点击翻面"'
      : 'aria-hidden="true"';
    const flippedClass = isCurrent && flipped ? 'is-flipped' : '';

    return `
      <div ${cardAttrs} class="flashcard-card ${flippedClass}">
        <div class="flashcard-front">
          <div class="fc-top">
            <div class="fc-badges">${badgesHtml}</div>
            ${App.renderSpeakButton(word.en, '读')}
          </div>

          <div class="fc-center">
            <h2 class="fc-word">${App.escapeHtml(word.en)}</h2>
            ${word.ipa ? `<div class="ipa-text fc-ipa">${App.escapeHtml(word.ipa)}</div>` : ''}
            ${word.pos ? `<div class="fc-pos">${App.escapeHtml(word.pos)}</div>` : ''}
          </div>

          <div class="fc-hint-line">点击卡片或按空格键查看中文释义</div>
        </div>

        <div class="flashcard-back">
          <div class="fc-top">
            <div class="fc-badges">${badgesHtml}</div>
            ${App.renderSpeakButton(word.en, '读')}
          </div>

          <div class="fc-center">
            <h2 class="fc-word">${App.escapeHtml(word.en)}</h2>
            ${word.ipa ? `<div class="ipa-text fc-ipa">${App.escapeHtml(word.ipa)}</div>` : ''}
            ${word.pos ? `<div class="fc-pos">${App.escapeHtml(word.pos)}</div>` : ''}
            <div class="fc-back-box">
              <div class="fc-zh">${App.escapeHtml(word.zh)}</div>
            </div>
          </div>

          <div class="fc-hint-line">已翻面：请选择掌握程度或滑动切卡</div>
        </div>
      </div>
    `;
  }

  function renderFlashcardDeckHtml() {
    const state = App.state;
    const fc = state.flashcard;
    const total = fc.order.length;
    if (total > 0 && (fc.index < 0 || fc.index >= total)) {
      fc.index = 0;
    }
    const currentWord = total > 0 ? state.wordMap.get(fc.order[fc.index]) : null;
    const currentStatus = currentWord ? App.getWordMastery(currentWord.id) : 'unlearned';

    if (!currentWord) {
      return `<div class="empty-box">当前筛选条件下没有卡片，请切换筛选条件。</div>`;
    }

    const prevIdx = (fc.index - 1 + total) % total;
    const nextIdx = (fc.index + 1) % total;
    const prevWord = state.wordMap.get(fc.order[prevIdx]);
    const nextWord = state.wordMap.get(fc.order[nextIdx]);
    const icons = App.ICONS || {};

    return `
      <div class="fc-meta-bar">
        <span>第 <strong>${fc.index + 1}</strong> / ${total} 张${fc.smartMode ? ' · 智能优先' : ''}</span>
        <span>左滑下一个 · 右滑上一个 · 点击翻面</span>
      </div>

      <div class="flashcard-stage">
        <span class="swipe-badge swipe-badge-know" aria-hidden="true">${icons.arrowLeft || ''} 上一个</span>
        <span class="swipe-badge swipe-badge-unknown" aria-hidden="true">下一个 ${icons.arrowRight || ''}</span>
        <div id="fc-track" class="fc-track">
          <div class="fc-slot fc-slot-prev">${renderSingleCardFaceHtml(prevWord, false, false)}</div>
          <div class="fc-slot fc-slot-curr">${renderSingleCardFaceHtml(currentWord, true, fc.flipped)}</div>
          <div class="fc-slot fc-slot-next">${renderSingleCardFaceHtml(nextWord, false, false)}</div>
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
        ${
          fc.lastUndo
            ? `<button type="button" id="fc-undo-btn" class="undo-bar">${icons.undo || ''} 撤回上次标记</button>`
            : ''
        }
        <span class="kbd-tip">快捷键：空格翻面 · 1不认识 2模糊 3认识 · S朗读</span>
      </div>
    `;
  }

  function updateFlashcardDeckOnly() {
    const deckEl = document.getElementById('fc-deck-area');
    if (deckEl && App.state.tab === 'flashcard') {
      deckEl.innerHTML = renderFlashcardDeckHtml();
      attachFlashcardSwipe();
    } else {
      callRender();
    }
  }

  function renderFlashcardView() {
    const fc = App.state.flashcard;
    const icons = App.ICONS || {};
    return `
      <section class="filter-panel">
        <div class="filter-row">
          <div class="unit-pills">${App.renderUnitChips(fc.unit, 'fc-unit')}</div>
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
          <button type="button" id="fc-smart-toggle" class="smart-pill ${fc.smartMode ? 'active' : ''}" aria-pressed="${fc.smartMode ? 'true' : 'false'}">${icons.spark || ''} 智能复习</button>
          <button type="button" id="fc-shuffle-btn" class="btn-ghost">${icons.shuffle || ''} 打乱</button>
        </div>
      </section>

      <div id="fc-deck-area">${renderFlashcardDeckHtml()}</div>
    `;
  }

  function attachFlashcardSwipe() {
    const card = document.getElementById('fc-card');
    const track = document.getElementById('fc-track');
    if (!card || !track) return;
    const stage = track.closest('.flashcard-stage');
    const badgePrev = stage ? stage.querySelector('.swipe-badge-know') : null;
    const badgeNext = stage ? stage.querySelector('.swipe-badge-unknown') : null;

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let dx = 0;
    let dy = 0;
    let tracking = false;
    let moved = false;
    let animating = false;
    let snapBackTimer = null;

    const clearSwipeBadges = () => {
      card.classList.remove('swipe-known', 'swipe-unknown', 'swipe-fuzzy');
      if (badgePrev) badgePrev.classList.remove('is-visible');
      if (badgeNext) badgeNext.classList.remove('is-visible');
    };

    if (stage) {
      stage.addEventListener(
        'touchmove',
        (e) => {
          e.preventDefault();
        },
        { passive: false }
      );
    }

    card.addEventListener('pointerdown', (e) => {
      if (animating || e.target.closest('.speak-btn')) return;
      if (snapBackTimer) {
        clearTimeout(snapBackTimer);
        snapBackTimer = null;
      }
      tracking = true;
      moved = false;
      startX = e.clientX;
      startY = e.clientY;
      startTime = performance.now();
      dx = 0;
      dy = 0;
      track.classList.remove('is-animating');
      try {
        card.setPointerCapture(e.pointerId);
      } catch {
        // Ignore pointer capture errors
      }
    });

    card.addEventListener('pointermove', (e) => {
      if (!tracking || animating) return;
      dx = e.clientX - startX;
      dy = e.clientY - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        moved = true;
      }
      if (!moved) return;

      track.style.transform = `translate3d(${dx}px, 0, 0)`;

      clearSwipeBadges();
      if (dx > 36) {
        card.classList.add('swipe-known');
        if (badgePrev) badgePrev.classList.add('is-visible');
      } else if (dx < -36) {
        card.classList.add('swipe-unknown');
        if (badgeNext) badgeNext.classList.add('is-visible');
      }
    });

    const finishDrag = (e) => {
      if (!tracking || animating) return;
      tracking = false;
      try {
        if (e && typeof e.pointerId === 'number' && card.hasPointerCapture(e.pointerId)) {
          card.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore pointer capture release errors
      }

      const dt = Math.max(1, performance.now() - startTime);
      const vx = dx / dt;
      clearSwipeBadges();

      if (dx < -55 || (dx < -18 && vx < -0.35)) {
        animating = true;
        clearFlashcardTimers();
        animateTrackTo('next', () => {
          animating = false;
          const fc = App.state.flashcard;
          if (App.state.tab !== 'flashcard' || fc.order.length === 0) return;
          fc.index = (fc.index + 1) % fc.order.length;
          fc.flipped = false;
          App.saveFlashcardState();
          updateFlashcardDeckOnly();
          maybeAutoSpeakCurrentCard();
        });
        return;
      }

      if (dx > 55 || (dx > 18 && vx > 0.35)) {
        animating = true;
        clearFlashcardTimers();
        animateTrackTo('prev', () => {
          animating = false;
          const fc = App.state.flashcard;
          if (App.state.tab !== 'flashcard' || fc.order.length === 0) return;
          const len = fc.order.length;
          fc.index = (fc.index - 1 + len) % len;
          fc.flipped = false;
          App.saveFlashcardState();
          updateFlashcardDeckOnly();
          maybeAutoSpeakCurrentCard();
        });
        return;
      }

      if (moved) {
        track.classList.add('is-animating');
        track.style.transform = 'translate3d(0, 0, 0)';
        snapBackTimer = setTimeout(() => {
          snapBackTimer = null;
          track.classList.remove('is-animating');
        }, 260);
      } else {
        track.style.transform = '';
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
      clearSwipeBadges();
      track.classList.add('is-animating');
      track.style.transform = 'translate3d(0, 0, 0)';
    });
  }

  // ---------- Practice Hub (Segmented Control) ----------
  function renderPracticeHubView() {
    const sub = App.state.practiceSubTab || 'quiz';
    const activeIdx = sub === 'spell' ? 1 : sub === 'exam' ? 2 : 0;
    let bodyHtml = '';
    if (sub === 'spell') {
      bodyHtml = renderSpellView();
    } else if (sub === 'exam') {
      bodyHtml = renderExamView();
    } else {
      bodyHtml = renderQuizView();
    }

    return `
      <div class="seg-control" style="--seg-count:3;--seg-idx:${activeIdx}" role="tablist" aria-label="测验模式">
        <span class="seg-indicator" aria-hidden="true"></span>
        <button type="button" class="seg-btn ${sub === 'quiz' ? 'active' : ''}" data-practice-sub="quiz" role="tab" aria-selected="${sub === 'quiz' ? 'true' : 'false'}">四选一</button>
        <button type="button" class="seg-btn ${sub === 'spell' ? 'active' : ''}" data-practice-sub="spell" role="tab" aria-selected="${sub === 'spell' ? 'true' : 'false'}">拼写听写</button>
        <button type="button" class="seg-btn ${sub === 'exam' ? 'active' : ''}" data-practice-sub="exam" role="tab" aria-selected="${sub === 'exam' ? 'true' : 'false'}">模拟考试</button>
      </div>
      ${bodyHtml}
    `;
  }

  // ---------- Quiz Mode ----------
  function rebuildQuizPool() {
    const q = App.state.quiz;
    let list = App.filterWords(q.unit, q.type, q.mastery);
    if (q.smartMode && typeof App.smartSortWords === 'function') {
      list = App.smartSortWords(list);
    } else {
      list = shuffleArray(list);
    }
    q.pool = list.map((w) => w.id);
    q.index = 0;
    q.selectedIndex = null;
    q.lastFeedback = '';
    prepareQuizQuestion();
  }

  function prepareQuizQuestion() {
    const q = App.state.quiz;
    if (q.pool.length === 0) {
      q.currentOptions = [];
      q.selectedIndex = null;
      q.lastFeedback = '';
      return;
    }
    if (q.index < 0 || q.index >= q.pool.length) {
      q.index = 0;
    }
    const word = App.state.wordMap.get(q.pool[q.index]);
    q.currentOptions = word ? buildWordOptions(word) : [];
    q.selectedIndex = null;
    q.lastFeedback = '';
  }

  function answerQuizOption(optIdx) {
    const q = App.state.quiz;
    if (q.selectedIndex !== null) return;
    const idx = Number(optIdx);
    const opt = q.currentOptions[idx];
    if (!opt) return;
    const word = App.state.wordMap.get(q.pool[q.index]);
    if (!word) return;

    q.selectedIndex = idx;
    const feedback =
      typeof App.recordPracticeOutcome === 'function'
        ? App.recordPracticeOutcome(word.id, Boolean(opt.isCorrect))
        : '';
    q.lastFeedback = feedback || '';
    callRender();
  }

  function nextQuizQuestion() {
    const q = App.state.quiz;
    if (q.pool.length === 0) return;
    q.index = (q.index + 1) % q.pool.length;
    prepareQuizQuestion();
    callRender();
  }

  function getFeedbackPillClass(feedback) {
    if (!feedback) return '';
    if (feedback.includes('升级') || feedback.includes('认识')) return 'is-upgrade';
    if (feedback.includes('模糊')) return 'is-warning';
    if (feedback.includes('错题') || feedback.includes('回炉') || feedback.includes('降级')) return 'is-downgrade';
    return '';
  }

  function renderQuizView() {
    const q = App.state.quiz;
    const word = q.pool.length > 0 ? App.state.wordMap.get(q.pool[q.index]) : null;
    const answered = q.selectedIndex !== null;
    const letters = ['A', 'B', 'C', 'D'];
    const icons = App.ICONS || {};
    const status = word ? App.getWordMastery(word.id) : 'unlearned';

    return `
      <section class="filter-panel">
        <div class="filter-row">
          <div class="unit-pills">${App.renderUnitChips(q.unit, 'quiz-unit')}</div>
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
          <button type="button" id="quiz-smart-toggle" class="smart-pill ${q.smartMode ? 'active' : ''}" aria-pressed="${q.smartMode ? 'true' : 'false'}">${icons.spark || ''} 智能出题</button>
        </div>
      </section>

      ${
        !word
          ? `<div class="empty-box">当前筛选条件下没有题目，请调整筛选条件。</div>`
          : `
        <div class="quiz-card">
          <div class="fc-top">
            <div class="fc-badges">
              <span class="badge badge-unit">Unit ${App.escapeHtml(word.unit)}</span>
              ${App.renderTypeBadge(word.type)}
              ${App.renderMasteryBadge(status)}
              <span class="badge badge-plain">${q.index + 1} / ${q.pool.length}</span>
            </div>
            ${App.renderSpeakButton(word.en, '读')}
          </div>

          <div class="quiz-prompt-row">
            <div>
              <h2 class="quiz-word">${App.escapeHtml(word.en)}</h2>
              ${word.ipa ? `<div class="ipa-text" style="margin-top:4px;">${App.escapeHtml(word.ipa)}</div>` : ''}
              ${word.pos ? `<div class="quiz-pos">${App.escapeHtml(word.pos)}</div>` : ''}
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
                    <span>${App.escapeHtml(opt.zh)}</span>
                  </button>
                `;
              })
              .join('')}
          </div>

          <div class="quiz-footer">
            ${
              answered && q.lastFeedback
                ? `<div class="auto-feedback-pill ${getFeedbackPillClass(q.lastFeedback)}">${App.escapeHtml(q.lastFeedback)}</div>`
                : ''
            }
            ${
              answered
                ? `<button type="button" id="quiz-next-btn" class="btn-primary">下一题 ${icons.arrowRight || ''}</button>`
                : `<div class="kbd-tip">快捷键：1-4 或 A-D 选择 · S 朗读 · 选完按回车下一题</div>`
            }
          </div>
        </div>
      `
      }
    `;
  }

  // ---------- Spelling & Dictation Mode ----------
  function normalizeSpellText(str) {
    return String(str || '')
      .replace(/[\u2018\u2019]/g, "'")
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  function collapseSpellDisplay(str) {
    return String(str || '')
      .replace(/[\u2018\u2019]/g, "'")
      .trim()
      .replace(/\s+/g, ' ');
  }

  function rebuildSpellPool() {
    const sp = App.state.spell;
    let list = App.filterWords(sp.unit, sp.type, sp.mastery);
    if (sp.smartMode && typeof App.smartSortWords === 'function') {
      list = App.smartSortWords(list);
    } else {
      list = shuffleArray(list);
    }
    sp.pool = list.map((w) => w.id);
    sp.index = 0;
    sp.input = '';
    sp.hintLevel = 0;
    sp.submitted = false;
    sp.isCorrect = false;
    sp.lastFeedback = '';
  }

  function getSpellHintText(en, level) {
    const lvl = Number(level) || 0;
    if (lvl <= 0 || !en) return '';
    const tokens = collapseSpellDisplay(en).split(' ');
    const maskedTokens = tokens.map((token) => {
      const chars = Array.from(token);
      const len = chars.length;
      if (len === 0) return '';
      if (len === 1) {
        return lvl >= 2 ? chars[0] : '_';
      }
      if (len === 2) {
        return `${chars[0]} _`;
      }
      return chars
        .map((ch, idx) => {
          // Keep punctuation like hyphens or apostrophes visible
          if (!/[a-zA-Z]/.test(ch)) return ch;
          if (idx === 0 || idx === len - 1) return ch;
          if (lvl >= 2 && idx % 2 === 0) return ch;
          return '_';
        })
        .join(' ');
    });
    return maskedTokens.join('   ');
  }

  function buildSpellDiffHtml(userInput, expectedEn) {
    const uStr = collapseSpellDisplay(userInput);
    const eStr = collapseSpellDisplay(expectedEn);
    const uChars = Array.from(uStr);
    const eChars = Array.from(eStr);
    const m = uChars.length;
    const n = eChars.length;

    const formatChar = (ch) => (ch === ' ' ? '&nbsp;' : App.escapeHtml(ch));

    if (m === 0) {
      return `<div class="spell-diff" aria-label="拼写对比">${eChars
        .map((ch) => `<span class="diff-miss">${formatChar(ch)}</span>`)
        .join('')}</div>`;
    }

    // Standard Levenshtein DP alignment for clear character-by-character diff
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      const uc = uChars[i - 1].toLowerCase();
      for (let j = 1; j <= n; j++) {
        const ec = eChars[j - 1].toLowerCase();
        if (uc === ec) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j - 1] + 1, // substitute
            dp[i - 1][j] + 1, // extra char in user input
            dp[i][j - 1] + 1 // missing char from expected
          );
        }
      }
    }

    const parts = [];
    let i = m;
    let j = n;
    while (i > 0 || j > 0) {
      if (
        i > 0 &&
        j > 0 &&
        uChars[i - 1].toLowerCase() === eChars[j - 1].toLowerCase() &&
        dp[i][j] === dp[i - 1][j - 1]
      ) {
        parts.push(`<span class="diff-ok">${formatChar(uChars[i - 1])}</span>`);
        i--;
        j--;
      } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
        parts.push(`<span class="diff-err">${formatChar(uChars[i - 1])}</span>`);
        i--;
        j--;
      } else if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
        parts.push(`<span class="diff-miss">${formatChar(eChars[j - 1])}</span>`);
        j--;
      } else {
        parts.push(`<span class="diff-err">${formatChar(uChars[i - 1])}</span>`);
        i--;
      }
    }

    parts.reverse();
    return `<div class="spell-diff" aria-label="拼写对比">${parts.join('')}</div>`;
  }

  function submitSpellAnswer() {
    const sp = App.state.spell;
    if (sp.pool.length === 0 || sp.submitted) return;
    const word = App.state.wordMap.get(sp.pool[sp.index]);
    if (!word) return;

    const inputEl = document.getElementById('spell-input');
    if (inputEl) {
      sp.input = inputEl.value;
    }

    const isCorrect =
      normalizeSpellText(sp.input) === normalizeSpellText(word.en);
    sp.submitted = true;
    sp.isCorrect = isCorrect;

    const feedback =
      typeof App.recordPracticeOutcome === 'function'
        ? App.recordPracticeOutcome(word.id, isCorrect)
        : '';
    sp.lastFeedback = feedback || '';

    callRender();

    if (App.state.prefs && App.state.prefs.autoSpeak && typeof App.speakEnglish === 'function') {
      App.speakEnglish(word.en);
    }
  }

  function skipSpellQuestion() {
    const sp = App.state.spell;
    if (sp.pool.length === 0) return;
    if (sp.submitted) {
      nextSpellQuestion();
      return;
    }
    const word = App.state.wordMap.get(sp.pool[sp.index]);
    if (!word) return;

    sp.input = '';
    sp.submitted = true;
    sp.isCorrect = false;
    const feedback =
      typeof App.recordPracticeOutcome === 'function'
        ? App.recordPracticeOutcome(word.id, false)
        : '';
    sp.lastFeedback = feedback || '';

    callRender();

    if (App.state.prefs && App.state.prefs.autoSpeak && typeof App.speakEnglish === 'function') {
      App.speakEnglish(word.en);
    }
  }

  function nextSpellQuestion() {
    const sp = App.state.spell;
    if (sp.pool.length === 0) return;
    sp.index = (sp.index + 1) % sp.pool.length;
    sp.input = '';
    sp.hintLevel = 0;
    sp.submitted = false;
    sp.isCorrect = false;
    sp.lastFeedback = '';
    callRender();

    const nextWord = App.state.wordMap.get(sp.pool[sp.index]);
    if (
      nextWord &&
      (sp.dictationOnly || (App.state.prefs && App.state.prefs.autoSpeak)) &&
      typeof App.speakEnglish === 'function'
    ) {
      App.speakEnglish(nextWord.en);
    }

    const inputEl = document.getElementById('spell-input');
    if (inputEl && !('ontouchstart' in window)) {
      try {
        inputEl.focus();
      } catch {
        // Ignore focus errors
      }
    }
  }

  function renderSpellView() {
    const sp = App.state.spell;
    if (sp.pool.length > 0 && (sp.index < 0 || sp.index >= sp.pool.length)) {
      sp.index = 0;
    }
    const word = sp.pool.length > 0 ? App.state.wordMap.get(sp.pool[sp.index]) : null;
    const status = word ? App.getWordMastery(word.id) : 'unlearned';
    const icons = App.ICONS || {};

    const showMeaning = word && (!sp.dictationOnly || sp.submitted || sp.hintLevel >= 1);
    const showIpa = word && word.ipa && (sp.submitted || sp.hintLevel >= 2);
    const hintText = word && !sp.submitted && sp.hintLevel > 0 ? getSpellHintText(word.en, sp.hintLevel) : '';

    return `
      <section class="filter-panel">
        <div class="filter-row">
          <div class="unit-pills">${App.renderUnitChips(sp.unit, 'spell-unit')}</div>
        </div>
        <div class="filter-row">
          <select id="spell-type-select" class="select-sm" aria-label="按题型筛选">
            <option value="all" ${sp.type === 'all' ? 'selected' : ''}>全部词型</option>
            <option value="star" ${sp.type === 'star' ? 'selected' : ''}>重点词</option>
            <option value="plain" ${sp.type === 'plain' ? 'selected' : ''}>无星词</option>
            <option value="phrase" ${sp.type === 'phrase' ? 'selected' : ''}>短语</option>
          </select>
          <select id="spell-mastery-select" class="select-sm" aria-label="按掌握状态筛选">
            <option value="all" ${sp.mastery === 'all' ? 'selected' : ''}>全部状态</option>
            <option value="unlearned" ${sp.mastery === 'unlearned' ? 'selected' : ''}>未学</option>
            <option value="unknown" ${sp.mastery === 'unknown' ? 'selected' : ''}>不认识</option>
            <option value="fuzzy" ${sp.mastery === 'fuzzy' ? 'selected' : ''}>模糊</option>
            <option value="known" ${sp.mastery === 'known' ? 'selected' : ''}>认识</option>
          </select>
          <button type="button" id="spell-dictation-toggle" class="smart-pill ${sp.dictationOnly ? 'active' : ''}" aria-pressed="${sp.dictationOnly ? 'true' : 'false'}">${icons.speaker || ''} 听写模式</button>
        </div>
      </section>

      ${
        !word
          ? `<div class="empty-box">当前筛选条件下没有可拼写的词条，请调整筛选条件。</div>`
          : `
        <div class="spell-card">
          <div class="fc-top">
            <div class="fc-badges">
              <span class="badge badge-unit">Unit ${App.escapeHtml(word.unit)}</span>
              ${App.renderTypeBadge(word.type)}
              ${App.renderMasteryBadge(status)}
              <span class="badge badge-plain">${sp.index + 1} / ${sp.pool.length}</span>
            </div>
            ${App.renderSpeakButton(word.en, sp.dictationOnly ? '听发音' : '读', '朗读当前单词')}
          </div>

          <div class="spell-prompt-row">
            <div style="width:100%;">
              ${
                showMeaning
                  ? `<h2 class="spell-zh">${App.escapeHtml(word.zh)}</h2>`
                  : `<p class="spell-dictation-tip">${icons.speaker || ''} 听写模式：点击右上角听发音拼写，需要帮助可点「提示」</p>`
              }
              <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:4px;">
                ${word.pos ? `<span class="spell-pos" style="margin-top:0;">${App.escapeHtml(word.pos)}</span>` : ''}
                ${showIpa ? `<span class="ipa-text">${App.escapeHtml(word.ipa)}</span>` : ''}
              </div>
            </div>
          </div>

          ${hintText ? `<div class="spell-hint-mask">${App.escapeHtml(hintText)}</div>` : ''}

          <input
            type="text"
            id="spell-input"
            class="spell-input ${sp.submitted ? (sp.isCorrect ? 'is-correct' : 'is-wrong') : ''}"
            value="${App.escapeHtml(sp.input)}"
            placeholder="${sp.dictationOnly ? '听发音输入英文拼写...' : '输入对应的英文单词或短语...'}"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            ${sp.submitted ? 'readonly' : ''}
          />

          ${
            !sp.submitted
              ? `
            <div class="spell-actions">
              <button type="button" id="spell-submit-btn" class="btn-primary">检查拼写</button>
              <button type="button" id="spell-hint-btn" class="btn-ghost" ${sp.hintLevel >= 2 ? 'disabled' : ''}>${
                sp.hintLevel === 0 ? '提示' : sp.hintLevel === 1 ? '更多提示' : '已全提示'
              }</button>
              <button type="button" id="spell-skip-btn" class="btn-ghost">跳过</button>
            </div>
            <div class="kbd-tip">快捷键：回车提交 · S 朗读</div>
          `
              : `
            <div class="spell-result ${sp.isCorrect ? 'is-correct' : 'is-wrong'}">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <span class="badge ${sp.isCorrect ? 'badge-known' : 'badge-unknown'}">${sp.isCorrect ? '拼写正确' : '拼写有误'}</span>
                <span style="font-size:12px;color:var(--text-muted);">绿=正确 · 红=错字 · 灰=漏字</span>
              </div>
              ${buildSpellDiffHtml(sp.input, word.en)}
              <div class="spell-expected">
                <span style="font-size:13px;font-weight:500;color:var(--text-muted);">正确拼写：</span>
                <span>${App.escapeHtml(word.en)}</span>
                ${word.ipa ? `<span class="ipa-text">${App.escapeHtml(word.ipa)}</span>` : ''}
              </div>
              ${
                sp.lastFeedback
                  ? `<div class="auto-feedback-pill ${getFeedbackPillClass(sp.lastFeedback)}">${App.escapeHtml(sp.lastFeedback)}</div>`
                  : ''
              }
            </div>

            <button type="button" id="spell-next-btn" class="btn-primary">下一题 ${icons.arrowRight || ''}</button>
            <div class="kbd-tip">快捷键：回车下一题 · S 朗读</div>
          `
          }
        </div>
      `
      }
    `;
  }

  // ---------- Mock Exam Mode ----------
  function startMockExam() {
    const state = App.state;
    const scope = state.exam.scope;
    const unitFilter = (item) => scope === 'all' || String(item.unit) === String(scope);

    const unitWords = state.data.words.filter(unitFilter);
    const starWords = shuffleArray(unitWords.filter((w) => w.type === 'star'));
    const otherWords = shuffleArray(unitWords.filter((w) => w.type !== 'star'));

    const chosenStar = starWords.slice(0, 15);
    const chosenOther = otherWords.slice(0, 5);
    const chosenSet = new Set([...chosenStar, ...chosenOther].map((w) => w.id));

    if (chosenSet.size < 20) {
      const remaining = shuffleArray(unitWords.filter((w) => !chosenSet.has(w.id)));
      for (const w of remaining) {
        if (chosenSet.size >= 20) break;
        chosenSet.add(w.id);
      }
    }

    const finalWords = shuffleArray(unitWords.filter((w) => chosenSet.has(w.id)));
    const wordQuestions = finalWords.map((w) => ({
      word: w,
      options: buildWordOptions(w)
    }));

    const unitSentences = shuffleArray(state.data.sentences.filter(unitFilter)).slice(0, 2);

    state.exam.phase = 'taking';
    state.exam.wordQuestions = wordQuestions;
    state.exam.sentenceQuestions = unitSentences;
    state.exam.wordAnswers = {};
    state.exam.sentenceInputs = {};
    state.exam.sentenceGrades = {};
    callRender();
    window.scrollTo(0, 0);
  }

  function renderExamView() {
    const state = App.state;
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
                  `<button type="button" class="scope-btn ${ex.scope === s.v ? 'active' : ''}" data-exam-scope="${App.escapeHtml(s.v)}">${App.escapeHtml(s.label)}</button>`
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
                <span class="badge badge-plain">Unit ${App.escapeHtml(q.word.unit)}</span>
                ${App.renderTypeBadge(q.word.type)}
              </div>
              ${App.renderSpeakButton(q.word.en)}
            </div>
            <div class="quiz-prompt-row" style="margin:10px 0 12px;">
              <div>
                <div class="quiz-word" style="font-size:22px;">${App.escapeHtml(q.word.en)}</div>
                ${q.word.ipa ? `<div class="ipa-text" style="margin-top:3px;">${App.escapeHtml(q.word.ipa)}</div>` : ''}
                ${q.word.pos ? `<div class="quiz-pos">${App.escapeHtml(q.word.pos)}</div>` : ''}
              </div>
            </div>
            <div class="option-list">
              ${q.options
                .map(
                  (opt, oi) => `
                <button type="button" class="option-btn ${ex.wordAnswers[q.word.id] === oi ? 'selected' : ''}" data-exam-word="${App.escapeHtml(q.word.id)}" data-exam-opt="${oi}">
                  <span class="option-key">${letters[oi]}</span>
                  <span>${App.escapeHtml(opt.zh)}</span>
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
              <span class="badge badge-unit">Unit ${App.escapeHtml(s.unit)}</span>
            </div>
            <div style="font-size:16px;font-weight:700;line-height:1.5;">${App.escapeHtml(s.zh)}</div>
            <div class="hint-box">提示词：${App.escapeHtml(s.hint)}</div>
            <textarea class="sentence-textarea" data-exam-sentence="${App.escapeHtml(s.id)}" placeholder="请输入英文翻译，注意使用提示词...">${App.escapeHtml(ex.sentenceInputs[s.id] || '')}</textarea>
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
          const refAns = App.getSentenceAnswer(s);
          return `
          <div class="exam-q-card">
            <div class="fc-top" style="margin-bottom:8px;">
              <div class="fc-badges">
                <span class="badge badge-sentence">中译英 ${si + 1}</span>
                <span class="badge badge-unit">Unit ${App.escapeHtml(s.unit)}</span>
              </div>
              ${App.renderSpeakButton(refAns, '读', '朗读参考答案')}
            </div>
            <div style="font-size:15px;font-weight:700;margin-bottom:6px;">${App.escapeHtml(s.zh)}</div>
            <div class="hint-box">提示词：${App.escapeHtml(s.hint)}</div>

            <div style="margin-top:10px;font-size:13px;color:var(--text-muted);">你的作答：</div>
            <div style="padding:8px 10px;border-radius:8px;background:var(--bg);margin-top:4px;font-size:14px;">
              ${userAns ? App.escapeHtml(userAns) : '<em>（未作答）</em>'}
            </div>

            <div style="margin-top:10px;font-size:13px;color:var(--text-muted);">参考答案（已高亮提示词）：</div>
            <div style="padding:10px 12px;border-radius:10px;background:var(--success-soft);margin-top:4px;font-size:15px;line-height:1.55;">
              ${App.highlightHints(refAns, s.hint)}
            </div>

            ${
              Array.isArray(s.pitfalls) && s.pitfalls.length > 0
                ? `<div class="pitfalls-box">
                    <strong>易错点：</strong>
                    <ul>${s.pitfalls.map((p) => `<li>${App.escapeHtml(p)}</li>`).join('')}</ul>
                  </div>`
                : ''
            }

            <div class="self-grade-row">
              <button type="button" class="grade-btn ${g === 'right' ? 'active-right' : ''}" data-grade-s="${App.escapeHtml(s.id)}" data-grade-val="right">对 (1分)</button>
              <button type="button" class="grade-btn ${g === 'partial' ? 'active-partial' : ''}" data-grade-s="${App.escapeHtml(s.id)}" data-grade-val="partial">部分对 (0.5分)</button>
              <button type="button" class="grade-btn ${g === 'wrong' ? 'active-wrong' : ''}" data-grade-s="${App.escapeHtml(s.id)}" data-grade-val="wrong">错 (0分)</button>
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
                <span class="badge badge-unit">Unit ${App.escapeHtml(q.word.unit)}</span>
              </div>
              ${App.renderSpeakButton(q.word.en)}
            </div>
            <div style="font-size:18px;font-weight:700;margin-bottom:8px;">
              ${App.escapeHtml(q.word.en)} ${q.word.ipa ? `<span class="ipa-text" style="margin-left:6px;font-size:13px;">${App.escapeHtml(q.word.ipa)}</span>` : ''} <span style="font-size:13px;color:var(--text-muted);font-weight:500;">${App.escapeHtml(q.word.pos || '')}</span>
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
                      <span>${App.escapeHtml(opt.zh)}</span>
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

  // ---------- Attach Section 2 Exports to window.VocabApp ----------
  Object.assign(App, {
    buildWordOptions,
    // Flashcard
    clearFlashcardTimers,
    rebuildFlashcardDeck,
    shuffleFlashcardDeck,
    animateTrackTo,
    prevFlashcard,
    nextFlashcard,
    rateFlashcard,
    undoLastFlashcardRating,
    toggleFlashcardFlip,
    renderFlashcardDeckHtml,
    updateFlashcardDeckOnly,
    renderFlashcardView,
    attachFlashcardSwipe,
    // Practice Hub
    renderPracticeHubView,
    // Quiz
    rebuildQuizPool,
    prepareQuizQuestion,
    answerQuizOption,
    nextQuizQuestion,
    renderQuizView,
    // Spell / Dictation
    rebuildSpellPool,
    buildSpellDiffHtml,
    getSpellHintText,
    submitSpellAnswer,
    skipSpellQuestion,
    nextSpellQuestion,
    renderSpellView,
    // Mock Exam
    startMockExam,
    renderExamView
  });
})();
