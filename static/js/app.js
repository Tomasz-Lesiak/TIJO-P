// ──────────────────────────────────────────────
//  QA-MasterMind AI — front-end controller
// ──────────────────────────────────────────────

// ── Marked.js config ──────────────────────────
marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true,
});

// ── DOM refs ──────────────────────────────────
const codeInput      = document.getElementById('codeInput');
const charCount      = document.getElementById('charCount');
const clearBtn       = document.getElementById('clearBtn');
const themeToggle    = document.getElementById('themeToggle');
const emptyState     = document.getElementById('emptyState');
const rightPanel     = document.getElementById('rightPanel');
const resultSection  = document.getElementById('resultSection');
const loadingSpinner = document.getElementById('loadingSpinner');
const loadingSubtext = document.getElementById('loadingSubtext');
const errorBox       = document.getElementById('errorBox');
const errorText      = document.getElementById('errorText');

// Code-review result elements
const reviewResult    = document.getElementById('reviewResult');
const scoreValue      = document.getElementById('scoreValue');
const scoreBar        = document.getElementById('scoreBar');
const scoreLabel      = document.getElementById('scoreLabel');
const reviewSummary   = document.getElementById('reviewSummary');
const issuesCount     = document.getElementById('issuesCount');
const noIssues        = document.getElementById('noIssues');
const issuesList      = document.getElementById('issuesList');
const positivesSection = document.getElementById('positivesSection');
const positivesList   = document.getElementById('positivesList');

// Unit-tests result container
const resultContent  = document.getElementById('resultContent');

const toastContainer = document.getElementById('toastContainer');
const btnAuditQuality = document.getElementById('btnAuditQuality');
const btnUnitTests    = document.getElementById('btnUnitTests');

const ALL_BUTTONS = [btnAuditQuality, btnUnitTests];

// ── Utility ───────────────────────────────────
function stripCodeFences(str) {
  return String(str).replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim();
}

// ── Theme management ──────────────────────────
function applyTheme(dark) {
  document.documentElement.classList.toggle('dark', dark);
  const hljsTheme = document.getElementById('hljs-theme');
  hljsTheme.href = dark
    ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
    : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
}

const savedTheme = localStorage.getItem('qa-theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(savedTheme ? savedTheme === 'dark' : prefersDark);

themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('qa-theme', isDark ? 'dark' : 'light');
  applyTheme(isDark);
});

// ── Character counter ─────────────────────────
codeInput.addEventListener('input', () => {
  const len = codeInput.value.length;
  charCount.textContent = len.toLocaleString() + ' znaków';
  charCount.classList.toggle('text-orange-500', len > 8000);
  charCount.classList.toggle('text-red-500', len > 12000);
});

// ── Clear button ──────────────────────────────
clearBtn.addEventListener('click', () => {
  codeInput.value = '';
  charCount.textContent = '0 znaków';
  charCount.classList.remove('text-orange-500', 'text-red-500');
  hideAll();
  codeInput.focus();
});

// ── Toast notifications ───────────────────────
function showToast(message, type = 'success') {
  const colours = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-indigo-600' };
  const icons = {
    success: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>',
    error:   '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>',
    info:    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>',
  };
  const toast = document.createElement('div');
  toast.className = `pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${colours[type] || colours.info} animate-slide-in`;
  toast.innerHTML = `
    <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      ${icons[type] || icons.info}
    </svg>
    <span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ── UI state helpers ──────────────────────────
function hideAll() {
  resultSection.classList.add('hidden');
  loadingSpinner.classList.add('hidden');
  errorBox.classList.add('hidden');
  reviewResult.classList.add('hidden');
  resultContent.classList.add('hidden');
  emptyState.classList.remove('hidden');
}

function showLoading(subtext) {
  emptyState.classList.add('hidden');
  resultSection.classList.remove('hidden');
  loadingSpinner.classList.remove('hidden');
  errorBox.classList.add('hidden');
  reviewResult.classList.add('hidden');
  resultContent.classList.add('hidden');
  loadingSubtext.textContent = subtext;
}

function showError(message) {
  emptyState.classList.add('hidden');
  resultSection.classList.remove('hidden');
  loadingSpinner.classList.add('hidden');
  reviewResult.classList.add('hidden');
  resultContent.classList.add('hidden');
  errorBox.classList.remove('hidden');
  errorText.textContent = message;
}

// ── Score bar updater ─────────────────────────
function updateScoreCircle(score) {
  let barColor, labelText, labelClass;
  if (score >= 75) {
    barColor = 'bg-emerald-500'; labelText = 'Dobry kod'; labelClass = 'text-emerald-400';
  } else if (score >= 40) {
    barColor = 'bg-amber-500'; labelText = 'Wymaga poprawy'; labelClass = 'text-amber-400';
  } else {
    barColor = 'bg-red-500'; labelText = 'Krytyczne problemy'; labelClass = 'text-red-400';
  }

  scoreValue.textContent = score;
  scoreLabel.textContent = labelText;
  scoreLabel.className = `text-2xl font-bold leading-tight ${labelClass}`;

  scoreBar.className = `h-full rounded-full transition-all duration-700 ease-out ${barColor}`;
  scoreBar.style.width = '0%';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { scoreBar.style.width = `${score}%`; });
  });
}

// ── Issue card builder ────────────────────────
const SEVERITY_CONFIG = {
  CRITICAL: {
    card:    'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60',
    badge:   'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800',
    label:   'BŁĄD KRYTYCZNY',
  },
  WARNING: {
    card:    'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
    badge:   'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800',
    label:   'OSTRZEŻENIE',
  },
  INFO: {
    card:    'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60',
    badge:   'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800',
    label:   'UWAGA',
  },
};

function buildIssueCard(issue) {
  const cfg = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.INFO;

  const card = document.createElement('div');
  card.className = `rounded-xl border p-4 ${cfg.card}`;

  // Title row
  const titleRow = document.createElement('div');
  titleRow.className = 'flex items-start gap-2.5 mb-2.5 flex-wrap';

  const badge = document.createElement('span');
  badge.className = `text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.badge}`;
  badge.textContent = cfg.label;

  const title = document.createElement('h4');
  title.className = 'font-semibold text-slate-800 dark:text-slate-200 text-sm pt-0.5';
  title.textContent = issue.title || '';

  titleRow.appendChild(badge);
  titleRow.appendChild(title);

  // Description
  const desc = document.createElement('div');
  desc.className = 'prose prose-sm dark:prose-invert max-w-none mb-3 text-slate-600 dark:text-slate-400';
  desc.innerHTML = marked.parse(issue.description || '');

  // Suggestion box
  const suggestionBox = document.createElement('div');
  suggestionBox.className = 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-lg p-3 mt-2';
  suggestionBox.innerHTML = `
    <div class="text-xs font-semibold tracking-wider
                text-emerald-700 dark:text-emerald-400 mb-2">
      PROPOZYCJA POPRAWKI
    </div>
    <div class="prose prose-sm dark:prose-invert max-w-none
                text-emerald-900 dark:text-emerald-300
                prose-code:text-emerald-800 dark:prose-code:text-emerald-300
                prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800">
      ${marked.parse(issue.suggestion || '')}
    </div>`;

  card.appendChild(titleRow);
  card.appendChild(desc);
  card.appendChild(suggestionBox);

  return card;
}

// ── Code Review renderer ──────────────────────
function renderCodeReview(data) {
  loadingSpinner.classList.add('hidden');
  errorBox.classList.add('hidden');
  resultContent.classList.add('hidden');
  reviewResult.classList.remove('hidden');

  // Score circle
  const score = typeof data.score === 'number' ? Math.min(100, Math.max(0, data.score)) : 0;
  updateScoreCircle(score);

  // Summary
  reviewSummary.textContent = data.summary || '';

  // Issues
  const issues = Array.isArray(data.issues) ? data.issues : [];
  issuesList.innerHTML = '';
  issuesCount.textContent = issues.length;

  if (issues.length === 0) {
    noIssues.classList.remove('hidden');
  } else {
    noIssues.classList.add('hidden');
    issues.forEach(issue => issuesList.appendChild(buildIssueCard(issue)));
    // Syntax-highlight any code blocks rendered inside issue cards
    issuesList.querySelectorAll('pre code').forEach(block => {
      if (!block.dataset.highlighted) hljs.highlightElement(block);
    });
  }

  // Positives
  const positives = Array.isArray(data.positives) ? data.positives : [];
  positivesList.innerHTML = '';

  if (positives.length === 0) {
    positivesSection.classList.add('hidden');
  } else {
    positivesSection.classList.remove('hidden');
    positives.forEach(p => {
      const li = document.createElement('li');
      li.className = 'flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300';
      li.innerHTML = `
        <span class="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0
                     bg-emerald-500 dark:bg-emerald-500"></span>
        <span>${marked.parseInline(p)}</span>`;
      positivesList.appendChild(li);
    });
  }

  rightPanel.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Unit Tests renderer ───────────────────────
function renderUnitTests(data) {
  loadingSpinner.classList.add('hidden');
  errorBox.classList.add('hidden');
  reviewResult.classList.add('hidden');
  resultContent.innerHTML = '';
  resultContent.classList.remove('hidden');

  const code      = stripCodeFences(data.code || '');
  const strategy  = data.strategy || '';
  const mocks     = Array.isArray(data.mocks) ? data.mocks : [];
  const testCases = Array.isArray(data.test_cases) ? data.test_cases : [];

  // ── 1. Code block ─────────────────────────
  const codeCard = document.createElement('div');
  codeCard.className = 'rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm';

  const codeHeader = document.createElement('div');
  codeHeader.className = 'flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800';

  const codeLabel = document.createElement('div');
  codeLabel.className = 'flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400';
  codeLabel.innerHTML = `
    <svg class="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
    </svg>
    Kod testów`;

  const copyCodeBtn = document.createElement('button');
  copyCodeBtn.className = 'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors';
  copyCodeBtn.innerHTML = `
    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
    </svg>
    Kopiuj kod`;
  copyCodeBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code);
      showToast('Kod skopiowany do schowka!', 'success');
      copyCodeBtn.innerHTML = `
        <svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        Skopiowano!`;
      setTimeout(() => {
        copyCodeBtn.innerHTML = `
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          Kopiuj kod`;
      }, 2000);
    } catch {
      showToast('Kopiowanie nie powiodło się.', 'error');
    }
  });

  codeHeader.appendChild(codeLabel);
  codeHeader.appendChild(copyCodeBtn);

  const pre = document.createElement('pre');
  pre.className = 'm-0 overflow-x-auto';
  pre.style.borderRadius = '0';
  const codeEl = document.createElement('code');
  codeEl.textContent = code;
  pre.appendChild(codeEl);
  hljs.highlightElement(codeEl);
  codeEl.style.borderRadius = '0';

  codeCard.appendChild(codeHeader);
  codeCard.appendChild(pre);

  // ── 2. Strategy ───────────────────────────
  const strategyCard = document.createElement('div');
  strategyCard.className = 'rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4';

  const strategyLabel = document.createElement('div');
  strategyLabel.className = 'text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2';
  strategyLabel.textContent = 'Strategia testowania';

  const strategyText = document.createElement('p');
  strategyText.className = 'text-sm text-slate-600 dark:text-slate-300 leading-relaxed';
  strategyText.textContent = strategy;

  strategyCard.appendChild(strategyLabel);
  strategyCard.appendChild(strategyText);

  // ── 3. Mocks table ────────────────────────
  let mocksCard = null;
  if (mocks.length > 0) {
    mocksCard = document.createElement('div');
    mocksCard.className = 'rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden';

    const mocksHeader = document.createElement('div');
    mocksHeader.className = 'px-5 py-3 border-b border-slate-100 dark:border-slate-800';
    const mocksLabel = document.createElement('div');
    mocksLabel.className = 'text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400';
    mocksLabel.textContent = 'Mockowane zależności';
    mocksHeader.appendChild(mocksLabel);

    const table = document.createElement('table');
    table.className = 'w-full text-sm';

    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr class="border-b border-slate-100 dark:border-slate-800">
        <th class="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wider
                   text-slate-400 dark:text-slate-500 w-2/5">Komponent</th>
        <th class="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wider
                   text-slate-400 dark:text-slate-500">Cel mockowania</th>
      </tr>`;

    const tbody = document.createElement('tbody');
    mocks.forEach((m, i) => {
      const tr = document.createElement('tr');
      if (i < mocks.length - 1) tr.className = 'border-b border-slate-100 dark:border-slate-800';

      const tdComp = document.createElement('td');
      tdComp.className = 'px-5 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 align-top';
      tdComp.textContent = m.component || '';

      const tdPurpose = document.createElement('td');
      tdPurpose.className = 'px-5 py-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed';
      tdPurpose.textContent = m.purpose || '';

      tr.appendChild(tdComp);
      tr.appendChild(tdPurpose);
      tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    mocksCard.appendChild(mocksHeader);
    mocksCard.appendChild(table);
  }

  // ── 4. Test cases ─────────────────────────
  let testCasesSection = null;
  if (testCases.length > 0) {
    testCasesSection = document.createElement('div');

    const tcLabel = document.createElement('div');
    tcLabel.className = 'text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3';
    tcLabel.textContent = 'Scenariusze testowe';

    const tcList = document.createElement('div');
    tcList.className = 'space-y-2';

    testCases.forEach(tc => {
      const card = document.createElement('div');
      card.className = 'bg-slate-50 dark:bg-slate-800/30 rounded-lg p-3 border border-slate-200 dark:border-slate-800';

      const nameEl = document.createElement('div');
      nameEl.className = 'font-mono text-sm text-indigo-600 dark:text-indigo-400 mb-1';
      nameEl.textContent = (tc.name || '') + '()';

      const descEl = document.createElement('div');
      descEl.className = 'text-sm text-slate-600 dark:text-slate-400 leading-relaxed';
      descEl.textContent = tc.description || '';

      card.appendChild(nameEl);
      card.appendChild(descEl);
      tcList.appendChild(card);
    });

    testCasesSection.appendChild(tcLabel);
    testCasesSection.appendChild(tcList);
  }

  // ── Assemble ──────────────────────────────
  resultContent.appendChild(codeCard);
  resultContent.appendChild(strategyCard);
  if (mocksCard) resultContent.appendChild(mocksCard);
  if (testCasesSection) resultContent.appendChild(testCasesSection);

  rightPanel.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Button state helpers ──────────────────────
function setButtonsDisabled(disabled) {
  ALL_BUTTONS.forEach(btn => {
    btn.disabled = disabled;
    btn.classList.toggle('opacity-60', disabled);
    btn.classList.toggle('cursor-not-allowed', disabled);
    const spinner = btn.querySelector('.btn-spinner');
    if (spinner) spinner.classList.add('hidden');
  });
}

function setActiveButton(btn, subtextMsg) {
  setButtonsDisabled(true);
  const spinner = btn.querySelector('.btn-spinner');
  if (spinner) spinner.classList.remove('hidden');
  showLoading(subtextMsg);
}

function resetButtons(activeBtn) {
  setButtonsDisabled(false);
  const spinner = activeBtn.querySelector('.btn-spinner');
  if (spinner) spinner.classList.add('hidden');
}

// ── Core API caller ───────────────────────────
async function callApi(endpoint, btn, loadingMsg, renderer) {
  const input = codeInput.value.trim();
  if (!input) {
    showToast('Najpierw wklej kod lub wymagania.', 'error');
    codeInput.focus();
    return;
  }

  setActiveButton(btn, loadingMsg);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || `Błąd serwera ${res.status}`);
    }

    renderer(data);
    showToast('Analiza zakończona!', 'success');

  } catch (err) {
    showError(err.message || 'Nieoczekiwany błąd. Spróbuj ponownie.');
    showToast('Żądanie nie powiodło się.', 'error');
  } finally {
    resetButtons(btn);
  }
}

// ── Button click handlers ─────────────────────
btnAuditQuality.addEventListener('click', () =>
  callApi(
    '/api/audit-quality',
    btnAuditQuality,
    'Przeprowadzam pełny Code Review — wykrywam błędy, antywzorce i przygotowuję poprawki…',
    renderCodeReview
  )
);

btnUnitTests.addEventListener('click', () =>
  callApi(
    '/api/unit-tests',
    btnUnitTests,
    'Generuję profesjonalne testy jednostkowe…',
    renderUnitTests
  )
);

// ── Keyboard shortcut: Ctrl/Cmd+Enter ────────
let lastBtn = btnAuditQuality;
ALL_BUTTONS.forEach(btn => btn.addEventListener('click', () => { lastBtn = btn; }));

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    if (!lastBtn.disabled) lastBtn.click();
  }
});
