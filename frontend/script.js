/* ================================================================
   CyberGuard AI — script.js  (Bento Grid redesign)
   API wired to your Flask backend (api.py / app.py).
   Note: /api/chat expects { "message": "..." } per api.py line 78
         but api.py reads data.get("prompt") — we send both for compat.
   ================================================================ */

'use strict';

/* ----------------------------------------------------------------
   1. CONFIG & STATE
   ---------------------------------------------------------------- */
const API_BASE = 'http://localhost:5000';

const state = {
  isOnline:        false,
  sessionId:       generateSessionId(),
  queryCount:      0,
  totalResponseMs: 0,
  isLoading:       false,
  startTime:       Date.now(),
  messages:        [],
};

/* ----------------------------------------------------------------
   2. DOM REFERENCES
   ---------------------------------------------------------------- */
const $ = (id) => document.getElementById(id);

const dom = {
  /* Header */
  statusBadge:    $('statusBadge'),
  statusLabel:    $('statusLabel'),
  sessionId:      $('sessionId'),
  historyBtn:     $('historyBtn'),
  clearBtn:       $('clearBtn'),

  /* Bento — threat ring */
  ringFill:       $('ringFill'),
  threatPct:      $('threatPct'),
  threatLevelText:$('threatLevelText'),

  /* Bento — stats */
  statQueries:    $('statQueries'),
  statAvgTime:    $('statAvgTime'),
  statUptime:     $('statUptime'),

  /* Chat */
  responseFeed:   $('responseFeed'),
  welcomeCard:    $('welcomeCard'),
  loadingBar:     $('loadingBar'),
  loadingPrimary: $('loadingPrimary'),
  loadingSecondary:$('loadingSecondary'),
  promptInput:    $('promptInput'),
  charCount:      $('charCount'),
  analyzeBtn:     $('analyzeBtn'),
  composerBox:    $('composerBox'),

  /* Toast */
  toastContainer: $('toastContainer'),
};

/* ----------------------------------------------------------------
   3. API LAYER
   ---------------------------------------------------------------- */

class ApiError extends Error {
  constructor(message, status, raw) {
    super(message);
    this.name   = 'ApiError';
    this.status = status;
    this.raw    = raw;
  }
}

/**
 * Generic fetch wrapper with timeout and error handling.
 */
async function apiFetch(endpoint, options = {}, timeoutMs = 30_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': state.sessionId,
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timer);

    let body = null;
    try { body = await res.json(); } catch { /* non-JSON body */ }

    if (!res.ok) {
      const msg = body?.error || body?.message || `HTTP ${res.status}`;
      throw new ApiError(msg, res.status, body);
    }

    return body;

  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new ApiError('Request timed out.', 0);
    if (err instanceof ApiError) throw err;
    throw new ApiError('Unable to reach the backend.', 0, err);
  }
}

/* --- Endpoint functions --- */

/**
 * POST /api/chat
 * api.py reads data.get("prompt") — we send both "prompt" and "message".
 */
async function apiChat(prompt) {
  return apiFetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      prompt:     prompt,
      message:    prompt,
      session_id: state.sessionId,
    }),
  });
}

/** GET /api/health */
async function apiHealth() {
  return apiFetch('/api/health', { method: 'GET' }, 5_000);
}

/** GET /api/history */
async function apiHistory() {
  return apiFetch(`/api/history?session_id=${state.sessionId}`, { method: 'GET' });
}

/** POST /api/feedback */
async function apiFeedback(messageId, positive) {
  return apiFetch('/api/feedback', {
    method: 'POST',
    body: JSON.stringify({
      session_id: state.sessionId,
      message_id: messageId,
      rating:     positive ? 'positive' : 'negative',
    }),
  });
}

/* ----------------------------------------------------------------
   4. SESSION & HEALTH POLLING
   ---------------------------------------------------------------- */

function generateSessionId() {
  return Math.random().toString(36).slice(2, 9).toUpperCase();
}

function renderSession() {
  dom.sessionId.textContent = state.sessionId;
}

async function startHealthPolling() {
  async function check() {
    try {
      await apiHealth();
      setStatus(true);
    } catch {
      setStatus(false);
    }
  }
  await check();
  setInterval(check, 30_000);
}

function setStatus(online) {
  state.isOnline = online;
  dom.statusBadge.classList.toggle('is-online',  online);
  dom.statusBadge.classList.toggle('is-offline', !online);
  dom.statusLabel.textContent = online ? 'Backend Online' : 'Offline';
}

function tickUptime() {
  const e = Math.floor((Date.now() - state.startTime) / 1000);
  const h = String(Math.floor(e / 3600)).padStart(2, '0');
  const m = String(Math.floor((e % 3600) / 60)).padStart(2, '0');
  const s = String(e % 60).padStart(2, '0');
  dom.statUptime.textContent = `${h}:${m}:${s}`;
}

/* ----------------------------------------------------------------
   5. CHAT / QUERY LOGIC
   ---------------------------------------------------------------- */

async function handleSubmit() {
  const prompt = dom.promptInput.value.trim();

  if (!prompt) {
    showToast('Enter a security query before analyzing.', 'warn');
    dom.promptInput.focus();
    return;
  }

  if (!state.isOnline) {
    showToast('Backend is offline — check the connection.', 'error');
    return;
  }

  if (state.isLoading) return;

  /* Hide welcome card */
  if (dom.welcomeCard) dom.welcomeCard.style.display = 'none';

  const ts = formatTime(new Date());
  appendUserCard(prompt, ts);
  dom.promptInput.value = '';
  dom.promptInput.style.height = '';
  updateCharCount(0);

  setLoading(true);
  const t0 = performance.now();

  try {
    const data = await apiChat(prompt);
    const elapsed = Math.round(performance.now() - t0);

    state.queryCount++;
    state.totalResponseMs += elapsed;
    updateStats(elapsed);

    /* api.py returns: { response: "...", status: "success" } */
    const text  = data?.response || data?.message || data?.content || 'No response received.';
    const msgId = data?.id || `msg-${Date.now()}`;

    appendAiCard(text, formatTime(new Date()), msgId, data?.metadata);
    updateThreat(data?.metadata?.threat_level);

  } catch (err) {
    console.error('[CyberGuard] API error:', err);
    appendErrorCard(err.message || 'An unexpected error occurred.');
    showToast('Analysis failed — see error below.', 'error');
    setStatus(false);
  } finally {
    setLoading(false);
  }
}

/* ----------------------------------------------------------------
   6. RENDERING
   ---------------------------------------------------------------- */

function appendUserCard(text, ts) {
  const card = document.createElement('div');
  card.className = 'msg-card msg-card--user';
  card.innerHTML = `
    <div class="msg-meta">
      <span class="msg-role">You</span>
      <span class="msg-time">${ts}</span>
    </div>
    <div class="msg-body">${esc(text)}</div>
  `;
  dom.responseFeed.appendChild(card);
  scrollFeed();
}

function appendAiCard(text, ts, msgId, metadata) {
  const card = document.createElement('div');
  card.className = 'msg-card msg-card--ai';
  if (msgId) card.dataset.msgId = msgId;

  const html = formatAiText(text, metadata);

  card.innerHTML = `
    <div class="msg-meta">
      <span class="msg-role msg-role--ai">CyberGuard AI</span>
      <span class="msg-time">${ts}</span>
    </div>
    <div class="msg-body">
      <div class="resp-content">${html}</div>
      <div class="feedback-row">
        <button class="fb-btn" data-feedback="positive" data-msg-id="${msgId}" aria-label="Helpful">
          ↑ Helpful
        </button>
        <button class="fb-btn" data-feedback="negative" data-msg-id="${msgId}" aria-label="Not helpful">
          ↓ Not helpful
        </button>
      </div>
    </div>
  `;
  dom.responseFeed.appendChild(card);
  scrollFeed();
}

function appendErrorCard(message) {
  const card = document.createElement('div');
  card.className = 'msg-card msg-card--error';
  card.innerHTML = `
    <div class="msg-meta">
      <span class="msg-role" style="color:var(--danger)">Error</span>
      <span class="msg-time">${formatTime(new Date())}</span>
    </div>
    <div class="msg-body">
      <p class="error-head">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
          <path d="M10 6v4M10 13v1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        Analysis failed
      </p>
      <p class="error-msg">${esc(message)}</p>
    </div>
  `;
  dom.responseFeed.appendChild(card);
  scrollFeed();
}

/**
 * Converts AI response text (Markdown-like) to formatted HTML.
 */
function formatAiText(text, metadata) {
  let html = esc(text);

  /* Severity badge */
  let badge = '';
  if (metadata?.threat_level) {
    const l = metadata.threat_level.toLowerCase();
    badge = `<p><span class="sev-badge sev-${l}">${metadata.threat_level}</span></p>`;
  }

  /* Fenced code blocks */
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
    `<pre><code>${code.trimEnd()}</code></pre>`
  );

  /* Inline code */
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  /* Bold */
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  /* Headings */
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');

  /* Lists */
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/((<li>[\s\S]*?<\/li>\n?)+)/g, '<ul>$1</ul>');

  /* Paragraphs */
  html = html
    .split(/\n{2,}/)
    .map((block) => {
      if (/^<(h[123]|ul|ol|pre)/.test(block.trim())) return block;
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');

  return badge + html;
}

function scrollFeed() {
  requestAnimationFrame(() => {
    dom.responseFeed.scrollTo({ top: dom.responseFeed.scrollHeight, behavior: 'smooth' });
  });
}

function clearChat() {
  dom.responseFeed.querySelectorAll('.msg-card').forEach(c => c.remove());
  if (dom.welcomeCard) dom.welcomeCard.style.display = '';
  state.messages = [];
  resetThreat();
  showToast('Chat cleared.', 'info');
}

/* ----------------------------------------------------------------
   7. UI HELPERS — loading, toasts, char count
   ---------------------------------------------------------------- */

const LOADING_MSGS = [
  ['Analyzing security events…',         'Cross-referencing threat database'],
  ['Parsing indicators of compromise…',  'Mapping to MITRE ATT&CK framework'],
  ['Correlating log patterns…',          'Running behavioral analysis'],
  ['Evaluating risk vectors…',           'Generating remediation steps'],
];

let _loadingInterval = null;
let _loadingIdx = 0;

function setLoading(on) {
  state.isLoading     = on;
  dom.analyzeBtn.disabled = on;
  dom.promptInput.disabled = on;
  dom.loadingBar.style.display = on ? 'block' : 'none';
  dom.loadingBar.setAttribute('aria-hidden', String(!on));

  if (on) {
    _loadingIdx = 0;
    setLoadingMsg();
    _loadingInterval = setInterval(() => {
      _loadingIdx = (_loadingIdx + 1) % LOADING_MSGS.length;
      setLoadingMsg();
    }, 2400);
  } else {
    clearInterval(_loadingInterval);
  }
}

function setLoadingMsg() {
  const [p, s] = LOADING_MSGS[_loadingIdx];
  dom.loadingPrimary.textContent   = p;
  dom.loadingSecondary.textContent = s;
}

function showToast(message, type = 'info', duration = 4000) {
  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.setAttribute('role', 'alert');
  const icons = { info: '●', success: '✓', warn: '!', error: '✕' };
  t.innerHTML = `
    <span style="flex-shrink:0;font-size:10px;font-weight:700;">${icons[type] || '●'}</span>
    <span>${esc(message)}</span>
  `;
  dom.toastContainer.appendChild(t);
  setTimeout(() => {
    t.classList.add('is-leaving');
    t.addEventListener('animationend', () => t.remove(), { once: true });
  }, duration);
}

function updateCharCount(n) {
  const max = 4000;
  dom.charCount.textContent = `${n} / ${max}`;
  dom.charCount.classList.remove('is-warn', 'is-limit');
  if (n > max * 0.85) dom.charCount.classList.add('is-warn');
  if (n >= max)        dom.charCount.classList.add('is-limit');
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ----------------------------------------------------------------
   8. BENTO — STATS & THREAT RING
   ---------------------------------------------------------------- */

function updateStats(lastMs) {
  dom.statQueries.textContent = state.queryCount;
  const avg = Math.round(state.totalResponseMs / state.queryCount);
  dom.statAvgTime.textContent = avg < 1000
    ? `${avg}ms`
    : `${(avg / 1000).toFixed(1)}s`;
}

/**
 * Updates the SVG ring threat meter.
 * Ring circumference = 2π × 34 ≈ 213.6
 */
function updateThreat(level) {
  if (!level) return;

  const map = {
    low:      { pct: 20, color: '#166534', label: 'Low',      strokeColor: '#2F9E44' },
    medium:   { pct: 55, color: '#B45309', label: 'Medium',   strokeColor: '#D97706' },
    high:     { pct: 82, color: '#C92A2A', label: 'High',     strokeColor: '#EF4444' },
    critical: { pct: 100, color: '#9B1C1C', label: 'Critical', strokeColor: '#DC2626' },
  };

  const cfg = map[level.toLowerCase()];
  if (!cfg) return;

  const circumference = 213.6;
  const offset = circumference - (cfg.pct / 100) * circumference;

  dom.ringFill.style.strokeDashoffset = offset;
  dom.ringFill.style.stroke           = cfg.strokeColor;
  dom.threatPct.textContent           = `${cfg.pct}%`;
  dom.threatLevelText.textContent     = cfg.label;
  dom.threatLevelText.style.color     = cfg.color;
}

function resetThreat() {
  dom.ringFill.style.strokeDashoffset = '213.6';
  dom.ringFill.style.stroke           = 'var(--primary)';
  dom.threatPct.textContent           = '—';
  dom.threatLevelText.textContent     = 'No data';
  dom.threatLevelText.style.color     = '';
}

/* ----------------------------------------------------------------
   9. HISTORY
   ---------------------------------------------------------------- */

async function loadHistory() {
  if (!state.isOnline) { showToast('Backend offline — cannot load history.', 'warn'); return; }

  dom.historyBtn.disabled = true;
  showToast('Loading history…', 'info', 2000);

  try {
    const data = await apiHistory();
    /* api.py returns { history: [{session_id, last_prompt}] } */
    const messages = data?.messages || data?.history || [];

    if (!messages.length) {
      showToast('No history for this session.', 'info');
      return;
    }

    if (dom.welcomeCard) dom.welcomeCard.style.display = 'none';

    messages.forEach((msg) => {
      const ts = msg.timestamp
        ? formatTime(new Date(msg.timestamp))
        : formatTime(new Date());

      const role = msg.role || 'user';
      if (role === 'user') {
        appendUserCard(msg.content || msg.message || msg.last_prompt || '', ts);
      } else {
        appendAiCard(msg.content || msg.message || '', ts, msg.id || `h-${Date.now()}`);
      }
    });

    scrollFeed();
    showToast(`Loaded ${messages.length} messages.`, 'success');

  } catch (err) {
    showToast('Could not load history.', 'error');
  } finally {
    dom.historyBtn.disabled = false;
  }
}

/* ----------------------------------------------------------------
   10. FEEDBACK
   ---------------------------------------------------------------- */

async function handleFeedback(btn) {
  if (btn.classList.contains('is-active')) return;
  const msgId    = btn.dataset.msgId;
  const positive = btn.dataset.feedback === 'positive';

  btn.classList.add('is-active');
  const sibling = btn.closest('.feedback-row')
    ?.querySelector(`[data-feedback="${positive ? 'negative' : 'positive'}"]`);
  if (sibling) sibling.disabled = true;

  try {
    await apiFeedback(msgId, positive);
    showToast(positive ? 'Thanks — marked as helpful.' : 'Feedback noted.', 'success');
  } catch {
    btn.classList.remove('is-active');
    if (sibling) sibling.disabled = false;
    showToast('Could not submit feedback.', 'warn');
  }
}

/* ----------------------------------------------------------------
   11. EVENT LISTENERS
   ---------------------------------------------------------------- */

dom.analyzeBtn.addEventListener('click', handleSubmit);
dom.clearBtn.addEventListener('click', clearChat);
dom.historyBtn.addEventListener('click', loadHistory);

dom.promptInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSubmit();
  }
});

dom.promptInput.addEventListener('input', () => {
  updateCharCount(dom.promptInput.value.length);
  dom.promptInput.style.height = 'auto';
  dom.promptInput.style.height = Math.min(dom.promptInput.scrollHeight, 260) + 'px';
});

/* Quick-action tiles fill the textarea */
document.querySelectorAll('.quick-tile').forEach((tile) => {
  tile.addEventListener('click', () => {
    const prompt = tile.dataset.prompt || '';
    dom.promptInput.value = prompt;
    updateCharCount(prompt.length);
    dom.promptInput.focus();
    dom.promptInput.setSelectionRange(prompt.length, prompt.length);
  });
});

/* Feedback event delegation */
dom.responseFeed.addEventListener('click', (e) => {
  const btn = e.target.closest('.fb-btn');
  if (btn) handleFeedback(btn);
});

/* ----------------------------------------------------------------
   12. INIT
   ---------------------------------------------------------------- */

function init() {
  renderSession();
  startHealthPolling();
  setInterval(tickUptime, 1000);
  updateCharCount(0);

  console.info('%cCyberGuard AI v1.0.0 — Bento Edition', 'color:#3B5BDB;font-weight:700;font-size:13px;');
  console.info(`Session ID: ${state.sessionId}`);
}

init();
