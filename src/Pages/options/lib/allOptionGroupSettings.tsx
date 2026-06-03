import React from 'react';
import { OptionGroupSettings } from '../../../interfaces/optionGroupSettingsInterface';
import type { useShareableState } from './reactSettingsHandler';
import { zipSync } from 'fflate';

type SharedSettings = ReturnType<typeof useShareableState>['sharedSettings'];
type UpdateSharedSettings = ReturnType<typeof useShareableState>['updateSharedSettings'];

const LoggingSettingsControls = ({
  sharedSettings,
  updateSharedSettings,
}: {
  sharedSettings: SharedSettings;
  updateSharedSettings: UpdateSharedSettings;
}) => {
  const [hasReports, setHasReports] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const checkReports = async () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          const data = (await chrome.storage.local.get('gct_log_sessions')) as { gct_log_sessions?: string[] };
          const sessions = data.gct_log_sessions || [];
          setHasReports(sessions.length > 0);
        }
      } catch {
        setHasReports(false);
      }
    };
    checkReports();

    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
        if (areaName === 'local' && changes.gct_log_sessions) {
          const sessions = (changes.gct_log_sessions.newValue || []) as string[];
          setHasReports(sessions.length > 0);
        }
      };
      chrome.storage.onChanged.addListener(listener);
      return () => chrome.storage.onChanged.removeListener(listener);
    }
  }, []);

  const handleDownload = async () => {
    setLoading(true);
    try {
      if (typeof chrome === 'undefined' || !chrome.storage?.local) {
        alert('Storage API not available');
        return;
      }
      const data = (await chrome.storage.local.get('gct_log_sessions')) as { gct_log_sessions?: string[] };
      const sessions = data.gct_log_sessions || [];
      if (sessions.length === 0) {
        alert('No log reports found.');
        return;
      }

      const logsData = (await chrome.storage.local.get(sessions.map((id: string) => `gct_log_report_${id}`))) as {
        [key: string]: string[];
      };

      const filesObject: { [filename: string]: Uint8Array } = {};
      sessions.forEach((id: string) => {
        const logs = logsData[`gct_log_report_${id}`] || [];
        const content = logs.join('\n');
        filesObject[`session_${id}.log`] = new TextEncoder().encode(content);
      });

      const zipBytes = zipSync(filesObject);

      const blob = new Blob([zipBytes], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gct_log_reports_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating log reports zip:', error);
      alert('Failed to generate log reports.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p>Enables logging of the extension. This is useful for debugging and development purposes.</p>
      <p className="mt-2">The logs are stored in the browser console and can be accessed by pressing F12 or Ctrl+Shift+I.</p>

      {sharedSettings.isLoggingEnabled && (
        <div className="form-control gap-4 mt-4 border-t border-gray-200 pt-4">
          <p className="text-sm mb-2 leading-relaxed">
            When active, log entries from each window/tab session are collected locally in the browser. You can assign a custom Report ID in the
            calendar page, and download all logs as a zipped archive to send to developers for help. Disabling this option will automatically wipe all
            report data from local storage.
            <br />
            <br />
            IMPORTANT: The log might include informations like event names, descriptions, locations, etc.
            <br />
          </p>
          <label className="flex items-center gap-4 mt-2">
            <span className="w-40 font-medium">Collect reports</span>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={sharedSettings.isReportGenerationEnabled}
              onChange={(e) => {
                updateSharedSettings({
                  isReportGenerationEnabled: e.target.checked,
                });
              }}
            />
          </label>

          {sharedSettings.isReportGenerationEnabled && hasReports && (
            <div className="mt-4">
              <button onClick={handleDownload} disabled={loading} className="btn btn-primary">
                {loading ? 'Generating Zip...' : 'Download Reports'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const getAllOptionGroupSettings = (sharedSettings: SharedSettings, updateSharedSettings: UpdateSharedSettings): OptionGroupSettings[] => {
  let allOptionGroupSettings: OptionGroupSettings[] = [
    {
      id: 'general',
      titel: 'General Information',
      text: (
        <div>
          <b>Welcome</b> <br />
          This extension provides multiple small tools for the Google Calendar™. <br />
          You can click on the preview images to see a larger version.
        </div>
      ),
    },
    {
      id: 'calcDuration',
      titel: 'Display Event-Duration',
      text: (
        <div>
          Calculates and displays the event durations on the "by day", "by week" and "by month" view.
          <div className="form-control gap-4 mt-4">
            <label className="flex items-center gap-4">
              <span className="w-40 font-medium">Minimum duration</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  className="input input-bordered w-24"
                  value={sharedSettings.calcDuration_minimumDurationMinutes}
                  onChange={(e) => {
                    updateSharedSettings({
                      calcDuration_minimumDurationMinutes: e.target.value,
                    });
                  }}
                />
                <span className="font-medium">min.</span>
              </div>
            </label>
            <label className="flex items-center gap-4 mt-4">
              <span className="w-40 font-medium">Format</span>
              <select
                className="select select-bordered w-48"
                value={sharedSettings.calcDuration_durationFormat}
                onChange={(e) => {
                  updateSharedSettings({
                    calcDuration_durationFormat: e.target.value,
                  });
                }}
              >
                <option value="hourMinutes">2h 30m</option>
                <option value="decimalHours">2.5 hours</option>
              </select>
            </label>
            <label className="flex items-center gap-4 mt-4">
              <span className="w-40 font-medium">Disable for all-day events</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={sharedSettings.calcDuration_disableForAllDayEvents}
                onChange={(e) => {
                  updateSharedSettings({
                    calcDuration_disableForAllDayEvents: e.target.checked,
                  });
                }}
              />
            </label>
          </div>
        </div>
      ),
      toggleSettings: 'calcDuration_isActive',
      pictureURLs: ['./images/insertDuration.jpg'],
    },
    {
      id: 'hoverInformation',
      titel: 'Information On Hover',
      text: <div>Show information on hover "by day", "by week" and "by month" view.</div>,
      toggleSettings: 'hoverInformation_isActive',
      pictureURLs: ['./images/hoverOverInformation_1.jpg', './images/hoverOverInformation_2.jpg'],
    },
    {
      id: 'removeGMeets',
      titel: 'Remove GMeeting Buttons',
      text: (
        <div>
          <p>Removes the Google Meet™ buttons from the event details page and the quick add dialog. This is useful if you don't use Google Meet™.</p>
        </div>
      ),
      toggleSettings: 'removeGMeets_isActive',
      pictureURLs: [],
    },
    {
      id: 'indicateAllDayEvents',
      titel: 'Indicate All- and Multi-Day Events',
      text: (
        <div>
          <p>Displays all-day and multi-day events in the day and week views by adding the event to the background of the main calendar.</p>
          <p className="mt-2">
            The transparency of the indicator depends on the event duration. You can set a minimum (&gt;=30 days) and a maximum (1 day) transparency.
          </p>
          <div className="flex items-center gap-4 mt-4">
            <span
              className="w-48 px-3 py-2 rounded-lg text-center font-medium"
              style={{
                backgroundColor: `rgb(25 115 230 /${sharedSettings.indicateAllDayEvents_minTransparency})`,
                color: `${sharedSettings.indicateAllDayEvents_minTransparency > 0.5 ? 'white' : 'black'}`,
              }}
            >
              min. transparency
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={sharedSettings.indicateAllDayEvents_minTransparency * 100}
              className="range range-lg flex-1"
              step="5"
              onChange={(e) => {
                updateSharedSettings({
                  indicateAllDayEvents_minTransparency: parseInt(e.target.value) / 100,
                });
              }}
            />
            <span className="w-12 rounded text-right font-bold">{Math.round(sharedSettings.indicateAllDayEvents_minTransparency * 100) + '%'}</span>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <span
              className="w-48 px-3 py-2 rounded-lg text-center font-medium"
              style={{
                backgroundColor: `rgb(25 115 230 /${sharedSettings.indicateAllDayEvents_maxTransparency})`,
                color: `${sharedSettings.indicateAllDayEvents_maxTransparency > 0.5 ? 'white' : 'black'}`,
              }}
            >
              max. transparency
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={sharedSettings.indicateAllDayEvents_maxTransparency * 100}
              className="range range-lg flex-1"
              step="5"
              onChange={(e) => {
                updateSharedSettings({
                  indicateAllDayEvents_maxTransparency: parseInt(e.target.value) / 100,
                });
              }}
            />
            <span className="w-12 rounded text-right font-bold">{Math.round(sharedSettings.indicateAllDayEvents_maxTransparency * 100) + '%'}</span>
          </div>
          <p className="mt-4">By default, the indicators span the entire width, but this can be changed here.</p>
          <div className="flex items-center gap-4 mt-4">
            <span className="w-48 px-3 py-2 text-center font-medium">width</span>
            <input
              type="range"
              min="0"
              max="100"
              value={sharedSettings.indicateAllDayEvents_maxWidth}
              className="range range-lg flex-1"
              step="5"
              onChange={(e) => {
                updateSharedSettings({
                  indicateAllDayEvents_maxWidth: e.target.value,
                });
              }}
            />
            <span className="w-12 rounded text-right font-bold">{sharedSettings.indicateAllDayEvents_maxWidth + '%'}</span>
          </div>
        </div>
      ),
      toggleSettings: 'indicateAllDayEvents_isActive',
      pictureURLs: ['./images/indicateAllDayEvents_1.jpg'],
    },
    {
      id: 'exportAsIcs',
      titel: 'Export Event As Ics/iCal',
      text: (
        <div>
          <p>
            Adds a button to the event details page to export the event as ICS/iCal. <br></br>
            This allows you to import the event into other calendar applications.
          </p>
        </div>
      ),
      toggleSettings: 'exportAsIcs_isActive',
      pictureURLs: ['./images/exportAsIcs_1.jpg'],
    },
    {
      id: 'changelog',
      titel: 'Open Changelog-Page After Update',
      text: (
        <div>
          Opens this{' '}
          <a href="/changelog/changelog.html" className="font-bold text-blue-500">
            changelog page
          </a>{' '}
          after an update.
        </div>
      ),
      toggleSettings: 'showChangeLog_isActive',
    },
    {
      id: 'logging',
      titel: 'Enable Logging',
      text: <LoggingSettingsControls sharedSettings={sharedSettings} updateSharedSettings={updateSharedSettings} />,
      toggleSettings: 'isLoggingEnabled',
    },
  ];

  return allOptionGroupSettings;
};
