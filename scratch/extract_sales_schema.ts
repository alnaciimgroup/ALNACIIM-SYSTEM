import fs from 'fs';

function extractSalesTables() {
  const schemaStr = fs.readFileSync('scratch/alnaciim-erp/database/schema.sql', 'utf8');
  
  const keepTables = [
    'customers',
    'sales_orders',
    'sales_order_items',
    'trucks',
    'truck_loads',
    'shipments',
    'shipment_stops',
    'customer_payments',
    'customer_balances',
    'route_sessions',
    'qaade_performance',
    'retail_sessions',
    'deliveries' // any other table that might be missing
  ];

  let resultSql = `-- Sales & Logistics ERP Tables Migration\n\n`;
  
  for (const table of keepTables) {
    const tableRegex = new RegExp(`CREATE TABLE ${table}\\s*\\([\\s\\S]*?\\);`, 'gi');
    const tableMatch = schemaStr.match(tableRegex);
    if (tableMatch) {
      resultSql += `${tableMatch[0]}\n\n`;
    }
  }

  // Extract indexes
  for (const table of keepTables) {
    const indexRegex = new RegExp(`CREATE INDEX .*? ON ${table}\\(.*?\\);`, 'gi');
    const indexMatches = schemaStr.match(indexRegex);
    if (indexMatches) {
      for (const m of indexMatches) {
        resultSql += `${m}\n`;
      }
    }
  }

  fs.writeFileSync('06_sales_distribution_tables.sql', resultSql);
  console.log('Successfully generated 06_sales_distribution_tables.sql!');
}

extractSalesTables();
