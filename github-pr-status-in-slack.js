// ==UserScript==
// @name        GitHub PR status in Slack
// @namespace   altbdoor
// @match       https://app.slack.com/client/*
// @grant       GM.setValue
// @grant       GM.getValue
// @version     0.1
// @author      altbdoor
// @run-at      document-start
// @updateURL   https://github.com/altbdoor/userscripts/raw/master/github-pr-status-in-slack.js
// @downloadURL https://github.com/altbdoor/userscripts/raw/master/github-pr-status-in-slack.js
// @icon        https://www.google.com/s2/favicons?sz=256&domain=slack.com
// ==/UserScript==

const githubPrRegex = /github\.com\/(.+)\/pull\/(\d+)/;

/** @param {MouseEvent} evt */
const handleMouseOver = async (evt) => {
  const tokenVal = await GM.getValue("github-token", "");
  if (tokenVal === "") {
    return;
  }

  const ghHeaders = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${tokenVal}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const linkElem = /** @type {HTMLElement} */ (evt.target).closest("a");
  if (!linkElem || !githubPrRegex.test(linkElem.href)) {
    return;
  }

  const matches = linkElem.href.match(githubPrRegex);
  if (matches.length !== 3) {
    return;
  }

  let linkElemStatus = linkElem.querySelector(".status");
  if (!linkElemStatus) {
    linkElemStatus = document.createElement("span");
    linkElemStatus.classList.add("status");
    linkElem.appendChild(linkElemStatus);
  }

  if (
    linkElemStatus.classList.contains("status--loading") ||
    linkElemStatus.classList.contains("status--completed")
  ) {
    return;
  }

  linkElemStatus.classList.add("status--loading");
  linkElemStatus.textContent = " ⚪";

  const [_url, repo, prId] = matches;
  const prDataRes = await fetch(
    `https://api.github.com/repos/${repo}/pulls/${prId}`,
    { headers: ghHeaders },
  );

  /** @type {PullRequestData} */
  const prData = await prDataRes.json();

  if (prData.merged) {
    linkElemStatus.textContent = " 🟣";
    linkElemStatus.classList.add("status--completed");
    linkElemStatus.classList.remove("status--loading");
    return;
  }

  const statusRes = await fetch(
    prData.statuses_url.replace("statuses", "status"),
    { headers: ghHeaders },
  );

  /** @type {StatusData} */
  const status = await statusRes.json();

  if (status.state === "failure") {
    linkElemStatus.textContent = " 🔴";
  } else if (status.state === "pending") {
    linkElemStatus.textContent = " 🟡";
  } else {
    linkElemStatus.textContent = " 🟢";
  }

  linkElemStatus.classList.remove("status--loading");
};

document.addEventListener("mouseover", handleMouseOver, true);

/**
  @typedef {Object} PullRequestData
  @property {string} url
  @property {number} id
  @property {boolean} merged
  @property {boolean | null} mergeable unreliable, needs polling
  @property {string} statuses_url

  @typedef {Object} StatusData
  @property {"failure" | "pending" | "success"} state
 */

const tokenTrigger = document.createElement("span");
tokenTrigger.style.cursor = "pointer";
tokenTrigger.style.display = "flex";

tokenTrigger.innerHTML = `
  <img
    src="https://cdn.jsdelivr.net/gh/primer/octicons@v19.18.0/icons/mark-github-24.svg"
    width="20"
    height="20"
  />
`;

tokenTrigger.onclick = () => {
  const tokenVal = window.prompt("Please input the GitHub token");
  if (tokenVal) {
    GM.setValue("github-token", tokenVal);
  }
};

setInterval(() => {
  if (!tokenTrigger.isConnected) {
    /** @type {HTMLElement} */
    const helpContainer = document.querySelector(
      '[data-qa="top-nav-help-button"]',
    );

    if (helpContainer) {
      helpContainer.style.display = "flex";
      helpContainer.style.gap = "4px";
      helpContainer.style.alignItems = "center";
      helpContainer.prepend(tokenTrigger);
    }
  }
}, 1000);
