import { db } from './server/db.ts';

async function clearData() {
  const data = db.getData();
  
  // Clear core collections
  data.books = [];
  data.items = [];
  data.loans = [];
  data.fines = [];
  data.members = [];
  
  // Checking other collections that might exist
  if (data.activityLogs) data.activityLogs = [];
  if (data.reservations) data.reservations = [];
  if (data.stockOpnames) data.stockOpnames = [];
  if (data.serials) data.serials = [];
  if (data.backups) data.backups = [];
  if (data.digitalCollections) data.digitalCollections = [];

  // Filter users: keep only administrative roles (superadmin, admin, pustakawan, kepala_sekolah)
  const rolesToKeep = ['superadmin', 'admin', 'pustakawan', 'kepala_sekolah'];
  const originalUserCount = data.users.length;
  data.users = data.users.filter(user => rolesToKeep.includes(user.role));
  
  const removedUsersCount = originalUserCount - data.users.length;

  db.saveDatabase(data);
  console.log(`Data cleared successfully.`);
  console.log(`Removed ${removedUsersCount} user accounts (Siswa/Guru). Remaining users: ${data.users.length}`);
}

clearData();
