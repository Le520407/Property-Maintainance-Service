-- Customer Membership System Database Schema

-- Membership Tiers Configuration
CREATE TABLE membership_tiers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL, -- 'BASIC', 'PREMIUM', 'ELITE'
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  monthly_price DECIMAL(10,2) NOT NULL,
  yearly_price DECIMAL(10,2),
  features JSON NOT NULL, -- Store tier features as JSON
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Customer Memberships
CREATE TABLE customer_memberships (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL,
  tier_id INT NOT NULL,
  status ENUM('ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED') DEFAULT 'ACTIVE',
  billing_cycle ENUM('MONTHLY', 'YEARLY') DEFAULT 'MONTHLY',
  start_date DATE NOT NULL,
  end_date DATE,
  next_billing_date DATE,
  auto_renew BOOLEAN DEFAULT true,
  payment_method_id VARCHAR(100), -- Stripe payment method ID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tier_id) REFERENCES membership_tiers(id),
  INDEX idx_customer_status (customer_id, status),
  INDEX idx_billing_date (next_billing_date)
);

-- Membership Usage Tracking
CREATE TABLE membership_usage (
  id INT PRIMARY KEY AUTO_INCREMENT,
  membership_id INT NOT NULL,
  month CHAR(7) NOT NULL, -- Format: 'YYYY-MM'
  service_requests_used INT DEFAULT 0,
  service_requests_limit INT NOT NULL,
  emergency_requests_used INT DEFAULT 0,
  emergency_requests_limit INT DEFAULT 0,
  inspection_credits_used INT DEFAULT 0,
  inspection_credits_limit INT DEFAULT 0,
  material_discount_used DECIMAL(10,2) DEFAULT 0,
  reset_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (membership_id) REFERENCES customer_memberships(id) ON DELETE CASCADE,
  UNIQUE KEY unique_membership_month (membership_id, month)
);

-- Membership Transactions/Billing History
CREATE TABLE membership_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  membership_id INT NOT NULL,
  transaction_type ENUM('SUBSCRIPTION', 'UPGRADE', 'DOWNGRADE', 'RENEWAL', 'CANCELLATION', 'REFUND') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'SGD',
  payment_status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
  stripe_payment_intent_id VARCHAR(100),
  billing_period_start DATE,
  billing_period_end DATE,
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (membership_id) REFERENCES customer_memberships(id) ON DELETE CASCADE,
  INDEX idx_payment_status (payment_status),
  INDEX idx_transaction_date (transaction_date)
);

-- Membership Benefits Redemption
CREATE TABLE membership_benefits (
  id INT PRIMARY KEY AUTO_INCREMENT,
  membership_id INT NOT NULL,
  job_id INT NOT NULL,
  benefit_type ENUM('PRIORITY_RESPONSE', 'MATERIAL_DISCOUNT', 'FREE_INSPECTION', 'EMERGENCY_SERVICE') NOT NULL,
  benefit_value DECIMAL(10,2), -- Discount amount or percentage
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (membership_id) REFERENCES customer_memberships(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  INDEX idx_membership_benefit (membership_id, benefit_type)
);

-- Membership Change History
CREATE TABLE membership_changes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  membership_id INT NOT NULL,
  from_tier_id INT,
  to_tier_id INT NOT NULL,
  change_type ENUM('UPGRADE', 'DOWNGRADE', 'INITIAL', 'RENEWAL') NOT NULL,
  effective_date DATE NOT NULL,
  prorated_amount DECIMAL(10,2),
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (membership_id) REFERENCES customer_memberships(id) ON DELETE CASCADE,
  FOREIGN KEY (from_tier_id) REFERENCES membership_tiers(id),
  FOREIGN KEY (to_tier_id) REFERENCES membership_tiers(id)
);

-- Update jobs table to include membership priority
ALTER TABLE jobs ADD COLUMN membership_priority ENUM('STANDARD', 'PRIORITY', 'EMERGENCY') DEFAULT 'STANDARD' AFTER status;
ALTER TABLE jobs ADD COLUMN membership_discount_applied DECIMAL(5,2) DEFAULT 0 AFTER total_amount;

-- Insert default membership tiers
INSERT INTO membership_tiers (name, display_name, description, monthly_price, yearly_price, features) VALUES 
('BASIC', 'Basic Plan', 'Perfect for occasional maintenance needs', 25.00, 250.00, JSON_OBJECT(
  'service_requests_per_month', 2,
  'response_time_hours', 72,
  'material_discount_percent', 0,
  'annual_inspections', 0,
  'emergency_service', false,
  'priority_support', false,
  'dedicated_manager', false
)),
('PREMIUM', 'Premium Plan', 'Great for regular maintenance requirements', 45.00, 450.00, JSON_OBJECT(
  'service_requests_per_month', 4,
  'response_time_hours', 48,
  'material_discount_percent', 10,
  'annual_inspections', 1,
  'emergency_service', false,
  'priority_support', true,
  'dedicated_manager', false
)),
('ELITE', 'Elite Plan', 'Comprehensive coverage for all your property needs', 75.00, 750.00, JSON_OBJECT(
  'service_requests_per_month', -1,
  'response_time_hours', 24,
  'material_discount_percent', 15,
  'annual_inspections', 4,
  'emergency_service', true,
  'priority_support', true,
  'dedicated_manager', true
));