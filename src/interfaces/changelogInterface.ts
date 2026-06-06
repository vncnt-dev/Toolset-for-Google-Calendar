import type { ReactNode } from 'react';

export interface Changelog {
  version: `${number}.${number}.${number}`;
  titel: string;
  /** If omitted, the version will be hidden from the changelog page and treated as a silent update. */
  text?: ReactNode;
  pictureURLs?: string[];
  /** If true, the changelog page will not auto-open when updating to this version. */
  silentUpdate?: boolean;
}
  