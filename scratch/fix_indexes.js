import fs from 'fs';

let sql = fs.readFileSync('05_factory_erp_tables.sql', 'utf8');

// The extraction script accidentally grabbed some indexes for columns that 
// were added in ALTER TABLE statements that we skipped. Let's delete those index lines.
const invalidColumns = ['parent_warehouse_id', 'cost_center_id', 'project_id', 'company_id', 'branch_id'];

let lines = sql.split('\n');
lines = lines.filter(line => {
  if (line.startsWith('CREATE INDEX')) {
    for (const col of invalidColumns) {
      if (line.includes(`(${col})`)) {
        return false; // delete this line
      }
    }
  }
  return true;
});

fs.writeFileSync('05_factory_erp_tables.sql', lines.join('\n'));
console.log('Cleaned up invalid indexes.');
