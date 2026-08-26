-- Factory ERP Tables Migration
-- Imported from new ERP

CREATE TABLE warehouses (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(20) UNIQUE NOT NULL,
    name        VARCHAR(100) NOT NULL,
    type        VARCHAR(30) NOT NULL CHECK (type IN ('raw_material','finished_goods','spare_parts','general')),
    location    VARCHAR(200),
    manager_id  UUID,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE categories (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    parent_id    INT REFERENCES categories(id),
    product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('raw_material','finished_good','spare_part'))
);

CREATE TABLE products (
    id             SERIAL PRIMARY KEY,
    sku            VARCHAR(30) UNIQUE NOT NULL,
    barcode        VARCHAR(50) UNIQUE,
    name           VARCHAR(150) NOT NULL,
    category_id    INT NOT NULL REFERENCES categories(id),
    product_type   VARCHAR(20) NOT NULL CHECK (product_type IN ('raw_material','finished_good','spare_part')),
    unit           VARCHAR(20) NOT NULL,
    unit_cost      NUMERIC(12,2) NOT NULL DEFAULT 0,
    unit_price     NUMERIC(12,2) NOT NULL DEFAULT 0,
    reorder_level  NUMERIC(12,2) NOT NULL DEFAULT 0,
    reorder_qty    NUMERIC(12,2) NOT NULL DEFAULT 0,
    is_active      BOOLEAN NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE stock_levels (
    id           SERIAL PRIMARY KEY,
    product_id   INT NOT NULL REFERENCES products(id),
    warehouse_id INT NOT NULL REFERENCES warehouses(id),
    quantity     NUMERIC(14,3) NOT NULL DEFAULT 0,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (product_id, warehouse_id)
);

CREATE TABLE stock_movements (
    id                    BIGSERIAL PRIMARY KEY,
    product_id            INT NOT NULL REFERENCES products(id),
    warehouse_id          INT NOT NULL REFERENCES warehouses(id),
    movement_type         VARCHAR(20) NOT NULL CHECK (movement_type IN ('IN','OUT','TRANSFER_IN','TRANSFER_OUT','ADJUSTMENT')),
    quantity              NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
    reference_type        VARCHAR(30) CHECK (reference_type IN ('purchase','production','sales','maintenance','transfer','adjustment')),
    reference_id          INT,
    related_warehouse_id  INT REFERENCES warehouses(id),
    performed_by          UUID NOT NULL REFERENCES users(id),
    notes                 TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE machines (
    id             SERIAL PRIMARY KEY,
    code           VARCHAR(30) UNIQUE NOT NULL,
    name           VARCHAR(100) NOT NULL,
    type           VARCHAR(30) NOT NULL CHECK (type IN ('RO_PLANT','FILLING_LINE','ICE_MACHINE','PACKAGING','GENERATOR','VEHICLE')),
    warehouse_id   INT REFERENCES warehouses(id),
    purchase_date  DATE,
    status         VARCHAR(20) NOT NULL DEFAULT 'operational' CHECK (status IN ('operational','under_maintenance','breakdown','retired')),
    specifications JSONB
);

CREATE TABLE production_batches (
    id                      SERIAL PRIMARY KEY,
    batch_number            VARCHAR(30) UNIQUE NOT NULL,
    production_type         VARCHAR(20) NOT NULL CHECK (production_type IN ('RO_WATER','BOTTLING','ICE')),
    product_id              INT REFERENCES products(id),
    machine_id              INT NOT NULL REFERENCES machines(id),
    planned_qty             NUMERIC(14,3) NOT NULL DEFAULT 0,
    actual_qty              NUMERIC(14,3),
    unit                    VARCHAR(20) NOT NULL,
    shift                   VARCHAR(10) CHECK (shift IN ('Morning','Afternoon','Night')),
    start_time              TIMESTAMPTZ,
    end_time                TIMESTAMPTZ,
    supervisor_id           UUID NOT NULL REFERENCES users(id),
    status                  VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_progress','completed','cancelled')),
    destination_warehouse_id INT REFERENCES warehouses(id),
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE production_batch_materials (
    id             SERIAL PRIMARY KEY,
    batch_id       INT NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
    product_id     INT NOT NULL REFERENCES products(id),
    quantity_used  NUMERIC(14,3) NOT NULL,
    warehouse_id   INT NOT NULL REFERENCES warehouses(id)
);

CREATE TABLE machine_usage_logs (
    id               SERIAL PRIMARY KEY,
    machine_id       INT NOT NULL REFERENCES machines(id),
    log_date         DATE NOT NULL,
    shift            VARCHAR(10),
    hours_used       NUMERIC(5,2) NOT NULL DEFAULT 0,
    output_quantity  NUMERIC(14,3),
    output_unit      VARCHAR(20),
    operator_id      UUID NOT NULL REFERENCES users(id),
    notes            TEXT
);

CREATE TABLE downtime_logs (
    id           SERIAL PRIMARY KEY,
    machine_id   INT NOT NULL REFERENCES machines(id),
    start_time   TIMESTAMPTZ NOT NULL,
    end_time     TIMESTAMPTZ,
    category     VARCHAR(30) NOT NULL CHECK (category IN ('breakdown','scheduled_maintenance','power_outage','other')),
    reason       TEXT,
    reported_by  UUID NOT NULL REFERENCES users(id),
    resolved_by  UUID REFERENCES users(id)
);

CREATE TABLE maintenance_schedules (
    id               SERIAL PRIMARY KEY,
    machine_id       INT NOT NULL REFERENCES machines(id),
    maintenance_type VARCHAR(20) NOT NULL CHECK (maintenance_type IN ('preventive','corrective')),
    frequency_days   INT,
    last_done_date   DATE,
    next_due_date    DATE,
    assigned_to      UUID REFERENCES users(id),
    description      TEXT
);

CREATE TABLE maintenance_logs (
    id            SERIAL PRIMARY KEY,
    machine_id    INT NOT NULL REFERENCES machines(id),
    schedule_id   INT REFERENCES maintenance_schedules(id),
    downtime_id   INT REFERENCES downtime_logs(id),
    type          VARCHAR(20) NOT NULL CHECK (type IN ('preventive','corrective','breakdown_repair')),
    performed_by  UUID NOT NULL REFERENCES users(id),
    log_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    description   TEXT,
    cost          NUMERIC(12,2) DEFAULT 0,
    status        VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed'))
);

CREATE TABLE maintenance_parts_used (
    id                  SERIAL PRIMARY KEY,
    maintenance_log_id  INT NOT NULL REFERENCES maintenance_logs(id) ON DELETE CASCADE,
    product_id          INT NOT NULL REFERENCES products(id),
    quantity            NUMERIC(12,3) NOT NULL,
    warehouse_id        INT NOT NULL REFERENCES warehouses(id)
);

CREATE TABLE suppliers (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(20) UNIQUE NOT NULL,
    name            VARCHAR(150) NOT NULL,
    category        VARCHAR(30) CHECK (category IN ('raw_material','packaging','spare_part','chemicals')),
    contact_person  VARCHAR(120),
    phone           VARCHAR(30),
    email           VARCHAR(120),
    address         VARCHAR(200),
    rating          NUMERIC(3,2) NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE purchase_orders (
    id             SERIAL PRIMARY KEY,
    po_number      VARCHAR(30) UNIQUE NOT NULL,
    supplier_id    INT NOT NULL REFERENCES suppliers(id),
    order_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_date  DATE,
    status         VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','partially_received','received','cancelled')),
    total_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_by     UUID NOT NULL REFERENCES users(id),
    notes          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE purchase_items (
    id                  SERIAL PRIMARY KEY,
    purchase_order_id   INT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id          INT NOT NULL REFERENCES products(id),
    quantity_ordered    NUMERIC(14,3) NOT NULL,
    quantity_received   NUMERIC(14,3) NOT NULL DEFAULT 0,
    unit_cost           NUMERIC(12,2) NOT NULL,
    subtotal            NUMERIC(12,2) NOT NULL
);

CREATE TABLE goods_receipts (
    id                  SERIAL PRIMARY KEY,
    purchase_order_id   INT NOT NULL REFERENCES purchase_orders(id),
    received_date       DATE NOT NULL DEFAULT CURRENT_DATE,
    received_by         UUID NOT NULL REFERENCES users(id),
    warehouse_id        INT NOT NULL REFERENCES warehouses(id),
    notes               TEXT
);

CREATE TABLE goods_receipt_items (
    id                  SERIAL PRIMARY KEY,
    goods_receipt_id    INT NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
    purchase_item_id    INT NOT NULL REFERENCES purchase_items(id),
    quantity_received   NUMERIC(14,3) NOT NULL,
    condition           VARCHAR(20) NOT NULL DEFAULT 'good' CHECK (condition IN ('good','damaged'))
);

CREATE TABLE supplier_performance (
    id                 SERIAL PRIMARY KEY,
    supplier_id        INT NOT NULL REFERENCES suppliers(id),
    purchase_order_id  INT NOT NULL REFERENCES purchase_orders(id),
    on_time_delivery   BOOLEAN NOT NULL,
    quality_rating     INT NOT NULL CHECK (quality_rating BETWEEN 1 AND 5),
    notes              TEXT,
    evaluated_by       UUID NOT NULL REFERENCES users(id),
    evaluated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE expense_categories (
    id    SERIAL PRIMARY KEY,
    name  VARCHAR(100) NOT NULL,
    type  VARCHAR(30) NOT NULL CHECK (type IN ('production','logistics','admin','maintenance','utilities'))
);

CREATE TABLE expenses (
    id                       SERIAL PRIMARY KEY,
    category_id              INT NOT NULL REFERENCES expense_categories(id),
    amount                   NUMERIC(12,2) NOT NULL,
    expense_date             DATE NOT NULL DEFAULT CURRENT_DATE,
    description              TEXT,
    related_reference_type   VARCHAR(30),
    related_reference_id     INT,
    recorded_by              UUID NOT NULL REFERENCES users(id)
);

CREATE TABLE chart_of_accounts (
    id             SERIAL PRIMARY KEY,
    code           VARCHAR(20) UNIQUE NOT NULL,
    name           VARCHAR(150) NOT NULL,
    account_type   VARCHAR(20) NOT NULL CHECK (account_type IN ('asset','liability','equity','revenue','expense')),
    parent_id      INT REFERENCES chart_of_accounts(id),
    is_system      BOOLEAN NOT NULL DEFAULT false,
    is_active      BOOLEAN NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE fiscal_years (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) UNIQUE NOT NULL,
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
    closed_by   UUID REFERENCES users(id),
    closed_at   TIMESTAMPTZ
);

CREATE TABLE bank_accounts (
    id               SERIAL PRIMARY KEY,
    name             VARCHAR(100) NOT NULL,
    bank_name        VARCHAR(100),
    account_number   VARCHAR(60),
    coa_account_id   INT NOT NULL UNIQUE REFERENCES chart_of_accounts(id),
    opening_balance  NUMERIC(14,2) NOT NULL DEFAULT 0,
    is_active        BOOLEAN NOT NULL DEFAULT true,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE je_sequences (
    id          SERIAL PRIMARY KEY,
    next_value  BIGINT NOT NULL DEFAULT 1
);

CREATE TABLE journal_entries (
    id              SERIAL PRIMARY KEY,
    entry_number    VARCHAR(30) UNIQUE NOT NULL,
    entry_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    description     TEXT,
    source          VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','system')),
    reference_type  VARCHAR(30),
    reference_id    INT,
    status          VARCHAR(20) NOT NULL DEFAULT 'posted' CHECK (status IN ('posted','void')),
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE journal_lines (
    id                 BIGSERIAL PRIMARY KEY,
    journal_entry_id   INT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id         INT NOT NULL REFERENCES chart_of_accounts(id),
    debit              NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
    credit             NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
    description        TEXT,
    customer_id        UUID REFERENCES customers(id),
    supplier_id        INT REFERENCES suppliers(id),
    CHECK ((debit = 0 AND credit > 0) OR (debit > 0 AND credit = 0))
);

CREATE TABLE budgets (
    id             SERIAL PRIMARY KEY,
    account_id     INT NOT NULL REFERENCES chart_of_accounts(id),
    fiscal_year_id INT NOT NULL REFERENCES fiscal_years(id),
    period_month   INT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    budgeted_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    UNIQUE (account_id, fiscal_year_id, period_month)
);

CREATE TABLE supplier_payments (
    id                SERIAL PRIMARY KEY,
    purchase_order_id INT NOT NULL REFERENCES purchase_orders(id),
    amount            NUMERIC(12,2) NOT NULL,
    payment_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    method            VARCHAR(20) NOT NULL CHECK (method IN ('cash','bank_transfer','cheque')),
    bank_account_id   INT REFERENCES bank_accounts(id),
    reference_number  VARCHAR(60),
    recorded_by       UUID NOT NULL REFERENCES users(id),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE bill_of_materials (
    id          SERIAL PRIMARY KEY,
    product_id  INT NOT NULL UNIQUE REFERENCES products(id),
    name        VARCHAR(150) NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE bom_items (
    id                       SERIAL PRIMARY KEY,
    bom_id                   INT NOT NULL REFERENCES bill_of_materials(id) ON DELETE CASCADE,
    raw_material_product_id  INT NOT NULL REFERENCES products(id),
    quantity_per_unit        NUMERIC(12,4) NOT NULL CHECK (quantity_per_unit > 0)
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_warehouse ON stock_movements(warehouse_id);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX idx_production_batches_date ON production_batches(start_time);
CREATE INDEX idx_production_batches_status ON production_batches(status);
CREATE INDEX idx_machine_usage_logs_machine_date ON machine_usage_logs(machine_id, log_date);
CREATE INDEX idx_downtime_logs_machine ON downtime_logs(machine_id);
CREATE INDEX idx_maintenance_schedules_due ON maintenance_schedules(next_due_date);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_coa_type ON chart_of_accounts(account_type);
CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX idx_journal_entries_reference ON journal_entries(reference_type, reference_id);
CREATE INDEX idx_journal_lines_entry ON journal_lines(journal_entry_id);
CREATE INDEX idx_journal_lines_account ON journal_lines(account_id);
CREATE INDEX idx_journal_lines_customer ON journal_lines(customer_id);
CREATE INDEX idx_journal_lines_supplier ON journal_lines(supplier_id);
CREATE INDEX idx_supplier_payments_po ON supplier_payments(purchase_order_id);
CREATE INDEX idx_bom_items_bom ON bom_items(bom_id);
