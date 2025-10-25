#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

// package.json에서 버전 읽기
const packageJson = JSON.parse(
  readFileSync(resolve(rootDir, 'package.json'), 'utf-8')
);
const version = packageJson.version;

console.log(`📦 Updating version to ${version}...`);

// tauri.conf.json 업데이트
const tauriConfPath = resolve(rootDir, 'src-tauri/tauri.conf.json');
const tauriConf = JSON.parse(readFileSync(tauriConfPath, 'utf-8'));
tauriConf.version = version;
writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
console.log(`✅ Updated src-tauri/tauri.conf.json`);

// Cargo.toml 업데이트
const cargoTomlPath = resolve(rootDir, 'src-tauri/Cargo.toml');
let cargoToml = readFileSync(cargoTomlPath, 'utf-8');
cargoToml = cargoToml.replace(
  /^version = ".*"$/m,
  `version = "${version}"`
);
writeFileSync(cargoTomlPath, cargoToml);
console.log(`✅ Updated src-tauri/Cargo.toml`);

console.log(`\n🎉 All files updated to version ${version}!`);
console.log(`\nNext steps:`);
console.log(`  git add .`);
console.log(`  git commit -m "chore: bump version to ${version}"`);
console.log(`  git push`);
