import { UserInfo } from './userInfo';
import { CalEvent } from './eventInterface';

export interface GctSessionCache {
  userInfo?: UserInfo | null;
  eventStorage?: CalEvent[];
  allOrMultiDayEvents?: CalEvent[];
  baseHeight?: number;
  maxTransparency?: number;
  minTransparency?: number;
}
