// ==UserScript==
// @name         Workday export absence
// @namespace    altbdoor
// @match        https://www.myworkday.com/*
// @grant        GM_setClipboard
// @version      0.5
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

        if (
          title.toLowerCase().includes("time off") ||
          title.toLowerCase().includes("annual leave")
        ) {
          title = "Time off";
        } else if (title.toLowerCase().includes("sick")) {
          title = "Sick";
        } else if (title.toLowerCase().trim() === "work from elsewhere") {
          title = "WFE";
        } else {
          console.warn("uncategorized title for:", title);
          title = "Uncategorized";
        }

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

    /** @type {EventDataMap} */
    const eventsPerUser = validEvents.reduce((acc, val) => {
      if (!(val.owner in acc)) {
        acc[val.owner] = [];
      }

      acc[val.owner].push(val);
      return acc;
    }, /** @type {EventDataMap} */ ({}));

    /** @type {EventDataMap} */
    const groupedEvents = {};
    Object.keys(eventsPerUser).forEach((owner) => {
      groupedEvents[owner] = [];

      eventsPerUser[owner].forEach((evt, idx) => {
        // always fill first event
        if (idx === 0) {
          groupedEvents[owner].push({ ...evt });
          return;
        }

        // check current grouped events
        const currentOwnerEvents = groupedEvents[owner];
        const prevEvt = currentOwnerEvents[currentOwnerEvents.length - 1];

        // if the prev event is similar, replace the end date, and don't append
        if (
          prevEvt.endDate.getTime() === evt.startDate.getTime() &&
          prevEvt.title === evt.title
        ) {
          prevEvt.endDate = evt.endDate;
          return;
        }

        // else, always append
        groupedEvents[owner].push({ ...evt });
      });
    });

    let fullText = [];
    Object.entries(groupedEvents).map(([owner, events]) => {
      fullText = fullText.concat([
        `## ${owner}`,
        "",
        "| Person | Event | Date |",
        "| --- | --- | --- |",
      ]);

      events.forEach((evt) => {
        const startDateStr = evt.startDate.toLocaleDateString("en-MY", {
          day: "2-digit",
          month: "short",
        });

        const endDate = new Date(evt.endDate);
        endDate.setDate(endDate.getDate() - 1);
        const endDateStr = endDate.toLocaleDateString("en-MY", {
          day: "2-digit",
          month: "short",
        });

        let dateStr = `${startDateStr} - ${endDateStr}`;
        if (startDateStr === endDateStr) {
          dateStr = startDateStr;
        }

        fullText.push(`| ${owner} | ${evt.title} | ${dateStr} |`);
      });

      fullText.push("");
    });

    GM_setClipboard(fullText.join("\n").trim());
  };
})();
