const fs = require('fs');
const glob = require('glob');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir('src/app/dashboard', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Fix TS2532: Object is possibly 'undefined' (Usually for arrays, like data.map -> data?.map)
    // We won't regex all of them, but we can fix specific ones:
    // Fix `const something = [];` -> `const something: any[] = [];`
    const arrayDeclRegex = /const\s+([a-zA-Z0-9_]+)\s*=\s*\[\];/g;
    content = content.replace(arrayDeclRegex, (match, p1) => {
      changed = true;
      return `const ${p1}: any[] = [];`;
    });

    // Fix `setError(err.response?.data?.error || ...)`
    const errCatchRegex = /setError\(err\.response\?\.data\?\.error/g;
    if (errCatchRegex.test(content)) {
       content = content.replace(errCatchRegex, "setError((err as any)?.response?.data?.error");
       changed = true;
    }
    const errCatchRegex2 = /setError\(err\.message/g;
    if (errCatchRegex2.test(content)) {
       content = content.replace(errCatchRegex2, "setError((err as any)?.message");
       changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
});

walkDir('src/components/erp', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    const arrayDeclRegex = /const\s+([a-zA-Z0-9_]+)\s*=\s*\[\];/g;
    content = content.replace(arrayDeclRegex, (match, p1) => {
      changed = true;
      return `const ${p1}: any[] = [];`;
    });

    const errCatchRegex = /setError\(err\.response\?\.data\?\.error/g;
    if (errCatchRegex.test(content)) {
       content = content.replace(errCatchRegex, "setError((err as any)?.response?.data?.error");
       changed = true;
    }

    if (content.includes('prev: null')) {
       content = content.replace('prev: null', 'prev: any');
       changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
});
