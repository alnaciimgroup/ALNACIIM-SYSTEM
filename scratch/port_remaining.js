const fs = require('fs');
const path = require('path');

const modules = ['sales', 'driver', 'reports', 'settings'];

modules.forEach(mod => {
  console.log(`Porting ${mod}...`);
  const srcDir = path.join('scratch/alnaciim-erp/frontend/src/pages', mod);
  const targetDir = path.join('src/app/dashboard', mod);
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));
  
  files.forEach(file => {
    let content = fs.readFileSync(path.join(srcDir, file), 'utf8');
    
    if (file.endsWith('.jsx')) {
      // Add use client
      if (!content.includes('use client')) {
        content = `'use client';\n\n` + content;
      }
      
      // Fix imports
      content = content.replace(/\.\.\/\.\.\/components\/useApi/g, '@/components/erp/useApi');
      content = content.replace(/\.\.\/\.\.\/components\/Table/g, '@/components/erp/Table');
      content = content.replace(/\.\.\/\.\.\/components\/GroupedTabs/g, '@/components/erp/GroupedTabs');
      content = content.replace(/\.\.\/\.\.\/components\/DateFilterBar/g, '@/components/erp/DateFilterBar');
      content = content.replace(/\.\.\/\.\.\/api\/client/g, '@/components/erp/client');
      content = content.replace(/\.\.\/\.\.\/context\/AuthContext/g, '@/components/erp/AuthContext');
      content = content.replace(/\.\.\/\.\.\/components\/QuickSearch/g, '@/components/erp/QuickSearch');
      
      // Fix utils (using regex for any number of ../)
      content = content.replace(/(\.\.\/)+utils\/dateRanges/g, '@/utils/dateRanges');
      content = content.replace(/(\.\.\/)+utils\/exportUtils/g, '@/utils/exportUtils');
      
      // Fix local relative .jsx imports
      content = content.replace(/\.jsx/g, '');
    }
    
    const basename = path.basename(file, path.extname(file));
    
    const modCap = mod.charAt(0).toUpperCase() + mod.slice(1);
    let destName = `${basename}.tsx`;
    
    if (file.endsWith('.js')) {
        destName = `${basename}.js`;
    }
    
    if (basename === `${modCap}Page` || basename === 'index') {
      destName = 'page.tsx';
    }
    
    fs.writeFileSync(path.join(targetDir, destName), content);
  });
});

console.log('Porting complete!');
