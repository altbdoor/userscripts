// ==UserScript==
// @name        aion-fast
// @namespace   altbdoor
// @match       https://www.aion-archives.net/*
// @grant       none
// @version     0.3
// @author      altbdoor
// @run-at      document-start
// @updateURL   https://github.com/altbdoor/userscripts/raw/master/aion-fast.user.js
// @downloadURL https://github.com/altbdoor/userscripts/raw/master/aion-fast.user.js
// ==/UserScript==

const originalLog = console.log;

const style = document.createElement("style");
style.textContent = `
  #fast-container {
    position: absolute;
    z-index: 9999;
    right: 0.5rem;
    top: 0.5rem;
    background-color: rgba(0, 0, 0, 0.8);
    padding: 0.5rem;
    max-height: calc(100vh - 1rem);
    overflow-y: auto;
    box-sizing: border-box;
    box-shadow: 0 0 0.25rem 0 #fff;
  }

  #fast-container * {
    box-sizing: border-box;
  }

  #fast-container h3 {
    margin: 0 0 0.5rem;
  }

  #fast-container > details > div {
    width: 40vw;
  }

  #fast-container input,
  #fast-container textarea {
    width: 100%;
    font-family: inherit;
    background-color: transparent;
    padding: 0.25rem;
    border: 1px solid rgba(255, 255, 255, 0.6);
    color: #fff;
    border-radius: 0.25rem;
    resize: vertical;
  }
`;

const fastElem = document.createElement("div");
fastElem.id = "fast-container";
fastElem.innerHTML = `
  <details open>
    <summary>Show/hide fast</summary>
    <div>
      <h3>Send four digit:</h3>
      <div>
        <input type="text" name="code" />
        <br />
        <small>Press <kbd>Enter</kbd> to submit.</small>
      </div>
      <hr />
      <h3>Send experiment code:</h3>
      <div>
        <input type="text" name="fen" />
        <br />
        <small>Press <kbd>Enter</kbd> to submit.</small>
      </div>
      <hr />
      <h3>Output:</h3>
      <textarea rows="20" readonly></textarea>
    </div>
  </details>
`;

function callBungaloo(input) {
  return fetch("https://qu4n7um-7ime-7unne7-4aa2.bungie.workers.dev/", {
    headers: {
      "Content-Type": "application/json",
      "X-Time-Badge": "timeTunnel346591457",
    },
    method: "POST",
    body: JSON.stringify({ input }),
  });
}

window.addEventListener("load", () => {
  document.head.appendChild(style);
  document.body.appendChild(fastElem);

  const [codeInputElem, fenInputElem] = [...fastElem.querySelectorAll("input")];
  const textareaElem = fastElem.querySelector("textarea");

  codeInputElem.addEventListener("keydown", async (evt) => {
    if (evt.key !== "Enter") {
      return;
    }

    evt.preventDefault();
    const inputVal = codeInputElem.value.trim();

    if (inputVal === "") {
      return;
    }

    textareaElem.value = "Loading...";
    try {
      const res = await callBungaloo(inputVal);
      if (!res.ok) {
        throw Error(`HTTP ${res.status}, failure`);
      }

      const jsonVal = await res.json();
      textareaElem.value = JSON.stringify(jsonVal, undefined, 2);
    } catch (err) {
      textareaElem.value = String(err);
    }
  });

  fenInputElem.addEventListener("keydown", async (evt) => {
    if (evt.key !== "Enter") {
      return;
    }

    evt.preventDefault();

    const codeVal = codeInputElem.value.trim();
    if (codeVal === "") {
      alert("Please input the code first!");
      return;
    }

    const inputVal = fenInputElem.value.trim();
    if (inputVal === "") {
      return;
    }

    textareaElem.value = "Loading...";
    try {
      const res = await callBungaloo(codeVal + inputVal);
      if (!res.ok) {
        throw Error(`HTTP ${res.status}, failure`);
      }

      const jsonVal = await res.json();
      textareaElem.value = JSON.stringify(jsonVal, undefined, 2);
    } catch (err) {
      textareaElem.value = String(err);
    }
  });
});
