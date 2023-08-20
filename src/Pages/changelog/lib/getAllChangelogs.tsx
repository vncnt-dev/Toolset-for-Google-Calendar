import React from 'react';
import { Changelog } from '../../../interfaces/changelogInterface';

export const getAllChangelogs = (): Changelog[] => {
  let allChangelogs: Changelog[] = [
    {
      version: '1.2.0',
      titel: 'v1.2.0 - Bugfixes and export as ics/iCal',
      text: (
        <div>
          This update fixes some bugs and adds the possibility to export individual events as ics/iCal file. <br />
          The feature is enabled by default but can be disabled in the settings.
        </div>
      ),
    },
  ];

  return allChangelogs;
};
