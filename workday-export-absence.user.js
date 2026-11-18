// ==UserScript==
// @name         Workday export absence
// @namespace    altbdoor
// @match        https://www.myworkday.com/*
// @grant        GM_setClipboard
// @version      0.4
// @author       altbdoor
// @run-at       document-start
// @updateURL    https://github.com/altbdoor/userscripts/raw/master/workday-export-absence.user.js
// @downloadURL  https://github.com/altbdoor/userscripts/raw/master/workday-export-absence.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=workday.com
// ==/UserScript==

/**
  @typedef {XMLHttpRequest & { __url?: string }} XHRWithUrl
 */

/**
  @typedef {Object} EventData
  @property {string} title
  @property {string} owner
  @property {Date} startDate
  @property {Date} endDate
 */

/**
  @typedef {{ [key: string]: EventData[] }} EventDataMap
 */

(() => {
  /** @type {EventDataMap} */
  let memoryEventsPerUser = {};

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (
    _method,
    url,
    _async,
    _user,
    _password,
  ) {
    /** @type {XHRWithUrl} */
    const self = this;
    self.__url = url;
    return originalOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (_body) {
    this.addEventListener("readystatechange", function () {
      /** @type {XHRWithUrl} */
      const self = this;

      if (self.readyState !== 4) {
        return;
      }

      try {
        const url = self.__url || "";

        if (!url.includes(".htmld")) {
          return;
        }

        const json = JSON.parse(self.responseText);
        handleJsonData(json);
      } catch (err) {
        console.error("error:", err);
      }
    });

    return originalSend.apply(this, arguments);
  };

  const handleJsonData = (data) => {
    /** @type {any[]} */
    const children = data.body?.children ?? [];
    const calendarWidget = children.find((el) => el.widget === "calendar");

    if (!calendarWidget) {
      return;
    }

    /** @type {any[]} */
    const events = calendarWidget.consolidatedList?.children ?? [];

    /** @type {EventData[]} */
    const validEvents = events
      .filter((evt) => evt.style.value === "approved")
      .map((evt) => {
        /** @type {string} */
        let title = evt.blockIdentifier?.value ?? "unknown event";
        title = title.replace(/[A-Za-z0-9]{32}Approved$/, "");
        title = title.replace(/- Time Off$/i, "");
        title = title.trim();

        const owner =
          evt.owner?.header?.instances?.at(0)?.text ?? "unknown user";

        const { Y, M, D } = evt.date?.value ?? {};
        const startDate = new Date(
          parseInt(Y, 10),
          parseInt(M, 10) - 1,
          parseInt(D, 10),
        );
        startDate.setHours(0, 0, 0);

        const subDays = parseFloat(evt.quantity?.value ?? "1.0");
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + subDays * 24);

        return {
          title,
          owner,
          startDate,
          endDate,
        };
      });

    // inefficient remap, to group better in future?
    memoryEventsPerUser = validEvents.reduce((acc, val) => {
      if (!(val.owner in acc)) {
        acc[val.owner] = [];
      }

      acc[val.owner].push(val);
      return acc;
    }, /** @type {EventDataMap} */ ({}));

    let fullText = [];
    Object.entries(memoryEventsPerUser).map(([owner, events]) => {
      fullText = fullText.concat([
        `## ${owner}`,
        "",
        "| Person | Event | Date |",
        "| --- | --- | --- |",
      ]);

      events.forEach((evt) => {
        const startDate = evt.startDate.toLocaleDateString("en-MY", {
          day: "2-digit",
          month: "short",
        });

        fullText.push(`| ${owner} | ${evt.title} | ${startDate} |`);
      });

      fullText.push("");
    });

    GM_setClipboard(fullText.join("\n").trim());
  };
})();
