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
  ];

  return allChangelogs;
};
