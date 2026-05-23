import path from 'path';
import { readFileSync } from 'fs';

const root = path.resolve(__dirname);
const publicManifestPath = path.join(root, 'public', 'manifest.json');
const source = JSON.parse(readFileSync(publicManifestPath, 'utf8'));

// Create a manifest object for the build that points to source entry files
const manifest = JSON.parse(JSON.stringify(source));

if (manifest.background && manifest.background.service_worker) {
  manifest.background.service_worker = 'src/background.ts';
}

if (Array.isArray(manifest.content_scripts)) {
  manifest.content_scripts = manifest.content_scripts.map((cs: any) => {
    const copy = { ...cs };
    if (Array.isArray(copy.js)) {
      copy.js = copy.js.map(() => 'src/contentScripts/content_script.entry.ts');
    }
    return copy;
  });
}

if (manifest.options_page) {
  manifest.options_page = 'public/options/options.html';
}

export default manifest;
