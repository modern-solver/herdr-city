// Module: test/screen-ui.test.js
// Purpose: Unit tests for U4 pane screen viewer rendering, metadata ribbon, and API contract consumption
// Maintainer: builder-gemini

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  renderScreenRibbonHtml,
  renderScreenToolbarHtml,
  renderScreenViewportHtml,
  renderScreenView,
  fetchScreen,
} from '../page/src/screen-view.js';
import { escapeHtml } from '../page/src/sessions-view.js';

test('renderScreenRibbonHtml displays all contract metadata fields', () => {
  const sample = {
    paneId: 'w8:p1',
    updatedAt: 1760700000000,
    lineCount: 80,
    session: {
      id: 'w8:p1',
      paneId: 'w8:p1',
      districtId: 'w8',
      districtTitle: 'atlas-api',
      name: 'grok-api',
      cli: 'grok',
      model: 'grok-4',
      status: 'blocked',
      statusLabel: 'Needs you',
      cwd: 'C:\\Users\\Shaunak\\src\\atlas-api',
      prompt: 'Allow this action?',
    },
  };

  const html = renderScreenRibbonHtml(sample);
  assert.match(html, /id="screenRibbon"/);
  assert.match(html, /w8:p1/);
  assert.match(html, /grok-api/);
  assert.match(html, /atlas-api/);
  assert.match(html, /<small class="sub-id">w8<\/small>/);
  assert.match(html, /class="badge badge-cli">grok<\/span>/);
  assert.match(html, /class="badge badge-model">grok-4<\/span>/);
  assert.match(html, /80 lines/);
});

test('renderScreenToolbarHtml renders autoscroll checkbox and truncation notice', () => {
  const normalHtml = renderScreenToolbarHtml({ autoScroll: true, truncated: false });
  assert.match(normalHtml, /id="screenToolbar"/);
  assert.match(normalHtml, /id="screenAutoScroll"/);
  assert.match(normalHtml, /checked/);
  assert.match(normalHtml, /href="#sessions"/);
  assert.doesNotMatch(normalHtml, /id="screenTruncationBanner"/);

  const truncatedHtml = renderScreenToolbarHtml({ autoScroll: false, truncated: true });
  assert.doesNotMatch(truncatedHtml, /checked/);
  assert.match(truncatedHtml, /id="screenTruncationBanner"/);
  assert.match(truncatedHtml, /Output truncated at 80,000 characters\./);
});

test('renderScreenViewportHtml passes raw ANSI sequences through unchanged in pre block', () => {
  const ansiText = '\u001b[32mPASS\u001b[39m all 48 tests passed\n<script>alert("xss")</script>';
  const html = renderScreenViewportHtml(ansiText);

  assert.match(html, /id="screenViewport"/);
  assert.match(html, /<pre class="screen-pre"><code class="screen-code" id="screenCode">/);
  // ANSI code passes through unchanged
  assert.ok(html.includes('\u001b[32mPASS\u001b[39m'));
  // HTML tags must be properly escaped
  assert.match(html, /&lt;script&gt;alert\(&quot;xss&quot;\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});

test('renderScreenViewportHtml renders empty state for blank text', () => {
  const emptyHtml = renderScreenViewportHtml('');
  assert.match(emptyHtml, /id="screenEmpty"/);
  assert.match(emptyHtml, /No recent output recorded for this pane\./);
});

test('renderScreenView manages unselected, loading, error, and content states', () => {
  const container = { innerHTML: '', querySelector: () => null };

  // 1. Unselected prompt
  renderScreenView(container, { paneId: null });
  assert.match(container.innerHTML, /id="screenSelectPrompt"/);
  assert.match(container.innerHTML, /No pane selected/);

  // 2. Loading state
  renderScreenView(container, { paneId: 'w8:p1', loading: true });
  assert.match(container.innerHTML, /id="screenLoading"/);
  assert.match(container.innerHTML, /Reading pane output for w8:p1…/);

  // 3. Error state
  renderScreenView(container, { paneId: 'w8:p1', error: 'HTTP 404' });
  assert.match(container.innerHTML, /id="screenError"/);
  assert.match(container.innerHTML, /Unable to read pane w8:p1\. Pane may have closed or herdr returned an error\./);

  // 4. Content state
  const mockVp = {
    scrollHeight: 500,
    scrollTop: 0,
  };
  const domContainer = {
    innerHTML: '',
    querySelector: (sel) => (sel === '#screenViewport' ? mockVp : null),
  };
  renderScreenView(domContainer, {
    paneId: 'w8:p1',
    data: {
      paneId: 'w8:p1',
      lineCount: 1,
      text: 'agent ready',
      truncated: false,
    },
    autoScroll: true,
  });
  assert.match(domContainer.innerHTML, /id="screenRibbon"/);
  assert.match(domContainer.innerHTML, /id="screenViewport"/);
  assert.match(domContainer.innerHTML, /agent ready/);
  assert.equal(mockVp.scrollTop, 500);
});

test('renderScreenView updates in-place and preserves scroll position when auto-scroll is off', () => {
  const mockCode = { innerHTML: 'line 1\nline 2' };
  const mockVp = { scrollHeight: 1200, scrollTop: 350 };
  const mockRibbonWrap = { innerHTML: '' };
  const mockAutoScroll = { checked: false };
  const mockToolbar = { insertAdjacentHTML: () => {} };

  const elements = {
    '#screenCode': mockCode,
    '#screenViewport': mockVp,
    '#screenRibbonWrap': mockRibbonWrap,
    '#screenAutoScroll': mockAutoScroll,
    '#screenToolbar': mockToolbar,
  };

  const container = {
    dataset: { currentPaneId: 'w8:p1' },
    _lastRawText: 'line 1\nline 2',
    innerHTML: '<div id="screenRibbonWrap"></div><div id="screenToolbar"></div><div id="screenViewport"></div>',
    querySelector: (sel) => elements[sel] || null,
  };

  // 1. Same pane, same text -> innerHTML of code element NOT overwritten, scroll position maintained
  let codeInnerHtmlWritten = false;
  Object.defineProperty(mockCode, 'innerHTML', {
    get() {
      return 'line 1\nline 2';
    },
    set() {
      codeInnerHtmlWritten = true;
    },
    configurable: true,
  });

  renderScreenView(container, {
    paneId: 'w8:p1',
    data: { paneId: 'w8:p1', lineCount: 2, text: 'line 1\nline 2', truncated: false },
    autoScroll: false,
  });

  assert.equal(codeInnerHtmlWritten, false, 'text selection preserved by skipping innerHTML rewrite');
  assert.equal(mockVp.scrollTop, 350, 'scroll position maintained when auto-scroll is false');
  assert.match(mockRibbonWrap.innerHTML, /id="screenRibbon"/);

  // 2. Updated text with autoScroll false -> innerHTML updated, scroll position held
  let newHtmlValue = '';
  Object.defineProperty(mockCode, 'innerHTML', {
    get() {
      return newHtmlValue || 'line 1\nline 2';
    },
    set(val) {
      newHtmlValue = val;
    },
    configurable: true,
  });

  renderScreenView(container, {
    paneId: 'w8:p1',
    data: { paneId: 'w8:p1', lineCount: 3, text: 'line 1\nline 2\nline 3', truncated: false },
    autoScroll: false,
  });

  assert.equal(newHtmlValue, 'line 1\nline 2\nline 3');
  assert.equal(mockVp.scrollTop, 350, 'scroll position held at prevScrollTop when auto-scroll is false');

  // 3. Auto-scroll on -> scrolls to bottom
  mockAutoScroll.checked = true;
  renderScreenView(container, {
    paneId: 'w8:p1',
    data: { paneId: 'w8:p1', lineCount: 4, text: 'line 1\nline 2\nline 3\nline 4', truncated: false },
    autoScroll: true,
  });

  assert.equal(mockVp.scrollTop, 1200, 'scroll position updated to bottom when auto-scroll is on');
});

test('renderScreenView compares raw text so quotes do not trigger innerHTML rewrites', () => {
  const quotedText = 'echo "hello world" && echo \'done\'';
  const mockCode = { innerHTML: 'echo "hello world" && echo \'done\'' };
  const mockVp = { scrollHeight: 1000, scrollTop: 200 };
  const mockRibbonWrap = { innerHTML: '' };
  const mockAutoScroll = { checked: false };
  const mockToolbar = { insertAdjacentHTML: () => {} };

  const elements = {
    '#screenCode': mockCode,
    '#screenViewport': mockVp,
    '#screenRibbonWrap': mockRibbonWrap,
    '#screenAutoScroll': mockAutoScroll,
    '#screenToolbar': mockToolbar,
  };

  const container = {
    dataset: { currentPaneId: 'w8:p1' },
    _lastRawText: quotedText,
    innerHTML: '<div id="screenRibbonWrap"></div><div id="screenToolbar"></div><div id="screenViewport"></div>',
    querySelector: (sel) => elements[sel] || null,
  };

  // Browser serialized innerHTML has raw quotes, differing from escapeHtml(quotedText)
  assert.notEqual(mockCode.innerHTML, escapeHtml(quotedText));

  let innerHtmlSetCount = 0;
  Object.defineProperty(mockCode, 'innerHTML', {
    get() {
      return 'echo "hello world" && echo \'done\'';
    },
    set() {
      innerHtmlSetCount++;
    },
    configurable: true,
  });

  // Re-poll with exact same quoted text
  renderScreenView(container, {
    paneId: 'w8:p1',
    data: { paneId: 'w8:p1', lineCount: 1, text: quotedText, truncated: false },
    autoScroll: false,
  });

  // Raw-to-raw comparison must prevent any innerHTML assignment, preserving selection
  assert.equal(innerHtmlSetCount, 0, 'innerHTML must not be rewritten when raw text with quotes is unchanged');
  assert.equal(mockVp.scrollTop, 200, 'scroll position must be preserved');
});

test('fetchScreen validates input and handles contract response and errors', async () => {
  // Missing paneId
  const missingRes = await fetchScreen(null, '');
  assert.equal(missingRes.ok, false);
  assert.equal(missingRes.error, 'paneId is required');

  // Success 200
  let queriedUrl = '';
  const mockFetch = async (url) => {
    queriedUrl = url;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        v: 1,
        paneId: 'w8:p1',
        text: 'ready',
      }),
    };
  };

  const res = await fetchScreen(mockFetch, 'w8:p1');
  assert.equal(res.ok, true);
  assert.equal(queriedUrl, '/api/screen?paneId=w8%3Ap1');
  assert.equal(res.data.text, 'ready');

  // HTTP 404
  const mock404 = async () => ({ ok: false, status: 404 });
  const notFoundRes = await fetchScreen(mock404, 'w8:p99');
  assert.equal(notFoundRes.ok, false);
  assert.equal(notFoundRes.status, 404);
  assert.equal(notFoundRes.error, 'HTTP 404');

  // Network failure
  const mockFail = async () => {
    throw new Error('Socket closed');
  };
  const failRes = await fetchScreen(mockFail, 'w8:p1');
  assert.equal(failRes.ok, false);
  assert.equal(failRes.error, 'Socket closed');
});
