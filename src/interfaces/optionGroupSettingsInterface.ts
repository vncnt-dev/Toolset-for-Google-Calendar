import type { ReactNode } from 'react';

import { Settings } from "./SettingsInterface";

export interface OptionGroupSettings {
  id: string;
  titel: string;
  text: ReactNode;
  pictureURLs?: string[];
  toggleSettings?: keyof Settings;
}
