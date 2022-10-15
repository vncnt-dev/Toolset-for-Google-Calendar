function openSettings() {
  chrome.runtime.openOptionsPage();
}

chrome.action.onClicked.addListener(function (tab) {
  openSettings();
});

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason == 'install') {
    openSettings();
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request === 'GCTopenOptionsPage') {
    openSettings();
  }
});

//chrome.runtime.setUninstallURL('');