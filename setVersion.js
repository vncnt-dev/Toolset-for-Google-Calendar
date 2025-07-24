// Load Version fronm .version file and sets in the manifest.json and the package.json
const fs = require('fs');
const path = require('path');
const versionFilePath = path.join(__dirname, '.version');
const manifestPath = path.join(__dirname, 'public/manifest.json');
const packageJsonPath = path.join(__dirname, 'package.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = fs.readFileSync(versionFilePath, 'utf8').trim();

manifest.version = version;
packageJson.version = version;

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log(`Version set to ${version} in manifest.json and package.json`);