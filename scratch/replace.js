const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) { 
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  // Replace all variations
  newContent = newContent.replace(/superadmin/g, 'manager');
  newContent = newContent.replace(/Superadmin/g, 'Manager');
  newContent = newContent.replace(/SUPERADMIN/g, 'MANAGER');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Updated:', file);
  }
});
