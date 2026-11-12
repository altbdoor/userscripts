// ==UserScript==
// @name         GitHub assist
// @namespace    altbdoor
// @match        https://github.com/*
// @grant        GM.xmlHttpRequest
// @version      0.8
// @author       altbdoor
// @run-at       document-end
// @updateURL    https://github.com/altbdoor/userscripts/raw/master/github-assist.user.js
// @downloadURL  https://github.com/altbdoor/userscripts/raw/master/github-assist.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// ==/UserScript==

(function () {
  "use strict";
  const parser = new DOMParser();

  // https://github.com/foo/bar/pull/{int}/{others}
  const getCombinedCommitText = async () => {
    const urlParts = window.location.pathname.split("/");
    const [_blank, owner, name, _pull, prId, ..._others] = urlParts;

    let docText = "";
    try {
      const pageRes = await GM.xmlHttpRequest({
        url: `https://github.com/${owner}/${name}/pull/${prId}/commits`,
        method: "GET",
        nocache: true,
      });

      docText = pageRes.responseText;
    } catch (err) {
      console.error("failed to make request to get commits", err);
    }

    const doc = parser.parseFromString(docText, "text/html");
    const jsonElem = doc.querySelector(
      'script[type="application/json"][data-target="react-app.embeddedData"]',
    );

    if (!jsonElem) {
      console.error("cannot find data script element in commits page");
      return "";
    }

    let commitText = "";

    try {
      const jsonData = JSON.parse(jsonElem.textContent);
      const commits =
        jsonData["payload"]["pullRequestsCommitsRoute"]["commitGroups"];

      /** @type {string[]} */
      const text = commits
        .flatMap((el) => el.commits)
        .map((el) => el.bodyMessageHtml);

      commitText = text.join("\n\n");
    } catch (err) {
      console.error("unable to parse data in commits page as JSON", err);
    }

    return commitText;
  };

  setInterval(async () => {
    const queries = [
      // old style
      '[data-testid="mergebox-border-container"] textarea',
      // new style
      '[data-component="Portal"]:has(textarea) textarea[placeholder^="Add an optional"]',
    ].join(", ");

    /** @type {HTMLTextAreaElement[]} */
    const textBoxes = Array.from(document.querySelectorAll(queries));
    const textBox = textBoxes.find((elem) => elem.value === "");

    if (textBox && textBox.value === "") {
      const nextVal = await getCombinedCommitText();
      if (nextVal) {
        textBox.value = nextVal;
      }
    }
  }, 1_000);
})();
