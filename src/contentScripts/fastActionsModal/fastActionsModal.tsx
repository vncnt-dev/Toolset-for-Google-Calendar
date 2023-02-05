import React from 'react';
import { Settings, SettingsIsActive } from '../../interfaces/SettingsInterface';
import { settings, saveSettings } from '../lib/SettingsHandler';

export const FastActionsModal = () => {
  const closeModal = () => {
    document.getElementById('GCTModal')!.style.display = 'none';
  };

  const handleIcsChange = async (event: any) => {
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
    document.getElementById('sendICS')!.click();
  };

  const toggleFeature = (feature: keyof SettingsIsActive) => {
    settings[feature] = !settings[feature];
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

      <div className="Trypk" tabIndex={0} role="button" aria-label="Datei von meinem Computer auswählen">
        <label className="IZXV0b">
          <i className="google-material-icons meh4fc hggPq CJ947" aria-hidden="true">
            file_upload
          </i>
          <span>Select .ics Files</span>
          <input type="file" accept=".ics" multiple className="xBQ53c" name="filename" onChange={handleIcsChange} />
          {/* @ts-ignore: because of jscontroller */}
          <button className="hidden" id="sendICS" jscontroller="soHxf" jsaction="click:cOuCgd;" jsname="N8B8lb"></button>
        </label>
      </div>

      <h3 className="O1gyfd">Switch Features On/Off</h3>
      <div className="GCToolsMenueItem">
        <div className="GCToolsMenueItem">
          <p>Get more information about the features and additional customization options on the option page.</p>
          <div className="grid grid-cols-2">
            <div className="block">
              <input
                type="checkbox"
                id="infoOnHover"
                onChange={() => toggleFeature('calcDuration_isActive')}
                checked={settings['calcDuration_isActive']}
              />
              <label htmlFor="infoOnHover">Display Event-Duration</label>
            </div>
            <div className="block">
              <input
                type="checkbox"
                id="infoOnHover"
                onChange={() => toggleFeature('hoverInformation_isActive')}
                checked={settings['hoverInformation_isActive']}
              />
              <label htmlFor="infoOnHover">Information On Hover</label>
            </div>
            <div className="block">
              <input
                type="checkbox"
                id="infoOnHover"
                onChange={() => toggleFeature('betterAddMeeting_isActive')}
                checked={settings['betterAddMeeting_isActive']}
              />
              <label htmlFor="infoOnHover">Better Add Meeting Buttons</label>
            </div>
            <div className="block">
              <input
                type="checkbox"
                id="infoOnHover"
                onChange={() => toggleFeature('indicateFullDayEvents_isActive')}
                checked={settings['indicateFullDayEvents_isActive']}
              />
              <label htmlFor="infoOnHover">Indicate Full Day Events</label>
            </div>
          </div>
        </div>
      </div>
      <button className="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-INsAgc VfPpkd-LgbsSe-OWXEXe-dgl2Hf Rj2Mlf" onClick={openSettings}>
        <span className="VfPpkd-vQzf8d">Open Options Page</span>
      </button>
    </div>
  );
};
