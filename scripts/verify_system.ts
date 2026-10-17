import { neonPool } from '../server/neonSync';
import { db } from '../server/db';

async function verify() {
  console.log('🔍 Checking System & Database Status...\n');

  // 1. Neon Database Check
  try {
    const timeRes = await neonPool.query('SELECT NOW() as current_time, current_database() as db_name');
    console.log('✅ Neon Connection: Connected to', timeRes.rows[0].db_name, 'at', timeRes.rows[0].current_time);

    const tablesRes = await neonPool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log(`✅ Neon Tables (${tablesRes.rows.length} tables found):`, tablesRes.rows.map((r) => r.table_name).join(', '));

    const settingsRes = await neonPool.query("SELECT data FROM settings WHERE key = 'main'");
    const s = settingsRes.rows[0]?.data;
    console.log(`✅ Neon Settings:`, {
      libraryName: s?.libraryName,
      shortName: s?.shortName,
      schoolName: s?.schoolName
    });

    const counts = await Promise.all([
      neonPool.query('SELECT count(*) as c FROM users'),
      neonPool.query('SELECT count(*) as c FROM books'),
      neonPool.query('SELECT count(*) as c FROM book_items'),
      neonPool.query('SELECT count(*) as c FROM members'),
      neonPool.query('SELECT count(*) as c FROM loans'),
      neonPool.query('SELECT count(*) as c FROM categories')
    ]);

    console.log('✅ Neon Data Counts:');
    console.log(`   - Users: ${counts[0].rows[0].c}`);
    console.log(`   - Books: ${counts[1].rows[0].c}`);
    console.log(`   - Book Items: ${counts[2].rows[0].c}`);
    console.log(`   - Members: ${counts[3].rows[0].c}`);
    console.log(`   - Loans: ${counts[4].rows[0].c}`);
    console.log(`   - Categories: ${counts[5].rows[0].c}`);
  } catch (err) {
    console.error('❌ Neon Error:', err);
    process.exit(1);
  }

  // 2. Local Cache Check
  const localData = db.getData();
  console.log('\n✅ Local Cache Status:');
  console.log(`   - Local Library Name: ${localData.settings?.libraryName}`);
  console.log(`   - Local School Name: ${localData.settings?.schoolName}`);
  console.log(`   - Local Books Count: ${localData.books?.length || 0}`);

  await neonPool.end();
  console.log('\n🎉 ALL CHECKS PASSED: ZERO ERRORS FOUND!');
}

verify().catch(console.error);
