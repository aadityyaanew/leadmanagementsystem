import mysql from "mysql2/promise";

let pool;

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
      queueLimit: 0,
      connectTimeout: 10000,
    });
  }
  return pool;
}

export async function initDatabase() {
  const db = getDbPool();

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
      batch VARCHAR(64),
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

  return db;
}
