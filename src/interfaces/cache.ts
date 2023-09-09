import { UserInfo } from './userInfo';
import { Event } from './eventInterface';

export interface GctCache {
  userInfo?: UserInfo | null;
  multiDayDateKeyMap?: Map<string, string>;
  eventStorage?: Event[];
  multiDayEvents?: Event[];
  baseHeight?: number;
  maxTransparency?: number;
  minTransparency?: number;
}
