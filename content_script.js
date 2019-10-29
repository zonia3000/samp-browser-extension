// Chrome has a chrome variable instead of a browser variable.
// Firefox has both.
let isChrome = typeof browser === 'undefined';

var runtime = isChrome ? chrome.runtime : browser.runtime;

// Event factory function used to communicate from the page script to the
// background script and viceversa
function xhrEventListenerFactory() {
  return function(e) {
    // send message to extension the background script
    runtime.sendMessage({
      type: e.type,
      detail: e.detail
    }, messageResponse => {
      // Receive background script response and in case of AJAX response
      // forward the response back to page script
      if (e.type === 'xhrSend') {
        let response = messageResponse[0];

        let message = {
          xhrId: response.xhrId,
          responseText: response.responseText,
          responseXML: response.responseXML
        };

        if (isChrome) {
          window.dispatchEvent(new CustomEvent('message', {
            detail: message
          }));
        } else {
          // In Firefox, dispatching an event containing the responseText will
          // result in a permission denied error. Right way to communicate back
          // to the page script is using window.postMessage. However, this
          // doesn't work in Chrome.
          // See also: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts#Communicating_with_the_web_page
          // and https://bugzilla.mozilla.org/show_bug.cgi?id=1294935
          window.postMessage({
            direction: "from-content-script",
            message: message
          }, "*");
        }
      }
    });
  }
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
