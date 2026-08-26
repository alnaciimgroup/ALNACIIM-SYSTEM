import fs from 'fs';

function extractFactoryTables() {
  const schemaStr = fs.readFileSync('scratch/alnaciim-erp/database/schema.sql', 'utf8');
  
  // Tables we WANT to keep for the factory
  const keepTables = [
    'warehouses',
    'categories',
    'products',
    'stock_levels',
    'stock_movements',
    'machines',
    'production_batches',
    'production_batch_materials',
    'machine_usage_logs',
    'downtime_logs',
    'maintenance_schedules',
    'maintenance_logs',
    'maintenance_parts_used',
    'suppliers',
    'purchase_orders',
    'purchase_items',
    'goods_receipts',
    'goods_receipt_items',
    'supplier_performance',
    'expense_categories',
    'expenses',
    'chart_of_accounts',
    'fiscal_years',
    'bank_accounts',
    'je_sequences',
    'journal_entries',
    'journal_lines',
    'budgets',
    'supplier_payments',
    'bill_of_materials',
    'bom_items'
  ];

  // A very basic parser to extract CREATE TABLE blocks
  // Since SQL parsing is tricky, we can just split by "CREATE TABLE" and extract the block.
  let resultSql = `-- Factory ERP Tables Migration\n-- Imported from new ERP\n\n`;

  // We can write a regex that grabs "CREATE TABLE X ( ... );"
  // Also we want to grab CREATE INDEX and ALTER TABLE for these kept tables.
  
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

  // Extract foreign keys
  for (const table of keepTables) {
    const fkRegex = new RegExp(`ALTER TABLE ${table}\\s+ADD CONSTRAINT .*? FOREIGN KEY .*?;`, 'gi');
    const fkMatches = schemaStr.match(fkRegex);
    if (fkMatches) {
      for (const m of fkMatches) {
        resultSql += `${m}\n`;
      }
    }
  }

  fs.writeFileSync('05_factory_erp_tables.sql', resultSql);
  console.log('Successfully generated 05_factory_erp_tables.sql!');
}

extractFactoryTables();
