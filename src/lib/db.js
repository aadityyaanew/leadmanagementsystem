import mysql from "mysql2/promise";

let pool;
let isInitialized = false;
let initPromise = null;

export function getDbPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "srv1676.hstgr.io",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "u725346955_lms",
      password: process.env.DB_PASSWORD || "Lms@2026",
      database: process.env.DB_NAME || "u725346955_lms",
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10,
      idleTimeout: 60000,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      connectTimeout: 20000,
    });
  }
  return pool;
}

export async function initDatabase() {
  if (isInitialized) {
    return getDbPool();
  }
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const db = getDbPool();
    try {

  // Create leads table
  await db.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      mobile VARCHAR(32),
      college VARCHAR(255),
      course VARCHAR(255),
      center VARCHAR(255),
      counsellor VARCHAR(255),
      status VARCHAR(64) DEFAULT 'New Lead',
      leadType VARCHAR(32) DEFAULT 'Primary',
      source VARCHAR(128),
      duplicateOfId VARCHAR(64),
      duplicateCount INT DEFAULT 0,
      punchDate DATETIME,
      notes JSON,
      followUps JSON,
      timeline JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Create users table (unit heads and counsellors managed by admin)
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      employee_id VARCHAR(255),
      password VARCHAR(255) NOT NULL,
      role ENUM('Admin', 'UnitHead', 'Counsellor') NOT NULL,
      phone VARCHAR(32),
      unit_id INT,
      avatar VARCHAR(8),
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE(email),
      UNIQUE(employee_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Create colleges table
  await db.query(`
    CREATE TABLE IF NOT EXISTS colleges (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      location VARCHAR(255),
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Create courses table
  await db.query(`
    CREATE TABLE IF NOT EXISTS courses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      college_id INT,
      duration VARCHAR(64),
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Create units table (centers / unit names)
  await db.query(`
    CREATE TABLE IF NOT EXISTS units (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      location VARCHAR(255),
      head_user_id INT,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Create call_logs table (records every call/outreach interaction by counsellors)
  await db.query(`
    CREATE TABLE IF NOT EXISTS call_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      lead_id VARCHAR(64) NOT NULL,
      lead_name VARCHAR(255),
      lead_phone VARCHAR(32),
      counsellor_name VARCHAR(255) NOT NULL,
      counsellor_id INT,
      call_type VARCHAR(64) DEFAULT 'Phone Call',
      disposition VARCHAR(128),
      notes TEXT,
      duration INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_call_created (created_at),
      INDEX idx_call_counsellor (counsellor_name),
      INDEX idx_call_lead (lead_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

      isInitialized = true;
      return db;
    } catch (err) {
      console.warn("initDatabase warning:", err.message);
      initPromise = null;
      return db;
    }
  })();

  return initPromise;
}

