import { writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
const root = "dist/demo-ring-of-fire";
async function files(directory, prefix = '') {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error('Symlink in public demo: '+entry.name);
    const relative = prefix + entry.name;
    if (entry.isDirectory()) result.push(...await files(join(directory,entry.name),relative+'/'));
    else {
      if (!/\.(?:html|js|css|webp|jpg|png|txt|json)$/.test(entry.name) || entry.name.startsWith('.')) throw new Error('Unexpected public file: '+relative);
      result.push(relative);
    }
  }
  return result.sort();
}
const publicFiles = (await files(root)).filter(file=>file!=='demo-manifest.json');
await writeFile(join(root,'demo-manifest.json'), JSON.stringify({publicPath:"/demos/ring-of-fire/",mode:'full-shared-device-game',features:["2-8 local players", "player rename/remove", "10 original avatars", "52-card shuffled deck", "turn rotation", "classic party rules", "optional alcohol-free rules", "draw animation lock", "complete turn history", "validated browser-local continue", "new round", "clear table"],notConnected:["Firebase", "Firestore", "online room creation", "cloud synchronization"],files:publicFiles},null,2)+'\n');
console.log('Public demo manifest written: '+root+'/demo-manifest.json');
