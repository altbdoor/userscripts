// ==UserScript==
// @name        insta-annoy
// @namespace   insta-annoy
// @match       https://www.instagram.com/*
// @version     1.0
// @author      altbdoor
// @grant       GM_addStyle
// @run-at      document-start
// ==/UserScript==

GM_addStyle(`
body > [role="presentation"] { display: none }
body { overflow-y: auto !important }
.__patch__overlay-link {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
}
`);

window.addEventListener("DOMContentLoaded", () => {
  const observer = new MutationObserver((mutationsList, observer) => {
    const addedNodes = mutationsList
      .filter((node) => node.type == "childList")
      .filter((node) => node.addedNodes.length > 0)
      .map((node) => [...node.addedNodes])
      .flat(1);

    addedNodes
      .reduce(
        (acc, node) => [...acc, ...node.querySelectorAll('a[href^="/p/"]')],
        [],
      )
      .forEach((node) => {
        const overlayLink = document.createElement("a");
        overlayLink.href = node.href;
        overlayLink.classList.add("__patch__overlay-link");
        node.parentNode.appendChild(overlayLink);

        node.onclick = null;
        node.addEventListener(
          "click",
          (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
          },
          false,
        );
      });

    addedNodes
      .reduce(
        (acc, node) => [
          ...acc,
          ...node.querySelectorAll(".glyphsSpriteGrey_Close"),
        ],
        [],
      )
      .forEach((node) => {
        if (
          node.parentNode &&
          node.parentNode.nodeName.toLowerCase() == "button" &&
          node.parentNode.parentNode &&
          node.parentNode.parentNode.style.width == "100%"
        ) {
          node.parentNode.parentNode.style.display = "none";
        }
      });
  });

  observer.observe(document.body, {
    attributes: false,
    childList: true,
    subtree: true,
  });
});
