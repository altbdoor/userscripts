// ==UserScript==
// @name        Glassdoor bypass
// @namespace   altbdoor
// @match       https://glassdoor.com/*
// @match       https://www.glassdoor.com/*
// @version     1.1
// @author      altbdoor
// @run-at      document-start
// @updateURL   https://github.com/altbdoor/userscripts/raw/master/glassdoor-bypass.user.js
// @downloadURL https://github.com/altbdoor/userscripts/raw/master/glassdoor-bypass.user.js
// ==/UserScript==

document.addEventListener("DOMContentLoaded", () => {
  document.body.onscroll = null;

  const style = document.createElement("style");
  style.innerHTML = `
    body { height: auto !important; overflow: auto !important; position: static !important; }
    #ContentHardsell { display: none !important; }
    [class*="review-text_isCollapsed"] { overflow: auto; -webkit-line-clamp: none; }
  `;
  document.head.append(style);
});
