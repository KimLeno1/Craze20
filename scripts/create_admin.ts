import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import path from 'path';
import bcrypt from 'bcryptjs';

dotenv.config();

async function createAdmin() {
  const dbPath = path.join(process.cwd(), 'database.sqlite');
  const db = new Database(dbPath);

  const email = 'admin@closetkraze.com';
  const password = 'TemporaryPassword123!';
  const hashedPassword = await bcrypt.hash(password, 10);
  const id = randomUUID();

  try {
    // Insert into users table
    db.prepare('INSERT INTO users (id, handle, email, password, role) VALUES (?, ?, ?, ?, ?)').run(id, 'admin', email, hashedPassword, 'ADMIN');
    
    // Insert into admins table
    db.prepare('INSERT INTO admins (id, email, password, handle) VALUES (?, ?, ?, ?)').run(id, email, hashedPassword, 'admin');
    
    console.log('Admin user created successfully with hashed password.');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Hashed Password stored in DB.');
    console.log('PLEASE CHANGE THIS PASSWORD IMMEDIATELY AFTER LOGIN.');
  } catch (err) {
    console.error('Error creating admin user:', err);
  } finally {
    db.close();
  }
}

createAdmin();
