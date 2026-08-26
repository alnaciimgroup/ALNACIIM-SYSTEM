import fs from 'fs';

let css = fs.readFileSync('scratch/alnaciim-erp/frontend/src/index.css', 'utf8');

// Remove global tag selectors that might break ALNM-SYSTEM
css = css.replace(/\* \{ box-sizing: border-box; \}/g, '');
css = css.replace(/body \{[^}]+\}/g, '');
css = css.replace(/a \{ color: inherit; \}/g, '');
css = css.replace(/h1, h2, h3, h4 \{[^}]+\}/g, '');

// Save as erp.css
fs.writeFileSync('src/app/erp.css', css);
console.log('Saved erp.css without base tag overrides!');
