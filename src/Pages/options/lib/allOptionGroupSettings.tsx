import React from 'react';
import { useBetween } from 'use-between';
import { OptionGroupSettings } from '../../../interfaces/optionGroupSettingsInterface';
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
      id: 'removeGMeets',
      titel: 'Remove GMeeting Buttons',
      text: (
        <div>
          <p>
            Removes the Google Meet™ buttons from the event details page and the quick add dialog. This is useful if you don't use Google Meet™.
          </p>

        </div>
      ),
      toggleSettings: 'removeGMeets_isActive',
      pictureURLs: [],
    },
    {
      id: 'indicateAllDayEvents',
      titel: 'Indicate All- and Multi-Day Events',
      text: (
        <div>
          <p>Displays all-day and multi-day events in the day and week views by adding the event to the background of the main calendar.</p>
          <p className="mt-2">
            The transparency of the indicator depends on the event duration. You can set a minimum (&gt;=30 days) and a maximum (1 day) transparency.
          </p>
          <div className="flex mt-4">
            <label className="input-group">
              <span
                className="w-2/5"
                style={{
                  backgroundColor: `rgb(25 115 230 /${sharedSettings.indicateAllDayEvents_minTransparency})`,
                  color: `${sharedSettings.indicateAllDayEvents_minTransparency > 0.5 ? 'white' : 'black'}`,
                }}
              >
                min. transparency
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={sharedSettings.indicateAllDayEvents_minTransparency * 100}
                className="range range-lg rounded-none"
                step="5"
                onChange={(e) => {
                  updateSharedSettings({
                    indicateAllDayEvents_minTransparency: parseInt(e.target.value) / 100,
                  });
                }}
              />
            </label>
            <span className="w-1/10 rounded text-center font-bold ml-2 w-14">
              {Math.round(sharedSettings.indicateAllDayEvents_minTransparency * 100) + '%'}
            </span>
          </div>
          <div className="flex mt-4">
            <label className="input-group">
              <span
                className="w-2/5"
                style={{
                  backgroundColor: `rgb(25 115 230 /${sharedSettings.indicateAllDayEvents_maxTransparency})`,
                  color: `${sharedSettings.indicateAllDayEvents_maxTransparency > 0.5 ? 'white' : 'black'}`,
                }}
              >
                max. transparency
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={sharedSettings.indicateAllDayEvents_maxTransparency * 100}
                className="range range-lg rounded-none"
                step="5"
                onChange={(e) => {
                  updateSharedSettings({
                    indicateAllDayEvents_maxTransparency: parseInt(e.target.value) / 100,
                  });
                }}
              />
            </label>
            <span className="w-1/10 rounded text-center font-bold ml-2 w-14">
              {Math.round(sharedSettings.indicateAllDayEvents_maxTransparency * 100) + '%'}
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
                value={sharedSettings.indicateAllDayEvents_maxWidth}
                className="range range-lg rounded-none"
                step="5"
                onChange={(e) => {
                  updateSharedSettings({
                    indicateAllDayEvents_maxWidth: e.target.value,
                  });
                }}
              />
            </label>
            <span className="w-1/10 rounded text-center font-bold ml-2 w-14">{sharedSettings.indicateAllDayEvents_maxWidth + '%'}</span>
          </div>
        </div>
      ),
      toggleSettings: 'indicateAllDayEvents_isActive',
      pictureURLs: ['./images/indicateAllDayEvents_1.jpg'],
    },
    {
      id: 'exportAsIcs',
      titel: 'Export Event As Ics/iCal',
      text: (
        <div>
          <p>
            Adds a button to the event details page to export the event as ICS/iCal. <br></br>
            This allows you to import the event into other calendar applications.
          </p>
        </div>
      ),
      toggleSettings: 'exportAsIcs_isActive',
      pictureURLs: ['./images/exportAsIcs_1.jpg'],
    },
    {
      id: 'changelog',
      titel: 'Open Changelog-Page After Update',
      text: (
        <div>
          Opens this <a href="/changelog/changelog.html"
          className='font-bold text-blue-500'
          >changelog page</a> after an update.
        </div>
      ),
      toggleSettings: 'showChangeLog_isActive'
    },
    {
      id: 'logging',
      titel: 'Enable Logging',
      text: (
        <div>
          <p>
            Enables logging of the extension. This is useful for debugging and development purposes.
          </p>
          <p className="mt-2">
            The logs are stored in the browser console and can be accessed by pressing F12 or Ctrl+Shift+I.
          </p>
        </div>
      ),
      toggleSettings: 'isLoggingEnabled'
    },
  ];

  return allOptionGroupSettings;
};
