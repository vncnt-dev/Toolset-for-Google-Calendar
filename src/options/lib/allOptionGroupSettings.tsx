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
            <li>Jitsi</li>
          </ul>
        </div>
      ),
      toggleSettings: 'betterAddMeeting_isActive',
      pictureURLs: ['./images/betterAddMeeting_1.jpg'],
    },
    {
      id: 'indicateFullDayEvents',
      titel: 'Indicate Full Day Events',
      text: <div>Displays full-day and multi-day events in the day and week views by adding the event to the background of the main calendar.</div>,
      toggleSettings: 'indicateFullDayEvents_isActive',
      pictureURLs: ['./images/indicateFullDayEvents_1.jpg'],
    },
  ];

  return allOptionGroupSettings;
};
