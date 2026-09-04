// ==UserScript==
// @name         LRN pasta
// @namespace    altbdoor
// @version      0.7
// @description  Take hold of a weapon and shield, and rise to help me.
// @author       altbdoor
// @match        https://*.course.lrn.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=lrn.com
// @grant        GM_setClipboard
// @updateURL    https://github.com/altbdoor/userscripts/raw/master/lrn-pasta.user.js
// @downloadURL  https://github.com/altbdoor/userscripts/raw/master/lrn-pasta.user.js
// ==/UserScript==

const cooldown = 800;

const handlePasta = () => {
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
    document.querySelector(
      [
        ".ip-question-title",
        ".ip-content-text",
        "#PROFILER_ASSESSMENT_CONTAINER #PAGE_CONTENT",
      ].join(", "),
    )?.textContent ?? "";

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
};

/** @param {Number} timeInMs */
const waitForTime = (timeInMs) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeInMs);
  });
};

const getAccordions = () => {
  /** @type {HTMLButtonElement[]} */
  const buttons = Array.from(
    document.querySelectorAll(".js-track-spaceKey[role='button']"),
  );

  return buttons;
};

const handleNext = async () => {
  /** @type {HTMLButtonElement | null} */
  const nextBtn = document.querySelector("#NAV_NEXT");
  if (
    nextBtn &&
    !nextBtn.disabled &&
    nextBtn.getAttribute("aria-disabled") !== "true"
  ) {
    nextBtn.click();
    return;
  }

  const accordionLength = getAccordions().length;
  if (accordionLength > 0) {
    const idxMap = Array(accordionLength)
      .fill(0)
      .map((_, idx) => idx);

    for (const idx of idxMap) {
      const refetchAccordion = getAccordions();
      refetchAccordion[idx].click();
      await waitForTime(cooldown);
    }

    return;
  }

  /** @type {HTMLButtonElement | null} */
  const vidPlayBtn = document.querySelector("#VIDEO_PLAY_BUTTON");
  if (
    vidPlayBtn &&
    !vidPlayBtn.disabled &&
    vidPlayBtn.getAttribute("aria-disabled") !== "true"
  ) {
    vidPlayBtn.click();

    /** @type {HTMLVideoElement | null} */
    const vidElem = document.querySelector("#COURSE_VIDEO");
    if (vidElem) {
      vidElem.playbackRate = 16;
    }

    return;
  }

  const headings = Array.from(document.querySelectorAll("h1"));
  const beforeYouGo = headings.find((elem) =>
    elem.textContent.trim().toLowerCase().startsWith("before you go"),
  );
  if (beforeYouGo) {
    const checks = Array.from(
      document.querySelectorAll('input[type="checkbox"]'),
    ).filter((el) => el.checkVisibility());

    for (const el of checks) {
      const elType = /** @type {HTMLInputElement} */ (el);

      if (!elType.checked) {
        elType.click();
        await waitForTime(cooldown);
      }
    }

    Array.from(document.querySelectorAll("button"))
      .filter((el) => el.checkVisibility())
      .filter((el) => el.textContent.trim().toLowerCase() === "submit")
      .filter((el) => !el.disabled)
      .forEach((el) => el.click());
  }
};

(function () {
  "use strict";

  document.documentElement.classList.add("ip-pageAnimations-off");

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

  /** @type {{ [key: string]: Function }} */
  const eventMaps = {
    F3: handlePasta,
    ArrowRight: handleNext,
  };

  window.addEventListener("keydown", (evt) => {
    if (eventMaps[evt.key]) {
      evt.preventDefault();
      eventMaps[evt.key]();
    }
  });
})();
