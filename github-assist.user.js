// ==UserScript==
// @name        GitHub assist
// @namespace   altbdoor
// @match       https://github.com/*
// @grant       none
// @version     0.4
// @author      altbdoor
// @run-at      document-start
// @updateURL   https://github.com/altbdoor/userscripts/raw/master/github-assist.user.js
// @downloadURL https://github.com/altbdoor/userscripts/raw/master/github-assist.user.js
// @icon        https://www.google.com/s2/favicons?sz=256&domain=github.com
// ==/UserScript==

// heavily inspired by https://greasyfork.org/en/scripts/461320-refined-github-notifications

// @ts-check

/** @type {{ [key: string]: Function }} */
let cleanups = {};

function bindNotificationAssist() {
  const getResolvableItems = () => {
    const icons = [
      ".octicon-git-merge.color-fg-done",
      ".octicon-git-pull-request-closed",
      ".octicon-tag",
      ".octicon-rocket",
      ".octicon-check.color-fg-success",
    ];

    return [
      ...document.querySelectorAll(
        icons
          .map((icon) => `.notifications-list-item:has(${icon})`)
          .map((val) => `${val}:not(.notification-archived)`)
          .join(","),
      ),
    ];
  };

  /** @param {HTMLElement | null} elem */
  const updateTriggerBtnText = (elem) => {
    if (!elem) {
      return;
    }
    elem.textContent = `Resolve done items (${getResolvableItems().length})`;
  };

  if (!("resolve-text-timer" in cleanups)) {
    const intervalUpdateText = setInterval(() => {
      updateTriggerBtnText(document.querySelector(".gh-assist__resolve"));
    }, 1000);
    cleanups["resolve-text-timer"] = () => clearInterval(intervalUpdateText);
  }

  if (document.querySelector(".gh-assist__resolve")) {
    return;
  }

  const triggerBtn = document.createElement("button");
  triggerBtn.className = "btn gh-assist__resolve";
  triggerBtn.type = "button";
  updateTriggerBtnText(triggerBtn);

  triggerBtn.addEventListener("click", () => {
    getResolvableItems().forEach((item) => {
      /** @type {HTMLFormElement | null} */
      const archiveForm = item.querySelector('form[data-status="archived"]');
      archiveForm?.requestSubmit();
    });

    setTimeout(() => {
      window.location.reload();
    }, 500);
  });

  const rightBlock = document.querySelector(".js-check-all-container");
  rightBlock?.prepend(triggerBtn);
}

// ========================================

function bindPullRequestAssist() {
  const labelsContainer = document.querySelectorAll(
    ".js-issue-labels > [data-name]",
  );

  if (document.querySelector(".gh-assist__pr-warning")) {
    return;
  }

  // check labels
  const labelsText = [...labelsContainer]
    .map((elem) => elem.getAttribute("data-name"))
    .filter((label) => !!label?.trim())
    .map((label) => `${label}`.trim().toLowerCase());
  const forbiddenLabels = ["do not", "don't", "dont", "test", "pending"];

  const isPRForbidden = labelsText.some((label) =>
    forbiddenLabels.some((forbidden) => label.includes(forbidden)),
  );

  // check author
  const author =
    document.querySelector(".gh-header-meta .author")?.textContent || "";
  const currentUser =
    document
      .querySelector('meta[name="user-login"]')
      ?.getAttribute("content") || "";

  if (
    !isPRForbidden &&
    author.trim().toLowerCase() === currentUser.trim().toLowerCase()
  ) {
    return;
  }

  const timelineDetails = document.querySelector(
    ".discussion-timeline-actions > .merge-pr",
  );
  const warningBox = document.createElement("div");
  warningBox.className =
    "gh-assist__pr-warning bgColor-danger-emphasis fgColor-onEmphasis rounded-2 text-center";
  warningBox.innerHTML = "⚠️ Caution on merge ⚠️";
  timelineDetails?.prepend(warningBox);
}

// ========================================

const regexPRWithId = /^(\/[^\/]+){2}\/pull\/\d+/;
const styles = `
  .gh-assist__resolve {
    margin-bottom: 1rem;
  }

  .gh-assist__pr-warning {
    font-size: 4rem;
    padding: 1rem 0;
  }
`;

/** @param {string} source */
function runner(source) {
  console.log(`[githubassist] from ${source}`);
  Object.values(cleanups).forEach((fn) => fn());
  cleanups = {};

  if (!document.head.querySelector(".gh-assist__styles")) {
    const styleElem = document.createElement("style");
    styleElem.textContent = styles;
    styleElem.className = ".gh-assist__styles";
    document.head.appendChild(styleElem);
  }

  if (location.pathname.startsWith("/notifications")) {
    console.log(`[githubassist] binding notifications`);
    bindNotificationAssist();
    return;
  }

  if (regexPRWithId.test(location.pathname)) {
    console.log(`[githubassist] binding pull requests`);
    bindPullRequestAssist();
    return;
  }
}

document.addEventListener("turbo:render", () => runner("turbo:render"));
document.addEventListener("pjax:end", () => runner("pjax:end"));
window.addEventListener("load", () => runner("load"));
