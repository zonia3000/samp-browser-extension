// Chrome and Firefox have a different prefix for the runtime API
var runtime = typeof chrome === 'undefined' ? browser.runtime : chrome.runtime;

// An unique id is associated to each xhr and they are stored into a map
var xhrMap = {};

// Receive the messages from the content script
runtime.onMessage.addListener(function(request, sender, sendResponse) {
  let payload = request.payload;
  let detail = request.detail;
  let response = null;
  let xhr = null;
  let waitReadyStateChange = false;

  switch (request.type) {
    case 'newXhr':
      xhr = new XMLHttpRequest();
      xhrMap[detail.xhrId] = xhr;
      xhr.onreadystatechange = (function(xhr) {
        return function() {
          if (xhr.readyState === 4 && +xhr.status === 200) {
            if (xhr.onload) {
              xhr.onload();
            }
            // Forward the AJAX response to the page script
            xhr.sendResponse([{
              xhrId: detail.xhrId,
              responseText: xhr.responseText,
              responseXML: xhr.responseXML
            }, null]);
          }
        };
      })(xhr);
      // function copied from samp.js
      xhr.onerror = (function(xhr) {
        return function(event) {
          if (!xhr.completed) {
            xhr.completed = true;
            if (xhr.onerror) {
              if (event) {
                event.toString = function() {
                  return "No hub?";
                };
              } else {
                event = "No hub?";
              }
              xhr.onerror(event);
            }
          }
        };
      })(xhr);
      // function copied from samp.js
      xhr.ontimeout = (function(xhr) {
        return function(event) {
          if (!xhr.completed) {
            xhr.completed = true;
            if (xhr.onerror) {
              xhr.onerror("timeout");
            }
          }
        };
      })(xhr);
      break;
    case 'xhrOpen':
      response = xhrMap[detail.xhrId].open(detail.method, detail.url, true);
      break;
    case 'xhrSetContentType':
      xhr = xhrMap[detail.xhrId];
      if ("setRequestHeader" in xhr) {
        xhr.setRequestHeader("Content-Type", detail.mimeType);
      }
      break;
    case 'xhrSend':
      xhr = xhrMap[detail.xhrId];
      // don't send the response back to the content script, instead wait for
      // the onreadystatechange function to be triggered
      waitReadyStateChange = true;
      // store the sendResponse function handler to the xhr itself
      xhr.sendResponse = sendResponse;
      xhrMap[detail.xhrId].send(detail.body);
      break;
    case 'xhrAbort':
      xhrMap[detail.xhrId].abort();
      break;
    default:
      throw "Unsupported event type: " + request.type;
  }

  if (!waitReadyStateChange) {
    sendResponse([response, null]);
  }
  return true;
});
