import type { ReactNode } from 'react';

export interface Changelog {
  version: `${number}.${number}.${number}`;
  titel: string;
  text: ReactNode;
  pictureURLs?: string[];
}
  