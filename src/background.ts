import { defaultSettings, loadSettings, saveSettings } from './contentScripts/lib/settingsHandler';

function openSettings() {
  chrome.runtime.openOptionsPage();
}

chrome.action.onClicked.addListener(function (tab) {
  openSettings();
});

chrome.runtime.onInstalled.addListener(async function (details) {
  if (details.reason == 'install') {
    saveSettings(defaultSettings);
    openSettings();
  }
  if (details.reason == 'update') {
    let settings = await loadSettings();
    saveSettings({ ...defaultSettings, ...settings });
    loadSettings().then((settings) => {
      if (settings.showChangeLog_isActive) chrome.tabs.create({ url: 'changelog/changelog.html' });
    });
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request === 'GCTopenOptionsPage') {
    openSettings();
  }
});

chrome.runtime.setUninstallURL('https://forms.gle/4Cz8mugpeky6EE9j7');
