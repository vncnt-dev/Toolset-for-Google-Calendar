import React from 'react';
import { useBetween } from 'use-between';
import { OptionGroupSettings } from '../../interfaces/optionGroupSettingsInterface';
import { useShareableState } from './reactSettingsHandler';

export const getAllOptionGroupSettings = (): OptionGroupSettings[] => {
  const { sharedSettings, updateSharedSettings } = useBetween(useShareableState);

  let allOptionGroupSettings: OptionGroupSettings[] = [
    {
      id: 'general',
      titel: 'General Information',
      text: (
        <div>
          <b>Welcome</b> <br />
          This extension provides multiple small tools for the Google Calendar™. <br />
          You can click on the preview images to see a larger version.
        </div>
      ),
    },
    {
      id: 'calcDuration',
      titel: 'Display Event-Duration',
      text: (
        <div>
          Calculates and displays the event durations on the "by day", "by week" and "by month" view.
          <div className="form-control">
            <label className="input-group mt-4">
              <span className="w-1/5">Minimum duration</span>
              <input
                type="number"
                min="0"
                className="input input-bordered w-400 w-1/5"
                value={sharedSettings.calcDuration_minimumDurationMinutes}
                onChange={(e) => {
                  updateSharedSettings({
                    calcDuration_minimumDurationMinutes: e.target.value,
                  });
                }}
              />
              <span className="w-1/5">min.</span>
            </label>
            <label className="input-group mt-4">
              <span className="w-1/5">Format</span>
              <select
                className="select select-bordered w-2/5"
                value={sharedSettings.calcDuration_durationFormat}
                onChange={(e) => {
                  updateSharedSettings({
                    calcDuration_durationFormat: e.target.value,
                  });
                }}
              >
                <option value="hourMinutes">2h 30m</option>
                <option value="decimalHours">2.5 hours</option>
              </select>
            </label>
          </div>
        </div>
      ),
      toggleSettings: 'calcDuration_isActive',
      pictureURLs: ['./images/insertDuration.jpg'],
    },
    {
      id: 'hoverInformation',
      titel: 'Information On Hover',
      text: <div>Show information on hover "by day", "by week" and "by month" view.</div>,
      toggleSettings: 'hoverInformation_isActive',
      pictureURLs: ['./images/hoverOverInformation_1.jpg', './images/hoverOverInformation_2.jpg'],
    },
    {
      id: 'betterAddMeeting',
      titel: 'Better Add Meeting Buttons',
      text: (
        <div>
          <p>
            This places all (supported) add meeting buttons in one line and shortens the text. <br></br>
            You will still need to install the extension of the respective vendor to add the buttons in the first place. <br></br>
            currently supported:
          </p>
          <ul className="list-disc ml-5">
            <li>Google Meet</li>
            <li>
              Jitsi with the{' '}
              <a className="font-bold" href="https://chrome.google.com/webstore/detail/jitsi-meetings/kglhbbefdnlheedjiejgomgmfplipfeb">
                Jitsi Meetings extension
              </a>
            </li>
            <li>
              Zoom with the{' '}
              <a className="font-bold" href="https://chrome.google.com/webstore/detail/zoom-scheduler/kgjfgplpablkjnlkjmjdecgdpfankdle">
                Zoom Scheduler extension
              </a>
            </li>
          </ul>
        </div>
      ),
      toggleSettings: 'betterAddMeeting_isActive',
      pictureURLs: ['./images/betterAddMeeting_1.jpg'],
    },
    {
      id: 'indicateFullDayEvents',
      titel: 'Indicate Full Day Events',
      text: (
        <div>
          <p>Displays full-day and multi-day events in the day and week views by adding the event to the background of the main calendar.</p>
          <p className="mt-2">
            The transparency of the indicator depends on the event duration. You can set a minimum (&gt;=30 days) and a maximum (1 day) transparency.
          </p>
          <div className="flex mt-4">
            <label className="input-group">
              <span
                className="w-2/5"
                style={{
                  backgroundColor: `rgb(25 115 230 /${sharedSettings.indicateFullDayEvents_minTransparency})`,
                  color: `${sharedSettings.indicateFullDayEvents_minTransparency > 0.5 ? 'white' : 'black'}`,
                }}
              >
                min. transparency
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={sharedSettings.indicateFullDayEvents_minTransparency * 100}
                className="range range-lg rounded-none"
                step="5"
                onChange={(e) => {
                  updateSharedSettings({
                    indicateFullDayEvents_minTransparency: parseInt(e.target.value) / 100,
                  });
                }}
              />
            </label>
            <span className="w-1/10 rounded text-center font-bold ml-2 w-14">
              {Math.round(sharedSettings.indicateFullDayEvents_minTransparency * 100) + '%'}
            </span>
          </div>
          <div className="flex mt-4">
            <label className="input-group">
              <span
                className="w-2/5"
                style={{
                  backgroundColor: `rgb(25 115 230 /${sharedSettings.indicateFullDayEvents_maxTransparency})`,
                  color: `${sharedSettings.indicateFullDayEvents_maxTransparency > 0.5 ? 'white' : 'black'}`,
                }}
              >
                max. transparency
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={sharedSettings.indicateFullDayEvents_maxTransparency * 100}
                className="range range-lg rounded-none"
                step="5"
                onChange={(e) => {
                  updateSharedSettings({
                    indicateFullDayEvents_maxTransparency: parseInt(e.target.value) / 100,
                  });
                }}
              />
            </label>
            <span className="w-1/10 rounded text-center font-bold ml-2 w-14">
              {Math.round(sharedSettings.indicateFullDayEvents_maxTransparency * 100) + '%'}
            </span>
          </div>
          <p className="mt-4">By default, the indicators span the entire width, but this can be changed here.</p>
          <div className="flex mt-4">
            <label className="input-group">
              <span className="w-2/5">width</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sharedSettings.indicateFullDayEvents_maxWidth}
                className="range range-lg rounded-none"
                step="5"
                onChange={(e) => {
                  updateSharedSettings({
                    indicateFullDayEvents_maxWidth: e.target.value,
                  });
                }}
              />
            </label>
            <span className="w-1/10 rounded text-center font-bold ml-2 w-14">{sharedSettings.indicateFullDayEvents_maxWidth + '%'}</span>
          </div>
        </div>
      ),
      toggleSettings: 'indicateFullDayEvents_isActive',
      pictureURLs: ['./images/indicateFullDayEvents_1.jpg'],
    },
  ];

  return allOptionGroupSettings;
};
