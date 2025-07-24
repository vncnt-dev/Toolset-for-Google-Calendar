import React from 'react';
import { Changelog } from '../../../interfaces/changelogInterface';

export const getAllChangelogs = (): Changelog[] => {
  let allChangelogs: Changelog[] = [
    {
      version: '1.2.0',
      titel: 'v1.2.0 - Bugfixes and ics/iCal functionality',
      text: (
        <div>
          This update fixes bugs and adds the functionality to:
          <br />
          <ul className="list-disc list-inside">
            <li>export individual events as ics/iCal file</li>
            <li>combine multiple ics-files to one ics file, that can be imported into Google Calendar™ using the nativ import function</li>
          </ul>
        </div>
      ),
    },
    {
      version: '1.3.0',
      titel: 'v1.3.0 - Bugfixes f.e. for "Indicate All- and Multi-Day Events"',
      text: (
        <div>
          This update fixes multiple bugs especially for the "Indicate All- and Multi-Day Events" functionality.
          <br />
          The indicator should now start and end at the correct time.
        </div>
      ),
    },
    {
      version: '1.4.0',
      titel: 'v1.4.0 - Fixes functionality ',
      text: <div>This update restores the functionality for most Features after a Google Calender Update broke the extension.</div>,
    },
    {
      version: '1.5.0',
      titel: 'v1.5.0 - Improves stability and fixes functionality ',
      text: <div>This update improves the stability and fixes bugs introduced by some smaller changes in the Google Calendar™ code.</div>,
    },
    {
      version: '1.5.1',
      titel: 'v1.5.1 - fixes "Information On Hover" functionality ',
      text: <div>The "Information On Hover" had a bug that caused the hover information to be one hour off. This update should fix this issue.</div>,
    },
    {
      version: '1.6.2',
      titel: 'v1.6.2 - Adds event descriptions in "Information On Hover", bugfixes to "Indicate All- and Multi-Day Events" and more',
      text: (
        <div>
          This add the following features:
          <ul className="list-disc list-inside">
            <li>Show descriptions of events in the "Information On Hover" functionality</li>
          </ul>
          Additionally, it fixes these bugs and improves the stability of the extension.
          <ul className="list-disc list-inside">
            <li>
              The "Indicate All- and Multi-Day Events" functionality sometimes had problems displaying the indicators correctly, this is now fixed.
            </li>
            <li>Users that use multiple accounts can now use this extension for all accounts</li>
            <li>Unicode characters in event names and descriptions are now correctly displayed</li>
            <li>The support for the Google Calendar™ dark mode has been improved</li>
          </ul>
        </div>
      ),
    },
    {
      version: '1.6.3',
      titel: 'v1.6.3 -  Added Logging functionality for better debugging',
      text: (
        <div>
          This update adds an optional logging functionality to the extension, which helps to debug issues more easily. <br />
          The logging can be enabled in the extension settings and is off by default.
        </div>
      ),
    },
  ];

  return allChangelogs;
};
