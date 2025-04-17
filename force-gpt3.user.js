// ==UserScript==
// @name        Force GPT3
// @namespace   altbdoor
// @match       https://chatgpt.com/*
// @grant       GM.setValue
// @grant       GM.getValue
// @version     1.14
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

/** @type {(...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>} */
windowRef.fetch = async (url, config) => {
  const gptModel = await GM.getValue("gptModel", "text-davinci-002-render-sha");
  const fixedUrl = typeof url === "string" ? url : url.toString();

  if (
    gptModel !== "auto" &&
    fixedUrl.includes("/backend-api/conversation") &&
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
      position: absolute; right: 12rem; top: 0.5rem;
    }
    .toggleContainer select {
      border-radius: 9999px;
    }
  `;
  document.head.append(style);

  // add dropdown
  const toggleContainer = document.createElement("div");
  toggleContainer.classList.add("toggleContainer");

  toggleContainer.innerHTML = `
    <select>
      <option value="auto">Auto</option>
      <option value="text-davinci-002-render-sha">3.5</option>
      <option value="gpt-4o-mini">4o mini</option>
      <option value="gpt-4o">4o</option>
      <option value="o4-mini">o4 mini</option>
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
}

// userscripts might have triggered DOM ready earlier
// https://developer.apple.com/forums/thread/651215
if (document.readyState !== "loading") {
  mainRunner();
} else {
  document.addEventListener("DOMContentLoaded", mainRunner);
}
