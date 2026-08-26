import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function generateReport() {
  console.log('Fetching all customers for refined report...');
  let allCustomers = [];
  let start = 0;
  const limit = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, tank_number, phone, status, customer_type, guarantor')
      .range(start, start + limit - 1);
      
    if (error) {
      console.error('Error fetching customers:', error);
      break;
    }
    if (!data || data.length === 0) break;
    allCustomers = allCustomers.concat(data);
    start += limit;
  }

  console.log(`Fetched ${allCustomers.length} total customers.`);

  // Group by tank_number
  const groups = {};
  allCustomers.forEach(c => {
    const tank = (c.tank_number || '').trim();
    if (tank) {
      if (!groups[tank]) {
        groups[tank] = [];
      }
      groups[tank].push(c);
    }
  });

  // Filter groups where there are DIFFERENT customers sharing the same tank ID
  const sharedTanks = Object.keys(groups)
    .map(tank => {
      const customers = groups[tank];
      const uniqueNames = new Set(
        customers.map(c => c.name.toLowerCase().trim().replace(/\s+/g, ' '))
      );
      
      return {
        tank,
        uniqueCount: uniqueNames.size,
        totalCount: customers.length,
        customers
      };
    })
    .filter(g => g.uniqueCount > 1)
    .sort((a, b) => b.uniqueCount - a.uniqueCount || b.totalCount - a.totalCount);

  console.log(`Found ${sharedTanks.length} tank numbers shared by different customers.`);

  const totalAffected = sharedTanks.reduce((sum, d) => sum + d.customers.length, 0);

  // 1. Generate CSV
  let csvContent = 'Tank ID,Unique Customers Count,Total Records,Customer Name,Phone Number,Status,Customer Type,Guarantor\n';
  sharedTanks.forEach(d => {
    d.customers.forEach(c => {
      const cleanName = `"${(c.name || '').replace(/"/g, '""')}"`;
      const cleanPhone = `"${(c.phone || '').replace(/"/g, '""')}"`;
      const cleanStatus = `"${(c.status || '').replace(/"/g, '""')}"`;
      const cleanType = `"${(c.customer_type || '').replace(/"/g, '""')}"`;
      const cleanGuarantor = `"${(c.guarantor || '').replace(/"/g, '""')}"`;
      csvContent += `${d.tank},${d.uniqueCount},${d.totalCount},${cleanName},${cleanPhone},${cleanStatus},${cleanType},${cleanGuarantor}\n`;
    });
  });
  fs.writeFileSync('duplicate_tanks_list.csv', csvContent);
  console.log('CSV list generated successfully as duplicate_tanks_list.csv');

  // 2. Generate HTML
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Shared Tank Numbers Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    
    body {
      font-family: 'Inter', sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 20px;
      margin-bottom: 25px;
    }
    
    .company-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      text-transform: uppercase;
    }
    
    .report-title {
      font-size: 16px;
      font-weight: 600;
      color: #059669;
      margin-top: 5px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    
    .meta-card {
      background-color: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 12px;
      padding: 15px;
      text-align: center;
    }
    
    .meta-val {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
    }
    
    .meta-lbl {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      margin-top: 4px;
      letter-spacing: 0.5px;
    }
    
    .success-banner {
      background-color: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 12px;
      padding: 30px;
      text-align: center;
      margin-top: 40px;
    }
    
    .success-icon {
      font-size: 40px;
      color: #059669;
      margin-bottom: 10px;
    }
    
    .success-title {
      font-size: 18px;
      font-weight: 700;
      color: #065f46;
    }
    
    .success-desc {
      font-size: 13px;
      color: #047857;
      margin-top: 5px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      text-align: left;
    }
    
    th {
      background-color: #0f172a;
      color: #ffffff;
      padding: 10px 12px;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
    }
    
    tr {
      page-break-inside: avoid;
    }
    
    td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="company-title">Alnaciim Group</div>
    <div class="report-title">Shared Customer Tanks Audit Report</div>
  </div>
  
  <div class="meta-grid">
    <div class="meta-card">
      <div class="meta-val">${allCustomers.length.toLocaleString()}</div>
      <div class="meta-lbl">Total Customers</div>
    </div>
    <div class="meta-card">
      <div class="meta-val">${sharedTanks.length.toLocaleString()}</div>
      <div class="meta-lbl">Shared Tank IDs</div>
    </div>
    <div class="meta-card">
      <div class="meta-val">${totalAffected.toLocaleString()}</div>
      <div class="meta-lbl">Affected Customer Profiles</div>
    </div>
  </div>

  ${
    sharedTanks.length === 0
      ? `
      <div class="success-banner">
        <div class="success-icon">✓</div>
        <div class="success-title">Audit Completed Successfully</div>
        <div class="success-desc">All customer tank numbers are now uniquely assigned. No duplicate or shared tanks detected.</div>
      </div>
      `
      : `
      <table>
        <thead>
          <tr>
            <th style="width: 15%;">Tank ID</th>
            <th style="width: 25%;">Unique Customers</th>
            <th style="width: 60%;">Associated Customer Profiles</th>
          </tr>
        </thead>
        <tbody>
          <!-- table rows -->
        </tbody>
      </table>
      `
  }

</body>
</html>
  `;

  fs.writeFileSync('scratch/duplicate_tanks_report.html', html);
  console.log('HTML written to scratch/duplicate_tanks_report.html');

  // Convert to PDF using Playwright
  console.log('Launching Playwright for PDF generation...');
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const htmlPath = path.resolve('scratch/duplicate_tanks_report.html');
    await page.goto(`file://${htmlPath}`);
    
    await page.pdf({
      path: '/Users/mohamedabshir/ALNM-SYSTEM/duplicate_tanks_report.pdf',
      format: 'A4',
      margin: {
        top: '15mm',
        bottom: '15mm',
        left: '15mm',
        right: '15mm'
      },
      printBackground: true
    });
    
    await browser.close();
    console.log('PDF generated successfully at /Users/mohamedabshir/ALNM-SYSTEM/duplicate_tanks_report.pdf');
  } catch (err) {
    console.error('Playwright failed to generate PDF:', err);
  }
}

generateReport();
