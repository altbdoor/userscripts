// ==UserScript==
// @name        Force GPT3
// @namespace   altbdoor
// @match       https://chatgpt.com/*
// @grant       GM.setValue
// @grant       GM.getValue
// @version     1.28
// @author      altbdoor
// @run-at      document-start
// @homepageURL https://github.com/altbdoor/userscripts
// @updateURL   https://github.com/altbdoor/userscripts/raw/master/force-gpt3.user.js
// @downloadURL https://github.com/altbdoor/userscripts/raw/master/force-gpt3.user.js
// @icon        https://www.google.com/s2/favicons?sz=64&domain=chatgpt.com
// ==/UserScript==

// https://chatgpt.com/backend-api/models
// window.__reactRouterContext.state.loaderData["routes/_conversation"]
const OPTIONS = [
  { label: "5 mini", value: "gpt-5-mini" },
  { label: "5", value: "gpt-5" },
  { label: "5.1", value: "gpt-5-1" },
  { label: "5.1 inst", value: "gpt-5-1-instant" },
  { label: "5+ mini", value: "gpt-5-t-mini" },
];

/** @type {(keyof RequestInit)[]} */
const requestInitKeys = [
  "method",
  "headers",
  "body",
  "mode",
  "credentials",
  "cache",
  "redirect",
  "referrer",
  "referrerPolicy",
  "integrity",
  "keepalive",
  "signal",
  "window",
];

// fallback for missing unsafeWindow
/** @type {typeof unsafeWindow | Window} */
let windowRef = window;

try {
  windowRef = unsafeWindow;
} catch (e) {}

// https://blog.logrocket.com/intercepting-javascript-fetch-api-requests-responses/
const originalFetch = windowRef.fetch;

const conversationUrlRegex = new RegExp(
  /https:\/\/chatgpt\.com\/backend-api\/.*conversation/,
);

/** @type {(...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>} */
windowRef.fetch = async (url, config) => {
  const gptModel = await GM.getValue("gptModel", OPTIONS[0].value);
  let fixedUrl = "";
  let fixedMethod = "";

  if (typeof url === "string" || url instanceof URL) {
    fixedMethod = config?.method ?? "";
    fixedUrl = url.toString();
  } else if (url instanceof Request) {
    fixedMethod = url.method;
    fixedUrl = url.url;
  }

  if (
    gptModel !== "auto" &&
    conversationUrlRegex.test(fixedUrl) &&
    fixedMethod === "POST"
  ) {
    let fixedConfig = config ?? {};

    if (url instanceof Request) {
      const reqClone = url.clone();

      /** @type {RequestInit} */
      fixedConfig = requestInitKeys.reduce((acc, val) => {
        if (val !== "body") {
          acc[val] = reqClone[val];
        }

        return acc;
      }, {});

      fixedConfig.body = await reqClone.text();
    }

    try {
      const body = JSON.parse(fixedConfig.body?.toString() || "{}");
      fixedConfig.body = JSON.stringify({
        ...body,
        model: gptModel,
      });

      return originalFetch(fixedUrl, fixedConfig);
    } catch (error) {
      console.error("[force-gpt3] Error modifying request:", error);
      return originalFetch(url, config);
    }
  }

  return originalFetch(url, config);
};

async function mainRunner() {
  // add style
  const style = document.createElement("style");
  style.innerHTML = `
    .toggleContainer {
      position: absolute;
      right: calc(var(--toggle-container-right, 0.5rem) + 1rem);
      top: var(--toggle-container-top, 0.5rem);
      display: none;
      transition: right 0.15s ease;
    }
    .toggleContainer select {
      border-radius: 9999px;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      border: 1px solid var(--border-default);
    }
    body:has(#conversation-header-actions) .toggleContainer {
      display: block;
    }
  `;
  document.head.append(style);

  // add dropdown
  const toggleContainer = document.createElement("div");
  toggleContainer.classList.add("toggleContainer");

  const optionsHtml = OPTIONS.map(
    (opt) => `<option value="${opt.value}">${opt.label}</option>`,
  );

  toggleContainer.innerHTML = `
    <select>
      <option value="auto">Auto</option>
      ${optionsHtml.join("")}
    </select>
  `;
  document.body.appendChild(toggleContainer);

  const select = toggleContainer.querySelector("select");
  if (!select) {
    return;
  }

  select.onchange = () => {
    GM.setValue("gptModel", select.value);
    console.log(`[force-gpt3] changing model to ${select.value}`);
  };

  const selectVal = await GM.getValue("gptModel", OPTIONS[0].value);
  select.value = selectVal;

  // keybinds
  windowRef.addEventListener("keydown", (evt) => {
    if (evt.ctrlKey && evt.shiftKey) {
      const changeEvt = new Event("change");

      if (evt.key === "ArrowUp") {
        select.selectedIndex = Math.max(0, select.selectedIndex - 1);
        select.dispatchEvent(changeEvt);
      } else if (evt.key === "ArrowDown") {
        select.selectedIndex = Math.min(
          select.options.length - 1,
          select.selectedIndex + 1,
        );
        select.dispatchEvent(changeEvt);
      }
    }
  });

  /** @type {{ top: DOMRect['top']; width: DOMRect['width'] }} */
  const lastRect = { top: 0, width: 0 };
  const rootStyle = document.documentElement.style;

  setInterval(() => {
    if (!toggleContainer.isConnected) {
      document.body.appendChild(toggleContainer);
    }

    const headerActionsElem = document.querySelector(
      "#conversation-header-actions",
    );

    if (!headerActionsElem) {
      return;
    }

    const { top, width } = headerActionsElem.getBoundingClientRect();
    if (lastRect.width !== width) {
      lastRect.width = width;
      rootStyle.setProperty(
        "--toggle-container-right",
        `${Math.ceil(width)}px`,
      );
    }

    if (lastRect.top !== top) {
      lastRect.top = top;
      rootStyle.setProperty("--toggle-container-top", `${Math.ceil(top)}px`);
    }
  }, 1000);
}

// userscripts might have triggered DOM ready earlier
// https://developer.apple.com/forums/thread/651215
if (document.readyState !== "loading") {
  mainRunner();
} else {
  document.addEventListener("DOMContentLoaded", mainRunner);
}
