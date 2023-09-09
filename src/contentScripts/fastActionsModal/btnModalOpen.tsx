import React from 'react';
import { BtnModalOpenIcon } from './btnModalOpenIcon';

export const BtnGCToolsModalOpen = () => {
  const openModal = () => {
    document.getElementById('GCTModal')!.style.display = 'block';
  };

  return (
    <button className="GCToolsModalOpen" onClick={openModal}>
      <BtnModalOpenIcon />
      <div className='hint'>GC Tools</div>
    </button>
  );
};
