import React from 'react';
import ReactDOM from 'react-dom/client';
import './changelog.css';
import { Sidebar } from './sidebar';
import { getAllChangelogs } from './lib/getAllChangelogs';
import { ChangelogGroup } from './changelogGroup';
import { ToastContainer } from 'react-toastify';
import { Changelog } from '../../interfaces/changelogInterface';

const Changelog = () => {
  return (
    <div>
      <h1 className="font-medium text-4xl ml-4 mb-4 mt-2">
        Changelog for "Toolset for Google Calendar™"
        <a href="https://github.com/vncnt-dev/Google-Calendar-Tools" aria-label="Link to the Github-Repository">
          <img className="w-10 h-10 float-right mr-4" src="../sharedImages/Github-Mark.png" alt="Github Logo" />
        </a>
        <a href="mailto:contact@vncnt.dev?subject=GCT%20Feedback%20or%20Question" aria-label="E-mail to the developer">
          <img className="w-10 h-10 float-right mr-4" src="../sharedImages/E-mail.svg" alt="Github Logo" />
        </a>
      </h1>
      <div className="divider"></div>
      <div className="flex flex-wrap ">
        <div className="w-1/5">
          <Sidebar />
        </div>
        <div className="w-4/5 pr-5">
          <div>
            <div id="changelogForm" className="overflow-y-scroll" style={{ height: 'calc(100vh - 171px)' }}>
              {getAllChangelogs()
                .reverse()
                .map((changelogs: Changelog, index: number) => {
                  return <ChangelogGroup key={index} {...changelogs}></ChangelogGroup>;
                })}
            </div>
            <div></div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <Changelog />
  </React.StrictMode>,
);
