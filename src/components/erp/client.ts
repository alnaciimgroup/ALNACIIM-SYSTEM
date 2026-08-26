import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

const client = {
  get: async (endpoint) => {
    return { data: { data: {} } };
  },
  post: async (endpoint, payload) => {
    try {
      if (endpoint === '/finance/bank-accounts') {
        const { data, error } = await supabase.from('bank_accounts').insert([payload]).select();
        if (error) throw error;
        return { data };
      }
      
      if (endpoint === '/finance/chart-of-accounts') {
        const { data, error } = await supabase.from('chart_of_accounts').insert([payload]).select();
        if (error) throw error;
        return { data };
      }

      if (endpoint.includes('/finance/journal-entries')) {
        // payload should have { description, entry_date, reference_type, status, lines }
        const { data: authData } = await supabase.auth.getUser();
        // 1. Insert header
        const { data: header, error: headErr } = await supabase.from('journal_entries').insert([{
          description: payload.description,
          entry_number: `JE-${Date.now()}`,
          entry_date: payload.entry_date,
          reference_type: payload.reference_type || 'manual',
          status: payload.status,
          created_by: authData.user?.id
        }]).select().single();
        if (headErr) throw headErr;
        
        // 2. Insert lines
        if (payload.lines && payload.lines.length > 0) {
          const lines = payload.lines.map(l => ({
            journal_entry_id: header.id,
            account_id: l.account_id,
            debit: Number(l.debit) || 0,
            credit: Number(l.credit) || 0
          }));
          const { error: linesErr } = await supabase.from('journal_lines').insert(lines);
          if (linesErr) throw linesErr;
        }
        return { data: header };
      }
      
      if (endpoint === '/products') {
        const { data, error } = await supabase.from('products').insert([payload]).select();
        if (error) throw error;
        return { data };
      }

      if (endpoint === '/categories') {
        const { data, error } = await supabase.from('categories').insert([payload]).select();
        if (error) throw error;
        return { data };
      }

      if (endpoint === '/warehouses') {
        const { data, error } = await supabase.from('warehouses').insert([payload]).select();
        if (error) throw error;
        return { data };
      }

      if (endpoint === '/inventory/movements') {
        const { data: authData } = await supabase.auth.getUser();
        const { data, error } = await supabase.from('inventory_movements').insert([{
          ...payload,
          performed_by: authData.user?.id
        }]).select();
        if (error) throw error;
        return { data };
      }

      if (endpoint === '/production/machines') {
        const { data, error } = await supabase.from('machines').insert([payload]).select();
        if (error) throw error;
        return { data };
      }

      if (endpoint === '/production/bom') {
        const { data: header, error: headErr } = await supabase.from('bill_of_materials').insert([{
          product_id: payload.product_id,
          version: payload.version,
          status: payload.status
        }]).select().single();
        if (headErr) throw headErr;
        
        if (payload.items && payload.items.length > 0) {
          const items = payload.items.map(i => ({
            bom_id: header.id,
            product_id: i.product_id,
            quantity: Number(i.quantity) || 0,
            unit_of_measure: i.unit_of_measure || 'kg'
          }));
          const { error: itemsErr } = await supabase.from('bom_items').insert(items);
          if (itemsErr) throw itemsErr;
        }
        return { data: header };
      }

      if (endpoint === '/production/batches') {
        const { data: authData } = await supabase.auth.getUser();
        const { data, error } = await supabase.from('production_batches').insert([{
          ...payload,
          operator_id: authData.user?.id
        }]).select();
        if (error) throw error;
        return { data };
      }


      if (endpoint === '/maintenance/logs') {
        const { data: authData } = await supabase.auth.getUser();
        const { data, error } = await supabase.from('maintenance_logs').insert([{
          ...payload,
          performed_by: authData.user?.id
        }]).select();
        if (error) throw error;
        return { data };
      }

      if (endpoint === '/maintenance/schedules') {
        const { data, error } = await supabase.from('maintenance_schedules').insert([payload]).select();
        if (error) throw error;
        return { data };
      }

      if (endpoint === '/retail/sales' || endpoint === '/sales/orders') {
        const { items, ...orderData } = payload;
        
        // 1. Create the sales order
        const { data: order, error: orderError } = await supabase
          .from('sales_orders')
          .insert({
            order_number: orderData.order_number || `ORD-${Date.now()}`,
            customer_id: orderData.customer_id,
            sales_rep_id: orderData.sales_rep_id,
            status: orderData.status || 'pending',
            payment_status: orderData.payment_status || 'unpaid',
            subtotal: orderData.subtotal || 0,
            discount: orderData.discount || 0,
            tax: orderData.tax || 0,
            total_amount: orderData.total_amount || 0,
            notes: orderData.notes
          })
          .select()
          .single();
          
        if (orderError) throw orderError;
        
        // 2. Insert items if any
        if (items && items.length > 0) {
          const itemsData = items.map(item => ({
            sales_order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal || (item.quantity * item.unit_price)
          }));
          
          const { error: itemsError } = await supabase.from('sales_order_items').insert(itemsData);
          if (itemsError) throw itemsError;
        }
        
        return { data: order };
      }


      if (endpoint === '/suppliers') {
        const { data, error } = await supabase.from('suppliers').insert([payload]).select();
        if (error) throw error;
        return { data };
      }

      if (endpoint === '/procurement/purchase-orders') {
        const { data: authData } = await supabase.auth.getUser();
        // 1. Insert header
        const { data: header, error: headErr } = await supabase.from('purchase_orders').insert([{
          supplier_id: payload.supplier_id,
          po_number: `PO-${Date.now()}`,
          order_date: payload.order_date || new Date().toISOString(),
          expected_delivery: payload.expected_delivery,
          status: payload.status || 'draft',
          total_amount: payload.total_amount || 0,
          created_by: authData.user?.id
        }]).select().single();
        if (headErr) throw headErr;
        
        // 2. Insert items
        if (payload.items && payload.items.length > 0) {
          const items = payload.items.map(i => ({
            po_id: header.id,
            product_id: i.product_id,
            quantity: Number(i.quantity) || 0,
            unit_price: Number(i.unit_price) || 0,
            total_price: (Number(i.quantity) || 0) * (Number(i.unit_price) || 0)
          }));
          const { error: itemsErr } = await supabase.from('purchase_order_items').insert(items);
          if (itemsErr) throw itemsErr;
        }
        return { data: header };
      }

      
      console.warn('Unhandled POST endpoint:', endpoint);
      return { data: {} };
    } catch (err) {
      console.error('Supabase POST Error:', err);
      throw err;
    }
  },
  put: async (endpoint, payload) => {
    try {
      if (endpoint.startsWith('/sales/deliveries/')) {
        const parts = endpoint.split('/');
        const deliveryId = parts[3];
        const action = parts[4]; // 'status' or 'confirm'

        if (action === 'status') {
          const { data, error } = await supabase
            .from('deliveries')
            .update({ status: payload.status, dispatch_time: payload.status === 'in_transit' ? new Date().toISOString() : undefined })
            .eq('id', deliveryId)
            .select();
          if (error) throw error;
          return { data };
        }

        if (action === 'confirm') {
          // Confirm delivery
          const { data, error } = await supabase
            .from('deliveries')
            .update({ 
              status: 'delivered', 
              delivery_time: new Date().toISOString(),
              last_known_lat: payload.last_known_lat,
              last_known_lng: payload.last_known_lng,
              pod_reference: payload.signature_name
            })
            .eq('id', deliveryId)
            .select();
          if (error) throw error;
          return { data };
        }
      }

      console.warn('Unhandled PUT endpoint:', endpoint);
      return { data: {} };
    } catch (err) {
      console.error('Supabase PUT Error:', err);
      throw err;
    }
  },
  delete: async (endpoint) => {
    return { data: {} };
  }
};

export default client;
