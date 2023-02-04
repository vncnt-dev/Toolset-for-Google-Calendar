import React from 'react';
import ReactDOM from 'react-dom/client';
import './options.css';
import { Sidebar } from './sidebar';
import { OptionGroupSettings } from '../interfaces/optionGroupSettingsInterface';
import { getAllOptionGroupSettings } from './lib/allOptionGroupSettings';
import { OptionGroup } from './optionGroup';
import { OptionsFormActions } from './optionsFormActions';
import { ToastContainer } from 'react-toastify';

const Options = () => {
  return (
    <div>
      <h1 className="font-medium text-4xl ml-4 mb-4 mt-2">
        Settings
        <a href="https://github.com/vncnt-dev/Google-Calendar-Tools" aria-label="Link to the Github-Repository">
          <img className="w-10 h-10 float-right mr-4" src="./images/Github-Mark.png" alt="Github Logo" />
        </a>
        <a href="mailto:contact@vncnt.dev?subject=GCT%20Feedback%20or%20Question" aria-label="E-mail to the developer">
          <img className="w-10 h-10 float-right mr-4" src="./images/E-mail.svg" alt="Github Logo" />
        </a>
      </h1>
      <div className="divider"></div>
      <div className="flex flex-wrap ">
        <div className="w-1/5">
          <Sidebar />
        </div>
        <div className="w-4/5 pr-5">
          <div>
            <div id="optionForm" className="overflow-y-scroll" style={{ height: 'calc(100vh - 171px)' }}>
              {getAllOptionGroupSettings().map((optionGroupSettings: OptionGroupSettings, index: number) => {
                return <OptionGroup key={index} {...optionGroupSettings}></OptionGroup>;
              })}
            </div>
            <div>
              <OptionsFormActions />
            </div>
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
    <Options />
  </React.StrictMode>,
);
