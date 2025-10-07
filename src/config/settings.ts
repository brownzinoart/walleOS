export interface AppSettings {
  /**
   * Controls whether the experience context should be cleared automatically when navigating away
   * from the resume route. Defaults to true to preserve existing behaviour while allowing
   * opt-in persistence.
   */
  clearExperienceContextOnRouteChange: boolean;
}

const defaultSettings: AppSettings = {
  clearExperienceContextOnRouteChange: true,
};

export const getAppSettings = (): AppSettings => defaultSettings;
