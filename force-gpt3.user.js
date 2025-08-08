// ==UserScript==
// @name        Force GPT3
// @namespace   altbdoor
// @match       https://chatgpt.com/*
// @grant       GM.setValue
// @grant       GM.getValue
// @version     1.20
// @author      altbdoor
// @run-at      document-start
// @updateURL   https://github.com/altbdoor/userscripts/raw/master/force-gpt3.user.js
// @downloadURL https://github.com/altbdoor/userscripts/raw/master/force-gpt3.user.js
// @icon        https://www.google.com/s2/favicons?sz=256&domain=chatgpt.com
// ==/UserScript==

// @ts-check
/// <reference types="@types/tampermonkey" />

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
  const gptModel = await GM.getValue("gptModel", "text-davinci-002-render-sha");
  const fixedUrl = typeof url === "string" ? url : url.toString();

  if (
    gptModel !== "auto" &&
    conversationUrlRegex.test(fixedUrl) &&
    config?.method === "POST"
  ) {
    try {
      const body = JSON.parse(config.body?.toString() || "{}");
      config.body = JSON.stringify({
        ...body,
        model: gptModel,
      });
    } catch (error) {
      console.error("[force-gpt3] Error parsing JSON body:", error);
    }
  }

  const response = await originalFetch(url, config);
  return response;
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
    }
    body:has(#conversation-header-actions) .toggleContainer {
      display: block;
    }
  `;
  document.head.append(style);

  // add dropdown
  const toggleContainer = document.createElement("div");
  toggleContainer.classList.add("toggleContainer");

  toggleContainer.innerHTML = `
    <select>
      <option value="auto">Auto</option>
      <option value="gpt-4-1-mini">4.1 mini</option>
      <option value="gpt-5">5</option>
      <option value="gpt-5-t-mini">5 think mini</option>
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

  const selectVal = await GM.getValue(
    "gptModel",
    "text-davinci-002-render-sha",
  );
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
