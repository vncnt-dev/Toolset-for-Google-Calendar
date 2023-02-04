import React from 'react';
import { settings, saveSettings } from '../lib/SettingsHandler';

export const FastActionsModal = () => {
  const closeModal = () => {
    document.getElementById('GCTModal')!.style.display = 'none';
  };

  const handleFilesChange = async (event: any) => {
    let files = event.target.files;
    if (!files) return;
    let ical;
    if (files.length > 1) {
      // get content of all files in array
      const fileContents = [];
      for (let i = 0; i < files.length; i++) {
        fileContents.push(await files[i].text());
      }

      // merge
      ical = fileContents.join('\n');
      ical = ical.replace(/BEGIN:VCALENDAR/g, '');
      ical = ical.replace(/END:VCALENDAR/g, '');
      ical = 'BEGIN:VCALENDAR' + ical + 'END:VCALENDAR';
      ical = ical.replace(/END:VEVENT[\s\S]*?BEGIN:VEVENT/g, 'END:VEVENT\nBEGIN:VEVENT');
    } else {
      ical = await files[0].text();
    }
    // reset input to no selected file
    event.target.value = '';

    /* https://calendar.google.com/calendar/u/0/r/settings/export */
    let googleImporter = document.createElement('div');
    googleImporter.innerHTML = `
          <form jsname="GBqgNb" method="POST" enctype="multipart/form-data">
            <input type="file" class="xBQ53c" name="filename" jsname="nGoat">
          </form>
          <span jsname="V67aGc" style="display: none;" id="googleImporter" ></span>`;

    // set ical file as value of input
    googleImporter.querySelector('input')!.value = ical;
    googleImporter.click();
  };

  const handleiInfoOnHoverClick = (event: any) => {
    settings.hoverInformation_isActive = (event.target! as HTMLInputElement).checked!;
    saveSettings(settings);
  };

  const openSettings = () => {
    chrome.runtime.sendMessage('GCTopenOptionsPage');
  };

  return (
    <div className="modal-content" id="GCToolsMenueBody" style={{ borderRadius: '10px' }}>
      <span className="close" style={{ position: 'relative', top: '-13px' }} onClick={closeModal}>
        &times;
      </span>
      <h2>Toolset for Google Calendar™</h2>
      <h3 className="O1gyfd">Ical Importer</h3>
      <p>This Importer allows you to easily import multiple iCalendar files into Google Calendar.</p>
      <input type="file" accept=".ics" multiple onChange={handleFilesChange} />
      <h3 className="O1gyfd">Fast Access Settings</h3>
      <div className="GCToolsMenueItem">
        <div className="GCToolsMenueItem">
          <div className="form-field">
            <input type="checkbox" id="infoOnHover" onChange={handleiInfoOnHoverClick} />
            <label htmlFor="infoOnHover">Information On Hover</label>
          </div>
        </div>
      </div>
      <button className="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-INsAgc VfPpkd-LgbsSe-OWXEXe-dgl2Hf Rj2Mlf" onClick={openSettings}>
        <span className="VfPpkd-vQzf8d">Open Settings</span>
      </button>
    </div>
  );
};
