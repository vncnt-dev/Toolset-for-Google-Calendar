import React from 'react';
import { OptionGroupSettings } from '../interfaces/optionGroupSettingsInterface';
import { useShareableState } from './lib/reactSettingsHandler';
import { useBetween } from 'use-between';
import { getAllOptionGroupSettings } from './lib/allOptionGroupSettings';
/* setter for settings  */
export const OptionGroup = (optionGroupSettings: OptionGroupSettings) => {
  const { sharedSettings, updateSharedSettings } = useBetween(useShareableState);
  let allOptionGroupSettings = getAllOptionGroupSettings();

  return (
    <div
      id={optionGroupSettings.id}
      className="relative flex flex-col rounded break-words border bg-white border-1 border-gray-300 mb-6"
      onMouseEnter={() => {
        // remove all other active classes
        allOptionGroupSettings.forEach((element: OptionGroupSettings) => {
          document.getElementById('nav_' + element.id)?.classList.remove('step-neutral');
        });
        document.getElementById('nav_' + optionGroupSettings.id)?.classList.add('step-neutral');
      }}
    >
      <div className="bg-gray-200 border-b-1 border-gray-300 text-black">
        <h5 className="text-3xl m-2 ml-3 mt-1">
          {optionGroupSettings.titel}
          {optionGroupSettings.toggleSettings && (
            <div className="inline-block ml-2 mt-1">
              <input
                type="checkbox"
                className="toggle"
                checked={(sharedSettings as unknown as any[])[optionGroupSettings.toggleSettings as any]}
                onChange={(e) => {
                  updateSharedSettings({
                    [optionGroupSettings.toggleSettings as any]: e.target.checked,
                  });
                }}
              />
            </div>
          )}
        </h5>
      </div>
      <div className="flex flex-wrap p-3 text-base">
        <div className="w-3/5">{optionGroupSettings.text}</div>
        <div className="w-2/5 flex flex-wrap justify-evenly">
          {optionGroupSettings.pictureURLs &&
            optionGroupSettings.pictureURLs.map((pictureURL: string) => {
              return (
                <div>
                  <img className="rounded-xl min-w-[250px]" src={pictureURL} />
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
