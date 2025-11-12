// ==UserScript==
// @name         LRN pasta
// @namespace    altbdoor
// @version      0.2
// @description  Take hold of a weapon and shield, and rise to help me.
// @author       altbdoor
// @match        https://*.course.lrn.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=lrn.com
// @grant        GM_setClipboard
// @updateURL    https://github.com/altbdoor/userscripts/raw/master/lrn-pasta.user.js
// @downloadURL  https://github.com/altbdoor/userscripts/raw/master/lrn-pasta.user.js
// ==/UserScript==

(function () {
  "use strict";

  const css = `
    html, body, * {
      -webkit-user-select: text !important;
      user-select: text !important;
      -webkit-touch-callout: default !important;
    }
  `;
  const style = document.createElement("style");
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);

  window.addEventListener("keydown", (evt) => {
    if (evt.key !== "F3") {
      return;
    }

    evt.preventDefault();

    const title =
      document.title ||
      window.parent?.document?.title ||
      window.top?.document?.title ||
      "";

    const description = [
      ...document.querySelectorAll(".ip-description app-text-content"),
    ]
      .map((el) => el.textContent.trim())
      .filter((txt) => !!txt)
      .join(", ");

    const question =
      document.querySelector(".ip-question-title, .ip-content-text")
        ?.textContent ?? "";
    if (!question) {
      alert("unable to find question");
      return;
    }

    const answers = [
      ...(document.querySelector(".decision-radio-opt")?.children ?? []),
    ].map(
      (el, idx) => `${String.fromCharCode(65 + idx)}. ${el.textContent.trim()}`,
    );
    if (answers.length === 0) {
      alert("unable to find answers");
      return;
    }

    GM.setClipboard(
      [
        title ? `Title: ${title.trim()}` : "",
        description ? `Description: ${description}` : "",
        `Question: ${question.trim()}`,
        "",
        ...answers,
      ]
        .join("\n")
        .trim(),
      "text",
    );
  });
})();
