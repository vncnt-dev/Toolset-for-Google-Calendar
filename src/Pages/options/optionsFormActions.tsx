import React from 'react';
import { useBetween } from 'use-between';
import { useShareableState } from './lib/reactSettingsHandler';

export const OptionsFormActions = () => {
  const { restoreDefaultSharedSettings } = useBetween(useShareableState);

  return (
    <div id="actions" style={{ height: '75px' }}>
      <button className="btn btn-error mr-2 mt-3" onClick={restoreDefaultSharedSettings}>
        Restore default
      </button>
    </div>
  );
};
