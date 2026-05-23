import type { Plugin } from 'vite';

/**
 * Vite plugin that generates a classic-script loader for content scripts.
 *
 * Chrome MV3 content scripts cannot be ES modules, so we emit a tiny IIFE
 * loader that dynamic-imports the real ES module entry.  The plugin also
 * patches the manifest in dist/ to reference the loader and adds the
 * required web_accessible_resources entries so the browser can fetch the
 * ES module chunks at runtime.
 */
export function chromeExtensionPlugin(): Plugin {
  return {
    name: 'chrome-extension-plugin',
    enforce: 'post',

    generateBundle(_, bundle) {
      // 1. Find content script entry
      const contentEntry = Object.values(bundle).find((c) => c.type === 'chunk' && c.name === 'content_script');
      if (!contentEntry || contentEntry.type !== 'chunk') return;

      // 2. Recursively collect imported JS chunks
      const webAccessible = new Set<string>();
      const collect = (id: string) => {
        if (!webAccessible.has(id) && bundle[id]?.type === 'chunk') {
          webAccessible.add(id);
          (bundle[id] as any).imports.forEach(collect);
        }
      };
      collect(contentEntry.fileName);

      // 3. Collect all unique CSS files from those chunks
      const cssFiles = [...new Set([...webAccessible].flatMap((id) => (bundle[id] as any).viteMetadata?.importedCss || []))];

      // 4. Emit IIFE loader that injects CSS and dynamic-imports the entry
      const injectCss = cssFiles.map(css => `document.head.appendChild(Object.assign(document.createElement('link'),{rel:'stylesheet',href:chrome.runtime.getURL('${css}')}));`).join('');
      this.emitFile({
        type: 'asset',
        fileName: 'js/content_script_loader.js',
        source: `(async()=>{${injectCss}await import(chrome.runtime.getURL('${contentEntry.fileName}'))})();`,
      });

      // 5. Patch manifest.json
      const manifestAsset = bundle['manifest.json'];
      if (manifestAsset?.type === 'asset') {
        const manifest = JSON.parse(manifestAsset.source as string);
        if (manifest.background) manifest.background.type = 'module';
        manifest.content_scripts?.forEach((cs: any) => { if (cs.js) cs.js = ['js/content_script_loader.js']; });
        manifest.web_accessible_resources ??= [];
        manifest.web_accessible_resources.push({ resources: [...webAccessible, ...cssFiles], matches: ['https://calendar.google.com/*'] });
        manifestAsset.source = JSON.stringify(manifest, null, 2);
      }
    },
  };
}
