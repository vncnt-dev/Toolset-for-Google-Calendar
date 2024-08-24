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
    },{
      version: '1.4.0',
      titel: 'v1.4.0 - Fixes functionality ',
      text: (
        <div>
          This update restores the functionality for most Features after a Google Calender Update broke the extension.
        </div>
      ),
    },{
      version: '1.5.0',
      titel: 'v1.5.0 - Improves stability and fixes functionality ',
      text: (
        <div>
          This update improves the stability and fixes bugs introduced by some smaller changes in the Google Calendar™ code.
        </div>
      ),
    }
  ];

  return allChangelogs;
};
