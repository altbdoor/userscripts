// ==UserScript==
// @name         Old Reddit
// @namespace    altbdoor
// @match        https://*.reddit.com/*
// @version      0.1
// @author       altbdoor
// @run-at       document-end
// @homepageURL  https://github.com/altbdoor/userscripts
// @homepage     https://github.com/altbdoor/userscripts
// @updateURL    https://github.com/altbdoor/userscripts/raw/master/old-reddit.user.js
// @downloadURL  https://github.com/altbdoor/userscripts/raw/master/old-reddit.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=reddit.com
// ==/UserScript==

(() => {
  /**
    @param {HTMLAnchorElement[]} elems
   */
  const handleLinks = (elems) => {
    elems
      .filter((elem) => elem.textContent.trim() === "<image>")
      .forEach((elem) => {
        const parent = elem.parentElement;
        let linkUrl = elem.href;

        if (linkUrl.includes("preview.redd.it")) {
          linkUrl = linkUrl.replace("preview.redd.it", "i.redd.it");
        }

        const img = document.createElement("img");
        img.width = 200;
        img.src = elem.href;

        const imgLink = document.createElement("a");
        imgLink.href = linkUrl;
        imgLink.target = "_blank";
        imgLink.className = "old-reddit-link";
        imgLink.appendChild(img);

        const newline = document.createElement("br");
        parent?.appendChild(newline);
        parent?.appendChild(imgLink);
      });
  };

  handleLinks(
    /** @type {HTMLAnchorElement[]} */ ([...document.querySelectorAll("a")]),
  );

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) {
          continue;
        }

        const typedNode = /** @type {HTMLAnchorElement} */ (node);
        const query = `a:not(.old-reddit-link)`;
        const childrenLinks = /** @type {HTMLAnchorElement[]} */ ([
          ...typedNode.querySelectorAll(query),
        ]);

        if (typedNode.matches(query)) {
          childrenLinks.unshift(typedNode);
        }

        if (childrenLinks.length !== 0) {
          handleLinks(childrenLinks);
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
