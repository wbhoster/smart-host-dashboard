-- Create Database
CREATE DATABASE IF NOT EXISTS iptv_admin;
USE iptv_admin;

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id VARCHAR(36) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(50) NOT NULL,
  host_url VARCHAR(255) NOT NULL,
  package_duration INT NOT NULL,
  created_at DATETIME NOT NULL,
  expiry_date DATETIME NOT NULL,
  status ENUM('active', 'expired', 'expiring-soon') NOT NULL,
  whatsapp_number VARCHAR(20) NOT NULL,
  INDEX idx_status (status),
  INDEX idx_expiry (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Host URLs Table
CREATE TABLE IF NOT EXISTS host_urls (
  id VARCHAR(36) PRIMARY KEY,
  url VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- WhatsApp Templates Table
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id VARCHAR(36) PRIMARY KEY,
  type ENUM('welcome', 'pre-expiry', 'expiry', 'renewal') NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert Default Templates
INSERT INTO whatsapp_templates (id, type, name, message) VALUES
('welcome', 'welcome', 'Welcome Message', '🎉 Welcome to IPTV Service, {fullName}!\n\n👤 Username: {username}\n🔑 Password: {password}\n🌐 Host URL: {hostUrl}\n📅 Valid Until: {expiryDate}\n\n✨ Enjoy unlimited entertainment!'),
('pre-expiry', 'pre-expiry', 'Pre-Expiry Reminder', '⏰ Reminder {fullName}: Your IPTV subscription expires in 7 days!\n\n📅 Expiry Date: {expiryDate}\n\n💬 Contact us to renew your subscription.'),
('expiry', 'expiry', 'Expiry Day Message', '⚠️ Hi {fullName}, your IPTV subscription has expired today.\n\n📅 Expired: {expiryDate}\n\n💬 Renew now to continue enjoying our service!'),
('renewal', 'renewal', 'Renewal Confirmation', '✅ Hi {fullName}! Subscription renewed successfully!\n\n📅 New Expiry Date: {expiryDate}\n\n🎉 Thank you for continuing with us!')
ON DUPLICATE KEY UPDATE message=VALUES(message);

-- Insert Default Admin (username: admin, password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO admin_users (id, username, password_hash) VALUES
('admin-001', 'admin', '$2b$10$rKvHYZ4x8Z.xWxqvxGxHxOqYvKjGxH5nX7qx4x8Z.xWxqvxGxHxO')
ON DUPLICATE KEY UPDATE username=username;
