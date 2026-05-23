import { getSettingsSnapshot } from './SettingsHandler';

function logging(Level: 'debug' | 'info' | 'warn' | 'error' | 'log', ...args: any[]) {
  if (!getSettingsSnapshot().isLoggingEnabled) return;

  const fullStack = new Error().stack;
  if (Level === 'warn') console.log('%cGC Tools - Warning:', 'color: orange; font-weight: bold;', ...args);
  else if (Level === 'error') console.error('%cGC Tools - Error:', 'color: #ff416d; font-weight: bold;', ...args);
  else if (Level === 'info') console.info('%cGC Tools - Info:', 'color: #4b99d2; font-weight: bold;', ...args);
  else if (Level === 'debug') console.debug('%cGC Tools - Debug:', 'color: #55b080; font-weight: bold;', ...args);
  else {
    console.log('%cGC Tools - Log:', 'color: black;', ...args);
  }
  console.debug(fullStack);
}

export { logging };