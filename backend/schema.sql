CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    neighborhood VARCHAR(100), -- For filtering by region
    geo_lat DECIMAL(10, 8), -- For Maps integration
    geo_lng DECIMAL(11, 8),
    fixed_price DECIMAL(10, 2), -- Monthly Fee
    payment_due_day INT, -- Day of month (e.g., 5, 10)
    last_sand_change DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_templates (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES clients(id),
    day_of_week INT, -- 0=Sunday, 1=Monday...
    service_type VARCHAR(50) DEFAULT 'Maintenance',
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS service_instances (
    id SERIAL PRIMARY KEY,
    template_id INT REFERENCES service_templates(id), -- NULL if it's a "One-off" job
    client_id INT REFERENCES clients(id),
    scheduled_date DATE NOT NULL, -- The specific date for THIS job
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Completed
    price DECIMAL(10, 2), -- Price charged for this specific visit
    visit_start TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    service_instance_id INT REFERENCES service_instances(id), -- NULL = Global Daily Expense
    description VARCHAR(255) NOT NULL, -- e.g. "Chlorine", "Lunch"
    amount DECIMAL(10, 2) NOT NULL,
    expense_date DATE NOT NULL,
    category VARCHAR(50) -- 'Material', 'Fuel', 'Food'
);
