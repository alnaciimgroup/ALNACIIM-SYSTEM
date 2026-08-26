-- Sales & Logistics ERP Tables Migration

CREATE TABLE customers (
    id                 SERIAL PRIMARY KEY,
    code               VARCHAR(20) UNIQUE NOT NULL,
    name               VARCHAR(150) NOT NULL,
    type               VARCHAR(20) NOT NULL CHECK (type IN ('retail','wholesale','distributor','tanker')),
    phone              VARCHAR(30),
    email              VARCHAR(120),
    address            VARCHAR(200),
    city               VARCHAR(80),
    credit_limit       NUMERIC(12,2) NOT NULL DEFAULT 0,
    payment_terms_days INT NOT NULL DEFAULT 0,
    sales_rep_id       INT REFERENCES users(id),
    is_active          BOOLEAN NOT NULL DEFAULT true,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sales_orders (
    id             SERIAL PRIMARY KEY,
    order_number   VARCHAR(30) UNIQUE NOT NULL,
    customer_id    INT NOT NULL REFERENCES customers(id),
    order_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    delivery_date  DATE,
    sales_rep_id   INT REFERENCES users(id),
    status         VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','dispatched','delivered','cancelled')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','partial','paid')),
    subtotal       NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount       NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax            NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
    notes          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sales_order_items (
    id              SERIAL PRIMARY KEY,
    sales_order_id  INT NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id      INT NOT NULL REFERENCES products(id),
    quantity        NUMERIC(12,3) NOT NULL,
    unit_price      NUMERIC(12,2) NOT NULL,
    discount        NUMERIC(12,2) NOT NULL DEFAULT 0,
    subtotal        NUMERIC(12,2) NOT NULL
);

CREATE TABLE trucks (
    id                  SERIAL PRIMARY KEY,
    plate_number        VARCHAR(20) UNIQUE NOT NULL,
    model               VARCHAR(60),
    capacity            NUMERIC(10,2),
    capacity_unit       VARCHAR(20),
    status              VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','maintenance','inactive')),
    assigned_driver_id  INT REFERENCES users(id)
);

CREATE TABLE truck_loads (
    id               SERIAL PRIMARY KEY,
    truck_id         INT NOT NULL REFERENCES trucks(id),
    product_id       INT NOT NULL REFERENCES products(id),
    warehouse_id     INT NOT NULL REFERENCES warehouses(id),
    quantity_loaded  NUMERIC(12,2) NOT NULL CHECK (quantity_loaded > 0),
    loaded_by        INT NOT NULL REFERENCES users(id),
    loaded_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    route_date       DATE NOT NULL DEFAULT CURRENT_DATE,
    status           VARCHAR(20) NOT NULL DEFAULT 'loaded' CHECK (status IN ('loaded','in_progress','completed')),
    notes            TEXT
);

CREATE TABLE deliveries (
    id               SERIAL PRIMARY KEY,
    sales_order_id   INT NOT NULL REFERENCES sales_orders(id),
    truck_id         INT NOT NULL REFERENCES trucks(id),
    driver_id        INT NOT NULL REFERENCES users(id),
    dispatch_time    TIMESTAMPTZ,
    delivery_time    TIMESTAMPTZ,
    status           VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_transit','delivered','failed')),
    delivery_address TEXT,
    last_known_lat   NUMERIC(9,6),
    last_known_lng   NUMERIC(9,6),
    pod_reference    VARCHAR(100)
);

CREATE INDEX idx_customers_qaade ON customers(qaade_id);
CREATE INDEX idx_customers_hno ON customers(hno);
CREATE INDEX idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
CREATE INDEX idx_sales_orders_date ON sales_orders(order_date);
CREATE INDEX idx_sales_orders_qaade ON sales_orders(qaade_id);
CREATE INDEX idx_sales_orders_invoice_hno ON sales_orders(invoice_hno);
CREATE INDEX idx_sales_orders_sale_type ON sales_orders(sale_type);
CREATE INDEX idx_sales_orders_cost_center ON sales_orders(cost_center_id);
CREATE INDEX idx_sales_orders_project ON sales_orders(project_id);
CREATE INDEX idx_sales_orders_company ON sales_orders(company_id);
CREATE INDEX idx_sales_orders_branch  ON sales_orders(branch_id);
CREATE INDEX idx_sales_orders_tank ON sales_orders(customer_tank_id);
CREATE INDEX idx_truck_loads_truck_date ON truck_loads(truck_id, route_date);
CREATE INDEX idx_truck_loads_route_run ON truck_loads(route_run_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_truck_load ON deliveries(truck_load_id);
CREATE INDEX idx_deliveries_tank ON deliveries(customer_tank_id);
CREATE INDEX idx_deliveries_route_stop ON deliveries(route_stop_id);
