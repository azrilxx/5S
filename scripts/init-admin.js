const { db } = require('../server/db.js');
const { users } = require('../shared/schema.js');
const bcrypt = require('bcrypt');

async function initAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.insert(users).values({
      username: 'admin',
      name: 'System Administrator',
      email: 'admin@karisma.com',
      password: hashedPassword,
      role: 'admin',
      team: null,
      zones: []
    });
    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
  process.exit(0);
}

initAdmin();