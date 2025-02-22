// ==UserScript==
// @name        Glassdoor bypass
// @namespace   altbdoor
// @match       https://glassdoor.com/*
// @match       https://www.glassdoor.com/*
// @version     1.0
// @author      altbdoor
// @run-at      document-start
// @updateURL   https://github.com/altbdoor/userscripts/raw/master/glassdoor-bypass.user.js
// @downloadURL https://github.com/altbdoor/userscripts/raw/master/glassdoor-bypass.user.js
// ==/UserScript==

document.addEventListener("DOMContentLoaded", () => {
  document.body.onscroll = null;

  const style = document.createElement("style");
  style.innerHTML = `
    body { height: auto !important; overflow: auto !important; }
    #ContentWallHardsell { display: none !important; }
  `;
  document.head.append(style);
});
