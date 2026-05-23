import React from 'react';
import { OptionGroupSettings } from '../../interfaces/optionGroupSettingsInterface';
type SidebarProps = {
  allOptionGroupSettings: OptionGroupSettings[];
};

export const Sidebar = ({ allOptionGroupSettings }: SidebarProps) => {
  return (
    <ul className="steps steps-vertical">
      {allOptionGroupSettings.map((optionGroupSettings: OptionGroupSettings, index: number) => {
        return (
          <li data-content="" className="step" id={'nav_' + optionGroupSettings.id} key={index}>
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
