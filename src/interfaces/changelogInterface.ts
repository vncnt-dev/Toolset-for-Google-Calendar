export interface Changelog {
    version: `${number}.${number}.${number}`;
    titel: string;
    text: JSX.Element;
    pictureURLs?: string[];
  }
  