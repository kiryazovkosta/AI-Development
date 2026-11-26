import { InjectionToken } from '@angular/core';

// Compiled in by scripts/build.mjs. Not there in `ng serve`, `ng test` and a plain `ng build`.
declare const BUILD_TIME: string | undefined;
declare const BUILD_COMMIT: string | undefined;

export interface BuildInfo {
  time: Date;
  /** Short git hash; ends with "+" when built with changes that are not committed */
  commit: string;
}

/** Null when the app was not built by scripts/build.mjs */
export const BUILD_INFO = new InjectionToken<BuildInfo | null>('BUILD_INFO', {
  providedIn: 'root',
  factory: () =>
    typeof BUILD_TIME === 'string' && typeof BUILD_COMMIT === 'string'
      ? { time: new Date(BUILD_TIME), commit: BUILD_COMMIT }
      : null,
});
