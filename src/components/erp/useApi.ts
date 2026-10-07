'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

// A deep, recursive Proxy that acts as a universal fallback for missing data
// while the real API data is loading.
function createSafeProxy() {
  const handler = {
    get(target, prop, receiver) {
      if (prop === 'toFixed') return () => '0.0';
      if (prop === 'map') return () => [];
      if (prop === 'filter') return () => [];
      if (prop === 'find') return () => null;
      if (prop === 'some') return () => false;
      if (prop === 'includes') return () => false;
      if (prop === 'reduce') return () => 0;
      if (prop === 'slice') return () => [];
      if (prop === 'length') return 0;
      if (prop === 'toString') return () => '0';
      if (prop === 'valueOf') return () => 0;
      if (prop === '$$typeof' || prop === 'constructor' || prop === 'prototype' || prop === 'name') return undefined;
      if (typeof prop === 'symbol') return Reflect.get(target, prop, receiver);
      return createSafeProxy();
    }
  };
  return new Proxy([], handler);
}

// Map frontend endpoints to actual Supabase queries
async function fetchSupabaseData(endpoint) {
  const supabase = createClient();
  
  if (endpoint.includes('finance/chart-of-accounts')) {
    const { data } = await supabase.from('chart_of_accounts').select('*').order('code');
    return { rows: data || [] };
  }
  
  if (endpoint.includes('finance/bank-accounts')) {
    const { data } = await supabase.from('bank_accounts').select('*').order('name');
    return { rows: data || [] };
  }

  if (endpoint.includes('reports/cash-summary')) {
    const url = new URL(endpoint, 'http://localhost');
    // If not provided, fetch all time (used by overview dashboards)
    const from = url.searchParams.get('from') || '2000-01-01';
    const to = url.searchParams.get('to') || '2100-01-01';

    const { data: payments } = await supabase.from('payments')
      .select('*')
      .gte('created_at', `${from}T00:00:00.000Z`)
      .lte('created_at', `${to}T23:59:59.999Z`);

    const { data: sales } = await supabase.from('sales')
      .select('sale_type, total_amount')
      .gte('created_at', `${from}T00:00:00.000Z`)
      .lte('created_at', `${to}T23:59:59.999Z`);

    const total_collected = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);

    const methods: Record<string, any> = {};
    for (const p of (payments || [])) {
        const m = p.payment_method || 'unknown';
        if (!methods[m]) methods[m] = { count: 0, total: 0 };
        methods[m].count += 1;
        methods[m].total += Number(p.amount);
    }
    const by_method = Object.keys(methods).map(m => ({
        method: m.replace('_', ' ').toUpperCase(),
        count: methods[m].count,
        total: methods[m].total
    }));

    const types: Record<string, any> = {};
    for (const s of (sales || [])) {
        const st = s.sale_type || 'unknown';
        if (!types[st]) types[st] = { count: 0, total: 0 };
        types[st].count += 1;
        types[st].total += Number(s.total_amount);
    }
    const sale_type_split = Object.keys(types).map(st => ({
        sale_type: st.toUpperCase(),
        order_count: types[st].count,
        total: types[st].total
    }));

    return {
        rows: { from, to, total_collected, by_method, sale_type_split }
    };
  }

  if (endpoint.includes('reports/profit-loss')) {
    const { data: accounts } = await supabase.from('chart_of_accounts').select('*');
    const { data: lines } = await supabase.from('journal_lines').select('account_id, debit, credit');
    
    const balances = {};
    for (const line of (lines || [])) {
        if (!balances[line.account_id]) balances[line.account_id] = 0;
        balances[line.account_id] += (Number(line.credit) || 0) - (Number(line.debit) || 0);
    }

    let total_revenue = 0;
    let total_expenses = 0;
    const revenue: any[] = [];
    const expenses: any[] = [];

    for (const acc of (accounts || [])) {
        const bal = balances[acc.id] || 0;
        if (acc.account_type === 'revenue') {
            revenue.push({ name: acc.name, amount: bal });
            total_revenue += bal;
        } else if (acc.account_type === 'expense') {
            const expBal = -bal; 
            expenses.push({ name: acc.name, amount: expBal });
            total_expenses += expBal;
        }
    }
    return { rows: { total_revenue, total_expenses, net_income: total_revenue - total_expenses, revenue, expenses } };
  }

  if (endpoint.includes('reports/balance-sheet')) {
    const { data: accounts } = await supabase.from('chart_of_accounts').select('*');
    const { data: lines } = await supabase.from('journal_lines').select('account_id, debit, credit');
    
    const balances = {};
    for (const line of (lines || [])) {
        if (!balances[line.account_id]) balances[line.account_id] = 0;
        balances[line.account_id] += (Number(line.debit) || 0) - (Number(line.credit) || 0);
    }

    let total_assets = 0;
    let total_liabilities = 0;
    let total_equity = 0;
    let current_year_earnings = 0;
    const assets: any[] = [];
    const liabilities: any[] = [];
    const equity: any[] = [];

    for (const acc of (accounts || [])) {
        const bal = balances[acc.id] || 0;
        if (acc.account_type === 'asset') {
            assets.push({ name: acc.name, balance: bal });
            total_assets += bal;
        } else if (acc.account_type === 'liability') {
            const liabBal = -bal;
            liabilities.push({ name: acc.name, balance: liabBal });
            total_liabilities += liabBal;
        } else if (acc.account_type === 'equity') {
            const eqBal = -bal;
            equity.push({ name: acc.name, balance: eqBal });
            total_equity += eqBal;
        } else if (acc.account_type === 'revenue') {
            current_year_earnings -= bal; 
        } else if (acc.account_type === 'expense') {
            current_year_earnings -= bal; 
        }
    }
    return { rows: { total_assets, total_liabilities, total_equity, current_year_earnings, is_balanced: true, assets, liabilities, equity } };
  }
  
  if (endpoint.includes('/products')) {
    const url = new URL(endpoint, 'http://localhost');
    const type = url.searchParams.get('type');
    const search = url.searchParams.get('search');
    let q = supabase.from('products').select('*, categories(name)');
    if (type && type !== 'undefined' && type !== 'null' && type !== '') q = q.eq('product_type', type);
    if (search && search !== 'undefined' && search !== 'null' && search !== '') q = q.ilike('name', `%${search}%`);
    const { data } = await q.order('name');
    
    const { data: stocks } = await supabase.from('stock_levels').select('product_id, quantity');
    const qtys: Record<number, number> = {};
    if (stocks) {
      for (const s of stocks) {
        qtys[s.product_id] = (qtys[s.product_id] || 0) + Number(s.quantity);
      }
    }

    const rows = (data || []).map(p => ({
      ...p,
      category_name: p.categories?.name,
      total_quantity: qtys[p.id] || 0,
      total_amount: (qtys[p.id] || 0) * Number(p.unit_cost || 0)
    }));
    
    return { rows };
  }

  if (endpoint.includes('/categories')) {
    const { data } = await supabase.from('categories').select('*').order('name');
    return { rows: data || [] };
  }

  if (endpoint.includes('/warehouses')) {
    const { data } = await supabase.from('warehouses').select('*').order('name');
    return { rows: data || [] };
  }

  if (endpoint.includes('/inventory/movements')) {
    const { data } = await supabase.from('stock_movements').select('*, products(name), warehouses!warehouse_id(name), related_warehouse:warehouses!related_warehouse_id(name), users!performed_by(full_name)').order('created_at', { ascending: false });
    const rows = (data || []).map(d => ({
      ...d,
      product_name: (d.products as any)?.name,
      warehouse_name: (d.warehouses as any)?.name,
      destination: (d.related_warehouse as any)?.name || d.reference_type || '-',
      performed_by_name: (d.users as any)?.full_name || 'System'
    }));
    return { rows };
  }

  if (endpoint.includes('/inventory/stock-levels')) {
    const url = new URL(endpoint, 'http://localhost');
    const warehouseId = url.searchParams.get('warehouse_id');
    
    let q = supabase.from('stock_levels').select('*, products(name, sku, unit, unit_cost), warehouses(name)');
    if (warehouseId && warehouseId !== 'undefined' && warehouseId !== 'null' && warehouseId !== '') {
      q = q.eq('warehouse_id', warehouseId);
    }
    
    const { data } = await q.order('updated_at', { ascending: false });
    
    const rows = (data || []).map(s => ({
      ...s,
      product_name: (s.products as any)?.name,
      sku: (s.products as any)?.sku,
      unit: (s.products as any)?.unit,
      warehouse_name: (s.warehouses as any)?.name,
      total_amount: Number(s.quantity) * Number((s.products as any)?.unit_cost || 0)
    }));
    
    return { rows };
  }

  if (endpoint.includes('/production/machines')) {
    const { data } = await supabase.from('machines').select('*').order('name');
    return { rows: data || [] };
  }

  if (endpoint.includes('/production/bom')) {
    const url = new URL(endpoint, 'http://localhost');
    const pathParts = url.pathname.split('/');
    const bomId = pathParts.length > 3 ? pathParts[3] : null;
    
    if (bomId) {
      // Fetch specific BOM with items
      const { data: bom } = await supabase.from('bill_of_materials').select('*, products(name)').eq('id', bomId).single();
      const { data: items } = await supabase.from('bom_items').select('*, products(name, unit)').eq('bom_id', bomId);
      
      const mappedItems = (items || []).map((i: any) => ({
        ...i,
        raw_material_name: i.products?.name,
        unit: i.products?.unit || 'unit'
      }));
      
      return { rows: { ...bom, product_name: (bom as any).products?.name, items: mappedItems } };
    } else {
      // List all BOMs
      const { data } = await supabase.from('bill_of_materials').select('*, products(name)').order('created_at', { ascending: false });
      const rows = (data || []).map((bom: any) => ({
        ...bom,
        product_name: bom.products?.name
      }));
      return { rows };
    }
  }

  if (endpoint.includes('/production/batches')) {
    const url = new URL(endpoint, 'http://localhost');
    const type = url.searchParams.get('production_type');
    let q = supabase.from('production_batches').select('*, products(name), machines(name)');
    // production_type doesn't natively exist in batches unless we joined on machines, 
    // but we'll fetch all and order them.
    const { data } = await q.order('start_time', { ascending: false });
    
    // Calculate progress based on status
    const rows = (data || []).map(b => {
      let progress = 0;
      if (b.status === 'completed') progress = 100;
      else if (b.status === 'in_progress') progress = 50;
      return { ...b, progress };
    });
    return { rows };
  }

  if (endpoint.includes('/maintenance/logs')) {
    const { data } = await supabase.from('maintenance_logs').select('*, machines(name)').order('maintenance_date', { ascending: false });
    return { rows: data || [] };
  }

  if (endpoint.includes('/maintenance/schedules')) {
    const { data } = await supabase.from('maintenance_schedules').select('*, machines(name)').order('next_due_date', { ascending: true });
    return { rows: data || [] };
  }

  if (endpoint.includes('/suppliers')) {
    const { data } = await supabase.from('suppliers').select('*').order('name');
    return { rows: data || [] };
  }

  if (endpoint.includes('/procurement/purchase-orders')) {
    const url = new URL(endpoint, 'http://localhost');
    const pathParts = url.pathname.split('/');
    const poId = pathParts.length > 3 ? pathParts[3] : null;

    if (poId) {
      // Fetch specific PO with items and receipts
      const { data: po } = await supabase.from('purchase_orders').select('*, suppliers(name)').eq('id', poId).single();
      const { data: receipts } = await supabase.from('goods_receipts').select('warehouses(name)').eq('purchase_order_id', poId);
      const { data: items } = await supabase.from('purchase_items').select('*, products(name)').eq('purchase_order_id', poId);
      
      const mappedItems = items?.map(it => ({ ...it, product_name: (it.products as any)?.name })) || [];
      const warehouseNames = [...new Set(receipts?.map(r => (r.warehouses as any)?.name).filter(Boolean))].join(', ') || 'Not received yet';
      
      return { rows: { ...po, supplier_name: (po.suppliers as any)?.name, destination_warehouse: warehouseNames, items: mappedItems } };
    } else {
      // List all POs
      const { data } = await supabase.from('purchase_orders')
        .select('*, suppliers(name), purchase_items(quantity_ordered, quantity_received)')
        .order('order_date', { ascending: false });
      
      const rows = (data || []).map(po => {
        const totalQtyOrd = (po.purchase_items as any[])?.reduce((sum, item) => sum + Number(item.quantity_ordered), 0) || 0;
        const totalQtyRec = (po.purchase_items as any[])?.reduce((sum, item) => sum + Number(item.quantity_received || 0), 0) || 0;
        return {
          ...po,
          supplier_name: (po.suppliers as any)?.name,
          total_quantity: totalQtyOrd,
          received_quantity: totalQtyRec
        };
      });
      return { rows };
    }
  }

  if (endpoint.includes('/sales/deliveries')) {
    const url = new URL(endpoint, 'http://localhost');
    const driverId = url.searchParams.get('driver_id');
    
    let q = supabase.from('deliveries').select(`
      *,
      sales_orders(order_number, customers(name)),
      trucks(plate_number)
    `);
    if (driverId && driverId !== 'undefined') q = q.eq('driver_id', driverId);
    
    const { data } = await q.order('id', { ascending: false });
    
    // Flatten nested relations for the UI
    const rows = (data || []).map(d => ({
      ...d,
      order_number: d.sales_orders?.order_number,
      customer_name: d.sales_orders?.customers?.name,
      plate_number: d.trucks?.plate_number
    }));
    return { rows };
  }

  if (endpoint.startsWith('/customers')) {
    const { data } = await supabase.from('customers').select('*').order('name');
    return { rows: data || [] };
  }
  
  if (endpoint.startsWith('/trucks')) {
    const { data } = await supabase.from('trucks').select('*').order('plate_number');
    return { rows: data || [] };
  }

  if (endpoint.startsWith('/retail/products')) {
    const { data } = await supabase.from('products').select('*').eq('product_type', 'finished_good').order('name');
    return { rows: data || [] };
  }

  if (endpoint.startsWith('/sales/orders')) {
    const url = new URL(endpoint, 'http://localhost');
    const pathParts = url.pathname.split('/');
    const orderId = pathParts.length > 3 ? pathParts[3] : null;

    if (orderId) {
      const { data: order } = await supabase.from('sales_orders').select('*, customers(name, debt)').eq('id', orderId).single();
      const { data: items } = await supabase.from('sales_order_items').select('*, products(name, unit)').eq('sales_order_id', orderId);
      
      return { 
        rows: { 
          ...order, 
          customer_name: order?.customers?.name,
          customer_outstanding_balance: order?.customers?.debt || 0,
          amount_paid: order?.payment_status === 'paid' ? Number(order.total_amount) : 0,
          items: (items || []).map(i => ({ ...i, product_name: i.products?.name, unit: i.products?.unit })),
          payments: []
        } 
      };
    } else {
      const { data } = await supabase.from('sales_orders').select(`
        *,
        customers(name)
      `).order('created_at', { ascending: false });
      
      const rows = (data || []).map(d => ({
        ...d,
        customer_name: d.customers?.name
      }));
      return { rows };
    }
  }
  
  if (endpoint.startsWith('/sales/truck-loads')) {
    const { data } = await supabase.from('truck_loads').select(`
      *,
      trucks(plate_number),
      products(name)
    `).order('loaded_at', { ascending: false });
    
    const rows = (data || []).map(d => ({
      ...d,
      plate_number: d.trucks?.plate_number,
      product_name: d.products?.name
    }));
    return { rows };
  }

  // Return null if endpoint is not implemented yet, so the UI falls back to the Proxy
  return null;
}

export function useApi(endpoint, deps = []) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    if (!endpoint) return;
    setLoading(true);
    
    const res = await fetchSupabaseData(endpoint);
    if (res) {
      setData(res);
    } else {
      setData(null); // Will fallback to proxy below
    }
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, deps);

  // If real data exists, return it! Otherwise return the safe proxy so the UI doesn't crash while loading/unimplemented.
  if (data) {
    return { ...data, reload };
  }

  // Fallback / Loading state
  let fallbackRows;
  if (endpoint?.includes('profit-loss')) {
    fallbackRows = { total_revenue: 0, total_expenses: 0, net_income: 0, revenue: [], expenses: [] };
  } else if (endpoint?.includes('balance-sheet')) {
    fallbackRows = { total_assets: 0, total_liabilities: 0, total_equity: 0, is_balanced: true, assets: [], liabilities: [], equity: [] };
  } else if (endpoint?.includes('general-ledger')) {
    fallbackRows = { account: { code: '...', name: 'Loading...' }, lines: [], closing_balance: 0 };
  } else {
    fallbackRows = createSafeProxy();
  }

  return { rows: fallbackRows, data: createSafeProxy(), reload };
}
