const fs = require('fs');
const path = require('path');
const glob = require('glob'); // Not installed? We can just use a recursive function.

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

    // Fix catch (err)
    if (content.includes('catch (err) {')) {
      content = content.replace(/catch \(err\) \{/g, 'catch (e) { const err = e as any;');
      changed = true;
    }

    // Fix useState(null)
    if (content.includes('useState(null)')) {
      content = content.replace(/useState\(null\)/g, 'useState<any>(null)');
      changed = true;
    }

    // Fix useState([])
    if (content.includes('useState([])')) {
      content = content.replace(/useState\(\[\]\)/g, 'useState<any[]>([])');
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed', filePath);
    }
  }
});

walkDir('src/components/erp', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    if (content.includes('catch (err) {')) {
      content = content.replace(/catch \(err\) \{/g, 'catch (e) { const err = e as any;');
      changed = true;
    }
    if (content.includes('useState(null)')) {
      content = content.replace(/useState\(null\)/g, 'useState<any>(null)');
      changed = true;
    }
    if (content.includes('useState([])')) {
      content = content.replace(/useState\(\[\]\)/g, 'useState<any[]>([])');
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed', filePath);
    }
  }
});
