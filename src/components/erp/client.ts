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
        const { initial_warehouse_id, initial_quantity, ...productPayload } = payload;
        const { data, error } = await supabase.from('products').insert([productPayload]).select().single();
        if (error) throw error;
        
        if (initial_warehouse_id && initial_quantity && Number(initial_quantity) > 0) {
          const { data: authData } = await supabase.auth.getUser();
          const userId = authData.user?.id;
          
          await supabase.from('stock_levels').insert([{
            product_id: data.id,
            warehouse_id: Number(initial_warehouse_id),
            quantity: Number(initial_quantity)
          }]);
          
          await supabase.from('stock_movements').insert([{
            product_id: data.id,
            warehouse_id: Number(initial_warehouse_id),
            movement_type: 'IN',
            quantity: Number(initial_quantity),
            reference_type: 'adjustment',
            performed_by: userId
          }]);
        }
        
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
        const { data, error } = await supabase.from('stock_movements').insert([{
          product_id: payload.product_id,
          warehouse_id: payload.warehouse_id,
          movement_type: payload.movement_type,
          quantity: payload.quantity,
          reference_type: payload.reference_type,
          performed_by: authData.user?.id,
          notes: payload.notes
        }]).select();
        
        const { data: sl } = await supabase.from('stock_levels').select('*').eq('product_id', payload.product_id).eq('warehouse_id', payload.warehouse_id).single();
        let qtyChange = Number(payload.quantity);
        if (payload.movement_type === 'OUT' || payload.movement_type === 'TRANSFER_OUT' || payload.movement_type === 'ADJUSTMENT_OUT') qtyChange = -qtyChange;
        
        if (sl) {
          await supabase.from('stock_levels').update({ quantity: Number(sl.quantity) + qtyChange, updated_at: new Date().toISOString() }).eq('id', sl.id);
        } else {
          await supabase.from('stock_levels').insert([{ product_id: payload.product_id, warehouse_id: payload.warehouse_id, quantity: qtyChange }]);
        }

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
          name: payload.name
        }]).select().single();
        if (headErr) throw headErr;
        
        if (payload.items && payload.items.length > 0) {
          const items = payload.items.map(i => ({
            bom_id: header.id,
            raw_material_product_id: i.raw_material_product_id,
            quantity_per_unit: Number(i.quantity_per_unit) || 0
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
        const total = (payload.items || []).reduce((sum, i) => sum + ((Number(i.quantity_ordered)||0) * (Number(i.unit_cost)||0)), 0);
        
        // 1. Insert header
        const { data: header, error: headErr } = await supabase.from('purchase_orders').insert([{
          supplier_id: payload.supplier_id,
          po_number: `PO-${Date.now()}`,
          order_date: payload.order_date || new Date().toISOString(),
          expected_date: payload.expected_date || null,
          status: payload.status || 'draft',
          total_amount: total,
          created_by: authData.user?.id
        }]).select().single();
        if (headErr) throw headErr;
        
        // 2. Insert items
        if (payload.items && payload.items.length > 0) {
          const items = payload.items.map(i => ({
            purchase_order_id: header.id,
            product_id: i.product_id,
            quantity_ordered: Number(i.quantity_ordered) || 0,
            unit_cost: Number(i.unit_cost) || 0,
            subtotal: (Number(i.quantity_ordered) || 0) * (Number(i.unit_cost) || 0)
          }));
          const { error: itemsErr } = await supabase.from('purchase_items').insert(items);
          if (itemsErr) throw itemsErr;
        }
        return { data: header };
      }

      if (endpoint.match(/^\/procurement\/purchase-orders\/\d+\/mark-sent$/)) {
        const poId = Number(endpoint.split('/')[3]);
        const { error } = await supabase.from('purchase_orders').update({ status: 'sent' }).eq('id', poId);
        if (error) throw error;
        return { data: { success: true } };
      }

      if (endpoint.match(/^\/procurement\/purchase-orders\/\d+\/receive$/)) {
        const poId = Number(endpoint.split('/')[3]);
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData.user?.id;
        
        // 1. Create goods_receipt
        const { data: receipt, error: rErr } = await supabase.from('goods_receipts').insert([{
            purchase_order_id: poId,
            received_by: userId,
            warehouse_id: payload.warehouse_id
        }]).select().single();
        if (rErr) throw rErr;

        let allReceived = true;
        for (const it of payload.items) {
             const qty = Number(it.quantity_received);
             if (qty <= 0) continue;
             
             // insert goods_receipt_items
             await supabase.from('goods_receipt_items').insert([{
                 goods_receipt_id: receipt.id,
                 purchase_item_id: it.purchase_item_id,
                 quantity_received: qty,
                 condition: it.condition || 'good'
             }]);

             // get purchase item product_id and quantities
             const { data: pItem } = await supabase.from('purchase_items').select('product_id, quantity_ordered, quantity_received').eq('id', it.purchase_item_id).single();
             if (!pItem) continue;

             const newTotal = Number(pItem.quantity_received) + qty;
             if (newTotal < Number(pItem.quantity_ordered)) allReceived = false;

             await supabase.from('purchase_items').update({ quantity_received: newTotal }).eq('id', it.purchase_item_id);

             // insert stock_movements
             await supabase.from('stock_movements').insert([{
                 product_id: pItem.product_id,
                 warehouse_id: payload.warehouse_id,
                 movement_type: 'IN',
                 quantity: qty,
                 reference_type: 'purchase',
                 reference_id: receipt.id,
                 performed_by: userId
             }]);

             // update stock_levels (using rpc is best for upsert, but we can do select then update/insert)
             const { data: sl } = await supabase.from('stock_levels').select('*').eq('product_id', pItem.product_id).eq('warehouse_id', payload.warehouse_id).single();
             if (sl) {
                 await supabase.from('stock_levels').update({ quantity: Number(sl.quantity) + qty, updated_at: new Date().toISOString() }).eq('id', sl.id);
             } else {
                 await supabase.from('stock_levels').insert([{ product_id: pItem.product_id, warehouse_id: payload.warehouse_id, quantity: qty }]);
             }
        }

        // update PO status
        await supabase.from('purchase_orders').update({ status: allReceived ? 'received' : 'partially_received' }).eq('id', poId);

        return { data: { success: true } };
      }

      console.warn('Unhandled POST endpoint:', endpoint);
      return { data: {} };
    } catch (e) { const err = e as any;
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
      
      if (endpoint.startsWith('/procurement/purchase-orders/')) {
        const poId = endpoint.split('/')[3];
        const total = (payload.items || []).reduce((sum, i) => sum + ((Number(i.quantity_ordered)||0) * (Number(i.unit_cost)||0)), 0);
        
        const { error: headErr } = await supabase.from('purchase_orders').update({
          supplier_id: payload.supplier_id,
          total_amount: total,
        }).eq('id', poId);
        if (headErr) throw headErr;
        
        await supabase.from('purchase_items').delete().eq('purchase_order_id', poId);
        
        if (payload.items && payload.items.length > 0) {
          const items = payload.items.map(i => ({
            purchase_order_id: poId,
            product_id: i.product_id,
            quantity_ordered: Number(i.quantity_ordered) || 0,
            unit_cost: Number(i.unit_cost) || 0,
            subtotal: (Number(i.quantity_ordered) || 0) * (Number(i.unit_cost) || 0)
          }));
          const { error: itemsErr } = await supabase.from('purchase_items').insert(items);
          if (itemsErr) throw itemsErr;
        }
        return { data: { id: poId } };
      }

      console.warn('Unhandled PUT endpoint:', endpoint);
      return { data: {} };
    } catch (e) { const err = e as any;
      console.error('Supabase PUT Error:', err);
      throw err;
    }
  },
  delete: async (endpoint) => {
    try {
      if (endpoint.startsWith('/procurement/purchase-orders/')) {
        const poId = endpoint.split('/')[3];
        const { error } = await supabase.from('purchase_orders').delete().eq('id', poId);
        if (error) throw error;
        return { data: { success: true } };
      }
      return { data: {} };
    } catch (e) { const err = e as any;
      console.error('Supabase DELETE Error:', err);
      throw err;
    }
  }
};

export default client;
