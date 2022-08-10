import React from 'react';
import { OptionGroupSettings } from '../interfaces/optionGroupSettingsInterface';
import { getAllOptionGroupSettings } from './allOptionGroupSettings';

export const Sidebar = () => {
  let allOptionGroupSettings = getAllOptionGroupSettings();
  return (
    <ul className="steps steps-vertical">
      {getAllOptionGroupSettings().map((optionGroupSettings: OptionGroupSettings) => {
        return (
          <li data-content="" className="step" id={'nav_' + optionGroupSettings.id}>
            <a
              href={'#' + optionGroupSettings.id}
              className="text-base"
              onClick={() => {
                // remove all other active classes
                allOptionGroupSettings.forEach((element: OptionGroupSettings) => {
                  document.getElementById('nav_' + element.id)?.classList.remove('step-neutral');
                });
                document.getElementById('nav_' + optionGroupSettings.id)?.classList.add('step-neutral');
              }}
            >
              {optionGroupSettings.titel}
            </a>
          </li>
        );
      })}
    </ul>
  );
};
