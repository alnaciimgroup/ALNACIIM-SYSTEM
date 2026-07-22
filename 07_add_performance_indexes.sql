-- PHASE 6: CUSTOMER REGISTRY PERFORMANCE UPGRADE INDEXES

-- 1. Index on customer name for lightning fast A-to-Z alphabetical sorting and paging
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);

-- 2. Index on sales customer_id for fast retrieval of sales by customer
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON public.sales(customer_id);

-- 3. Index on payments sale_id for fast retrieval of payments by sale
CREATE INDEX IF NOT EXISTS idx_payments_sale_id ON public.payments(sale_id);
