import { Settings } from "./SettingsInterface";

export interface OptionGroupSettings {
  id: string;
  titel: string;
  text: JSX.Element;
  pictureURLs?: string[];
  toggleSettings?: keyof Settings;
}
