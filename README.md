# SAMP Browser Extension

This repository contains a browser extension that handle SAMP XMLHttpRequests inside the extension background script. In this way it is possible to bypass the same-origin policy and the mixed-content issue (http calls from a https page).

Even if the [browser extension standard](https://browserext.github.io/browserext/) has been used, we encountered some different behaviors between Firefox and Chrome (see "SAMP Extension developer notes" section).

Tested on:

* Chrome 77
* Firefox 69

## Installation

Following sub-sections describe how to manually install an extension. Easier installation from the official browser extension repository could be provided registering the extension.

### Firefox

Zip the content of this repository (e.g. `zip samp-browser-extension.zip *.js *.json`), then:

Open a new tab and enter `about:debugging`

Select "This Firefox" --> "Load Temporary Add-on"

### Chrome

Menu --> More Tool --> Extensions --> Load unpacked --> Select repository folder

## SAMP Developer notes

Small changes are necessary to your SAMP web applications.

Include the samp extension caller script and a slightly modified version of the samp.js script (you can find these files in this repository: https://github.com/zonia3000/sampjs)

    <script src="samp-extension-caller.js"></script>
    <script src="samp.js"></script>

Then it is necessary to wait the loading of the extension before calling samp.js functions. This can be done listening for the `SampBrowserExtensionLoaded` event:

    document.addEventListener('SampBrowserExtensionLoaded', event => {
        // Your SAMP code here:
        connector = new samp.Connector("Sender");
    });

Have a look at the extension-examples folder to see the modified version of official samp.js examples.

## SAMP Extension Developer notes

### Extension workflow

In samp.js the `XmlRpcClient.createXHR` function creates an XHR facade. This function has been modified adding a facade provided by the samp-extension-caller.js script.

All the XHR functions are translated into asynchrous [custom events](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent) that the extension content script can listen. The content script then communicates with the background script using the [runtime API](https://developer.mozilla.org/it/docs/Mozilla/Add-ons/WebExtensions/API/runtime).

    page script <--> content script <--> background script

Differences encountered between Firefox and Chrome:

* Runtime API has different prefix (`browser.runtime` vs `chrome.runtime`)
* Firefox allows cross-origin requests also from the content script, while Chrome not. For this reason all the XHR requests are performed from the background script (...).
* Chrome allows passing XHR data inside a CustomEvent from the content script to the page script, while Firefox not (it is necessary to use the `window.postMessage` function).

On manifest.json it is necessary to add the "*://localhost/*" [permission](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/permissions) in order to perform cross-origin requests from the background script.

### Development

For development on Firefox this tool is quite useful:

    web-ext run