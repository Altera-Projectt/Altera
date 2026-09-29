const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const replacements = [
  { regex: /bg-\[#111111\]/g, replacement: 'bg-[var(--color-background)]' },
  { regex: /bg-\[#18181b\]/g, replacement: 'bg-[var(--color-card)]' },
  { regex: /text-white(?!(\/|\]|\}))/g, replacement: 'text-[var(--color-foreground)]' },
  { regex: /border-zinc-800/g, replacement: 'border-[var(--color-border)]' },
  { regex: /bg-zinc-900/g, replacement: 'bg-[var(--color-muted)]' },
  { regex: /text-zinc-400/g, replacement: 'text-[var(--color-muted-foreground)]' },
  { regex: /text-zinc-300/g, replacement: 'text-[var(--color-muted-foreground)]' },
  { regex: /text-zinc-500/g, replacement: 'text-[var(--color-muted-foreground)]' },
];

const targetDirs = [
  '/Users/huynhkhoi/SU_26/ALTERA_PRJ/Altera/FE/src/pages',
  '/Users/huynhkhoi/SU_26/ALTERA_PRJ/Altera/FE/src/components'
];

targetDirs.forEach(dir => {
  walkDir(dir, filePath => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let original = content;
      replacements.forEach(({ regex, replacement }) => {
        content = content.replace(regex, replacement);
      });
      if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
      }
    }
  });
});
