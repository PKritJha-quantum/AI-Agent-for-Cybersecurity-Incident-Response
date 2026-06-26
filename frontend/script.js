/* ================================================================
   CyberGuard AI — script.js
   Modular vanilla JS. All API calls use fetch() + async/await.
   Sections:
     1. Config & State
     2. DOM References
     3. API Layer
     4. Session & Health
     5. Chat / Query Logic
     6. Rendering
     7. UI Helpers (loading, toasts, status)
     8. Sidebar & Stats
     9. History
    10. Feedback
    11. Event Listeners
    12. Init
   ================================================================ */

'use strict';

/* ----------------------------------------------------------------
   1. CONFIG & STATE
   ---------------------------------------------------------------- */

/** Base URL for Flask backend. Adjust if deployed elsewhere. */
const API_BASE = 'http://localhost:5000';

/** Application state (single source of truth) */
const state = {
  /** Whether the backend is reachable */
  isOnline: false,
  /** Unique session identifier for this page load */
  sessionId: generateSessionId(),
  /** Total queries submitted in this session */
  queryCount: 0,
  /** Sum of all response times (ms) — for computing average */
  totalResponseMs: 0,
  /** Whether a request is currently in flight */
  isLoading: false,
  /** Timestamp when the app started (for uptime display) */
  startTime: Date.now(),
  /** Array of { role, text, timestamp } message objects */
  messages: [],
};

/* ----------------------------------------------------------------
   2. DOM REFERENCES
   ---------------------------------------------------------------- */

const $ = (id) => document.getElementById(id);

const dom = {
  statusBadge:       $('statusBadge'),
  statusDot:         $('statusDot'),
  statusLabel:       $('statusLabel'),
  sessionId:         $('sessionId'),
  responseFeed:      $('responseFeed'),
  welcomeCard:       $('welcomeCard'),
  loadingBar:        $('loadingBar'),
  loadingPrimary:    $('loadingPrimary'),
  loadingSecondary:  $('loadingSecondary'),
  loadingProgress:   $('loadingProgress'),
  promptInput:       $('promptInput'),
  charCount:         $('charCount'),
  analyzeBtn:        $('analyzeBtn'),
  clearBtn:          $('clearBtn'),
  historyBtn:        $('historyBtn'),
  toastContainer:    $('toastContainer'),
  threatFill:        $('threatFill'),
  threatLabel:       $('threatLabel'),
  statQueries:       $('statQueries'),
  statAvgTime:       $('statAvgTime'),
  statUptime:        $('statUptime'),
};

/* ----------------------------------------------------------------
   3. API LAYER
   Core fetch wrapper and endpoint-specific functions.
   All functions are async and return parsed data or throw.
   ---------------------------------------------------------------- */

/**
 * Generic fetch wrapper with timeout, JSON parsing, and error handling.
 * @param {string}  endpoint   — Path relative to API_BASE (e.g. '/api/chat')
 * @param {Object}  options    — Standard fetch options
 * @param {number}  timeoutMs  — Abort timeout in milliseconds (default 30s)
 * @returns {Promise<any>}     — Parsed JSON response body
 */
async function apiFetch(endpoint, options = {}, timeoutMs = 30_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': state.sessionId,
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timer);

    // Try to parse body regardless of status code (errors often include detail)
    let body;
    try { body = await response.json(); } catch { body = null; }

    if (!response.ok) {
      const message = body?.error || body?.message || `HTTP ${response.status}`;
      throw new ApiError(message, response.status, body);
    }

    return body;

  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new ApiError('Request timed out.', 0);
    if (err instanceof ApiError) throw err;
    throw new ApiError('Unable to reach the backend.', 0, err);
  }
}

/** Typed API error for structured handling */
class ApiError extends Error {
  constructor(message, status, raw) {
    super(message);
    this.name   = 'ApiError';
    this.status = status;
    this.raw    = raw;
  }
}

/* --- Endpoint functions --- */

/**
 * POST /api/chat — Send a user query and receive an AI response.
 * @param {string} prompt — The user's security query
 * @returns {Promise<{response: string, metadata?: Object}>}
 */
async function apiChat(prompt) {
  return apiFetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      message: prompt,
      session_id: state.sessionId,
    }),
  });
}

/**
 * GET /api/health — Check backend availability.
 * @returns {Promise<{status: string, uptime?: number}>}
 */
async function apiHealth() {
  return apiFetch('/api/health', { method: 'GET' }, 5_000);
}

/**
 * GET /api/history — Fetch prior conversation history.
 * @returns {Promise<{messages: Array}>}
 */
async function apiHistory() {
  return apiFetch(`/api/history?session_id=${state.sessionId}`, { method: 'GET' });
}

/**
 * POST /api/feedback — Submit thumbs up/down on a response.
 * @param {string}  messageId — ID of the AI message being rated
 * @param {boolean} positive  — true = helpful, false = not helpful
 */
async function apiFeedback(messageId, positive) {
  return apiFetch('/api/feedback', {
    method: 'POST',
    body: JSON.stringify({
      session_id: state.sessionId,
      message_id: messageId,
      rating: positive ? 'positive' : 'negative',
    }),
  });
}

/* ----------------------------------------------------------------
   4. SESSION & HEALTH POLLING
   ---------------------------------------------------------------- */

/** Generates a short random session identifier. */
function generateSessionId() {
  return Math.random().toString(36).slice(2, 9).toUpperCase();
}

/** Renders the session ID in the header. */
function renderSessionId() {
  dom.sessionId.textContent = state.sessionId;
}

/**
 * Polls GET /api/health on a schedule to keep connection status fresh.
 * Runs immediately on load, then every 30 seconds.
 */
async function startHealthPolling() {
  async function check() {
    try {
      await apiHealth();
      setConnectionStatus(true);
    } catch {
      setConnectionStatus(false);
    }
  }
  await check();
  setInterval(check, 30_000);
}

/**
 * Updates the header connection badge.
 * @param {boolean} online
 */
function setConnectionStatus(online) {
  state.isOnline = online;
  dom.statusBadge.classList.toggle('is-online',  online);
  dom.statusBadge.classList.toggle('is-offline', !online);
  dom.statusLabel.textContent = online ? 'Backend Online' : 'Offline';
}

/** Updates the uptime counter in the sidebar. */
function tickUptime() {
  const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
  const h = Math.floor(elapsed / 3600).toString().padStart(2, '0');
  const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
  const s = (elapsed % 60).toString().padStart(2, '0');
  dom.statUptime.textContent = `${h}:${m}:${s}`;
}

/* ----------------------------------------------------------------
   5. CHAT / QUERY LOGIC
   ---------------------------------------------------------------- */

/**
 * Main entry point when the user submits a query.
 * Validates input, calls the API, and renders the result.
 */
async function handleSubmit() {
  const prompt = dom.promptInput.value.trim();

  // Validation
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

  // Hide welcome card on first submission
  if (dom.welcomeCard) dom.welcomeCard.style.display = 'none';

  // Render the user's query immediately
  const userTimestamp = formatTimestamp(new Date());
  appendUserCard(prompt, userTimestamp);
  dom.promptInput.value = '';
  updateCharCount(0);

  // Transition to loading state
  setLoadingState(true);
  const startMs = performance.now();

  try {
    const data = await apiChat(prompt);
    const elapsed = Math.round(performance.now() - startMs);

    // Update state stats
    state.queryCount++;
    state.totalResponseMs += elapsed;
    updateStats(elapsed);

    // Extract response text (handles both {response} and {message} shapes)
    const text = data?.response || data?.message || data?.content || 'No response received.';
    const msgId = data?.id || `msg-${Date.now()}`;

    appendAiCard(text, formatTimestamp(new Date()), msgId, data?.metadata);
    updateThreatLevel(data?.metadata?.threat_level);

  } catch (err) {
    const elapsed = Math.round(performance.now() - startMs);
    console.error('[CyberGuard] API error:', err);
    appendErrorCard(err.message || 'An unexpected error occurred.', elapsed);
    showToast('Analysis failed — see error in feed.', 'error');
    setConnectionStatus(false);
  } finally {
    setLoadingState(false);
  }
}

/* ----------------------------------------------------------------
   6. RENDERING — Cards & Feed
   ---------------------------------------------------------------- */

/**
 * Appends the user's query card to the feed.
 * @param {string} text
 * @param {string} timestamp
 */
function appendUserCard(text, timestamp) {
  const card = createCard('user', sanitizeHtml(text), timestamp);
  dom.responseFeed.appendChild(card);
  scrollFeedToBottom();
}

/**
 * Appends an AI response card with formatted content and feedback controls.
 * @param {string} text
 * @param {string} timestamp
 * @param {string} msgId       — Used for feedback API calls
 * @param {Object} [metadata]  — Optional metadata from the backend
 */
function appendAiCard(text, timestamp, msgId, metadata) {
  const formattedHtml = formatResponseText(text, metadata);
  const card = createCard('ai', formattedHtml, timestamp, msgId);
  dom.responseFeed.appendChild(card);
  scrollFeedToBottom();
}

/**
 * Appends a styled error card to the feed.
 * @param {string} message
 * @param {number} [elapsed] — Response time in ms
 */
function appendErrorCard(message, elapsed) {
  const card = document.createElement('div');
  card.className = 'response-card response-card--error';
  card.innerHTML = `
    <div class="card-meta">
      <span class="card-role">Error</span>
      <span class="card-time">${formatTimestamp(new Date())}${elapsed ? ` · ${elapsed}ms` : ''}</span>
    </div>
    <div class="card-body">
      <p class="error-heading">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
          <path d="M10 6v4M10 13v1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        Analysis Failed
      </p>
      <p class="error-msg">${sanitizeHtml(message)}</p>
    </div>
  `;
  card.style.animation = 'fadeUp 0.35s ease both';
  dom.responseFeed.appendChild(card);
  scrollFeedToBottom();
}

/**
 * Creates a response card DOM element.
 * @param {'user'|'ai'} role
 * @param {string}      htmlContent — Pre-formatted HTML (sanitized for user, structured for AI)
 * @param {string}      timestamp
 * @param {string}      [msgId]     — Only for AI cards (enables feedback)
 * @returns {HTMLElement}
 */
function createCard(role, htmlContent, timestamp, msgId) {
  const card = document.createElement('div');
  card.className = `response-card response-card--${role}`;
  if (msgId) card.dataset.msgId = msgId;

  const feedbackHtml = (role === 'ai' && msgId) ? `
    <div class="card-footer">
      <button class="feedback-btn" data-feedback="positive" data-msg-id="${msgId}" aria-label="Mark as helpful">
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M7 10l3-6 3 6H7z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
          <rect x="4" y="11" width="12" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/>
        </svg>
        Helpful
      </button>
      <button class="feedback-btn" data-feedback="negative" data-msg-id="${msgId}" aria-label="Mark as not helpful">
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M7 10l3 6 3-6H7z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
          <rect x="4" y="4" width="12" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/>
        </svg>
        Not helpful
      </button>
    </div>
  ` : '';

  card.innerHTML = `
    <div class="card-meta">
      <span class="card-role card-role--${role}">${role === 'ai' ? 'CyberGuard AI' : 'You'}</span>
      <span class="card-time">${timestamp}</span>
    </div>
    <div class="card-body">
      ${role === 'ai' ? `<div class="response-content">${htmlContent}</div>` : htmlContent}
      ${feedbackHtml}
    </div>
  `;

  return card;
}

/**
 * Converts raw AI response text (Markdown-ish) into styled HTML.
 * Handles headings, bold, inline code, fenced code blocks, and lists.
 * Also injects severity badges if metadata is provided.
 * @param {string} text
 * @param {Object} [metadata]
 * @returns {string} — HTML string
 */
function formatResponseText(text, metadata) {
  let html = sanitizeHtml(text);

  // Severity badge from metadata
  let badge = '';
  if (metadata?.threat_level) {
    const level = metadata.threat_level.toLowerCase();
    badge = `<p><span class="severity-badge severity-badge--${level}">${metadata.threat_level}</span></p>`;
  }

  // Fenced code blocks  ```lang\n...\n```
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code>${code.trimEnd()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // H2  ## heading
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  // H3  ### heading
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');

  // Unordered lists — lines starting with - or *
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/((<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

  // Numbered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Paragraphs — double newline becomes paragraph break
  html = html
    .split(/\n{2,}/)
    .map((block) => {
      if (/^<(h[123]|ul|ol|pre|li)/.test(block.trim())) return block;
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');

  return badge + html;
}

/** Auto-scrolls the response feed to the most recent message. */
function scrollFeedToBottom() {
  requestAnimationFrame(() => {
    dom.responseFeed.scrollTo({
      top: dom.responseFeed.scrollHeight,
      behavior: 'smooth',
    });
  });
}

/** Removes all messages from the feed and resets state. */
function clearChat() {
  // Remove all cards except the welcome card
  const cards = dom.responseFeed.querySelectorAll('.response-card');
  cards.forEach((c) => c.remove());

  if (dom.welcomeCard) dom.welcomeCard.style.display = '';
  state.messages = [];
  showToast('Chat cleared.', 'info');
}

/* ----------------------------------------------------------------
   7. UI HELPERS
   ---------------------------------------------------------------- */

/**
 * Toggles the loading state: disables inputs, shows/hides loading bar.
 * @param {boolean} loading
 */
function setLoadingState(loading) {
  state.isLoading = loading;

  dom.promptInput.disabled = loading;
  dom.analyzeBtn.disabled  = loading;
  dom.clearBtn.disabled    = loading;

  dom.analyzeBtn.classList.toggle('is-loading', loading);
  dom.loadingBar.style.display = loading ? 'block' : 'none';
  dom.loadingBar.setAttribute('aria-hidden', String(!loading));

  if (loading) {
    cycleLoadingMessages();
  }
}

/** Cycles through contextual loading messages while the API is processing. */
const LOADING_MESSAGES = [
  ['Analyzing security events…',       'Cross-referencing threat database'],
  ['Parsing indicators of compromise…', 'Mapping to MITRE ATT&CK framework'],
  ['Correlating log patterns…',         'Running behavioral analysis'],
  ['Evaluating risk vectors…',          'Generating remediation steps'],
];

let loadingMsgIndex = 0;
let loadingInterval = null;

function cycleLoadingMessages() {
  clearInterval(loadingInterval);
  loadingMsgIndex = 0;
  updateLoadingMessage();
  loadingInterval = setInterval(() => {
    loadingMsgIndex = (loadingMsgIndex + 1) % LOADING_MESSAGES.length;
    updateLoadingMessage();
  }, 2500);
}

function updateLoadingMessage() {
  const [primary, secondary] = LOADING_MESSAGES[loadingMsgIndex];
  dom.loadingPrimary.textContent   = primary;
  dom.loadingSecondary.textContent = secondary;
}

/**
 * Shows a transient toast notification.
 * @param {string} message
 * @param {'info'|'success'|'warn'|'error'} type
 * @param {number} [duration] — ms before auto-dismiss (default 4000)
 */
function showToast(message, type = 'info', duration = 4000) {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'alert');

  const iconMap = {
    info:    '●',
    success: '✓',
    warn:    '⚠',
    error:   '✕',
  };

  toast.innerHTML = `<span style="flex-shrink:0;font-size:0.75rem;">${iconMap[type] || '●'}</span><span>${sanitizeHtml(message)}</span>`;
  dom.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('is-leaving');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

/**
 * Updates the character counter below the input.
 * @param {number} count
 */
function updateCharCount(count) {
  const max = 4000;
  dom.charCount.textContent = `${count} / ${max}`;
  dom.charCount.classList.remove('is-warning', 'is-limit');
  if (count > max * 0.85) dom.charCount.classList.add('is-warning');
  if (count >= max)       dom.charCount.classList.add('is-limit');
}

/**
 * Formats a Date as HH:MM:SS for card timestamps.
 * @param {Date} date
 * @returns {string}
 */
function formatTimestamp(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

/**
 * Minimal HTML sanitizer — escapes < > & " ' to prevent XSS.
 * For production, replace with DOMPurify or similar library.
 * @param {string} str
 * @returns {string}
 */
function sanitizeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ----------------------------------------------------------------
   8. SIDEBAR & STATS
   ---------------------------------------------------------------- */

/**
 * Updates sidebar stat values after each successful query.
 * @param {number} lastResponseMs — Most recent response time
 */
function updateStats(lastResponseMs) {
  dom.statQueries.textContent = state.queryCount;

  const avg = Math.round(state.totalResponseMs / state.queryCount);
  dom.statAvgTime.textContent = avg < 1000
    ? `${avg}ms`
    : `${(avg / 1000).toFixed(1)}s`;
}

/**
 * Updates the threat meter in the sidebar based on backend metadata.
 * @param {string} [level] — 'low' | 'medium' | 'high' | 'critical'
 */
function updateThreatLevel(level) {
  if (!level) return;

  const levelMap = {
    low:      { pct: 20, cls: '',             label: 'LOW' },
    medium:   { pct: 50, cls: 'level-medium', label: 'MEDIUM' },
    high:     { pct: 80, cls: 'level-high',   label: 'HIGH' },
    critical: { pct: 100, cls: 'level-high',  label: 'CRITICAL' },
  };

  const config = levelMap[level.toLowerCase()];
  if (!config) return;

  dom.threatFill.style.width = `${config.pct}%`;
  dom.threatFill.className   = `threat-fill ${config.cls}`.trim();
  dom.threatLabel.textContent = config.label;
}

/* ----------------------------------------------------------------
   9. HISTORY
   ---------------------------------------------------------------- */

/**
 * Loads and renders prior session history from GET /api/history.
 * Falls back to a toast if the endpoint is unavailable.
 */
async function loadHistory() {
  if (!state.isOnline) {
    showToast('Cannot load history — backend offline.', 'warn');
    return;
  }

  dom.historyBtn.disabled = true;
  showToast('Loading history…', 'info', 2000);

  try {
    const data = await apiHistory();
    const messages = data?.messages || [];

    if (!messages.length) {
      showToast('No prior history for this session.', 'info');
      return;
    }

    // Hide welcome card
    if (dom.welcomeCard) dom.welcomeCard.style.display = 'none';

    messages.forEach((msg) => {
      const ts = msg.timestamp
        ? formatTimestamp(new Date(msg.timestamp))
        : formatTimestamp(new Date());

      if (msg.role === 'user') {
        appendUserCard(msg.content || msg.message || '', ts);
      } else if (msg.role === 'assistant' || msg.role === 'ai') {
        const msgId = msg.id || `hist-${Date.now()}-${Math.random()}`;
        appendAiCard(msg.content || msg.message || '', ts, msgId);
      }
    });

    scrollFeedToBottom();
    showToast(`Loaded ${messages.length} messages.`, 'success');

  } catch (err) {
    console.error('[CyberGuard] History error:', err);
    showToast('Could not load history.', 'error');
  } finally {
    dom.historyBtn.disabled = false;
  }
}

/* ----------------------------------------------------------------
   10. FEEDBACK
   ---------------------------------------------------------------- */

/**
 * Handles thumbs up/down feedback button clicks (event delegation).
 * Sends the rating to POST /api/feedback.
 * @param {HTMLElement} btn — The feedback button that was clicked
 */
async function handleFeedback(btn) {
  if (btn.classList.contains('is-active')) return;

  const msgId    = btn.dataset.msgId;
  const positive = btn.dataset.feedback === 'positive';

  // Optimistic UI
  btn.classList.add('is-active');
  const sibling = btn.closest('.card-footer').querySelector(
    `[data-feedback="${positive ? 'negative' : 'positive'}"]`
  );
  if (sibling) sibling.disabled = true;

  try {
    await apiFeedback(msgId, positive);
    showToast(positive ? 'Thanks for the feedback!' : 'Feedback noted — we\'ll improve.', 'success');
  } catch (err) {
    // Revert on failure
    btn.classList.remove('is-active');
    if (sibling) sibling.disabled = false;
    showToast('Could not submit feedback.', 'warn');
  }
}

/* ----------------------------------------------------------------
   11. EVENT LISTENERS
   ---------------------------------------------------------------- */

/** Analyze button */
dom.analyzeBtn.addEventListener('click', handleSubmit);

/** Clear button */
dom.clearBtn.addEventListener('click', clearChat);

/** History button */
dom.historyBtn.addEventListener('click', loadHistory);

/** Keyboard submit — Enter sends, Shift+Enter inserts newline */
dom.promptInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSubmit();
  }
});

/** Character counter update on input */
dom.promptInput.addEventListener('input', () => {
  updateCharCount(dom.promptInput.value.length);
});

/** Quick-action buttons (sidebar) — fill input and focus */
document.querySelectorAll('.quick-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const prompt = btn.dataset.prompt || '';
    dom.promptInput.value = prompt;
    updateCharCount(prompt.length);
    dom.promptInput.focus();
    dom.promptInput.setSelectionRange(prompt.length, prompt.length);
  });
});

/** Feedback buttons (event delegation on feed) */
dom.responseFeed.addEventListener('click', (e) => {
  const btn = e.target.closest('.feedback-btn');
  if (btn) handleFeedback(btn);
});

/** Auto-resize textarea as content grows */
dom.promptInput.addEventListener('input', () => {
  dom.promptInput.style.height = 'auto';
  dom.promptInput.style.height = `${Math.min(dom.promptInput.scrollHeight, 280)}px`;
});

/* ----------------------------------------------------------------
   12. INIT
   Application bootstrap sequence.
   ---------------------------------------------------------------- */

function init() {
  // Render session ID in header
  renderSessionId();

  // Start health check polling
  startHealthPolling();

  // Tick the uptime counter every second
  setInterval(tickUptime, 1000);

  // Initial char count state
  updateCharCount(0);

  // Initial stats
  dom.statQueries.textContent = '0';
  dom.statAvgTime.textContent = '—';
  dom.statUptime.textContent  = '00:00:00';
  dom.threatLabel.textContent = '—';

  // Greet in console
  console.info('%cCyberGuard AI v1.0.0', 'color:#00C2FF;font-weight:bold;font-size:14px;');
  console.info(`Session: ${state.sessionId}`);
}

// Boot
init();
