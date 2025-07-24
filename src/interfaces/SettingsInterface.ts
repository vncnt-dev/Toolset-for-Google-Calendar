
export interface SettingsIsActive {
  calcDuration_isActive: boolean;
  hoverInformation_isActive: boolean;
  removeGMeets_isActive: boolean;
  indicateAllDayEvents_isActive: boolean;
  exportAsIcs_isActive: boolean;
  showChangeLog_isActive: boolean;
}


// extend SettingsIsActive
export interface Settings extends SettingsIsActive {
  calcDuration_minimumDurationMinutes: number;
  calcDuration_durationFormat: 'hourMinutes' | 'decimalHours';
  indicateAllDayEvents_minTransparency: number;
  indicateAllDayEvents_maxTransparency: number;
  indicateAllDayEvents_maxWidth: number;
  isLoggingEnabled: boolean;
}
