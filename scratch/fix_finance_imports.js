import fs from 'fs';
import path from 'path';

function fixImports(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Add 'use client'
  if (!content.includes('use client')) {
    content = `'use client';\n\n` + content;
  }
  
  // Replace imports
  content = content.replace(/\.\.\/\.\.\/components\//g, '@/components/erp/');
  content = content.replace(/\.\.\/\.\.\/api\/client/g, '@/components/erp/client');
  content = content.replace(/\.\.\/\.\.\/context\/AuthContext/g, '@/components/erp/AuthContext');

  fs.writeFileSync(file, content);
  console.log('Fixed imports in', file);
}

fixImports('src/app/dashboard/finance/page.tsx');
fixImports('src/app/dashboard/finance/BillingCollectionsTab.tsx');
