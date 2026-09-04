import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const manifestDirectory = resolve(projectRoot, 'art', 'manifest');
const manifests = readdirSync(manifestDirectory).filter((name) => name.endsWith('.json') && name !== 'asset-manifest.schema.json');

const errors = [];
for (const name of manifests) {
  const manifestPath = resolve(manifestDirectory, name);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (!Array.isArray(manifest.assets)) {
    errors.push(`${name}: assets must be an array`);
    continue;
  }
  for (const asset of manifest.assets) {
    const label = `${name}:${asset.id ?? '<unnamed>'}`;
    if (typeof asset.source !== 'string' || !existsSync(resolve(projectRoot, asset.source))) {
      errors.push(`${label}: missing source file ${asset.source ?? '<none>'}`);
    }
    if (!Array.isArray(asset.canvas) || asset.canvas.length !== 2 || asset.canvas.some((value) => !Number.isInteger(value) || value < 1)) {
      errors.push(`${label}: canvas must contain two positive integer dimensions`);
    }
    if (!Array.isArray(asset.pivot) || asset.pivot.length !== 2 || asset.pivot.some((value) => typeof value !== 'number' || value < 0 || value > 1)) {
      errors.push(`${label}: pivot must contain two normalized coordinates`);
    }
    if (!['planned', 'candidate', 'approved', 'rejected'].includes(asset.approval)) {
      errors.push(`${label}: invalid approval state`);
    }
    if (asset.approval === 'approved' && (!asset.runtime || !existsSync(resolve(projectRoot, asset.runtime)))) {
      errors.push(`${label}: approved asset is missing runtime artifact ${asset.runtime ?? '<none>'}`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Asset validation failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Asset validation passed for ${manifests.length} manifest${manifests.length === 1 ? '' : 's'}.`);
