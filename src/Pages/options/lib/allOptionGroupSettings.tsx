import React from 'react';
import { OptionGroupSettings } from '../../../interfaces/optionGroupSettingsInterface';
import type { useShareableState } from './reactSettingsHandler';
import { zipSync } from 'fflate';
import { toast } from 'react-toastify';
import { getAllIndicatorExclusions, removeIndicatorExclusion, INDICATOR_EXCLUSIONS_STORAGE_KEY, IndicatorExclusionEntry } from '../../../contentScripts/lib/indicatorExclusionStore';

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

const formatDate = (ms?: number) => (ms === undefined ? '' : new Date(ms).toLocaleDateString());

/** "21.8.2026 – 21.8.2026" -> "21.8.2026" */
const formatDateRange = (startMs?: number, endMs?: number): string => {
  const start = startMs !== undefined ? formatDate(startMs) : null;
  const end = endMs !== undefined ? formatDate(endMs) : null;
  if (!start && !end) return '';
  if (!end || !start) return start ?? end!;
  const isSameCalendarDay =
    new Date(startMs!).getFullYear() === new Date(endMs!).getFullYear() &&
    new Date(startMs!).getMonth() === new Date(endMs!).getMonth() &&
    new Date(startMs!).getDate() === new Date(endMs!).getDate();
  return isSameCalendarDay ? start : `${start} – ${end}`;
};

/** second line per entry: date range; series show "from <date>; RULE, until <date>" */
const entryMeta = (entry: IndicatorExclusionEntry): string => {
  if (entry.scope === 'series') {
    const parts = [`from ${entry.s !== undefined ? formatDate(entry.s) : '?'}`];
    if (entry.r) parts.push(entry.r);
    parts.push(entry.end !== undefined ? `until ${formatDate(entry.end)}` : 'no end date');
    return parts.join(', ');
  }

  return formatDateRange(entry.s, entry.end) || entry.id;
};

const IndicatorExclusionListControls = () => {
  const [entries, setEntries] = React.useState<IndicatorExclusionEntry[]>([]);
  const [open, setOpen] = React.useState(false);

  const refresh = React.useCallback(async () => {
    try {
      setEntries(await getAllIndicatorExclusions());
    } catch (error) {
      console.error('Failed to load indicator exclusions:', error);
    }
  }, []);

  React.useEffect(() => {
    refresh();
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
        if (areaName === 'sync' && changes[INDICATOR_EXCLUSIONS_STORAGE_KEY]) {
          refresh();
        }
      };
      chrome.storage.onChanged.addListener(listener);
      return () => chrome.storage.onChanged.removeListener(listener);
    }
  }, [refresh]);

  const handleRemove = async (id: string) => {
    await removeIndicatorExclusion(id);
    await refresh();
  };

  return (
    <div className="border-t border-gray-200 pt-4 mt-4">
      <p className="font-medium mb-2">Hidden background indicators</p>
      <p className="text-sm text-gray-500 mb-3">
        Events whose background indicator was hidden. Entries whose last occurrence lies more than 6 months in the past
        are removed automatically.
        <br />
        <b>How to add events:</b> Open an all-day or multi-day event in Google Calendar™, click the three-dot menu and
        select "Hide background indicator".
      </p>
      <button onClick={() => setOpen(true)} disabled={entries.length === 0} className="btn btn-outline btn-sm">
        Open Blacklist ({entries.length})
      </button>

      {open && (
        <div
          className="modal modal-open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="modal-box max-w-lg">
            <h5 className="text-xl font-bold mb-1">Hidden background indicators</h5>
            <p className="text-sm text-gray-500 mb-4">
              Click "Remove" to show the background indicator of an event again.
            </p>
            <ul className="divide-y divide-gray-200 border border-gray-200 rounded-xl overflow-hidden max-h-[60vh] overflow-y-auto">
              {entries.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-4 px-4 py-2 bg-white">
                  <div className="min-w-0">
                    <span className="block truncate font-medium">{entry.n || entry.id}</span>
                    <span className="text-xs text-gray-400">{entryMeta(entry)}</span>
                  </div>
                  <button onClick={() => void handleRemove(entry.id)} className="btn btn-outline btn-error btn-xs shrink-0">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="modal-action">
              <button className="btn" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CacheSettingsControls = () => {
  const [eventCount, setEventCount] = React.useState(0);
  const [logCount, setLogCount] = React.useState(0);
  const [clearing, setClearing] = React.useState(false);

  const fetchStats = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        const allData = await chrome.storage.local.get(null);
        const keys = Object.keys(allData);
        let events = 0;
        let logs = 0;
        for (const key of keys) {
          if (key.includes('gct_event_')) {
            events++;
          } else if (key.includes('gct_log_report_')) {
            logs++;
          }
        }
        setEventCount(events);
        setLogCount(logs);
      }
    } catch (err) {
      console.error('Failed to fetch cache stats:', err);
    }
  };

  React.useEffect(() => {
    fetchStats();
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
        if (areaName === 'local') {
          fetchStats();
        }
      };
      chrome.storage.onChanged.addListener(listener);
      return () => chrome.storage.onChanged.removeListener(listener);
    }
  }, []);

  const handleClearCache = async () => {
    setClearing(true);
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await chrome.storage.local.clear();
        await fetchStats();
        toast.success('All cached data deleted successfully', {
          position: 'bottom-right',
          autoClose: 3000,
        });
      }
    } catch (err) {
      console.error('Failed to clear cache:', err);
      toast.error('Failed to clear cached data.', {
        position: 'bottom-right',
        autoClose: 3000,
      });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 mt-2">
      <p className="text-base text-gray-600">
        The extension caches Google Calendar™ event metadata and temporary logs locally in your browser's storage to enhance rendering performance and assist with troubleshooting.
      </p>
      
      <div className="grid grid-cols-2 gap-4 my-2">
        <div className="bg-gray-100 p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Cached Events</span>
          <span className="text-3xl font-extrabold text-blue-600 mt-2">{eventCount}</span>
          <span className="text-xs text-gray-400 mt-1">Improves hover and calculation speed</span>
        </div>
        <div className="bg-gray-100 p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Stored Log Reports</span>
          <span className="text-3xl font-extrabold text-blue-600 mt-2">{logCount}</span>
          <span className="text-xs text-gray-400 mt-1">Saved debugging sessions</span>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4 mt-2">
        <p className="text-sm text-gray-500 mb-4">
          Clearing this data will remove all stored event metadata and debug log reports. Your settings will remain unaffected.
        </p>
        <button
          onClick={handleClearCache}
          disabled={clearing || (eventCount === 0 && logCount === 0)}
          className="btn btn-error text-white font-medium px-6 shadow-md hover:shadow-lg transition-all"
        >
          {clearing ? 'Clearing Cache...' : 'Delete All Cached Data'}
        </button>
      </div>
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
          You can click on the preview images to see a larger version. <br /><br />
          <b>Currently installed version:</b> {chrome.runtime.getManifest().version}
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
          <IndicatorExclusionListControls />
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
    {
      id: 'cache',
      titel: 'Cache & Local Storage',
      text: <CacheSettingsControls />,
    },
  ];

  return allOptionGroupSettings;
};
