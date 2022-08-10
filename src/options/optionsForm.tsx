import React from 'react';
import { OptionGroupSettings } from '../interfaces/optionGroupSettingsInterface';
import { getAllOptionGroupSettings } from './allOptionGroupSettings';
import { OptionGroup } from './optionGroup';
import { OptionsFormActions } from './optionsFormActions';

export const OptionsForm = () => {
  return (
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
  );
};
