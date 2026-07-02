import * as fs from 'fs';
import * as path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DATA_DIR = path.join(__dirname, '../data');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readTable(tableName: string): any[] {
  const filePath = path.join(DATA_DIR, `${tableName}.json`);
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
}

function writeTable(tableName: string, data: any[]) {
  const filePath = path.join(DATA_DIR, `${tableName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

async function seedUsers() {
  ensureDir();

  const tableName = process.env.DYNAMODB_USERS_TABLE || 'krishi-users';
  const existingUsers = readTable(tableName);

  const demoUsers = [
    { email: 'buyer@gmail.com', password: '123456', name: 'Demo Buyer', role: 'buyer' },
    { email: 'farmer@gmail.com', password: '123456', name: 'Demo Farmer', role: 'farmer' },
    { email: 'transporter@gmail.com', password: '123456', name: 'Demo Transporter', role: 'transporter' },
    { email: 'storage@gmail.com', password: '123456', name: 'Demo Storage', role: 'storage' },
    { email: 'admin@krishiera.com', password: 'Admin@123', name: 'Admin', role: 'admin' },
  ];

  let added = 0;
  let skipped = 0;

  for (const demo of demoUsers) {
    const exists = existingUsers.find((u: any) => u.email === demo.email);
    if (exists) {
      console.log(`⚠️  User ${demo.email} already exists — skipping`);
      skipped++;
      continue;
    }

    const hashedPassword = await bcrypt.hash(demo.password, 10);
    const user = {
      id: uuidv4(),
      email: demo.email,
      password: hashedPassword,
      name: demo.name,
      role: demo.role,
      phone: '',
      phoneVerified: true,
      emailVerified: true,
      profile: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    existingUsers.push(user);
    console.log(`✅ Created user: ${demo.email} (${demo.role}) — password: ${demo.password}`);
    added++;
  }

  writeTable(tableName, existingUsers);
  console.log(`\n🌱 Seed complete: ${added} added, ${skipped} skipped`);
  console.log('\n📋 Demo Login Credentials:');
  demoUsers.forEach(u => {
    console.log(`   ${u.role.padEnd(12)} → ${u.email} / ${u.password}`);
  });
}

seedUsers().catch(console.error);
