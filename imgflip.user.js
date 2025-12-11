// ==UserScript==
// @name        imgflip
// @namespace   altbdoor
// @match       https://imgflip.com/memegenerator
// @match       https://imgflip.com/memegenerator/*
// @version     1.3
// @author      altbdoor
// @run-at      document-end
// @updateURL   https://github.com/altbdoor/userscripts/raw/master/imgflip.user.js
// @downloadURL https://github.com/altbdoor/userscripts/raw/master/imgflip.user.js
// @icon        https://www.google.com/s2/favicons?sz=64&domain=imgflip.com
// ==/UserScript==

window.addEventListener("load", () => {
  const $ = window["jQuery"] || window["$"];
  if ($) {
    $("canvas").off("contextmenu");
  }

  const styleElem = document.createElement("style");
  styleElem.textContent = `
    .gen-wrap-btns { display: flex; }
    .gen-wrap-btns > button { float: none !important; }
  `;
  document.head.appendChild(styleElem);

  const btnContainer = document.querySelector(".gen-wrap-btns");
  const copyBtn = document.createElement("button");
  btnContainer.appendChild(copyBtn);

  copyBtn.textContent = "Copy image";
  copyBtn.className = "but l reset";
  copyBtn.type = "button";

  copyBtn.addEventListener("click", async () => {
    const canvasElem = document.querySelector("canvas");
    if (canvasElem) {
      try {
        const blob = await new Promise((resolve) =>
          canvasElem.toBlob(resolve, "image/png"),
        );
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);

        copyBtn.textContent = "Copied";
        setTimeout(() => {
          copyBtn.textContent = "Copy image";
        }, 2000);
      } catch (err) {
        alert(`Failed to copy image: ${err}`);
      }
    } else {
      alert("Canvas element not found");
    }
  });
});
