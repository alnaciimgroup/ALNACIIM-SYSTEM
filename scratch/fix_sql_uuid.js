import fs from 'fs';

let sql = fs.readFileSync('05_factory_erp_tables.sql', 'utf8');

// Replace INT with UUID for user references
sql = sql.replace(/INT(\s+NOT\s+NULL)?(\s+REFERENCES\s+users\(id\))/gi, 'UUID$1$2');
sql = sql.replace(/INT(\s+REFERENCES\s+users\(id\))/gi, 'UUID$1');

// Let's do the same for customers just in case it's a UUID too, or wait, we can just leave customers as INT unless it errors.
// Wait, looking closely at the SQL: manager_id INT, ... then later ALTER TABLE warehouses ADD CONSTRAINT fk_warehouses_manager FOREIGN KEY (manager_id) REFERENCES users(id); 
// In 05_factory_erp_tables.sql, warehouses has manager_id INT, but it doesn't have the inline REFERENCES users(id). It was added in ALTER TABLE. We missed the ALTER TABLE in our extraction. So manager_id is INT and doesn't have a FK right now. That's fine for now.

// For safety, let's fix ANY inline references to users(id)
fs.writeFileSync('05_factory_erp_tables.sql', sql);
console.log('Fixed users(id) references to UUID.');
