// ==UserScript==
// @name        Force GPT3
// @namespace   altbdoor
// @match       https://chatgpt.com/*
// @grant       none
// @version     1.2
// @author      altbdoor
// @run-at      document-start
// @updateURL   https://github.com/altbdoor/userscripts/raw/master/force-gpt3.user.js
// @downloadURL https://github.com/altbdoor/userscripts/raw/master/force-gpt3.user.js
// ==/UserScript==

// https://blog.logrocket.com/intercepting-javascript-fetch-api-requests-responses/
const originalFetch = unsafeWindow.fetch;

unsafeWindow.fetch = async (url, config) => {
    if (url.includes('/backend-api/conversation') && config.method === 'POST') {
        try {
            const body = JSON.parse(config.body);
            config.body = JSON.stringify({
                ...body,
                model: 'text-davinci-002-render-sha',
            });
        } catch (error) {
            console.error('Error parsing JSON body:', error);
        }
    }

    const response = await originalFetch(url, config);
    return response;
};
