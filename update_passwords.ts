import { db } from './server/db.ts';
import bcrypt from 'bcryptjs';

async function updatePasswords() {
  const data = db.getData();
  
  const passwords = {
    'superadmin': 'wplsadmin',
    'admin': 'admin123',
    'pustakawan': 'widya123',
    'kepsek': 'kswidya'
  };

  let updated = 0;
  for (const user of data.users) {
    if (passwords[user.username as keyof typeof passwords]) {
      user.passwordHash = bcrypt.hashSync(passwords[user.username as keyof typeof passwords], 10);
      console.log(`Updated password for ${user.username}`);
      updated++;
    }
  }

  if (updated > 0) {
    db.saveDatabase(data);
    console.log('Database saved.');
  } else {
    console.log('No users found to update.');
  }
}

updatePasswords();
