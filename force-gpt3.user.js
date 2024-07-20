// ==UserScript==
// @name        Force GPT3
// @namespace   altbdoor
// @match       https://chatgpt.com/*
// @grant       GM.setValue
// @grant       GM.getValue
// @version     1.4
// @author      altbdoor
// @run-at      document-start
// @updateURL   https://github.com/altbdoor/userscripts/raw/master/force-gpt3.user.js
// @downloadURL https://github.com/altbdoor/userscripts/raw/master/force-gpt3.user.js
// ==/UserScript==

// https://blog.logrocket.com/intercepting-javascript-fetch-api-requests-responses/
const originalFetch = unsafeWindow.fetch;

unsafeWindow.fetch = async (url, config) => {
    const gptModel = await GM.getValue(
        'gptModel',
        'text-davinci-002-render-sha',
    );

    if (
        gptModel !== 'auto' &&
        url.includes('/backend-api/conversation') &&
        config.method === 'POST'
    ) {
        try {
            const body = JSON.parse(config.body);
            config.body = JSON.stringify({
                ...body,
                model: gptModel,
            });
        } catch (error) {
            console.error('[force-gpt3] Error parsing JSON body:', error);
        }
    }

    const response = await originalFetch(url, config);
    return response;
};

document.addEventListener('DOMContentLoaded', async () => {
    // add style
    const style = document.createElement('style');
    style.innerHTML = `
        .toggleContainer {
            position: absolute; right: 12rem; top: 0.5rem;
        }
        .toggleContainer select {
            border-radius: 9999px;
        }
    `;
    document.head.append(style);

    // add dropdown
    const toggleContainer = document.createElement('div');
    toggleContainer.classList.add('toggleContainer');

    toggleContainer.innerHTML = `
        <select>
            <option value="auto">Auto</option>
            <option value="text-davinci-002-render-sha">GPT 3.5</option>
            <option value="gpt-4o-mini">GPT 4o mini</option>
        </select>
    `;
    document.body.appendChild(toggleContainer);

    const select = toggleContainer.querySelector('select');
    select.onchange = (evt) => {
        GM.setValue('gptModel', evt.target.value);
        console.log(`[force-gpt3] changing model to ${evt.target.value}`);
    };

    const selectVal = await GM.getValue(
        'gptModel',
        'text-davinci-002-render-sha',
    );
    select.value = selectVal;
});
