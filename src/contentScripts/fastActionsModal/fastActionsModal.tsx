import React, { useEffect } from 'react';
import { Settings, SettingsIsActive } from '../../interfaces/SettingsInterface';
import { loadSettings, saveSettings } from '../lib/SettingsHandler';
import { downloadStringAsFile } from '../lib/miscellaneous';

export const FastActionsModal = () => {
  const closeModal = () => {
    document.getElementById('GCTModal')!.style.display = 'none';
  };

  const handleIcsChange = async (event: any) => {
    let files = event.target.files;
    if (!files) return;

    const fileContents = [];
    for (let i = 0; i < files.length; i++) {
      fileContents.push(await files[i].text());
    }

    let combinedIcs = fileContents[0];
    let timeZones = [];
    if (combinedIcs.indexOf('BEGIN:VTIMEZONE') !== -1) {
      timeZones.push(
        combinedIcs.slice(combinedIcs.indexOf('TZID:') + 5, nextIndexOf(combinedIcs, new RegExp('\n|\r'), combinedIcs.indexOf('TZID:') + 5)),
      );
    }

    for (let i = 1; i < fileContents.length; i++) {
      let events = fileContents[i].slice(fileContents[i].indexOf('BEGIN:VEVENT'), fileContents[i].lastIndexOf('END:VEVENT') + 11);

      if (fileContents[i].indexOf('TZID:') !== -1) {
        let timeZoneId = fileContents[i].slice(
          fileContents[i].indexOf('TZID:') + 5,
          nextIndexOf(fileContents[i], new RegExp('\n|\r'), fileContents[i].indexOf('TZID:') + 5),
        );
        if (timeZones.indexOf(timeZoneId) === -1) {
          console.log('new timezone: ' + timeZoneId, timeZones);
          timeZones.push(timeZoneId);
          if (combinedIcs.indexOf('END:VTIMEZONE') === -1) {
            combinedIcs =
              combinedIcs.slice(0, combinedIcs.indexOf('BEGIN:VEVENT')) +
              fileContents[i].slice(0, fileContents[i].indexOf('BEGIN:VEVENT')) +
              combinedIcs.slice(combinedIcs.indexOf('BEGIN:VEVENT'));
          } else {
            combinedIcs =
              combinedIcs.slice(0, combinedIcs.indexOf('END:VTIMEZONE') + 13) +
              '\r\n' +
              fileContents[i].slice(fileContents[i].indexOf('BEGIN:VTIMEZONE'), fileContents[i].indexOf('END:VTIMEZONE') + 13) +
              combinedIcs.slice(combinedIcs.indexOf('END:VTIMEZONE') + 13);
          }
        }
      }

      combinedIcs =
        combinedIcs.slice(0, combinedIcs.lastIndexOf('END:VEVENT') + 11) + events + combinedIcs.slice(combinedIcs.lastIndexOf('END:VEVENT') + 11);
    }
    // remove empty lines and \n to CRLF
    combinedIcs = combinedIcs
      .replace(/^\s*[\r\n]/gm, '')
      .replace(/\n/g, '\r\n')
      .replace(/\r\r\n/g, '\r\n');

    downloadStringAsFile(combinedIcs, 'combined.ics');

    // reset input to no selected file
    event.target.value = '';
  };

  const openSettings = () => {
    chrome.runtime.sendMessage('GCTopenOptionsPage');
  };

  return (
    <div
      className="modal-content"
      id="GCToolsMenueBody"
      style={{
        borderRadius: '10px',
        backgroundColor: 'var(--gm3-sys-color-surface-container-high)',
        color: 'var(--gm3-sys-color-on-surface-variant)',
      }}
    >
      <span className="close" style={{ position: 'relative', top: '-13px' }} onClick={closeModal}>
        &times;
      </span>
      <h2>Toolset for Google Calendar™</h2>
      <h3 className="O1gyfd">ics Combiner</h3>
      <p>
        This combines multiple .ics (iCal) files into one, that then can be imported into Google Calendar™ using the native import functionallity.
      </p>
      <div
        className="container"
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
        }}
      >
        <div
          className="Trypk"
          tabIndex={0}
          role="button"
          aria-label="Datei von meinem Computer auswählen"
          style={{ width: '50%', border: '1px solid var(--gm-hairlinebutton-outline-color,rgb(218,220,224))' }}
        >
          <label className="IZXV0b">
            <i className="google-material-icons meh4fc hggPq CJ947" aria-hidden="true">
              file_upload
            </i>
            <span>Select the .ics files to combine</span>
            <input type="file" accept=".ics" multiple className="xBQ53c" name="filename" onChange={handleIcsChange} />
          </label>
        </div>
        <div id="linkToImporter" style={{ width: '50%', display: 'flex', justifyContent: 'center' }}>
          <GoogleButtonBlueOutline text="Open Importer" onClick={() => window.open('https://calendar.google.com/calendar/u/0/r/settings/export')} />
        </div>
      </div>
      <h3 className="O1gyfd">Switch Features On/Off</h3>
      <div className="GCToolsMenueItem">
        <div className="GCToolsMenueItem">
          <p>Get more information about the features and additional customization options on the option page.</p>
          <div className="grid grid-cols-2">
            <FastSettingsToggle feature="calcDuration_isActive" name="Display Event-Duration" />
            <FastSettingsToggle feature="hoverInformation_isActive" name="Information On Hover" />
            <FastSettingsToggle feature="removeGMeets_isActive" name="Remove GMeeting Buttons" />
            <FastSettingsToggle feature="indicateAllDayEvents_isActive" name="Indicate Full and Multi-Day Events" />
          </div>
        </div>
      </div>
      <GoogleButtonBlueOutline text="Open Options Page" onClick={openSettings} />
    </div>
  );
};

const FastSettingsToggle = (props: { feature: keyof SettingsIsActive; name: string }) => {
  const [settings, setSettings] = React.useState<Settings>({} as Settings);

  useEffect(() => {
    loadSettings().then((settings) => {
      setSettings(settings);
    });
  }, []);

  useEffect(() => {
    saveSettings({ [props.feature]: settings[props.feature] });
  }, [settings]);

  const toggleFeature = (feature: keyof SettingsIsActive) => {
    console.log(settings);
    console.log('toggleFeature', feature, settings[feature]);
    setSettings({ ...settings, [feature]: !settings[feature] });
  };

  return (
    <div className="block" style={{ marginBottom: '10px' }}>
      {settings && settings[props.feature] !== undefined && (
        <div>
          <input type="checkbox" id={props.feature} onChange={() => toggleFeature(props.feature)} checked={settings[props.feature]} />
          <label htmlFor={props.feature}>{props.name}</label>
        </div>
      )}
    </div>
  );
};

const GoogleButtonBlueOutline = (props: { text: string; onClick: () => void }) => {
  return (
    <button className="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-INsAgc VfPpkd-LgbsSe-OWXEXe-dgl2Hf Rj2Mlf" onClick={props.onClick}>
      <span className="VfPpkd-vQzf8d">{props.text}</span>
    </button>
  );
};

function nextIndexOf(str: string, search: string | RegExp, start: number) {
  return typeof search === 'string' ? str.indexOf(search, start) : regexIndexOf(str, search, start);
}

function regexIndexOf(string: string, regex: RegExp, startpos: number = 0) {
  var indexOf = string.substring(startpos).search(regex);
  return indexOf >= 0 ? indexOf + startpos : indexOf;
}
