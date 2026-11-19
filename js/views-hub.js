/* =========================================================
   Vocab App v4 — Hub Views (Sentence Practice, Browse, Progress & Sync Modal)
   Classic static script attaching Section 3 exports to window.VocabApp
   ========================================================= */
(function () {
  'use strict';

  const App = (window.VocabApp = window.VocabApp || {});

  function formatFileSize(bytes) {
    const n = Math.max(0, Number(bytes) || 0);
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  }

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

  // ---------- Browse & Search View (IME-safe + Paginated + 3-Band Item One) ----------
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
      renderMasteryBadge,
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
          const masteryBadge =
            typeof renderMasteryBadge === 'function' ? renderMasteryBadge(item.mastery) : '';
          return `
            <article class="browse-item">
              <div class="browse-head">
                <div class="fc-badges">
                  <span class="badge badge-unit">Unit ${escapeHtml(w.unit)}</span>
                  ${renderTypeBadge(w.type)}
                  ${masteryBadge}
                </div>
                ${renderSpeakButton(w.en)}
              </div>
              <div class="browse-body" style="margin-top:8px;">
                <div class="browse-word-line">
                  <span class="browse-en">${escapeHtml(w.en)}</span>
                  ${w.ipa ? `<span class="ipa-text browse-ipa">${escapeHtml(w.ipa)}</span>` : ''}
                  ${w.pos ? `<span class="browse-pos">${escapeHtml(w.pos)}</span>` : ''}
                </div>
                ${
                  visible
                    ? `<div class="browse-zh">${escapeHtml(w.zh)}</div>`
                    : `<div class="browse-zh masked" data-reveal-id="${escapeHtml(w.id)}">点击查看释义</div>`
                }
              </div>
              <div class="browse-footer">
                <span class="browse-meta-hint" style="font-size:12px;color:var(--text-muted);">${
                  item.mastery && item.mastery !== 'unlearned'
                    ? `当前：${escapeHtml(MASTERY_LABELS[item.mastery] || item.mastery)}`
                    : '点右侧快速标记'
                }</span>
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
            <div class="browse-body">
              <div class="browse-sentence-zh" style="margin-top:8px;font-size:15px;font-weight:700;line-height:1.5;">${escapeHtml(s.zh)}</div>
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
            </div>
          </article>
        `;
      })
      .join('');

    const loadMoreHtml =
      remaining > 0
        ? `<div class="browse-load-more-wrap"><button type="button" id="browse-load-more" class="btn-ghost load-more-btn">
            加载更多（剩余 ${remaining} 条）
          </button></div>`
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

  // ---------- Shared Preview Summary (Inline Preview Card + Sync Modal) ----------
  function renderImportPreviewBody(preview) {
    const c = (preview && preview.counts) || {};
    const m = (preview && preview.mergeDiff) || {};
    const o = (preview && preview.overwriteDiff) || {};

    const known = Math.max(0, Number(c.known) || 0);
    const fuzzy = Math.max(0, Number(c.fuzzy) || 0);
    const unknown = Math.max(0, Number(c.unknown) || 0);
    const sentenceEdits = Math.max(0, Number(c.sentenceEdits) || 0);
    const days = Math.max(0, Number(c.days) || 0);

    const currentKnown = Math.max(0, Number(m.currentKnown) || 0);
    const afterMergeKnown = Math.max(0, Number(m.afterMergeKnown) || 0);
    const addedKnown = Math.max(0, Number(m.addedKnown) || 0);
    const upgradedWords = Math.max(0, Number(m.upgradedWords) || 0);
    const addedEdits = Math.max(0, Number(m.addedEdits) || 0);
    const afterOverwriteKnown = Math.max(0, Number(o.afterOverwriteKnown) || 0);

    return `
      <div class="import-preview-stats">
        <span class="badge badge-known">认识 ${known}</span>
        <span class="badge badge-fuzzy">模糊 ${fuzzy}</span>
        <span class="badge badge-unknown">不认识 ${unknown}</span>
        <span class="badge badge-edited">自定义句译 ${sentenceEdits}</span>
        <span class="badge badge-plain">打卡 ${days} 天</span>
      </div>
      <div class="diff-highlight">
        <span>本机已认识 <strong>${currentKnown}</strong> → 合并后 <strong>${afterMergeKnown}</strong>${
          addedKnown > 0 ? ` <strong>(+${addedKnown})</strong>` : ' (+0)'
        }</span>
        <span style="width:100%;font-size:12px;font-weight:500;opacity:0.88;">
          ${
            upgradedWords > 0 || addedEdits > 0
              ? `合并将提升 ${upgradedWords} 个词条状态${addedEdits > 0 ? `、同步 ${addedEdits} 条句译` : ''}`
              : '合并模式仅保留更高掌握度，不会回退本机已有进度'
          } · 覆盖模式将为 ${afterOverwriteKnown} 词认识
        </span>
      </div>
    `;
  }

  // ---------- Progress & Seamless Sync Dashboard View ----------
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
    const progressSub = state.progressSubTab === 'manual' ? 'manual' : 'sync';
    const subIdx = progressSub === 'manual' ? 1 : 0;
    const fileMeta = state.importFileMeta;
    const preview = state.importPreview;

    const statusBannersHtml = `
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
    `;

    const syncPaneHtml = `
      <div class="sync-sub-panel">
        <p class="sync-lead">
          发到微信或电脑浏览器，点开即可弹窗一键合并进度，不用复制粘贴长串代码。
        </p>
        <button type="button" id="copy-sync-link-btn" class="btn-primary">
          ${ICONS.link || ICONS.copy} 复制同步链接
        </button>

        <div class="sync-secondary-row">
          <button type="button" id="copy-export-btn" class="btn-ghost">${ICONS.copy} 复制进度码</button>
          <button type="button" id="download-json-btn" class="btn-ghost">${ICONS.fileDown || ICONS.download} 下载 .json 备份</button>
        </div>

        ${statusBannersHtml}

        <details class="sync-code-details">
          <summary>展开原始进度码（VOCAB1）</summary>
          <textarea id="export-textarea" class="data-textarea" readonly aria-label="导出的进度文本">${escapeHtml(exportedText)}</textarea>
        </details>
      </div>
    `;

    const manualPaneHtml = `
      <div class="sync-sub-panel">
        <div id="import-dropzone" class="upload-dropzone" role="button" tabindex="0" aria-label="点击选择或拖拽备份文件">
          <div class="upload-dropzone-icon">${ICONS.uploadCloud || ICONS.upload}</div>
          <div class="upload-dropzone-title">点击选择或拖拽 <code>.json</code> / <code>.txt</code> 备份文件</div>
          <div class="upload-dropzone-sub">读取后先展示合并预览，确认后再写入本机</div>
        </div>
        <input type="file" id="import-file-input" accept=".json,.txt,application/json,text/plain" class="hidden" style="display:none;">

        ${
          fileMeta
            ? `
          <div class="file-pill-row">
            <div class="file-pill-info">
              ${ICONS.fileJson || ICONS.fileUp || ICONS.upload}
              <span class="file-pill-name">${escapeHtml(fileMeta.name || '备份文件')}</span>
              <span class="file-pill-size">${escapeHtml(formatFileSize(fileMeta.size))}</span>
            </div>
            <button type="button" id="clear-import-file-btn" class="file-pill-clear" aria-label="清除已选文件" title="清除已选文件">移除</button>
          </div>
        `
            : ''
        }

        <textarea id="import-textarea" class="data-textarea" placeholder="粘贴同步链接、VOCAB1 进度码或 JSON（微信转发带空格/换行也没关系）">${escapeHtml(state.importDraft || '')}</textarea>

        <div class="import-quick-row">
          <button type="button" id="paste-clipboard-btn" class="btn-ghost">${ICONS.clipboard || ICONS.copy} 从剪贴板读取并识别</button>
          <button type="button" id="parse-import-btn" class="btn-ghost">${ICONS.shieldCheck || ICONS.eye} 解析预览</button>
        </div>

        ${statusBannersHtml}

        ${
          preview
            ? `
          <div class="import-preview-card" role="region" aria-label="导入前预览">
            <div class="import-preview-head">
              <span class="import-preview-title">${ICONS.shieldCheck || ICONS.check} 已识别进度备份</span>
              <span style="font-size:12px;color:var(--text-muted);font-weight:500;">确认后生效</span>
            </div>
            ${renderImportPreviewBody(preview)}
            <div class="import-preview-actions">
              <button type="button" id="import-merge-btn" class="btn-primary">${ICONS.upload} 确认合并导入（推荐）</button>
              <div class="import-preview-secondary">
                <button type="button" id="import-overwrite-btn" class="btn-ghost">${ICONS.download} 确认覆盖导入</button>
                <button type="button" id="import-clear-preview-btn" class="btn-ghost">取消</button>
              </div>
            </div>
          </div>
        `
            : `
          <div class="import-btn-row">
            <button type="button" id="import-merge-btn" class="btn-primary">${ICONS.upload} 合并导入（推荐）</button>
            <button type="button" id="import-overwrite-btn" class="btn-ghost">${ICONS.download} 覆盖导入</button>
          </div>
        `
        }
      </div>
    `;

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
        <div class="seg-control" style="--seg-count:2;--seg-idx:${subIdx}" role="tablist" aria-label="同步与导入方式">
          <span class="seg-indicator" aria-hidden="true"></span>
          <button type="button" class="seg-btn ${progressSub === 'sync' ? 'active' : ''}" data-progress-sub="sync" role="tab" aria-selected="${progressSub === 'sync'}">${ICONS.link || ''} 一键链接同步</button>
          <button type="button" class="seg-btn ${progressSub === 'manual' ? 'active' : ''}" data-progress-sub="manual" role="tab" aria-selected="${progressSub === 'manual'}">${ICONS.uploadCloud || ICONS.upload} 文件与文本导入</button>
        </div>

        ${progressSub === 'sync' ? syncPaneHtml : manualPaneHtml}

        <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;">
          <button type="button" id="reset-progress-btn" class="btn-ghost" style="color:var(--danger);">${ICONS.trash} 清空本地进度</button>
        </div>
      </div>
    `;
  }

  // ---------- Incoming Sync Link Confirmation Modal ----------
  function renderSyncModal() {
    const { state, ICONS } = App;
    const root = typeof document !== 'undefined' ? document.getElementById('sync-modal-root') : null;
    const preview = state.pendingSyncModal;

    if (!preview) {
      if (root) root.innerHTML = '';
      return '';
    }

    const html = `
      <div class="sync-modal-backdrop" id="sync-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="sync-modal-title">
        <div class="sync-modal">
          <div class="sync-modal-head">
            <span class="sync-modal-icon" aria-hidden="true">${ICONS.shieldCheck || ICONS.link || ''}</span>
            <div style="flex:1;min-width:0;">
              <h3 id="sync-modal-title" class="sync-modal-title">收到跨设备同步进度</h3>
              <p class="sync-modal-sub">点下方按钮即可将链接里的进度同步到本设备</p>
            </div>
            <button type="button" id="sync-modal-x-btn" class="icon-btn" aria-label="关闭同步弹窗" title="关闭">${ICONS.x}</button>
          </div>

          ${renderImportPreviewBody(preview)}

          <div class="sync-modal-actions">
            <button type="button" id="sync-modal-merge-btn" class="btn-primary">${ICONS.upload} 合并同步（推荐）</button>
            <div class="sync-modal-sub-actions">
              <button type="button" id="sync-modal-overwrite-btn" class="btn-ghost">${ICONS.download} 覆盖同步</button>
              <button type="button" id="sync-modal-close-btn" class="btn-ghost">暂不导入</button>
            </div>
          </div>
        </div>
      </div>
    `;

    if (root) root.innerHTML = html;
    return html;
  }

  Object.assign(App, {
    rebuildSentencePool,
    renderSentenceView,
    getBrowseFilteredItems,
    renderBrowseResultsHtml,
    updateBrowseResultsOnly,
    renderBrowseView,
    renderProgressView,
    renderSyncModal
  });
})();
