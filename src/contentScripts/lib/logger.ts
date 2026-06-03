import { getSettingsSnapshot } from './SettingsHandler';

// Cache sessionId in memory to avoid generating new ones on every log call
let cachedSessionId: string | null = null;

export function getSessionId(): string {
  if (!cachedSessionId) {
    cachedSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  return cachedSessionId;
}

export function setSessionId(id: string): void {
  cachedSessionId = id;
}

let pendingLogs: string[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

async function flushPendingLogs() {
  flushTimeout = null;
  if (pendingLogs.length === 0) return;

  const logsToWrite = [...pendingLogs];
  pendingLogs = [];

  if (typeof chrome === 'undefined' || !chrome.storage?.local) return;

  const sessionId = getSessionId();
  const sessionKey = `gct_log_report_${sessionId}`;

  try {
    const storageData = await chrome.storage.local.get(['gct_log_sessions', sessionKey]) as {
      gct_log_sessions?: string[];
      [key: string]: any;
    };
    let sessions: string[] = storageData.gct_log_sessions || [];
    let currentLogs: string[] = storageData[sessionKey] || [];

    currentLogs = currentLogs.concat(logsToWrite);

    if (!sessions.includes(sessionId)) {
      sessions.push(sessionId);
    }

    const keysToRemove: string[] = [];
    if (sessions.length > 100) {
      const sessionsToRemove = sessions.slice(0, sessions.length - 100);
      sessions = sessions.slice(sessions.length - 100);
      sessionsToRemove.forEach((id) => {
        keysToRemove.push(`gct_log_report_${id}`);
      });
    }

    const updateObject: { [key: string]: any } = {
      gct_log_sessions: sessions,
      [sessionKey]: currentLogs,
    };

    await chrome.storage.local.set(updateObject);
    if (keysToRemove.length > 0) {
      await chrome.storage.local.remove(keysToRemove);
    }
  } catch (error) {
    console.error('Failed to flush log report entries to local storage:', error);
  }
}

export async function renameSession(oldId: string, newId: string): Promise<void> {
  // 1. Immediately flush any pending logs before we perform the rename
  if (flushTimeout) {
    clearTimeout(flushTimeout);
  }
  await flushPendingLogs();

  if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
  try {
    const oldKey = `gct_log_report_${oldId}`;
    const newKey = `gct_log_report_${newId}`;

    const data = await chrome.storage.local.get(['gct_log_sessions', oldKey]) as {
      gct_log_sessions?: string[];
      [key: string]: any;
    };
    let sessions: string[] = data.gct_log_sessions || [];
    const logs: string[] = data[oldKey] || [];

    // Rename session in the sessions list
    sessions = sessions.map((id) => (id === oldId ? newId : id));
    if (!sessions.includes(newId)) {
      sessions.push(newId);
    }
    // Remove old session ID
    sessions = sessions.filter((id) => id !== oldId || id === newId);

    // Save new log entries and updated sessions list
    await chrome.storage.local.set({
      gct_log_sessions: sessions,
      [newKey]: logs,
    });

    // Explicitly delete the old log key from local storage
    await chrome.storage.local.remove(oldKey);
  } catch (e) {
    console.error('Error renaming session in storage', e);
  }
}

function queueLogEntry(level: string, ...args: any[]) {
  const timestamp = new Date().toISOString();
  const message = args
    .map((arg) => {
      if (arg instanceof Error) return arg.stack || arg.message;
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(' ');

  const formattedLog = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  pendingLogs.push(formattedLog);

  if (!flushTimeout) {
    flushTimeout = setTimeout(flushPendingLogs, 1000);
  }
}

function logging(Level: 'debug' | 'info' | 'warn' | 'error' | 'log', ...args: any[]) {
  if (!getSettingsSnapshot().isLoggingEnabled) return;

  const fullStack = new Error().stack?.replace('Error', 'Location');
  if (Level === 'warn') console.log('%cGC Tools - Warning:', 'color: orange; font-weight: bold;', ...args);
  else if (Level === 'error') console.error('%cGC Tools - Error:', 'color: #ff416d; font-weight: bold;', ...args);
  else if (Level === 'info') console.info('%cGC Tools - Info:', 'color: #4b99d2; font-weight: bold;', ...args);
  else if (Level === 'debug') console.debug('%cGC Tools - Debug:', 'color: #55b080; font-weight: bold;', ...args);
  else {
    console.log('%cGC Tools - Log:', 'color: black;', ...args);
  }
  console.debug(fullStack);

  if (getSettingsSnapshot().isReportGenerationEnabled) {
    queueLogEntry(Level, ...args);
  }
}

export async function clearAllReports() {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
  try {
    const allData = await chrome.storage.local.get(null);
    const keysToRemove = Object.keys(allData).filter((key) => key.startsWith('gct_log_report_') || key === 'gct_log_sessions');
    if (keysToRemove.length > 0) {
      await chrome.storage.local.remove(keysToRemove);
    }
  } catch (error) {
    console.error('Error clearing log reports:', error);
  }
}

export { logging };
