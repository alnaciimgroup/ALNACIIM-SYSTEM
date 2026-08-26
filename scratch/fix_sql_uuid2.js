import fs from 'fs';

let sql = fs.readFileSync('05_factory_erp_tables.sql', 'utf8');

// The columns that hold user IDs
const userColumns = [
  'manager_id', 'supervisor_id', 'operator_id', 
  'reported_by', 'resolved_by', 'assigned_to', 
  'evaluated_by', 'recorded_by', 'created_by', 
  'voided_by', 'closed_by', 'received_by'
];

for (const col of userColumns) {
  // Replace: "manager_id  INT," with "manager_id  UUID,"
  const regex = new RegExp(`(${col}\\s+)INT`, 'gi');
  sql = sql.replace(regex, '$1UUID');
}

// Write it back
fs.writeFileSync('05_factory_erp_tables.sql', sql);
console.log('Fixed all user reference columns to UUID.');
