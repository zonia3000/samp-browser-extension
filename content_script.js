// Chrome has a chrome variable instead of a browser variable.
// Firefox has both.
let isChrome = typeof browser === 'undefined';

var runtime = isChrome ? chrome.runtime : browser.runtime;

/* Receive background script response and forward them to the page script */
runtime.onMessage.addListener(function (response) {
    let message = {
        xhrId: response.xhrId,
        responseText: response.responseText
    };
    window.postMessage({
        direction: "from-content-script",
        message: message
    }, "*");
});

// Event factory function used to communicate from the page script to the
// background script and viceversa
function xhrEventListenerFactory() {
    return function (e) {
        // send message to extension the background script
        runtime.sendMessage({
            type: e.type,
            detail: e.detail
        });
    };
}

// Register all available events
document.addEventListener('newXhr', xhrEventListenerFactory());
document.addEventListener('xhrSetContentType', xhrEventListenerFactory());
document.addEventListener('xhrOpen', xhrEventListenerFactory());
document.addEventListener('xhrSend', xhrEventListenerFactory());
document.addEventListener('xhrAbort', xhrEventListenerFactory());

// Trigger loaded event for page script
if (isChrome) {
    window.dispatchEvent(new CustomEvent('message', {
        detail: 'SampBrowserExtensionLoaded'
    }));
} else {
    window.postMessage({
        direction: "from-content-script",
        message: 'SampBrowserExtensionLoaded'
    }, "*");
}
