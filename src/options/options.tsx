import React from 'react';
import { render } from 'react-dom';
import './options.css';
import { OptionsForm } from './optionsForm';
import { Sidebar } from './sidebar';

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
          <OptionsForm />
        </div>
      </div>
    </div>
  );
};

render(<Options />, document.getElementById('root'));
