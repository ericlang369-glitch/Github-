/* =========================================================
   Vocab App v3 — Hub Views (Sentence Practice, Browse, Progress)
   Classic static script attaching Section 3 exports to window.VocabApp
   ========================================================= */
(function () {
  'use strict';

  const App = (window.VocabApp = window.VocabApp || {});

  // ---------- Sentence Translation Practice View ----------
  function rebuildSentencePool(keepCurrentId = false) {
    const { state, getSentenceMastery } = App;
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
    const {
      state,
      ICONS,
      escapeHtml,
      renderUnitChips,
      renderSpeakButton,
      highlightHints,
      getSentenceAnswer,
      isSentenceEdited,
      getSentenceMastery
    } = App;

    const sp = state.sentencePractice;
    const total = sp.order.length;
    const currentId = total > 0 ? sp.order[sp.index] : null;
    const s = currentId ? state.data.sentences.find((x) => x.id === currentId) : null;
    const effectiveAnswer = s ? getSentenceAnswer(s) : '';
    const edited = s ? isSentenceEdited(s) : false;
    const mastery = s ? getSentenceMastery(s.id) : 'unlearned';
    const userDraft = s ? sp.drafts[s.id] || '' : '';
    const isEditing = Boolean(s && sp.editingId === s.id);

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
                <button type="button" class="btn-inline-edit" data-sp-edit="${escapeHtml(s.id)}">${isEditing ? '收起编辑' : `${ICONS.edit || ''} 编辑标准答案`}</button>
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

              <div class="self-grade-row" style="margin-top:12px;grid-template-columns:repeat(2,1fr);">
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

  // ---------- Browse & Search View (IME-safe + Paginated) ----------
  function getBrowseFilteredItems() {
    const { state, getWordMastery, getSentenceAnswer } = App;
    const b = state.browse;
    const kw = (b.search || '').trim().toLowerCase();

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
    const {
      state,
      MASTERY_LABELS,
      escapeHtml,
      renderTypeBadge,
      renderSpeakButton,
      highlightHints,
      getSentenceAnswer,
      isSentenceEdited
    } = App;

    const b = state.browse;
    if (items.length === 0) {
      return `<div class="empty-box">没有找到匹配的词条或句子。</div>`;
    }

    const limit = Math.max(1, Number(b.limit) || 80);
    const visibleItems = items.slice(0, limit);
    const remaining = items.length - visibleItems.length;

    const listHtml = visibleItems
      .map((item) => {
        if (item.kind === 'word') {
          const w = item.data;
          const visible = b.showAnswers || (b.revealedIds && b.revealedIds.has(w.id));
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
                  <span class="badge badge-unit">Unit ${escapeHtml(w.unit)}</span>
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
        const visible = b.showAnswers || (b.revealedIds && b.revealedIds.has(s.id));
        const ansText = getSentenceAnswer(s);
        const edited = isSentenceEdited(s);
        const isEditing = b.editingSentenceId === s.id;
        return `
          <article class="browse-item">
            <div class="browse-head">
              <div class="fc-badges">
                <span class="badge badge-unit">Unit ${escapeHtml(s.unit)}</span>
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
      .join('');

    const loadMoreHtml =
      remaining > 0
        ? `<button type="button" id="browse-load-more" class="btn-ghost load-more-btn">
            加载更多（剩余 ${remaining} 条）
          </button>`
        : '';

    return `<div class="browse-list">${listHtml}</div>${loadMoreHtml}`;
  }

  function updateBrowseResultsOnly() {
    const items = getBrowseFilteredItems();
    const resultsEl = document.getElementById('browse-results');
    if (resultsEl) resultsEl.innerHTML = renderBrowseResultsHtml(items);
    const countEl = document.getElementById('browse-count');
    if (countEl) countEl.textContent = `共 ${items.length} 条`;
    const clearEl = document.getElementById('browse-clear-search');
    if (clearEl) clearEl.classList.toggle('hidden', !App.state.browse.search);
  }

  function renderBrowseView() {
    const { state, ICONS, escapeHtml, renderUnitChips } = App;
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

  // ---------- Progress & Backup Dashboard View ----------
  function renderProgressView() {
    const {
      state,
      STORAGE_KEY,
      ICONS,
      escapeHtml,
      getWordMastery,
      isSentenceEdited,
      getSentenceMastery,
      getTodayCount,
      getStreakDays,
      encodeProgressString
    } = App;

    const counts = { known: 0, fuzzy: 0, unknown: 0, unlearned: 0 };
    for (const w of state.data.words) {
      counts[getWordMastery(w.id)] += 1;
    }
    const totalWords = state.data.words.length;
    const masteryPct = totalWords > 0 ? Math.round((counts.known / totalWords) * 100) : 0;

    const todayCount = typeof getTodayCount === 'function' ? getTodayCount() : 0;
    const streakDays = typeof getStreakDays === 'function' ? getStreakDays() : 0;

    // SVG donut ring geometry (.progress-ring already rotates -90deg in styles.css)
    const radius = 46;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - masteryPct / 100);
    const ringColor = masteryPct === 100 ? 'var(--success)' : 'var(--primary)';

    // Per-unit breakdown (dynamically from state.units, fallback to word units)
    const unitList =
      Array.isArray(state.units) && state.units.length > 0
        ? state.units
        : Array.from(new Set(state.data.words.map((w) => w.unit)))
            .sort((a, b) => Number(a) - Number(b))
            .map((id) => ({ id, title: `Unit ${id}`, subtitle: '' }));

    const unitRowsHtml = unitList
      .map((u) => {
        const unitWords = state.data.words.filter((w) => String(w.unit) === String(u.id));
        const unitTotal = unitWords.length;
        let unitKnown = 0;
        for (const w of unitWords) {
          if (getWordMastery(w.id) === 'known') unitKnown += 1;
        }
        const unitPct = unitTotal > 0 ? Math.round((unitKnown / unitTotal) * 100) : 0;
        const unitTitle = u.title || `Unit ${u.id}`;
        return `
          <div class="unit-bar-row">
            <div class="unit-bar-head">
              <span class="unit-bar-title">
                ${escapeHtml(unitTitle)}${u.subtitle ? ` <span style="font-weight:400;font-size:12px;color:var(--text-muted);">${escapeHtml(u.subtitle)}</span>` : ''}
              </span>
              <span class="unit-bar-meta">${unitKnown} / ${unitTotal} · ${unitPct}%</span>
            </div>
            <div class="unit-bar-track">
              <div class="unit-bar-fill" style="width:${unitPct}%;"></div>
            </div>
          </div>
        `;
      })
      .join('');

    const totalSentences = state.data.sentences.length;
    let editedSentences = 0;
    let knownSentences = 0;
    for (const s of state.data.sentences) {
      if (isSentenceEdited(s)) editedSentences += 1;
      if (getSentenceMastery(s.id) === 'known') knownSentences += 1;
    }

    const exportedText = encodeProgressString();

    return `
      <div class="card-box">
        <h2>学习总览</h2>
        <div class="dashboard-hero">
          <div class="progress-ring-wrap">
            <svg class="progress-ring" width="112" height="112" viewBox="0 0 112 112" role="img" aria-label="总掌握率 ${masteryPct}%">
              <circle class="progress-ring-bg" cx="56" cy="56" r="${radius}"></circle>
              <circle
                class="progress-ring-fill"
                cx="56"
                cy="56"
                r="${radius}"
                style="stroke:${ringColor};"
                stroke-dasharray="${circumference.toFixed(2)}"
                stroke-dashoffset="${dashOffset.toFixed(2)}"
              ></circle>
            </svg>
            <div class="progress-ring-label">
              <span class="progress-ring-pct">${masteryPct}%</span>
              <span class="progress-ring-sub">总掌握率</span>
            </div>
          </div>

          <div class="hero-metrics">
            <div class="hero-metric-card">
              <div class="hero-metric-lbl">今日复习</div>
              <div class="hero-metric-val" style="color:var(--primary);">${todayCount} <span style="font-size:12px;font-weight:500;">词</span></div>
            </div>
            <div class="hero-metric-card">
              <div class="hero-metric-lbl">${ICONS.flame || ''} 连续学习</div>
              <div class="hero-metric-val" style="color:var(--warning);">${streakDays} <span style="font-size:12px;font-weight:500;">天</span></div>
            </div>
          </div>
        </div>

        <div style="font-size:12px;color:var(--text-muted);margin-top:10px;">
          已掌握 <strong>${counts.known}</strong> / ${totalWords} 词 · 本地存储 <code>${escapeHtml(STORAGE_KEY)}</code>
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
        <h2>各单元掌握进度</h2>
        <div class="unit-progress-list">
          ${unitRowsHtml || `<div style="font-size:13px;color:var(--text-muted);">暂无单元数据</div>`}
        </div>
        <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border);display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;font-size:12px;color:var(--text-muted);">
          <span>已自定义句子答案 <strong>${editedSentences} / ${totalSentences}</strong> 句</span>
          <span>中译英已掌握 <strong>${knownSentences} / ${totalSentences}</strong> 句</span>
        </div>
      </div>

      <div class="card-box">
        <h2>进度备份与迁移</h2>
        <div style="font-size:13px;color:var(--text-muted);line-height:1.5;">
          复制下方文本发给自己（支持微信转发），或下载 <code>.json</code> 备份文件到另一台设备导入。
        </div>
        <textarea id="export-textarea" class="data-textarea" readonly aria-label="导出的进度文本">${escapeHtml(exportedText)}</textarea>
        <div class="btn-row">
          <button type="button" id="copy-export-btn" class="btn-primary">${ICONS.copy} 一键复制进度</button>
          <button type="button" id="download-json-btn" class="btn-ghost">${ICONS.fileDown || ICONS.download} 下载 .json 备份</button>
        </div>

        <div style="margin-top:18px;padding-top:16px;border-top:1px solid var(--border);">
          <h2 style="margin-bottom:6px;">导入进度</h2>
          <div style="font-size:13px;color:var(--text-muted);line-height:1.5;">
            支持粘贴 <code>VOCAB1:</code> 编码（即使微信转发带空格、换行或附带文字也能识别），或直接选择 <code>.json</code> 文件导入。
          </div>
          <textarea id="import-textarea" class="data-textarea" placeholder="在此粘贴导出的进度文本（含微信转发内容、空格/换行均可自动识别）..."></textarea>
          <input type="file" id="import-file-input" accept=".json,.txt,application/json,text/plain" class="hidden" style="display:none;">

          ${
            state.importError
              ? `<div class="import-banner error" role="alert">${escapeHtml(state.importError)}</div>`
              : ''
          }
          ${
            state.importSuccess
              ? `<div class="import-banner success" role="status">${escapeHtml(state.importSuccess)}</div>`
              : ''
          }

          <div class="import-btn-row">
            <button type="button" id="import-merge-btn" class="btn-primary">${ICONS.upload} 合并导入（推荐）</button>
            <button type="button" id="import-overwrite-btn" class="btn-ghost">${ICONS.download} 覆盖导入</button>
            <button type="button" id="import-file-btn" class="btn-ghost">${ICONS.fileUp || ICONS.upload} 从文件导入</button>
          </div>

          <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;">
            <button type="button" id="reset-progress-btn" class="btn-ghost" style="color:var(--danger);">${ICONS.trash} 清空本地进度</button>
          </div>
        </div>
      </div>
    `;
  }

  Object.assign(App, {
    rebuildSentencePool,
    renderSentenceView,
    getBrowseFilteredItems,
    renderBrowseResultsHtml,
    updateBrowseResultsOnly,
    renderBrowseView,
    renderProgressView
  });
})();
