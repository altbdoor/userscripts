// ==UserScript==
// @name        h264-google
// @namespace   h264-google
// @match       https://meet.google.com/*
// @match       https://*.youtube.com/*
// @version     0.1
// @author      altbdoor
// @grant       unsafeWindow
// @run-at      document-start
// ==/UserScript==

/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2020 altbdoor
 * Copyright (c) 2019 alextrv
 * Copyright (c) 2015 erkserkserks
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

function override() {
    // Override video element canPlayType() function
    var videoElem = document.createElement('video');
    var origCanPlayType = videoElem.canPlayType.bind(videoElem);
    videoElem.__proto__.canPlayType = makeModifiedTypeChecker(origCanPlayType);

    // Override media source extension isTypeSupported() function
    var mse = window.MediaSource;
    // Check for MSE support before use
    if (mse === undefined) return;
    var origIsTypeSupported = mse.isTypeSupported.bind(mse);
    mse.isTypeSupported = makeModifiedTypeChecker(origIsTypeSupported);

    // unsafeWindow.applesauce = 1
    // console.log('heyyyy', unsafeWindow)
    // var origGetUserMedia = unsafeWindow.navigator.mediaDevices.getUserMedia.bind(unsafeWindow.navigator.mediaDevices);
    // unsafeWindow.navigator.mediaDevices.getUserMedia = function (constraints) {
    //     console.log('aaaaaaaaaaaaaaa', constraints)
    //     return origGetUserMedia(constraints);
    //     // origUserMedia(...arguments)
    // }
}

// return a custom MIME type checker that can defer to the original function
function makeModifiedTypeChecker(origChecker) {
    // Check if a video type is allowed
    /**
     * @param {string} inputType
     * @returns {boolean}
     */
    function checkWrapper(inputType) {
        if (inputType === undefined) {
            return '';
        }

        var disallowedTypes = ['webm', 'vp8', 'vp9', 'vp09', 'av01'];

        // If video type is in disallowedTypes, say we don't support them
        if (disallowedTypes.some((disType) => inputType.includes(disType))) {
            return '';
        }

        var match = /framerate=(\d+)/.exec(inputType);
        if (match && parseInt(match[1], 10) > 30) {
            return '';
        }

        // Otherwise, ask the browser
        return origChecker(inputType);
    }

    return checkWrapper;
}

override();
