var SampBrowserExtension = (function() {

  // An unique id is associated to each xhr facade and they are stored into a map
  let xhrMap = {};

  // Listen from messages coming from the extension content script
  window.addEventListener("message", (event) => {
    let message;
    if (event.detail) {
      // Chrome
      message = event.detail;
    } else if (event.source == window && event.data &&
      event.data.direction == "from-content-script") {
      // Firefox
      message = event.data.message;
    }

    // Special case: the first message received identify that the extension is
    // ready. A new event is dispatched.
    if ('SampBrowserExtensionLoaded' === message) {
      document.dispatchEvent(new CustomEvent('SampBrowserExtensionLoaded'));
      return;
    }

    // Retrive the xhr facade from the map in order to setup the response values
    // and call the onload function on it
    let xhrId = message.xhrId;
    let xhr = xhrMap[xhrId];
    // Map cleanup
    delete xhrMap[xhrId];

    // For some reasons we can't rely on responseXML: we need to parse the response text
    let parser = new DOMParser();
    let responseXML = parser.parseFromString(message.responseText, "text/xml");

    xhr.responseText = message.responseText;
    xhr.responseXML = responseXML;
    // Return control to samp.js:
    xhr.onload();
  });

  // A xhr facade that delegates all the functions to the extension content
  // script throught CustomEvents
  XhrWrapper = function() {
    // Generate an unique id for the xhr facade
    let id = Math.random().toString(36);
    this.id = id;
    // save the new object into the map
    xhrMap[id] = this;
    // Tell to the extension content script that a new xhr is needed
    document.dispatchEvent(new CustomEvent('newXhr', {
      detail: {
        xhrId: id
      }
    }));
  };
  XhrWrapper.prototype.open = function(method, url) {
    let self = this;
    document.dispatchEvent(new CustomEvent('xhrOpen', {
      detail: {
        xhrId: self.id,
        method: method,
        url: url
      }
    }));
  };
  XhrWrapper.prototype.send = function(body) {
    let self = this;
    document.dispatchEvent(new CustomEvent('xhrSend', {
      detail: {
        xhrId: self.id,
        body: body
      }
    }));
  };
  XhrWrapper.prototype.setContentType = function(mimeType) {
    let self = this;
    document.dispatchEvent(new CustomEvent('xhrSetContentType', {
      detail: {
        mimeType: mimeType,
        xhrId: self.id
      }
    }));
  };
  XhrWrapper.prototype.abort = function() {
    document.dispatchEvent(new CustomEvent('xhrAbort', {
      detail: {
        xhrId: self.id
      }
    }));
  };

  /* Exports */
  return {
    // This function has to be called inside a modified samp.js version when
    // providing a xhr facade
    createXhrFacade: function() {
      return new XhrWrapper();
    }
  };
})();
