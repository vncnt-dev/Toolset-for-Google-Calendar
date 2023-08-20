import React from 'react';
import { getAllChangelogs } from './lib/getAllChangelogs';
import { Changelog } from '../../interfaces/changelogInterface';
export const ChangelogGroup = (changelogGroupSettings: Changelog) => {
  let allChangelogGroupSettings = getAllChangelogs();

  return (
    <div
      id={"v"+changelogGroupSettings.version}
      className="relative flex flex-col rounded break-words border bg-white border-1 border-gray-300 mb-6"
      onMouseEnter={() => {
        // remove all other active classes
        allChangelogGroupSettings.forEach((element: Changelog) => {
          document.getElementById('nav_v' + element.version)?.classList.remove('step-neutral');
        });
        document.getElementById('nav_v' + changelogGroupSettings.version)?.classList.add('step-neutral');
      }}
    >
      <div className="bg-gray-200 border-b-1 border-gray-300 text-black">
        <h5 className="text-3xl m-2 ml-3 mt-1">
          {changelogGroupSettings.titel}
        </h5>
      </div>
      <div className="flex flex-wrap p-3 text-base">
        <div className="w-3/5">{changelogGroupSettings.text}</div>
        <div className="w-2/5 flex flex-wrap justify-evenly">
          {changelogGroupSettings.pictureURLs &&
            changelogGroupSettings.pictureURLs.map((pictureURL: string, index: number) => {
              return (
                <div key={index}>
                  <img
                    className="rounded-xl min-w-[250px] max-h-[200px] object-contain"
                    src={pictureURL}
                    onClick={() => {
                      document.getElementById(pictureURL.slice(pictureURL.lastIndexOf("/")))!.click();
                    }}
                  />
                  <input type="checkbox" id={pictureURL.slice(pictureURL.lastIndexOf("/"))} className="modal-toggle" />
                  <div className="modal">
                    <div className="modal-box max-h-fit max-w-fit">
                    <img className="rounded-xl object-contain max-h-[80vh] max-w-[80vw] sm:min-w-[500px] min-w-[50vw]" src={pictureURL} />
                      <div className="modal-action">
                        <label htmlFor={pictureURL.slice(pictureURL.lastIndexOf("/"))} className="btn">
                          Close
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
