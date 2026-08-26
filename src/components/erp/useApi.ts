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
    const revenue = [];
    const expenses = [];

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
    const assets = [];
    const liabilities = [];
    const equity = [];

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
    if (type && type !== 'undefined' && type !== 'null' && type !== '') q = q.eq('type', type);
    if (search && search !== 'undefined' && search !== 'null' && search !== '') q = q.ilike('name', `%${search}%`);
    const { data } = await q.order('name');
    return { rows: data || [] };
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
    const { data } = await supabase.from('inventory_movements').select('*, products(name), warehouses(name)').order('movement_date', { ascending: false });
    return { rows: data || [] };
  }

  if (endpoint.includes('/inventory/stock-levels')) {
    const url = new URL(endpoint, 'http://localhost');
    const warehouseId = url.searchParams.get('warehouse_id');
    const { data: products } = await supabase.from('products').select('*');
    let q = supabase.from('inventory_movements').select('*');
    if (warehouseId && warehouseId !== 'undefined' && warehouseId !== 'null' && warehouseId !== '') q = q.eq('warehouse_id', warehouseId);
    const { data: movements } = await q;

    const stock = {};
    for (const m of (movements || [])) {
      if (!stock[m.product_id]) stock[m.product_id] = 0;
      if (m.movement_type === 'in' || m.movement_type === 'initial' || m.movement_type === 'transfer_in') stock[m.product_id] += Number(m.quantity);
      if (m.movement_type === 'out' || m.movement_type === 'adjustment' || m.movement_type === 'transfer_out') stock[m.product_id] -= Number(m.quantity);
    }
    
    const rows = (products || []).map(p => ({
      ...p,
      quantity_on_hand: stock[p.id] || 0
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
      const { data: items } = await supabase.from('bom_items').select('*, products(name)').eq('bom_id', bomId);
      return { rows: { ...bom, items: items || [] } };
    } else {
      // List all BOMs
      const { data } = await supabase.from('bill_of_materials').select('*, products(name)').order('created_at', { ascending: false });
      return { rows: data || [] };
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
      // Fetch specific PO with items
      const { data: po } = await supabase.from('purchase_orders').select('*, suppliers(name)').eq('id', poId).single();
      const { data: items } = await supabase.from('purchase_order_items').select('*, products(name)').eq('po_id', poId);
      return { rows: { ...po, items: items || [] } };
    } else {
      // List all POs
      const { data } = await supabase.from('purchase_orders').select('*, suppliers(name)').order('order_date', { ascending: false });
      return { rows: data || [] };
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
  const [data, setData] = useState(null);
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
