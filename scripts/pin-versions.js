const fs = require('fs');
const path = require('path');
const p = require(path.join(__dirname, '..', 'package-lock.json'));
const pkgs = p.packages;
const root = pkgs[''];

const all = { ...root.dependencies, ...root.devDependencies };
const lockedVersions = {};

Object.entries(all).forEach(([k, v]) => {
  const locked = pkgs['node_modules/' + k]?.version;
  lockedVersions[k] = locked || v.replace(/^[\^~]/, '');
});

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'));

['dependencies', 'devDependencies'].forEach((section) => {
  if (pkg[section]) {
    Object.keys(pkg[section]).forEach((k) => {
      if (lockedVersions[k]) {
        pkg[section][k] = lockedVersions[k];
      }
    });
  }
});

fs.writeFileSync(path.join(__dirname, '..', 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
console.log('package.json pinned to locked versions');
