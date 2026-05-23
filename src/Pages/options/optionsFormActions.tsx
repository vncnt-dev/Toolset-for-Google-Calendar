import React from 'react';
import { useShareableStateContext } from './lib/reactSettingsHandler';

export const OptionsFormActions = () => {
  const { restoreDefaultSharedSettings } = useShareableStateContext();

  return (
    <div id="actions" style={{ height: '75px' }}>
      <button className="btn btn-error mr-2 mt-3" onClick={restoreDefaultSharedSettings}>
        Restore default
      </button>
    </div>
  );
};
