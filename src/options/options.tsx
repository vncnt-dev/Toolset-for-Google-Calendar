import React from 'react';
import { render } from 'react-dom';
import './options.css';
import { Sidebar } from './sidebar';
import { OptionGroupSettings } from '../interfaces/optionGroupSettingsInterface';
import { getAllOptionGroupSettings } from './lib/allOptionGroupSettings';
import { OptionGroup } from './optionGroup';
import { OptionsFormActions } from './optionsFormActions';

const Options = () => {
  return (
    <div>
      <h1 className="font-medium text-4xl ml-4 mb-4 mt-2">Settings</h1>
      <div className="divider"></div>
      <div className="flex flex-wrap ">
        <div className="w-1/5">
          <Sidebar />
        </div>
        <div className="w-4/5 pr-5">
          <div>
            <div id="optionForm" className="overflow-y-scroll" style={{ height: 'calc(100vh - 171px)' }}>
              {getAllOptionGroupSettings().map((optionGroupSettings: OptionGroupSettings) => {
                return <OptionGroup {...optionGroupSettings}></OptionGroup>;
              })}
            </div>
            <div>
              <OptionsFormActions></OptionsFormActions>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

render(<Options />, document.getElementById('root'));
