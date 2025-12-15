// ==UserScript==
// @name         Workday export absence
// @namespace    altbdoor
// @match        https://www.myworkday.com/*
// @grant        none
// @version      0.2
// @author       altbdoor
// @grant        none
// @run-at       document-start
// @updateURL    https://github.com/altbdoor/userscripts/raw/master/workday-export-absence.user.js
// @downloadURL  https://github.com/altbdoor/userscripts/raw/master/workday-export-absence.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=workday.com
// ==/UserScript==

/**
  @typedef {XMLHttpRequest & { __url?: string }} XHRWithUrl
 */

(() => {
  /** @type {string[]} */
  let icsStr = [];

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

        try {
          const json = JSON.parse(self.responseText);
          handleJsonData(json);
        } catch (err) {
          throw err;
        }
      } catch (err) {
        console.error("error:", err);
      }
    });

    return originalSend.apply(this, arguments);
  };

  /** @param {Date} d */
  function dateToICSLocal(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  }

  const handleJsonData = (data) => {
    const username = data.currentUser?.label ?? "unknown user";

    /** @type {any[]} */
    const children = data.body?.children ?? [];
    const calendarWidget = children.find((el) => el.widget === "calendar");

    if (!calendarWidget) {
      return;
    }

    /** @type {any[]} */
    const events = calendarWidget.consolidatedList?.children ?? [];

    const validEvents = events
      .filter((evt) => evt.type?.instances?.at(0)?.text === "Time Off")
      .map((evt) => {
        /** @type {string} */
        let title = evt.title?.value ?? "unknown event";
        if (title.toLowerCase() === "annual leave") {
          title = username;
        }

        const { Y, M, D } = evt.date?.value ?? {};
        const startDate = new Date(
          parseInt(Y, 10),
          parseInt(M, 10) - 1,
          parseInt(D, 10),
        );
        startDate.setHours(0, 0, 0);

        const days = parseInt(evt.quantity?.value ?? "1", 10);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + days);

        return {
          title,
          startDate: dateToICSLocal(startDate),
          endDate: dateToICSLocal(endDate),
        };
      });

    /** @type {string[]} */
    icsStr = [];
    icsStr.push("BEGIN:VCALENDAR");
    icsStr.push("VERSION:2.0");
    icsStr.push("");

    validEvents.forEach((evt) => {
      icsStr.push("BEGIN:VEVENT");
      icsStr.push(
        `UID:${evt.startDate}_${evt.title.replace(/\s+/g, "_").toLowerCase()}`,
      );
      icsStr.push(`DTSTAMP:${evt.startDate}T000000Z`);
      icsStr.push(`DTSTART;VALUE=DATE:${evt.startDate}`);
      icsStr.push(`DTEND;VALUE=DATE:${evt.endDate}`);
      icsStr.push(`SUMMARY:${evt.title}`);
      icsStr.push("END:VEVENT");
      icsStr.push("");
    });

    icsStr.push("END:VCALENDAR");
  };

  window.addEventListener("keydown", (evt) => {
    if (evt.key !== "F3") {
      return;
    }

    if (icsStr.length === 0) {
      return;
    }

    evt.preventDefault();

    const blob = new Blob([icsStr.join("\r\n")], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);

    const linkElem = document.createElement("a");
    linkElem.href = url;
    linkElem.download = "timeoff.ics";

    document.body.appendChild(linkElem);
    linkElem.click();
    document.body.removeChild(linkElem);

    URL.revokeObjectURL(url);
  });
})();
