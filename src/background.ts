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
  if (details.reason == 'update') {
    chrome.tabs.create({ url: 'changelog/changelog.html' });
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request === 'GCTopenOptionsPage') {
    openSettings();
  }
});

chrome.runtime.setUninstallURL('https://forms.gle/4Cz8mugpeky6EE9j7');