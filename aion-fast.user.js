// ==UserScript==
// @name        aion-fast
// @namespace   altbdoor
// @match       https://www.aion-archives.net/*
// @grant       none
// @version     0.1
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
    right: 1rem;
    top: 1rem;
    background-color: rgba(0, 0, 0, 0.8);
    padding: 0.5rem;
  }

  #fast-container h3 {
    margin: 0;
  }

  #fast-container > details > div {
    width: 50vw;
  }

  #fast-container input,
  #fast-container textarea {
    width: 100%;
    font-family: monospace;
    background-color: transparent;
    padding: 0.25rem;
    border: 1px solid rgba(255, 255, 255, 0.6);
    color: #fff;
    border-radius: 0.25rem;
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
      <textarea rows="24" readonly></textarea>
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
    const inputVal = evt.currentTarget.value.trim();

    if (inputVal === "") {
      return;
    }

    textareaElem.value = "Loading...";
    const res = await callBungaloo(inputVal);
    const jsonVal = await res.json();
    textareaElem.value = JSON.stringify(jsonVal, undefined, 2);
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

    const inputVal = evt.currentTarget.value.trim();
    if (inputVal === "") {
      return;
    }

    textareaElem.value = "Loading...";
    const res = await callBungaloo(codeVal + inputVal);
    const jsonVal = await res.json();
    textareaElem.value = JSON.stringify(jsonVal, undefined, 2);
  });
});
