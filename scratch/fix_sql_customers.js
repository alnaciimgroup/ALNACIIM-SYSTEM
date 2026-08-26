import fs from 'fs';

let sql = fs.readFileSync('05_factory_erp_tables.sql', 'utf8');

// Replace INT with UUID for customer references
sql = sql.replace(/INT(\s+NOT\s+NULL)?(\s+REFERENCES\s+customers\(id\))/gi, 'UUID$1$2');
sql = sql.replace(/INT(\s+REFERENCES\s+customers\(id\))/gi, 'UUID$1');

// Also explicitly catch "customer_id INT" just in case it lacks the inline reference
sql = sql.replace(/customer_id\s+INT/gi, 'customer_id        UUID');

fs.writeFileSync('05_factory_erp_tables.sql', sql);
console.log('Fixed customers(id) references to UUID.');
