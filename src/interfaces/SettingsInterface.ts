
export interface SettingsIsActive {
  calcDuration_isActive: boolean;
  hoverInformation_isActive: boolean;
  betterAddMeeting_isActive: boolean;
  indicateFullDayEvents_isActive: boolean;
  exportAsIcs_isActive: boolean;
  showChangeLog_isActive: boolean;
}


// extend SettingsIsActive
export interface Settings extends SettingsIsActive {
  calcDuration_minimumDurationMinutes: number;
  calcDuration_durationFormat: 'hourMinutes' | 'decimalHours';
  indicateFullDayEvents_minTransparency: number;
  indicateFullDayEvents_maxTransparency: number;
  indicateFullDayEvents_maxWidth: number;
}
