/**
 * migrate-to-neon.js
 * Seeds demo users into Neon PostgreSQL and migrates any existing local JSON data.
 * Run with:  node scripts/migrate-to-neon.js
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const DATA_DIR = path.join(__dirname, '../data');

const TABLES = [
  'krishi-users',
  'krishi-crops',
  'krishi-orders',
  'krishi-shipments',
  'krishi-storage',
  'krishi-transactions',
  'krishi-notifications',
];

async function ensureTable(tableName) {
  const safe = `"${tableName}"`;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${safe} (
      id   TEXT PRIMARY KEY,
      data JSONB NOT NULL
    )
  `);
  console.log(`  ✅ Table ${safe} ready`);
}

async function upsert(tableName, item) {
  const safe = `"${tableName}"`;
  await pool.query(
    `INSERT INTO ${safe} (id, data) VALUES ($1, $2)
     ON CONFLICT (id) DO UPDATE SET data = $2`,
    [item.id, JSON.stringify(item)]
  );
}

async function migrateLocalData(tableName) {
  const filePath = path.join(DATA_DIR, `${tableName}.json`);
  if (!fs.existsSync(filePath)) return 0;

  const items = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  for (const item of items) {
    if (item.id) await upsert(tableName, item);
  }
  return items.length;
}

async function seedDemoUsers() {
  const hash = bcrypt.hashSync('123456', 10);
  const demoUsers = [
    { id: 'user-buyer-001',       email: 'buyer@gmail.com',        name: 'Demo Buyer',            role: 'buyer',       phone: '+911234567890' },
    { id: 'user-farmer-001',      email: 'farmer@gmail.com',       name: 'Demo Farmer',           role: 'farmer',      phone: '+911234567891' },
    { id: 'user-transporter-001', email: 'transporter@gmail.com',  name: 'Demo Transporter',      role: 'transporter', phone: '+911234567892' },
    { id: 'user-storage-001',     email: 'storage@gmail.com',      name: 'Demo Storage Provider', role: 'storage',     phone: '+911234567893' },
    { id: 'user-admin-001',       email: 'admin@krishiera.com',    name: 'Admin',                 role: 'admin',       phone: '+911234567894' },
  ];

  const table = process.env.DYNAMODB_USERS_TABLE || 'krishi-users';
  const safe = `"${table}"`;
  let seeded = 0;

  for (const u of demoUsers) {
    const { rows } = await pool.query(`SELECT id FROM ${safe} WHERE id = $1`, [u.id]);
    if (rows.length > 0) {
      console.log(`  ⚠️  ${u.email} already exists — skipping`);
      continue;
    }
    const user = {
      ...u,
      password: hash,
      phoneVerified: true,
      emailVerified: true,
      profile: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await upsert(table, user);
    console.log(`  ✅ Seeded ${u.email} (${u.role})`);
    seeded++;
  }
  return seeded;
}

async function main() {
  console.log('\n🚀 Connecting to Neon PostgreSQL...');
  await pool.query('SELECT 1');
  console.log('✅ Connected!\n');

  // 1. Create all tables
  console.log('📋 Creating tables...');
  for (const t of TABLES) await ensureTable(t);

  // 2. Migrate existing local JSON data (if any)
  console.log('\n📦 Migrating local JSON data...');
  for (const t of TABLES) {
    const count = await migrateLocalData(t);
    if (count > 0) console.log(`  📥 ${t}: migrated ${count} rows`);
  }

  // 3. Seed demo users
  console.log('\n🌱 Seeding demo users...');
  const seeded = await seedDemoUsers();

  console.log('\n✅ Migration complete!');
  console.log(`   ${seeded} new users seeded`);
  console.log('\n📋 Login credentials:');
  console.log('   farmer@gmail.com       / 123456');
  console.log('   buyer@gmail.com        / 123456');
  console.log('   transporter@gmail.com  / 123456');
  console.log('   storage@gmail.com      / 123456');
  console.log('   admin@krishiera.com    / 123456\n');

  await pool.end();
}

main().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
