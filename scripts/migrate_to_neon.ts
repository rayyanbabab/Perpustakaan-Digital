import fs from 'fs';
import path from 'path';
import { neonPool, initNeonTables, pushAllToNeon, fetchAllFromNeon } from '../server/neonSync';
import { DatabaseSchema } from '../server/db';

async function migrate() {
  console.log('🚀 Starting migration to Neon PostgreSQL...');
  
  const dbFile = path.join(process.cwd(), 'data', 'library_db.json');
  if (!fs.existsSync(dbFile)) {
    console.error('Error: data/library_db.json does not exist.');
    process.exit(1);
  }

  const raw = fs.readFileSync(dbFile, 'utf-8');
  const data: DatabaseSchema = JSON.parse(raw);

  console.log('📦 Local data loaded:');
  console.log(`- Users: ${data.users?.length || 0}`);
  console.log(`- Books: ${data.books?.length || 0}`);
  console.log(`- Items: ${data.items?.length || 0}`);
  console.log(`- Members: ${data.members?.length || 0}`);
  console.log(`- Loans: ${data.loans?.length || 0}`);
  console.log(`- Categories: ${data.categories?.length || 0}`);
  console.log(`- Locations: ${data.locations?.length || 0}`);
  console.log(`- Publishers: ${data.publishers?.length || 0}`);
  console.log(`- Authors: ${data.authors?.length || 0}`);

  console.log('\n🔧 Ensuring Neon tables are up to date...');
  await initNeonTables();

  console.log('📤 Uploading data to Neon PostgreSQL...');
  await pushAllToNeon(data);
  console.log('✅ Data successfully written to Neon!');

  console.log('\n📥 Verifying read from Neon PostgreSQL...');
  const neonData = await fetchAllFromNeon();
  if (neonData) {
    console.log('🎉 Verification successful! Data in Neon:');
    console.log(`- Settings: ${neonData.settings?.libraryName}`);
    console.log(`- Users: ${neonData.users?.length}`);
    console.log(`- Books: ${neonData.books?.length}`);
    console.log(`- Categories: ${neonData.categories?.length}`);
    console.log(`- Locations: ${neonData.locations?.length}`);
    console.log(`- Publishers: ${neonData.publishers?.length}`);
    console.log(`- Authors: ${neonData.authors?.length}`);
  } else {
    console.error('❌ Verification failed: Neon returned empty data.');
  }

  await neonPool.end();
  console.log('\n✨ Neon migration finished cleanly!');
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
