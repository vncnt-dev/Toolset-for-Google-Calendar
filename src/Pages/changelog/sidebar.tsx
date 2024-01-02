import React from 'react';
import { Changelog } from '../../interfaces/changelogInterface';
import { getAllChangelogs } from './lib/getAllChangelogs';

export const Sidebar = () => {
  let allChangelogGroupSettings = getAllChangelogs();
  return (
    <ul className="steps steps-vertical">
      {getAllChangelogs().reverse().map((changelog: Changelog, index: number) => {
        return (
          <li data-content="" className="step" id={'nav_v' + changelog.version} key={index}>
            <a
              href={'#v' + changelog.version}
              className="text-base"
              onClick={() => {
                // remove all other active classes
                allChangelogGroupSettings.forEach((element: Changelog) => {
                  document.getElementById('nav_v' + element.version)?.classList.remove('step-neutral');
                });
                document.getElementById('nav_v' + changelog.version)?.classList.add('step-neutral');
              }}
            >
              {changelog.version}
            </a>
          </li>
        );
      })}
    </ul>
  );
};
