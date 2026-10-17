import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import { DatabaseSchema } from './db';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_CfRJ4tszwBl3@ep-cold-star-b38z032f-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=verify-full';

export const neonPool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

export async function initNeonTables(client?: PoolClient): Promise<void> {
  const runner = client || neonPool;
  await runner.query(`
    -- 1. settings
    CREATE TABLE IF NOT EXISTS settings (
      key VARCHAR(50) PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 2. users
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(100) PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(150),
      full_name VARCHAR(200),
      role VARCHAR(50),
      password_hash TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 3. books
    CREATE TABLE IF NOT EXISTS books (
      id VARCHAR(100) PRIMARY KEY,
      isbn VARCHAR(50),
      title TEXT NOT NULL,
      subtitle TEXT,
      author VARCHAR(255),
      publisher VARCHAR(255),
      publish_year INT,
      category VARCHAR(100),
      classification_code VARCHAR(50),
      call_number VARCHAR(100),
      is_opac_visible BOOLEAN DEFAULT TRUE,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 4. book_items
    CREATE TABLE IF NOT EXISTS book_items (
      id VARCHAR(100) PRIMARY KEY,
      book_id VARCHAR(100),
      barcode VARCHAR(100) UNIQUE,
      rfid VARCHAR(100),
      call_number VARCHAR(100),
      copy_number INT,
      location VARCHAR(100),
      status VARCHAR(50) DEFAULT 'available',
      condition VARCHAR(50) DEFAULT 'good',
      price NUMERIC DEFAULT 0,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 5. members
    CREATE TABLE IF NOT EXISTS members (
      id VARCHAR(100) PRIMARY KEY,
      member_code VARCHAR(100) UNIQUE NOT NULL,
      full_name VARCHAR(200) NOT NULL,
      type VARCHAR(50),
      identity_number VARCHAR(100),
      email VARCHAR(150),
      phone VARCHAR(50),
      class_or_department VARCHAR(100),
      status VARCHAR(50) DEFAULT 'active',
      register_date DATE,
      expiry_date DATE,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 6. loans
    CREATE TABLE IF NOT EXISTS loans (
      id VARCHAR(100) PRIMARY KEY,
      loan_code VARCHAR(100) UNIQUE NOT NULL,
      member_id VARCHAR(100),
      member_name VARCHAR(200),
      member_code VARCHAR(100),
      status VARCHAR(50) DEFAULT 'active',
      loan_date DATE,
      due_date DATE,
      return_date DATE,
      renewed_count INT DEFAULT 0,
      officer_name VARCHAR(200),
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 7. fines
    CREATE TABLE IF NOT EXISTS fines (
      id VARCHAR(100) PRIMARY KEY,
      fine_code VARCHAR(100) UNIQUE NOT NULL,
      loan_id VARCHAR(100),
      member_id VARCHAR(100),
      member_name VARCHAR(200),
      status VARCHAR(50) DEFAULT 'unpaid',
      total_fine NUMERIC DEFAULT 0,
      paid_amount NUMERIC DEFAULT 0,
      reason VARCHAR(100),
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 8. reservations
    CREATE TABLE IF NOT EXISTS reservations (
      id VARCHAR(100) PRIMARY KEY,
      reservation_code VARCHAR(100) UNIQUE,
      member_id VARCHAR(100),
      book_id VARCHAR(100),
      book_title TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      reserved_date DATE,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 9. stock_opnames
    CREATE TABLE IF NOT EXISTS stock_opnames (
      id VARCHAR(100) PRIMARY KEY,
      code VARCHAR(100) UNIQUE,
      title VARCHAR(255),
      fiscal_year VARCHAR(50),
      status VARCHAR(50),
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 10. serials
    CREATE TABLE IF NOT EXISTS serials (
      id VARCHAR(100) PRIMARY KEY,
      issn VARCHAR(50),
      title TEXT,
      type VARCHAR(50),
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 11. categories
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(100) PRIMARY KEY,
      code VARCHAR(50),
      name VARCHAR(200),
      ddc_range VARCHAR(50),
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 12. locations
    CREATE TABLE IF NOT EXISTS locations (
      id VARCHAR(100) PRIMARY KEY,
      code VARCHAR(50),
      name VARCHAR(200),
      room VARCHAR(100),
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 13. publishers
    CREATE TABLE IF NOT EXISTS publishers (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(200),
      city VARCHAR(100),
      country VARCHAR(100),
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 14. authors
    CREATE TABLE IF NOT EXISTS authors (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(200),
      type VARCHAR(50),
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 15. activity_logs
    CREATE TABLE IF NOT EXISTS activity_logs (
      id VARCHAR(100) PRIMARY KEY,
      timestamp TIMESTAMPTZ NOT NULL,
      user_id VARCHAR(100),
      user_name VARCHAR(200),
      action VARCHAR(100),
      module VARCHAR(100),
      data JSONB NOT NULL
    );

    -- 16. backups
    CREATE TABLE IF NOT EXISTS backups (
      id VARCHAR(100) PRIMARY KEY,
      filename VARCHAR(255),
      timestamp TIMESTAMPTZ NOT NULL,
      data JSONB NOT NULL
    );
  `);
}

export async function fetchAllFromNeon(): Promise<DatabaseSchema | null> {
  const client = await neonPool.connect();
  try {
    // Check if users exist in Neon
    const userCheck = await client.query('SELECT count(*) as count FROM users');
    const userCount = parseInt(userCheck.rows[0]?.count || '0', 10);

    // Check settings
    const settingsRes = await client.query("SELECT data FROM settings WHERE key = 'main'");
    const hasSettings = settingsRes.rows.length > 0;

    if (userCount === 0 && !hasSettings) {
      // Neon is empty
      return null;
    }

    const settings = settingsRes.rows[0]?.data;

    const [
      usersRes,
      booksRes,
      itemsRes,
      membersRes,
      loansRes,
      finesRes,
      reservationsRes,
      stockOpnamesRes,
      serialsRes,
      categoriesRes,
      locationsRes,
      publishersRes,
      authorsRes,
      activityLogsRes,
      backupsRes
    ] = await Promise.all([
      neonPool.query('SELECT data FROM users ORDER BY created_at ASC'),
      neonPool.query('SELECT data FROM books ORDER BY created_at DESC'),
      neonPool.query('SELECT data FROM book_items ORDER BY created_at DESC'),
      neonPool.query('SELECT data FROM members ORDER BY created_at DESC'),
      neonPool.query('SELECT data FROM loans ORDER BY created_at DESC'),
      neonPool.query('SELECT data FROM fines ORDER BY created_at DESC'),
      neonPool.query('SELECT data FROM reservations ORDER BY created_at DESC'),
      neonPool.query('SELECT data FROM stock_opnames ORDER BY created_at DESC'),
      neonPool.query('SELECT data FROM serials ORDER BY created_at DESC'),
      neonPool.query('SELECT data FROM categories ORDER BY id ASC'),
      neonPool.query('SELECT data FROM locations ORDER BY id ASC'),
      neonPool.query('SELECT data FROM publishers ORDER BY id ASC'),
      neonPool.query('SELECT data FROM authors ORDER BY id ASC'),
      neonPool.query('SELECT data FROM activity_logs ORDER BY timestamp DESC LIMIT 500'),
      neonPool.query('SELECT data FROM backups ORDER BY timestamp DESC LIMIT 50')
    ]);

    return {
      settings: settings || {},
      users: usersRes.rows.map((r) => r.data),
      books: booksRes.rows.map((r) => r.data),
      items: itemsRes.rows.map((r) => r.data),
      members: membersRes.rows.map((r) => r.data),
      loans: loansRes.rows.map((r) => r.data),
      fines: finesRes.rows.map((r) => r.data),
      reservations: reservationsRes.rows.map((r) => r.data),
      stockOpnames: stockOpnamesRes.rows.map((r) => r.data),
      serials: serialsRes.rows.map((r) => r.data),
      categories: categoriesRes.rows.map((r) => r.data),
      locations: locationsRes.rows.map((r) => r.data),
      publishers: publishersRes.rows.map((r) => r.data),
      authors: authorsRes.rows.map((r) => r.data),
      activityLogs: activityLogsRes.rows.map((r) => r.data),
      backups: backupsRes.rows.map((r) => r.data)
    };
  } finally {
    client.release();
  }
}

export async function pushAllToNeon(data: DatabaseSchema): Promise<void> {
  const client = await neonPool.connect();
  try {
    await client.query('BEGIN');

    // 1. Settings
    if (data.settings) {
      await client.query(
        `INSERT INTO settings (key, data, updated_at)
         VALUES ('main', $1, NOW())
         ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [JSON.stringify(data.settings)]
      );
    }

    // Helper for syncing an array table
    const syncTable = async (
      table: string,
      items: any[],
      buildRow: (item: any) => { query: string; params: any[] }
    ) => {
      if (!items || items.length === 0) {
        await client.query(`DELETE FROM ${table}`);
        return;
      }

      // Upsert all items
      for (const item of items) {
        const { query, params } = buildRow(item);
        await client.query(query, params);
      }

      // Delete items not in memory
      const ids = items.map((i) => i.id).filter(Boolean);
      if (ids.length > 0) {
        await client.query(`DELETE FROM ${table} WHERE id NOT IN (${ids.map((_, idx) => `$${idx + 1}`).join(',')})`, ids);
      }
    };

    // 2. Users
    await syncTable('users', data.users || [], (u) => ({
      query: `INSERT INTO users (id, username, email, full_name, role, password_hash, is_active, data, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
              ON CONFLICT (id) DO UPDATE SET
                username = EXCLUDED.username,
                email = EXCLUDED.email,
                full_name = EXCLUDED.full_name,
                role = EXCLUDED.role,
                password_hash = EXCLUDED.password_hash,
                is_active = EXCLUDED.is_active,
                data = EXCLUDED.data,
                updated_at = NOW()`,
      params: [
        u.id,
        u.username,
        u.email || null,
        u.fullName || null,
        u.role || null,
        u.passwordHash || null,
        u.isActive !== false,
        JSON.stringify(u)
      ]
    }));

    // 3. Books
    await syncTable('books', data.books || [], (b) => ({
      query: `INSERT INTO books (id, isbn, title, subtitle, author, publisher, publish_year, category, classification_code, call_number, is_opac_visible, data, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
              ON CONFLICT (id) DO UPDATE SET
                isbn = EXCLUDED.isbn,
                title = EXCLUDED.title,
                subtitle = EXCLUDED.subtitle,
                author = EXCLUDED.author,
                publisher = EXCLUDED.publisher,
                publish_year = EXCLUDED.publish_year,
                category = EXCLUDED.category,
                classification_code = EXCLUDED.classification_code,
                call_number = EXCLUDED.call_number,
                is_opac_visible = EXCLUDED.is_opac_visible,
                data = EXCLUDED.data,
                updated_at = NOW()`,
      params: [
        b.id,
        b.isbn || null,
        b.title,
        b.subtitle || null,
        b.author || null,
        b.publisher || null,
        b.publishYear || null,
        b.category || null,
        b.classificationCode || null,
        b.callNumber || null,
        b.isOpacVisible !== false,
        JSON.stringify(b)
      ]
    }));

    // 4. Book Items
    await syncTable('book_items', data.items || [], (it) => ({
      query: `INSERT INTO book_items (id, book_id, barcode, rfid, call_number, copy_number, location, status, condition, price, data, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
              ON CONFLICT (id) DO UPDATE SET
                book_id = EXCLUDED.book_id,
                barcode = EXCLUDED.barcode,
                rfid = EXCLUDED.rfid,
                call_number = EXCLUDED.call_number,
                copy_number = EXCLUDED.copy_number,
                location = EXCLUDED.location,
                status = EXCLUDED.status,
                condition = EXCLUDED.condition,
                price = EXCLUDED.price,
                data = EXCLUDED.data,
                updated_at = NOW()`,
      params: [
        it.id,
        it.bookId,
        it.barcode || null,
        it.rfid || null,
        it.callNumber || null,
        it.copyNumber || 1,
        it.location || null,
        it.status || 'available',
        it.condition || 'good',
        it.price || 0,
        JSON.stringify(it)
      ]
    }));

    // 5. Members
    await syncTable('members', data.members || [], (m) => ({
      query: `INSERT INTO members (id, member_code, full_name, type, identity_number, email, phone, class_or_department, status, data, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
              ON CONFLICT (id) DO UPDATE SET
                member_code = EXCLUDED.member_code,
                full_name = EXCLUDED.full_name,
                type = EXCLUDED.type,
                identity_number = EXCLUDED.identity_number,
                email = EXCLUDED.email,
                phone = EXCLUDED.phone,
                class_or_department = EXCLUDED.class_or_department,
                status = EXCLUDED.status,
                data = EXCLUDED.data,
                updated_at = NOW()`,
      params: [
        m.id,
        m.memberCode,
        m.name || (m as any).fullName || 'Anggota',
        m.type || null,
        m.identityNumber || null,
        m.email || null,
        m.phone || null,
        m.classGrade || (m as any).classOrDepartment || null,
        m.status || 'active',
        JSON.stringify(m)
      ]
    }));

    // 6. Loans
    await syncTable('loans', data.loans || [], (l) => ({
      query: `INSERT INTO loans (id, loan_code, member_id, member_name, member_code, status, renewed_count, officer_name, data, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
              ON CONFLICT (id) DO UPDATE SET
                loan_code = EXCLUDED.loan_code,
                member_id = EXCLUDED.member_id,
                member_name = EXCLUDED.member_name,
                member_code = EXCLUDED.member_code,
                status = EXCLUDED.status,
                renewed_count = EXCLUDED.renewed_count,
                officer_name = EXCLUDED.officer_name,
                data = EXCLUDED.data,
                updated_at = NOW()`,
      params: [
        l.id,
        l.loanCode,
        l.memberId || null,
        l.memberName || null,
        l.memberCode || null,
        l.status || 'active',
        l.renewedCount || 0,
        l.officerName || null,
        JSON.stringify(l)
      ]
    }));

    // 7. Fines
    await syncTable('fines', data.fines || [], (f) => ({
      query: `INSERT INTO fines (id, fine_code, loan_id, member_id, member_name, status, total_fine, paid_amount, reason, data, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
              ON CONFLICT (id) DO UPDATE SET
                fine_code = EXCLUDED.fine_code,
                loan_id = EXCLUDED.loan_id,
                member_id = EXCLUDED.member_id,
                member_name = EXCLUDED.member_name,
                status = EXCLUDED.status,
                total_fine = EXCLUDED.total_fine,
                paid_amount = EXCLUDED.paid_amount,
                reason = EXCLUDED.reason,
                data = EXCLUDED.data,
                updated_at = NOW()`,
      params: [
        f.id,
        f.fineCode,
        f.loanId || null,
        f.memberId || null,
        f.memberName || null,
        f.status || 'unpaid',
        f.totalFine || 0,
        f.paidAmount || 0,
        f.reason || null,
        JSON.stringify(f)
      ]
    }));

    // 8. Reservations
    await syncTable('reservations', data.reservations || [], (r) => ({
      query: `INSERT INTO reservations (id, reservation_code, member_id, book_id, book_title, status, data, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
              ON CONFLICT (id) DO UPDATE SET
                reservation_code = EXCLUDED.reservation_code,
                member_id = EXCLUDED.member_id,
                book_id = EXCLUDED.book_id,
                book_title = EXCLUDED.book_title,
                status = EXCLUDED.status,
                data = EXCLUDED.data,
                updated_at = NOW()`,
      params: [
        r.id,
        r.reservationCode || null,
        r.memberId || null,
        r.bookId || null,
        r.bookTitle || null,
        r.status || 'pending',
        JSON.stringify(r)
      ]
    }));

    // 9. Stock Opnames
    await syncTable('stock_opnames', data.stockOpnames || [], (s) => ({
      query: `INSERT INTO stock_opnames (id, code, title, fiscal_year, status, data, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, NOW())
              ON CONFLICT (id) DO UPDATE SET
                code = EXCLUDED.code,
                title = EXCLUDED.title,
                fiscal_year = EXCLUDED.fiscal_year,
                status = EXCLUDED.status,
                data = EXCLUDED.data,
                updated_at = NOW()`,
      params: [
        s.id,
        s.code || null,
        s.title || null,
        s.fiscalYear || null,
        s.status || null,
        JSON.stringify(s)
      ]
    }));

    // 10. Serials
    await syncTable('serials', data.serials || [], (s) => ({
      query: `INSERT INTO serials (id, issn, title, type, data, updated_at)
              VALUES ($1, $2, $3, $4, $5, NOW())
              ON CONFLICT (id) DO UPDATE SET
                issn = EXCLUDED.issn,
                title = EXCLUDED.title,
                type = EXCLUDED.type,
                data = EXCLUDED.data,
                updated_at = NOW()`,
      params: [s.id, s.issn || null, s.title || null, s.type || null, JSON.stringify(s)]
    }));

    // 11. Categories
    await syncTable('categories', data.categories || [], (c) => ({
      query: `INSERT INTO categories (id, code, name, ddc_range, data, updated_at)
              VALUES ($1, $2, $3, $4, $5, NOW())
              ON CONFLICT (id) DO UPDATE SET
                code = EXCLUDED.code,
                name = EXCLUDED.name,
                ddc_range = EXCLUDED.ddc_range,
                data = EXCLUDED.data,
                updated_at = NOW()`,
      params: [c.id, c.code || null, c.name, c.ddcRange || null, JSON.stringify(c)]
    }));

    // 12. Locations
    await syncTable('locations', data.locations || [], (l) => ({
      query: `INSERT INTO locations (id, code, name, room, data, updated_at)
              VALUES ($1, $2, $3, $4, $5, NOW())
              ON CONFLICT (id) DO UPDATE SET
                code = EXCLUDED.code,
                name = EXCLUDED.name,
                room = EXCLUDED.room,
                data = EXCLUDED.data,
                updated_at = NOW()`,
      params: [l.id, l.code || null, l.name, l.room || null, JSON.stringify(l)]
    }));

    // 13. Publishers
    await syncTable('publishers', data.publishers || [], (p) => ({
      query: `INSERT INTO publishers (id, name, city, country, data, updated_at)
              VALUES ($1, $2, $3, $4, $5, NOW())
              ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                city = EXCLUDED.city,
                country = EXCLUDED.country,
                data = EXCLUDED.data,
                updated_at = NOW()`,
      params: [p.id, p.name, p.city || null, p.country || null, JSON.stringify(p)]
    }));

    // 14. Authors
    await syncTable('authors', data.authors || [], (a) => ({
      query: `INSERT INTO authors (id, name, type, data, updated_at)
              VALUES ($1, $2, $3, $4, NOW())
              ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                type = EXCLUDED.type,
                data = EXCLUDED.data,
                updated_at = NOW()`,
      params: [a.id, a.name, a.type || null, JSON.stringify(a)]
    }));

    // 15. Activity Logs (Only keep latest 200 in Neon)
    if (data.activityLogs && data.activityLogs.length > 0) {
      const logs = data.activityLogs.slice(0, 200);
      for (const log of logs) {
        await client.query(
          `INSERT INTO activity_logs (id, timestamp, user_id, user_name, action, module, data)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [
            log.id,
            log.timestamp ? new Date(log.timestamp) : new Date(),
            log.userId || null,
            log.userName || null,
            log.action || null,
            log.module || null,
            JSON.stringify(log)
          ]
        );
      }
    }

    // 16. Backups
    if (data.backups && data.backups.length > 0) {
      for (const b of data.backups) {
        await client.query(
          `INSERT INTO backups (id, filename, timestamp, data)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO NOTHING`,
          [
            b.id,
            b.filename || null,
            b.createdAt ? new Date(b.createdAt) : new Date(),
            JSON.stringify(b)
          ]
        );
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
