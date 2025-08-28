// ==UserScript==
// @name        imgflip
// @namespace   altbdoor
// @match       https://imgflip.com/memegenerator/*
// @version     1.0
// @author      altbdoor
// @run-at      document-end
// @updateURL   https://github.com/altbdoor/userscripts/raw/master/imgflip.user.js
// @downloadURL https://github.com/altbdoor/userscripts/raw/master/imgflip.user.js
// ==/UserScript==

window.addEventListener("load", () => {
  const $ = window.jQuery || window.$;
  if (!$) {
    console.error("unable to get jQuery");
    return;
  }

  $("canvas").off("contextmenu");
});
