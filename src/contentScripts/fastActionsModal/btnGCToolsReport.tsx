import React, { useState } from 'react';
import { getSessionId, setSessionId, renameSession } from '../lib/logger';
import { BtnReportIcon } from './btnReportIcon';

export const BtnGCToolsReport = () => {
  const [reportId, setReportIdState] = useState(getSessionId());

  const handleChangeId = async () => {
    const currentId = getSessionId();
    const newId = window.prompt('Change Report ID (renames log context and migrates existing session logs):', currentId);
    if (newId && newId.trim() !== '' && newId.trim() !== currentId) {
      const sanitizedId = newId.trim();
      await renameSession(currentId, sanitizedId);
      setSessionId(sanitizedId);
      setReportIdState(sanitizedId);
    }
  };

  const displayId = reportId.length > 20 ? reportId.substring(0, 17) + '...' : reportId;

  return (
    <button 
      className="GCToolsModalOpen" 
      onClick={handleChangeId} 
      title={`Report ID: ${reportId}`}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
        <BtnReportIcon />
        <span style={{ fontSize: '13px', color: '#5f6368', fontWeight: 500 }}>
          {displayId}
        </span>
      </div>
      <div className="hint">GC Log Report</div>
    </button>
  );
};
