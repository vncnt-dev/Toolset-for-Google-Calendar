import { UserInfo } from './userInfo';
import { CalEvent } from './eventInterface';

export interface GctCache {
  userInfo?: UserInfo | null;
  eventStorage?: CalEvent[];
  allOrMultiDayEvents?: CalEvent[];
  baseHeight?: number;
  maxTransparency?: number;
  minTransparency?: number;
}
