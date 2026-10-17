// server/api.ts
import express from "express";
import cors from "cors";
import dotenv2 from "dotenv";

// server/routes/auth.ts
import { Router } from "express";
import bcrypt2 from "bcryptjs";

// server/db.ts
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

// server/neonSync.ts
import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();
var connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_CfRJ4tszwBl3@ep-cold-star-b38z032f-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=verify-full";
var neonPool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 3e4,
  connectionTimeoutMillis: 5e3
});
async function initNeonTables(client) {
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
async function fetchAllFromNeon() {
  const client = await neonPool.connect();
  try {
    const userCheck = await client.query("SELECT count(*) as count FROM users");
    const userCount = parseInt(userCheck.rows[0]?.count || "0", 10);
    const settingsRes = await client.query("SELECT data FROM settings WHERE key = 'main'");
    const hasSettings = settingsRes.rows.length > 0;
    if (userCount === 0 && !hasSettings) {
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
      neonPool.query("SELECT data FROM users ORDER BY created_at ASC"),
      neonPool.query("SELECT data FROM books ORDER BY created_at DESC"),
      neonPool.query("SELECT data FROM book_items ORDER BY created_at DESC"),
      neonPool.query("SELECT data FROM members ORDER BY created_at DESC"),
      neonPool.query("SELECT data FROM loans ORDER BY created_at DESC"),
      neonPool.query("SELECT data FROM fines ORDER BY created_at DESC"),
      neonPool.query("SELECT data FROM reservations ORDER BY created_at DESC"),
      neonPool.query("SELECT data FROM stock_opnames ORDER BY created_at DESC"),
      neonPool.query("SELECT data FROM serials ORDER BY created_at DESC"),
      neonPool.query("SELECT data FROM categories ORDER BY id ASC"),
      neonPool.query("SELECT data FROM locations ORDER BY id ASC"),
      neonPool.query("SELECT data FROM publishers ORDER BY id ASC"),
      neonPool.query("SELECT data FROM authors ORDER BY id ASC"),
      neonPool.query("SELECT data FROM activity_logs ORDER BY timestamp DESC LIMIT 500"),
      neonPool.query("SELECT data FROM backups ORDER BY timestamp DESC LIMIT 50")
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
async function pushAllToNeon(data) {
  const client = await neonPool.connect();
  try {
    await client.query("BEGIN");
    if (data.settings) {
      await client.query(
        `INSERT INTO settings (key, data, updated_at)
         VALUES ('main', $1, NOW())
         ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [JSON.stringify(data.settings)]
      );
    }
    const syncTable = async (table, items, buildRow) => {
      if (!items || items.length === 0) {
        await client.query(`DELETE FROM ${table}`);
        return;
      }
      for (const item of items) {
        const { query, params } = buildRow(item);
        await client.query(query, params);
      }
      const ids = items.map((i) => i.id).filter(Boolean);
      if (ids.length > 0) {
        await client.query(`DELETE FROM ${table} WHERE id NOT IN (${ids.map((_, idx) => `$${idx + 1}`).join(",")})`, ids);
      }
    };
    await syncTable("users", data.users || [], (u) => ({
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
    await syncTable("books", data.books || [], (b) => ({
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
    await syncTable("book_items", data.items || [], (it) => ({
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
        it.status || "available",
        it.condition || "good",
        it.price || 0,
        JSON.stringify(it)
      ]
    }));
    await syncTable("members", data.members || [], (m) => ({
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
        m.name || m.fullName || "Anggota",
        m.type || null,
        m.identityNumber || null,
        m.email || null,
        m.phone || null,
        m.classGrade || m.classOrDepartment || null,
        m.status || "active",
        JSON.stringify(m)
      ]
    }));
    await syncTable("loans", data.loans || [], (l) => ({
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
        l.status || "active",
        l.renewedCount || 0,
        l.officerName || null,
        JSON.stringify(l)
      ]
    }));
    await syncTable("fines", data.fines || [], (f) => ({
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
        f.status || "unpaid",
        f.totalFine || 0,
        f.paidAmount || 0,
        f.reason || null,
        JSON.stringify(f)
      ]
    }));
    await syncTable("reservations", data.reservations || [], (r) => ({
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
        r.status || "pending",
        JSON.stringify(r)
      ]
    }));
    await syncTable("stock_opnames", data.stockOpnames || [], (s) => ({
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
    await syncTable("serials", data.serials || [], (s) => ({
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
    await syncTable("categories", data.categories || [], (c) => ({
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
    await syncTable("locations", data.locations || [], (l) => ({
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
    await syncTable("publishers", data.publishers || [], (p) => ({
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
    await syncTable("authors", data.authors || [], (a) => ({
      query: `INSERT INTO authors (id, name, type, data, updated_at)
              VALUES ($1, $2, $3, $4, NOW())
              ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                type = EXCLUDED.type,
                data = EXCLUDED.data,
                updated_at = NOW()`,
      params: [a.id, a.name, a.type || null, JSON.stringify(a)]
    }));
    if (data.activityLogs && data.activityLogs.length > 0) {
      const logs = data.activityLogs.slice(0, 200);
      for (const log of logs) {
        await client.query(
          `INSERT INTO activity_logs (id, timestamp, user_id, user_name, action, module, data)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [
            log.id,
            log.timestamp ? new Date(log.timestamp) : /* @__PURE__ */ new Date(),
            log.userId || null,
            log.userName || null,
            log.action || null,
            log.module || null,
            JSON.stringify(log)
          ]
        );
      }
    }
    if (data.backups && data.backups.length > 0) {
      for (const b of data.backups) {
        await client.query(
          `INSERT INTO backups (id, filename, timestamp, data)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO NOTHING`,
          [
            b.id,
            b.filename || null,
            b.createdAt ? new Date(b.createdAt) : /* @__PURE__ */ new Date(),
            JSON.stringify(b)
          ]
        );
      }
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// server/db.ts
var DATA_DIR = path.join(process.cwd(), "data");
var DB_FILE = path.join(DATA_DIR, "library_db.json");
var defaultSettings = {
  libraryName: "ASTRA LIBRARY SYSTEM",
  shortName: "ASTRA LIBRARY",
  schoolName: "POLITEKNIK ASTRA",
  address: "Kawasan Industri Delta Silicon II, Cikarang",
  city: "Bekasi",
  postalCode: "17550",
  province: "Jawa Barat",
  phone: "(021) 50227888",
  email: "perpustakaan@polytechnic.astra.ac.id",
  website: "https://polytechnic.astra.ac.id",
  tagline: "Membaca, Mengelola, Menginspirasi",
  headOfLibrary: "Rayyan Ammar",
  headmaster: "Direktur Politeknik Astra",
  finePerDay: 1e3,
  gracePeriodDays: 1,
  fineDamagedPercent: 50,
  fineLostMultiplier: 100,
  loanRules: {
    siswa: { maxItems: 3, loanDurationDays: 7, maxExtensions: 2 },
    guru: { maxItems: 5, loanDurationDays: 14, maxExtensions: 3 },
    tendik: { maxItems: 5, loanDurationDays: 14, maxExtensions: 3 }
  },
  enableSelfReservation: true,
  enableAiAssistant: true,
  themeColor: "#1E3A8A",
  googleSpreadsheetUrl: "https://docs.google.com/spreadsheets/d/1VlKdmIhyMOIQtdgGu5SebRy4wP216THGt9dMPuQfyOA/edit?usp=sharing",
  googleSpreadsheetId: "1VlKdmIhyMOIQtdgGu5SebRy4wP216THGt9dMPuQfyOA",
  googleDriveFolderUrl: "https://drive.google.com/drive/folders/1KpUK7yn2CZeTQGKAjdvQWdC662dkOna3?usp=sharing",
  googleDriveFolderId: "1KpUK7yn2CZeTQGKAjdvQWdC662dkOna3",
  gasWebAppUrl: "",
  enableGoogleSheetsSync: true,
  autoSyncIntervalMinutes: 5
};
function getSeedData() {
  const superadminHash = bcrypt.hashSync("wplsadmin", 10);
  const adminHash = bcrypt.hashSync("admin123", 10);
  const pustakawanHash = bcrypt.hashSync("widya123", 10);
  const kepsekHash = bcrypt.hashSync("kswidya", 10);
  const teacherHash = bcrypt.hashSync("guru123", 10);
  const studentHash = bcrypt.hashSync("siswa123", 10);
  const users = [
    {
      id: "usr-superadmin",
      username: "superadmin",
      email: "superadmin@sman3nganjuk.sch.id",
      fullName: "Super Administrator",
      role: "superadmin",
      passwordHash: superadminHash,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      isActive: true,
      createdAt: "2025-01-01T08:00:00Z"
    },
    {
      id: "usr-admin",
      username: "admin",
      email: "admin.perpus@sman3nganjuk.sch.id",
      fullName: "Bambang Sudarmono, S.Sos.",
      role: "admin",
      passwordHash: adminHash,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      isActive: true,
      createdAt: "2025-01-02T08:00:00Z"
    },
    {
      id: "usr-pustakawan",
      username: "pustakawan",
      email: "pustakawan@sman3nganjuk.sch.id",
      fullName: "Siti Rahmawati, S.I.Pust.",
      role: "pustakawan",
      passwordHash: pustakawanHash,
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      isActive: true,
      createdAt: "2025-01-03T08:00:00Z"
    },
    {
      id: "usr-kepsek",
      username: "kepsek",
      email: "kepsek@sman3nganjuk.sch.id",
      fullName: "Drs. H. Sukadi, M.Pd.",
      role: "kepala_sekolah",
      passwordHash: kepsekHash,
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      isActive: true,
      createdAt: "2025-01-01T08:00:00Z"
    },
    {
      id: "usr-guru1",
      username: "guru1",
      email: "guru.matematika@sman3nganjuk.sch.id",
      fullName: "Ahmad Fauzi, S.Pd., M.Si.",
      role: "guru",
      passwordHash: teacherHash,
      memberId: "mem-guru-001",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      isActive: true,
      createdAt: "2025-01-05T08:00:00Z"
    },
    {
      id: "usr-siswa1",
      username: "siswa1",
      email: "dimas.pratama@siswa.sman3nganjuk.sch.id",
      fullName: "Dimas Arya Pratama",
      role: "siswa",
      passwordHash: studentHash,
      memberId: "mem-siswa-001",
      avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
      isActive: true,
      createdAt: "2025-01-06T08:00:00Z"
    }
  ];
  const categories = [
    { id: "cat-1", code: "000", name: "Karya Umum & Komputer", ddcRange: "000 - 099" },
    { id: "cat-2", code: "100", name: "Filsafat & Psikologi", ddcRange: "100 - 199" },
    { id: "cat-3", code: "200", name: "Agama", ddcRange: "200 - 299" },
    { id: "cat-4", code: "300", name: "Ilmu Sosial & Pendidikan", ddcRange: "300 - 399" },
    { id: "cat-5", code: "400", name: "Bahasa & Linguistik", ddcRange: "400 - 499" },
    { id: "cat-6", code: "500", name: "Sains & Matematika", ddcRange: "500 - 599" },
    { id: "cat-7", code: "600", name: "Teknologi & Ilmu Terapan", ddcRange: "600 - 699" },
    { id: "cat-8", code: "700", name: "Seni, Musik & Olahraga", ddcRange: "700 - 799" },
    { id: "cat-9", code: "800", name: "Kesusastraan & Fiksi", ddcRange: "800 - 899" },
    { id: "cat-10", code: "900", name: "Sejarah & Geografi", ddcRange: "900 - 999" },
    { id: "cat-11", code: "TEX", name: "Buku Teks Pelajaran", ddcRange: "Pelajaran SMA" },
    { id: "cat-12", code: "REF", name: "Referensi & Ensiklopedia", ddcRange: "R" }
  ];
  const locations = [
    { id: "loc-1", code: "RAK-A1", name: "Rak A1 - Sains & MIPA", room: "Ruang Koleksi Utama", shelf: "Lantai 1, Baris 1", capacity: 150 },
    { id: "loc-2", code: "RAK-A2", name: "Rak A2 - Teknologi & Terapan", room: "Ruang Koleksi Utama", shelf: "Lantai 1, Baris 2", capacity: 150 },
    { id: "loc-3", code: "RAK-B1", name: "Rak B1 - Sastra & Fiksi", room: "Ruang Koleksi Utama", shelf: "Lantai 1, Baris 3", capacity: 200 },
    { id: "loc-4", code: "RAK-B2", name: "Rak B2 - Novel & Antologi", room: "Ruang Baca Santai", shelf: "Lantai 1, Baris 4", capacity: 200 },
    { id: "loc-5", code: "RAK-C1", name: "Rak C1 - Pelajaran Kelas X", room: "Ruang Buku Teks", shelf: "Lantai 2, Baris 1", capacity: 300 },
    { id: "loc-6", code: "RAK-C2", name: "Rak C2 - Pelajaran Kelas XI", room: "Ruang Buku Teks", shelf: "Lantai 2, Baris 2", capacity: 300 },
    { id: "loc-7", code: "RAK-C3", name: "Rak C3 - Pelajaran Kelas XII", room: "Ruang Buku Teks", shelf: "Lantai 2, Baris 3", capacity: 300 },
    { id: "loc-8", code: "RAK-R1", name: "Rak R1 - Referensi & Kamus", room: "Ruang Referensi", shelf: "Lantai 1, Sudut R", capacity: 100 },
    { id: "loc-9", code: "RAK-D1", name: "Rak D1 - Karya Ilmiah & Majalah", room: "Ruang Berkala", shelf: "Lantai 1, Sisi Timur", capacity: 120 }
  ];
  const publishers = [
    { id: "pub-1", name: "Pusat Perbukuan Kemendikbudristek", city: "Jakarta", country: "Indonesia", phone: "(021) 3804248", email: "buku@kemdikbud.go.id" },
    { id: "pub-2", name: "Erlangga", city: "Jakarta", country: "Indonesia", phone: "(021) 8717085", email: "customercare@erlangga.co.id" },
    { id: "pub-3", name: "Gramedia Pustaka Utama", city: "Jakarta", country: "Indonesia", phone: "(021) 53650110", email: "customercare@gramedia.com" },
    { id: "pub-4", name: "Bentang Pustaka", city: "Yogyakarta", country: "Indonesia", phone: "(0274) 885408", email: "bentang.pustaka@mizan.com" },
    { id: "pub-5", name: "Mizan", city: "Bandung", country: "Indonesia", phone: "(022) 7834310", email: "redaksi@mizan.com" },
    { id: "pub-6", name: "Balai Pustaka", city: "Jakarta", country: "Indonesia", phone: "(021) 8583377", email: "info@balaipustaka.co.id" }
  ];
  const authors = [
    { id: "aut-1", name: "Pramoedya Ananta Toer", type: "Personal", nationality: "Indonesia" },
    { id: "aut-2", name: "Andrea Hirata", type: "Personal", nationality: "Indonesia" },
    { id: "aut-3", name: "Tere Liye", type: "Personal", nationality: "Indonesia" },
    { id: "aut-4", name: "Ahmad Fuadi", type: "Personal", nationality: "Indonesia" },
    { id: "aut-5", name: "Eka Kurniawan", type: "Personal", nationality: "Indonesia" },
    { id: "aut-6", name: "Tim Kemendikbud", type: "Organisasi", nationality: "Indonesia" },
    { id: "aut-7", name: "Marthen Kanginan", type: "Personal", nationality: "Indonesia" },
    { id: "aut-8", name: "Sukino", type: "Personal", nationality: "Indonesia" },
    { id: "aut-9", name: "Siti Nurul Hidayah", type: "Personal", nationality: "Indonesia" }
  ];
  const books = [
    {
      id: "bk-001",
      isbn: "978-602-244-325-4",
      title: "Matematika Tingkat Lanjut untuk SMA/MA Kelas XI",
      subtitle: "Kurikulum Merdeka - Edisi Revisi",
      author: "Al Azhary Masta, dkk.",
      editor: "Pusat Kurikulum dan Perbukuan",
      publisher: "Pusat Perbukuan Kemendikbudristek",
      publishYear: 2023,
      publishCity: "Jakarta",
      edition: "Cetakan Ke-1",
      language: "Indonesia",
      category: "Buku Teks Pelajaran",
      subject: "Matematika SMA, Aljabar, Trigonometri, Geometri Analitik",
      classificationCode: "510",
      callNumber: "510 MAS m",
      description: "Buku teks resmi Matematika Tingkat Lanjut SMA Kelas XI berbasis Kurikulum Merdeka yang menekankan pemahaman konsep, eksplorasi matematis, dan pemecahan masalah kontekstual berorientasi Profil Pelajar Pancasila.",
      pages: 312,
      dimension: "17.6 x 25 cm",
      source: "BOS",
      defaultLocation: "Rak C2 - Pelajaran Kelas XI",
      coverUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&auto=format&fit=crop&q=80",
      digitalFileUrl: "https://buku.kemdikbud.go.id/katalog/matematika-tingkat-lanjut-sma-xi",
      isOpacVisible: true,
      createdAt: "2025-01-10T08:00:00Z",
      updatedAt: "2025-01-10T08:00:00Z"
    },
    {
      id: "bk-002",
      isbn: "978-602-244-380-3",
      title: "Fisika untuk SMA/MA Kelas XI",
      subtitle: "Kurikulum Merdeka - Pemahaman Konsep dan Praktikum",
      author: "Marianna Magdalena Radjawane, dkk.",
      publisher: "Pusat Perbukuan Kemendikbudristek",
      publishYear: 2023,
      publishCity: "Jakarta",
      edition: "Cetakan Ke-2",
      language: "Indonesia",
      category: "Sains & Matematika",
      subject: "Fisika SMA, Mekanika Fluida, Gelombang, Termodinamika",
      classificationCode: "530",
      callNumber: "530 RAD f",
      description: "Buku Fisika SMA kelas XI menyajikan fenomena alam secara empiris, dilengkapi kegiatan laboratorium, simulasi digital, serta aplikasi teknologi terbarukan dalam kehidupan sehari-hari.",
      pages: 256,
      dimension: "17.6 x 25 cm",
      source: "BOS",
      defaultLocation: "Rak C2 - Pelajaran Kelas XI",
      coverUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&auto=format&fit=crop&q=80",
      isOpacVisible: true,
      createdAt: "2025-01-10T08:00:00Z",
      updatedAt: "2025-01-10T08:00:00Z"
    },
    {
      id: "bk-003",
      isbn: "978-602-291-662-8",
      title: "Bumi Manusia",
      subtitle: "Tetralogi Buru Bagian Pertama",
      author: "Pramoedya Ananta Toer",
      publisher: "Lentera Dipantara",
      publishYear: 2021,
      publishCity: "Jakarta",
      edition: "Edisi Khusus",
      language: "Indonesia",
      category: "Kesusastraan & Fiksi",
      subject: "Novel Sejarah Indonesia, Pergerakan Nasional, Humanisme",
      classificationCode: "813",
      callNumber: "813 TOE b",
      description: "Karya sastra legendaris mahakarya Pramoedya Ananta Toer yang mengisahkan perjuangan Minke, seorang pribumi cerdas di era Hindia Belanda, menegakkan harkat kemanusiaan dan cinta sejati bersama Annelies Mellema.",
      pages: 535,
      dimension: "13 x 20.5 cm",
      source: "Pembelian",
      defaultLocation: "Rak B1 - Sastra & Fiksi",
      coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80",
      isOpacVisible: true,
      createdAt: "2025-01-11T08:00:00Z",
      updatedAt: "2025-01-11T08:00:00Z"
    },
    {
      id: "bk-004",
      isbn: "978-979-3062-79-2",
      title: "Laskar Pelangi",
      subtitle: "Kisah Inspiratif Sepuluh Sahabat Pengukir Mimpi",
      author: "Andrea Hirata",
      publisher: "Bentang Pustaka",
      publishYear: 2022,
      publishCity: "Yogyakarta",
      edition: "Cetakan Ke-40",
      language: "Indonesia",
      category: "Kesusastraan & Fiksi",
      subject: "Novel Motivasi, Pendidikan Belitung, Persahabatan",
      classificationCode: "813",
      callNumber: "813 HIR l",
      description: "Novel best seller fenomena sastra Indonesia tentang tekad baja anak-anak pulau Belitong meraih cita-cita di bawah bimbingan guru penuh dedikasi Bu Muslimah dan Pak Harfan.",
      pages: 529,
      dimension: "13.5 x 20.5 cm",
      source: "Hibah / Donasi",
      defaultLocation: "Rak B2 - Novel & Antologi",
      coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&auto=format&fit=crop&q=80",
      isOpacVisible: true,
      createdAt: "2025-01-12T08:00:00Z",
      updatedAt: "2025-01-12T08:00:00Z"
    },
    {
      id: "bk-005",
      isbn: "978-602-03-2478-4",
      title: "Hujan",
      subtitle: "Kisah Cinta, Persahabatan dan Melupakan",
      author: "Tere Liye",
      publisher: "Gramedia Pustaka Utama",
      publishYear: 2022,
      publishCity: "Jakarta",
      edition: "Cetakan Ke-25",
      language: "Indonesia",
      category: "Kesusastraan & Fiksi",
      subject: "Fiksi Sains Masa Depan, Drama, Hubungan Kemanusiaan",
      classificationCode: "813",
      callNumber: "813 TER h",
      description: "Mengambil latar tahun 2042 setelah bencana gunung meletus dahsyat, mengisahkan Lail dan Esok dalam pergulatan teknologi memori, kepedulian sosial, dan keikhlasan melepaskan masa lalu.",
      pages: 320,
      dimension: "13.5 x 20 cm",
      source: "Pembelian",
      defaultLocation: "Rak B2 - Novel & Antologi",
      coverUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&auto=format&fit=crop&q=80",
      isOpacVisible: true,
      createdAt: "2025-01-13T08:00:00Z",
      updatedAt: "2025-01-13T08:00:00Z"
    },
    {
      id: "bk-006",
      isbn: "978-602-244-657-6",
      title: "Biologi untuk SMA/MA Kelas XII",
      subtitle: "Kurikulum Merdeka - Bioteknologi & Genetika Terapan",
      author: "Shilviana Rahayu, dkk.",
      publisher: "Pusat Perbukuan Kemendikbudristek",
      publishYear: 2024,
      publishCity: "Jakarta",
      edition: "Cetakan Ke-1",
      language: "Indonesia",
      category: "Sains & Matematika",
      subject: "Biologi SMA, Enzim Metabolisme, DNA/RNA, Rekayasa Genetika, Evolusi",
      classificationCode: "570",
      callNumber: "570 RAH b",
      description: "Membahas konsep mutakhir biologi sel, sintesis protein, genetika Mendel, hereditas manusia, serta bioteknologi modern dengan pendekatan saintifik dan studi kasus riset.",
      pages: 288,
      dimension: "17.6 x 25 cm",
      source: "BOS",
      defaultLocation: "Rak C3 - Pelajaran Kelas XII",
      coverUrl: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400&auto=format&fit=crop&q=80",
      isOpacVisible: true,
      createdAt: "2025-01-14T08:00:00Z",
      updatedAt: "2025-01-14T08:00:00Z"
    },
    {
      id: "bk-007",
      isbn: "978-602-06-3843-0",
      title: "Atomic Habits: Perubahan Kecil yang Memberikan Hasil Luar Biasa",
      subtitle: "Cara Mudah & Terbukti Membangun Kebiasaan Baik dan Membuang Kebiasaan Buruk",
      author: "James Clear",
      editor: "Alex Tri Kantjono Widodo (Penerjemah)",
      publisher: "Gramedia Pustaka Utama",
      publishYear: 2023,
      publishCity: "Jakarta",
      edition: "Cetakan Ke-18",
      language: "Indonesia",
      category: "Filsafat & Psikologi",
      subject: "Pengembangan Diri, Psikologi Perilaku, Produktivitas Siswa",
      classificationCode: "158",
      callNumber: "158 CLE a",
      description: "Panduan praktis berbasis ilmu biologi, psikologi, dan neurosains untuk membentuk kebiasaan positif 1% setiap hari dan mencapai lompatan prestasi belajar serta pembentukan karakter disiplin.",
      pages: 356,
      dimension: "15 x 23 cm",
      source: "Pembelian",
      defaultLocation: "Rak A2 - Teknologi & Terapan",
      coverUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&auto=format&fit=crop&q=80",
      isOpacVisible: true,
      createdAt: "2025-01-15T08:00:00Z",
      updatedAt: "2025-01-15T08:00:00Z"
    },
    {
      id: "bk-008",
      isbn: "978-979-403-888-9",
      title: "Kamus Besar Bahasa Indonesia (KBBI) Edisi Kelima",
      subtitle: "Rujukan Utama Kosakata Bahasa Indonesia Baku",
      author: "Badan Pengembangan dan Pembinaan Bahasa",
      publisher: "Balai Pustaka & Kemdikbud",
      publishYear: 2022,
      publishCity: "Jakarta",
      edition: "Edisi V Lux",
      language: "Indonesia",
      category: "Referensi & Ensiklopedia",
      subject: "Leksikografi, Tata Bahasa, Kamus Referensi Nasional",
      classificationCode: "R 499.221",
      callNumber: "R 499.221 BAD k",
      description: "Kamus resmi terlengkap bahasa Indonesia memuat lebih dari 127.000 lema dan makna, mencakup istilah ilmiah mutakhir, etimologi kata, ungkapan, dan peribahasa nusantara.",
      pages: 2040,
      dimension: "21 x 28 cm",
      source: "Pemerintah",
      defaultLocation: "Rak R1 - Referensi & Kamus",
      coverUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&auto=format&fit=crop&q=80",
      isOpacVisible: true,
      createdAt: "2025-01-15T08:00:00Z",
      updatedAt: "2025-01-15T08:00:00Z"
    }
  ];
  const items = [
    // bk-001 (Matematika XI) - 4 eksemplar
    { id: "itm-001-1", bookId: "bk-001", barcode: "WPL-000001", inventoryNumber: "INV/2024/001/01", location: "Rak C2 - Pelajaran Kelas XI", status: "borrowed", condition: "good", entryDate: "2024-07-15", source: "BOS", price: 75e3 },
    { id: "itm-001-2", bookId: "bk-001", barcode: "WPL-000002", inventoryNumber: "INV/2024/001/02", location: "Rak C2 - Pelajaran Kelas XI", status: "available", condition: "good", entryDate: "2024-07-15", source: "BOS", price: 75e3 },
    { id: "itm-001-3", bookId: "bk-001", barcode: "WPL-000003", inventoryNumber: "INV/2024/001/03", location: "Rak C2 - Pelajaran Kelas XI", status: "available", condition: "good", entryDate: "2024-07-15", source: "BOS", price: 75e3 },
    { id: "itm-001-4", bookId: "bk-001", barcode: "WPL-000004", inventoryNumber: "INV/2024/001/04", location: "Rak C2 - Pelajaran Kelas XI", status: "available", condition: "fair", entryDate: "2024-07-15", source: "BOS", price: 75e3 },
    // bk-002 (Fisika XI) - 3 eksemplar
    { id: "itm-002-1", bookId: "bk-002", barcode: "WPL-000005", inventoryNumber: "INV/2024/002/01", location: "Rak C2 - Pelajaran Kelas XI", status: "borrowed", condition: "good", entryDate: "2024-07-15", source: "BOS", price: 82e3 },
    { id: "itm-002-2", bookId: "bk-002", barcode: "WPL-000006", inventoryNumber: "INV/2024/002/02", location: "Rak C2 - Pelajaran Kelas XI", status: "available", condition: "good", entryDate: "2024-07-15", source: "BOS", price: 82e3 },
    { id: "itm-002-3", bookId: "bk-002", barcode: "WPL-000007", inventoryNumber: "INV/2024/002/03", location: "Rak C2 - Pelajaran Kelas XI", status: "available", condition: "good", entryDate: "2024-07-15", source: "BOS", price: 82e3 },
    // bk-003 (Bumi Manusia) - 3 eksemplar
    { id: "itm-003-1", bookId: "bk-003", barcode: "WPL-000008", inventoryNumber: "INV/2023/003/01", location: "Rak B1 - Sastra & Fiksi", status: "borrowed", condition: "good", entryDate: "2023-09-10", source: "Pembelian", price: 135e3 },
    { id: "itm-003-2", bookId: "bk-003", barcode: "WPL-000009", inventoryNumber: "INV/2023/003/02", location: "Rak B1 - Sastra & Fiksi", status: "available", condition: "good", entryDate: "2023-09-10", source: "Pembelian", price: 135e3 },
    { id: "itm-003-3", bookId: "bk-003", barcode: "WPL-000010", inventoryNumber: "INV/2023/003/03", location: "Rak B1 - Sastra & Fiksi", status: "reserved", condition: "good", entryDate: "2023-09-10", source: "Pembelian", price: 135e3 },
    // bk-004 (Laskar Pelangi) - 3 eksemplar
    { id: "itm-004-1", bookId: "bk-004", barcode: "WPL-000011", inventoryNumber: "INV/2023/004/01", location: "Rak B2 - Novel & Antologi", status: "available", condition: "good", entryDate: "2023-10-01", source: "Hibah / Donasi", price: 98e3 },
    { id: "itm-004-2", bookId: "bk-004", barcode: "WPL-000012", inventoryNumber: "INV/2023/004/02", location: "Rak B2 - Novel & Antologi", status: "available", condition: "good", entryDate: "2023-10-01", source: "Hibah / Donasi", price: 98e3 },
    { id: "itm-004-3", bookId: "bk-004", barcode: "WPL-000013", inventoryNumber: "INV/2023/004/03", location: "Rak B2 - Novel & Antologi", status: "damaged", condition: "damaged", entryDate: "2023-10-01", source: "Hibah / Donasi", price: 98e3, notes: "Cover lepas, butuh perbaikan jilid" },
    // bk-005 (Hujan) - 2 eksemplar
    { id: "itm-005-1", bookId: "bk-005", barcode: "WPL-000014", inventoryNumber: "INV/2023/005/01", location: "Rak B2 - Novel & Antologi", status: "available", condition: "good", entryDate: "2023-11-20", source: "Pembelian", price: 95e3 },
    { id: "itm-005-2", bookId: "bk-005", barcode: "WPL-000015", inventoryNumber: "INV/2023/005/02", location: "Rak B2 - Novel & Antologi", status: "borrowed", condition: "good", entryDate: "2023-11-20", source: "Pembelian", price: 95e3 },
    // bk-006 (Biologi XII) - 3 eksemplar
    { id: "itm-006-1", bookId: "bk-006", barcode: "WPL-000016", inventoryNumber: "INV/2024/006/01", location: "Rak C3 - Pelajaran Kelas XII", status: "available", condition: "good", entryDate: "2024-07-20", source: "BOS", price: 88e3 },
    { id: "itm-006-2", bookId: "bk-006", barcode: "WPL-000017", inventoryNumber: "INV/2024/006/02", location: "Rak C3 - Pelajaran Kelas XII", status: "available", condition: "good", entryDate: "2024-07-20", source: "BOS", price: 88e3 },
    // bk-007 (Atomic Habits) - 2 eksemplar
    { id: "itm-007-1", bookId: "bk-007", barcode: "WPL-000018", inventoryNumber: "INV/2023/007/01", location: "Rak A2 - Teknologi & Terapan", status: "available", condition: "good", entryDate: "2023-12-05", source: "Pembelian", price: 108e3 },
    { id: "itm-007-2", bookId: "bk-007", barcode: "WPL-000019", inventoryNumber: "INV/2023/007/02", location: "Rak A2 - Teknologi & Terapan", status: "available", condition: "good", entryDate: "2023-12-05", source: "Pembelian", price: 108e3 },
    // bk-008 (KBBI V) - 2 eksemplar
    { id: "itm-008-1", bookId: "bk-008", barcode: "WPL-000020", inventoryNumber: "INV/2022/008/01", location: "Rak R1 - Referensi & Kamus", status: "available", condition: "good", entryDate: "2022-05-10", source: "Pemerintah", price: 45e4 },
    { id: "itm-008-2", bookId: "bk-008", barcode: "WPL-000021", inventoryNumber: "INV/2022/008/02", location: "Rak R1 - Referensi & Kamus", status: "available", condition: "good", entryDate: "2022-05-10", source: "Pemerintah", price: 45e4 }
  ];
  const members = [
    {
      id: "mem-siswa-001",
      memberCode: "202410101",
      type: "SISWA",
      identityNumber: "10101",
      nisn: "0067891234",
      name: "Dimas Arya Pratama",
      gender: "L",
      classGrade: "XI MIPA 1",
      major: "MIPA (Kurikulum Merdeka)",
      entryYear: 2023,
      phone: "081234567890",
      email: "dimas.pratama@siswa.sman3nganjuk.sch.id",
      address: "Jl. Ahmad Yani No. 45, Nganjuk",
      photoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80",
      status: "active",
      registeredDate: "2023-07-17",
      expiryDate: "2026-06-30",
      notes: "Siswa aktif, ketua ekskul KIR"
    },
    {
      id: "mem-siswa-002",
      memberCode: "202410102",
      type: "SISWA",
      identityNumber: "10102",
      nisn: "0067891235",
      name: "Anindya Putri Maharani",
      gender: "P",
      classGrade: "XI MIPA 2",
      major: "MIPA (Kurikulum Merdeka)",
      entryYear: 2023,
      phone: "081298765432",
      email: "anindya.putri@siswa.sman3nganjuk.sch.id",
      address: "Perumahan Griya Indah Begadung Blok C-12, Nganjuk",
      photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
      status: "active",
      registeredDate: "2023-07-17",
      expiryDate: "2026-06-30"
    },
    {
      id: "mem-siswa-003",
      memberCode: "202410103",
      type: "SISWA",
      identityNumber: "10103",
      nisn: "0071234567",
      name: "Muhammad Rizky Ramadhan",
      gender: "L",
      classGrade: "X-E 3",
      major: "Fase E (Kurikulum Merdeka)",
      entryYear: 2024,
      phone: "085712349988",
      email: "rizky.ramadhan@siswa.sman3nganjuk.sch.id",
      address: "Jl. Supriyadi No. 18, Sukomoro, Nganjuk",
      photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80",
      status: "active",
      registeredDate: "2024-07-15",
      expiryDate: "2027-06-30"
    },
    {
      id: "mem-siswa-004",
      memberCode: "202410104",
      type: "SISWA",
      identityNumber: "10104",
      nisn: "0059988776",
      name: "Nabila Zahra Khairunnisa",
      gender: "P",
      classGrade: "XII IPS 1",
      major: "IPS",
      entryYear: 2022,
      phone: "082133445566",
      email: "nabila.zahra@siswa.sman3nganjuk.sch.id",
      address: "Jl. Dermojoyo No. 88, Berbek, Nganjuk",
      photoUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80",
      status: "active",
      registeredDate: "2022-07-18",
      expiryDate: "2025-06-30"
    },
    {
      id: "mem-guru-001",
      memberCode: "197805122005011003",
      type: "GURU",
      identityNumber: "197805122005011003",
      name: "Ahmad Fauzi, S.Pd., M.Si.",
      gender: "L",
      subject: "Matematika Peminatan & Tingkat Lanjut",
      position: "Guru Madya / Pembina Olimpiade Sains",
      phone: "081335789012",
      email: "fauzi.guru@sman3nganjuk.sch.id",
      address: "Jl. Panglima Sudirman No. 102, Nganjuk",
      photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
      status: "active",
      registeredDate: "2020-01-10",
      expiryDate: "2030-12-31"
    },
    {
      id: "mem-guru-002",
      memberCode: "198203152008012015",
      type: "GURU",
      identityNumber: "198203152008012015",
      name: "Dra. Sri Wahyuni, M.Pd.",
      gender: "P",
      subject: "Bahasa dan Sastra Indonesia",
      position: "Guru Pembina Literasi & Majalah Sekolah",
      phone: "081230456781",
      email: "sri.wahyuni@sman3nganjuk.sch.id",
      address: "Jl. Mastrip No. 34, Loceret, Nganjuk",
      photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
      status: "active",
      registeredDate: "2020-01-10",
      expiryDate: "2030-12-31"
    },
    {
      id: "mem-tendik-001",
      memberCode: "TK-19880914-001",
      type: "TENDIK",
      identityNumber: "198809142010011002",
      name: "Joko Susilo, S.Kom.",
      gender: "L",
      position: "Kepala Laboratorium Komputer & IT Support",
      phone: "085649123888",
      email: "joko.it@sman3nganjuk.sch.id",
      address: "Jl. Diponegoro No. 27, Nganjuk",
      photoUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80",
      status: "active",
      registeredDate: "2021-03-01",
      expiryDate: "2030-12-31"
    }
  ];
  const loans = [
    {
      id: "loan-001",
      loanCode: "PJ-202608-0001",
      memberId: "mem-siswa-001",
      memberCode: "202410101",
      memberName: "Dimas Arya Pratama",
      memberType: "SISWA",
      officerId: "usr-pustakawan",
      officerName: "Siti Rahmawati, S.I.Pust.",
      loanDate: "2026-08-15",
      dueDate: "2026-08-22",
      // Overdue relative to current time Aug 23
      status: "overdue",
      extensionCount: 0,
      maxExtensions: 2,
      items: [
        {
          itemId: "itm-001-1",
          bookId: "bk-001",
          barcode: "WPL-000001",
          bookTitle: "Matematika Tingkat Lanjut untuk SMA/MA Kelas XI",
          author: "Al Azhary Masta, dkk.",
          callNumber: "510 MAS m",
          coverUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&auto=format&fit=crop&q=80"
        }
      ],
      notes: "Dipinjam untuk persiapan olimpiade matematika sekolah"
    },
    {
      id: "loan-002",
      loanCode: "PJ-202608-0002",
      memberId: "mem-guru-001",
      memberCode: "197805122005011003",
      memberName: "Ahmad Fauzi, S.Pd., M.Si.",
      memberType: "GURU",
      officerId: "usr-pustakawan",
      officerName: "Siti Rahmawati, S.I.Pust.",
      loanDate: "2026-08-18",
      dueDate: "2026-09-01",
      status: "active",
      extensionCount: 0,
      maxExtensions: 3,
      items: [
        {
          itemId: "itm-002-1",
          bookId: "bk-002",
          barcode: "WPL-000005",
          bookTitle: "Fisika untuk SMA/MA Kelas XI",
          author: "Marianna Magdalena Radjawane, dkk.",
          callNumber: "530 RAD f",
          coverUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&auto=format&fit=crop&q=80"
        }
      ]
    },
    {
      id: "loan-003",
      loanCode: "PJ-202608-0003",
      memberId: "mem-siswa-002",
      memberCode: "202410102",
      memberName: "Anindya Putri Maharani",
      memberType: "SISWA",
      officerId: "usr-pustakawan",
      officerName: "Siti Rahmawati, S.I.Pust.",
      loanDate: "2026-08-20",
      dueDate: "2026-08-27",
      status: "active",
      extensionCount: 0,
      maxExtensions: 2,
      items: [
        {
          itemId: "itm-003-1",
          bookId: "bk-003",
          barcode: "WPL-000008",
          bookTitle: "Bumi Manusia",
          author: "Pramoedya Ananta Toer",
          callNumber: "813 TOE b",
          coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80"
        },
        {
          itemId: "itm-005-2",
          bookId: "bk-005",
          barcode: "WPL-000015",
          bookTitle: "Hujan",
          author: "Tere Liye",
          callNumber: "813 TER h",
          coverUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&auto=format&fit=crop&q=80"
        }
      ]
    },
    {
      id: "loan-004",
      loanCode: "PJ-202608-0004",
      memberId: "mem-siswa-004",
      memberCode: "202410104",
      memberName: "Nabila Zahra Khairunnisa",
      memberType: "SISWA",
      officerId: "usr-pustakawan",
      officerName: "Siti Rahmawati, S.I.Pust.",
      loanDate: "2026-08-01",
      dueDate: "2026-08-08",
      returnDate: "2026-08-10",
      status: "returned",
      extensionCount: 0,
      maxExtensions: 2,
      items: [
        {
          itemId: "itm-004-1",
          bookId: "bk-004",
          barcode: "WPL-000011",
          bookTitle: "Laskar Pelangi",
          author: "Andrea Hirata",
          callNumber: "813 HIR l",
          coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&auto=format&fit=crop&q=80",
          returnedAt: "2026-08-10",
          returnCondition: "good",
          fineAmount: 2e3,
          finePaid: true
        }
      ]
    }
  ];
  const fines = [
    {
      id: "fn-001",
      fineCode: "FN-202608-0001",
      loanId: "loan-004",
      memberId: "mem-siswa-004",
      memberName: "Nabila Zahra Khairunnisa",
      memberCode: "202410104",
      itemId: "itm-004-1",
      bookTitle: "Laskar Pelangi",
      barcode: "WPL-000011",
      daysLate: 2,
      finePerDay: 1e3,
      damageFine: 0,
      lostFine: 0,
      totalFine: 2e3,
      paidAmount: 2e3,
      status: "paid",
      reason: "Keterlambatan",
      officerId: "usr-pustakawan",
      officerName: "Siti Rahmawati, S.I.Pust.",
      createdAt: "2026-08-10T09:30:00Z",
      paidAt: "2026-08-10T09:32:00Z",
      notes: "Lunas dibayar tunai di meja sirkulasi"
    },
    {
      id: "fn-002",
      fineCode: "FN-202608-0002",
      loanId: "loan-001",
      memberId: "mem-siswa-001",
      memberName: "Dimas Arya Pratama",
      memberCode: "202410101",
      itemId: "itm-001-1",
      bookTitle: "Matematika Tingkat Lanjut untuk SMA/MA Kelas XI",
      barcode: "WPL-000001",
      daysLate: 1,
      finePerDay: 1e3,
      damageFine: 0,
      lostFine: 0,
      totalFine: 1e3,
      paidAmount: 0,
      status: "unpaid",
      reason: "Keterlambatan",
      officerId: "usr-pustakawan",
      officerName: "Siti Rahmawati, S.I.Pust.",
      createdAt: "2026-08-23T00:00:00Z",
      notes: "Otomatis dihitung sistem saat jatuh tempo terlewati"
    }
  ];
  const reservations = [
    {
      id: "res-001",
      bookId: "bk-003",
      bookTitle: "Bumi Manusia",
      coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80",
      memberId: "mem-siswa-003",
      memberName: "Muhammad Rizky Ramadhan",
      memberCode: "202410103",
      requestDate: "2026-08-21",
      expiryDate: "2026-08-26",
      status: "waiting",
      notes: "Reservasi via OPAC mandiri"
    }
  ];
  const stockOpnames = [
    {
      id: "so-2026-01",
      sessionCode: "SO-SMAN3-2026-01",
      title: "Stock Opname Koleksi Sastra & Pelajaran Semester Ganjil 2026",
      startDate: "2026-08-01",
      endDate: "2026-08-05",
      status: "completed",
      officerName: "Bambang Sudarmono, S.Sos.",
      totalCatalogItems: 21,
      scannedCount: 21,
      foundCount: 19,
      missingCount: 1,
      damagedCount: 1,
      misplacedCount: 0,
      notes: "Audit tahunan buku perpustakaan SMAN 3 Nganjuk selesai dengan akurasi 95%",
      scannedItems: [
        {
          barcode: "WPL-000001",
          bookTitle: "Matematika Tingkat Lanjut untuk SMA/MA Kelas XI",
          expectedLocation: "Rak C2 - Pelajaran Kelas XI",
          scannedLocation: "Rak C2 - Pelajaran Kelas XI",
          scannedAt: "2026-08-01T10:15:00Z",
          officer: "Siti Rahmawati",
          condition: "good",
          status: "matched"
        },
        {
          barcode: "WPL-000013",
          bookTitle: "Laskar Pelangi",
          expectedLocation: "Rak B2 - Novel & Antologi",
          scannedLocation: "Rak B2 - Novel & Antologi",
          scannedAt: "2026-08-02T11:20:00Z",
          officer: "Siti Rahmawati",
          condition: "damaged",
          status: "damaged"
        }
      ]
    }
  ];
  const serials = [
    {
      id: "ser-001",
      title: "Gema Smaga - Majalah Komunitas SMAN 3 Nganjuk",
      type: "Majalah",
      issn: "2549-887X",
      publisher: "OSIS & Tim Jurnalistik SMA Negeri 3 Nganjuk",
      frequency: "Triwulan",
      editionNumber: "Edisi 42 / Agustus 2026",
      publishDate: "2026-08-01",
      location: "Rak D1 - Karya Ilmiah & Majalah",
      totalCopies: 10,
      availableCopies: 8,
      coverUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80",
      notes: "Liputan prestasi olimpiade sains, pentas seni sekolah, dan rubrik karya sastra siswa"
    },
    {
      id: "ser-002",
      title: "Jurnal Edukasi & Pedagogi Jawa Timur",
      type: "Jurnal",
      issn: "2301-4455",
      publisher: "Dinas Pendidikan Provinsi Jawa Timur",
      frequency: "Bulanan",
      editionNumber: "Vol. 14 No. 2 (2026)",
      publishDate: "2026-07-15",
      location: "Rak D1 - Karya Ilmiah & Majalah",
      totalCopies: 5,
      availableCopies: 5,
      coverUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&auto=format&fit=crop&q=80",
      notes: "Kumpulan artikel penelitian tindakan kelas (PTK) guru SMA/SMK se-Jawa Timur"
    }
  ];
  const activityLogs = [
    {
      id: "log-001",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userId: "usr-pustakawan",
      username: "pustakawan",
      role: "pustakawan",
      module: "LOANS",
      action: "BORROW",
      recordId: "loan-003",
      recordIdentifier: "PJ-202608-0003",
      description: "Peminjaman 2 buku oleh Anindya Putri Maharani (XI MIPA 2)",
      ipAddress: "127.0.0.1"
    },
    {
      id: "log-002",
      timestamp: new Date(Date.now() - 36e5).toISOString(),
      userId: "usr-admin",
      username: "admin",
      role: "admin",
      module: "BOOKS",
      action: "CREATE",
      recordId: "bk-001",
      recordIdentifier: "978-602-244-325-4",
      description: "Input bibliografi baru: Matematika Tingkat Lanjut SMA Kelas XI",
      ipAddress: "127.0.0.1"
    },
    {
      id: "log-003",
      timestamp: new Date(Date.now() - 72e5).toISOString(),
      userId: "usr-superadmin",
      username: "superadmin",
      role: "superadmin",
      module: "AUTH",
      action: "LOGIN",
      description: "Super Administrator berhasil login ke sistem",
      ipAddress: "127.0.0.1"
    }
  ];
  const backups = [
    {
      id: "bak-001",
      filename: "backup_sman3nganjuk_initial_20260820.json",
      createdAt: "2026-08-20T17:00:00Z",
      createdBy: "Super Administrator",
      fileSizeKb: 48,
      itemCount: 21,
      status: "success",
      notes: "Backup rutin mingguan database Widya Pustaka"
    }
  ];
  return {
    settings: defaultSettings,
    users,
    books,
    items,
    members,
    loans,
    fines,
    reservations,
    stockOpnames,
    serials,
    categories,
    locations,
    publishers,
    authors,
    activityLogs,
    backups
  };
}
var DatabaseService = class {
  constructor() {
    this.isNeonEnabled = false;
    this.syncTimeout = null;
    this.isSyncingToNeon = false;
    this.pendingSyncToNeon = false;
    this.ensureDirectoryExists();
    this.data = this.loadDatabase();
    this.ensureStudentAndCatalogData();
  }
  async init() {
    if (!process.env.DATABASE_URL) {
      console.log("[DATABASE] No DATABASE_URL configured. Running with local JSON database.");
      return;
    }
    try {
      console.log("[NEON POSTGRES] Initializing Neon connection...");
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Neon connection timed out")), 2e3)
      );
      await Promise.race([initNeonTables(), timeoutPromise]);
      const neonData = await Promise.race([fetchAllFromNeon(), timeoutPromise]);
      if (neonData && neonData.users && neonData.users.length > 0) {
        console.log(`[NEON POSTGRES] Synced data from Neon (${neonData.users.length} users, ${neonData.books.length} books, ${neonData.categories.length} categories).`);
        this.data = neonData;
        this.ensureStudentAndCatalogData();
        try {
          fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
        } catch {
        }
      } else {
        console.log("[NEON POSTGRES] Neon database is fresh/empty. Migrating initial data to Neon...");
        this.ensureStudentAndCatalogData();
        await pushAllToNeon(this.data);
        console.log("[NEON POSTGRES] Initial data successfully migrated to Neon PostgreSQL!");
      }
      this.isNeonEnabled = true;
      console.log("[NEON POSTGRES] Neon PostgreSQL is connected and active.");
    } catch (err) {
      console.error("[NEON POSTGRES] Failed to connect to Neon PostgreSQL. Continuing with local JSON file:", err);
      this.isNeonEnabled = false;
    }
  }
  ensureStudentAndCatalogData() {
    let changed = false;
    const studentHash = bcrypt.hashSync("siswa123", 10);
    let studentUser = this.data.users.find((u) => u.username === "siswa");
    if (!studentUser) {
      studentUser = {
        id: "usr-siswa",
        username: "siswa",
        email: "siswa@polytechnic.astra.ac.id",
        fullName: "Dimas Arya Pratama (Mahasiswa)",
        name: "Dimas Arya Pratama",
        role: "siswa",
        passwordHash: studentHash,
        memberId: "mem-siswa-001",
        avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
        isActive: true,
        createdAt: "2025-01-06T08:00:00Z"
      };
      this.data.users.push(studentUser);
      changed = true;
    }
    if (!this.data.users.some((u) => u.username === "siswa1")) {
      this.data.users.push({
        id: "usr-siswa1",
        username: "siswa1",
        email: "dimas.pratama@siswa.astra.ac.id",
        fullName: "Dimas Arya Pratama",
        name: "Dimas Arya Pratama",
        role: "siswa",
        passwordHash: studentHash,
        memberId: "mem-siswa-001",
        avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
        isActive: true,
        createdAt: "2025-01-06T08:00:00Z"
      });
      changed = true;
    }
    let studentMember = this.data.members.find((m) => m.id === "mem-siswa-001" || m.memberCode === "202410101");
    if (!studentMember) {
      this.data.members.push({
        id: "mem-siswa-001",
        memberCode: "202410101",
        type: "SISWA",
        identityNumber: "202410101",
        nisn: "0067891234",
        name: "Dimas Arya Pratama",
        gender: "L",
        classGrade: "Tingkat 2 (Teknik Manufaktur)",
        major: "Teknik Rekayasa Pembuatan Perkakas Presisi",
        entryYear: 2024,
        phone: "081234567890",
        email: "siswa@polytechnic.astra.ac.id",
        address: "Kawasan Industri Delta Silicon II, Cikarang",
        photoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80",
        status: "active",
        registeredDate: "2024-08-01",
        expiryDate: "2027-08-01",
        notes: "Mahasiswa aktif Politeknik Astra"
      });
      changed = true;
    }
    if (!this.data.books || this.data.books.length < 3) {
      const seed = getSeedData();
      for (const b of seed.books) {
        if (!this.data.books.some((existing) => existing.id === b.id)) {
          this.data.books.push(b);
          changed = true;
        }
      }
      for (const itm of seed.items) {
        if (!this.data.items.some((existing) => existing.id === itm.id || existing.barcode === itm.barcode)) {
          this.data.items.push(itm);
          changed = true;
        }
      }
    }
    if (changed) {
      this.saveDatabase();
    }
  }
  ensureDirectoryExists() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch {
    }
  }
  loadDatabase() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        return parsed;
      }
    } catch (e) {
      console.error("Error loading library database file, reinitializing with seed data:", e);
    }
    const seed = getSeedData();
    this.saveDatabase(seed);
    return seed;
  }
  saveDatabase(newData) {
    if (newData) {
      this.data = newData;
    }
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("Error saving library database file:", e);
    }
    if (this.isNeonEnabled) {
      this.scheduleNeonSync();
      this.flushToNeon().catch(() => {
      });
    }
  }
  scheduleNeonSync() {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    this.syncTimeout = setTimeout(() => {
      this.flushToNeon();
    }, 250);
  }
  async flushToNeon() {
    if (!this.isNeonEnabled) return;
    if (this.isSyncingToNeon) {
      this.pendingSyncToNeon = true;
      return;
    }
    this.isSyncingToNeon = true;
    try {
      await pushAllToNeon(this.data);
    } catch (e) {
      console.error("[NEON POSTGRES] Background sync to Neon failed:", e);
    } finally {
      this.isSyncingToNeon = false;
      if (this.pendingSyncToNeon) {
        this.pendingSyncToNeon = false;
        this.scheduleNeonSync();
      }
    }
  }
  getData() {
    return this.data;
  }
  // Helper log activity
  logActivity(log) {
    const newLog = {
      id: "log-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      ...log
    };
    this.data.activityLogs.unshift(newLog);
    if (this.data.activityLogs.length > 500) {
      this.data.activityLogs = this.data.activityLogs.slice(0, 500);
    }
    this.saveDatabase();
    return newLog;
  }
  // Synchronize overdue loans, fine calculation, and expired reservations
  syncOverdueLoans() {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const todayMidnight = (/* @__PURE__ */ new Date(today + "T00:00:00Z")).getTime();
    let changed = false;
    this.data.loans.forEach((loan) => {
      if (loan.status === "active" && loan.dueDate < today) {
        loan.status = "overdue";
        changed = true;
      }
      if (loan.status === "overdue" || loan.status === "active" && loan.dueDate < today) {
        const dueMidnight = (/* @__PURE__ */ new Date(loan.dueDate.slice(0, 10) + "T00:00:00Z")).getTime();
        const daysLate = Math.max(0, Math.floor((todayMidnight - dueMidnight) / (1e3 * 60 * 60 * 24)));
        const gracePeriod = this.data.settings.gracePeriodDays || 0;
        loan.items.forEach((item) => {
          const existingFine = this.data.fines.find(
            (f) => f.loanId === loan.id && f.itemId === item.itemId && f.status !== "paid" && f.status !== "waived"
          );
          if (daysLate > gracePeriod) {
            const fineAmount = daysLate * (this.data.settings.finePerDay || 1e3);
            if (existingFine) {
              if (existingFine.daysLate !== daysLate || existingFine.totalFine !== fineAmount) {
                existingFine.daysLate = daysLate;
                existingFine.totalFine = fineAmount;
                changed = true;
              }
            } else {
              this.data.fines.push({
                id: "fn-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
                fineCode: "FN-" + (/* @__PURE__ */ new Date()).toISOString().slice(0, 7).replace("-", "") + "-" + (this.data.fines.length + 1).toString().padStart(4, "0"),
                loanId: loan.id,
                memberId: loan.memberId,
                memberName: loan.memberName,
                memberCode: loan.memberCode,
                itemId: item.itemId,
                bookTitle: item.bookTitle,
                barcode: item.barcode,
                daysLate,
                finePerDay: this.data.settings.finePerDay || 1e3,
                damageFine: 0,
                lostFine: 0,
                totalFine: fineAmount,
                paidAmount: 0,
                status: "unpaid",
                reason: "Keterlambatan",
                officerId: loan.officerId,
                officerName: loan.officerName,
                createdAt: (/* @__PURE__ */ new Date()).toISOString(),
                notes: "Otomatis dihitung sistem"
              });
              changed = true;
            }
          }
        });
      }
    });
    if (this.data.reservations && this.data.reservations.length > 0) {
      this.data.reservations.forEach((resv) => {
        if ((resv.status === "ready" || resv.status === "pending" || resv.status === "waiting") && resv.expiryDate && resv.expiryDate < today) {
          resv.status = "expired";
          changed = true;
          if (resv.allocatedBarcode) {
            const item = this.data.items.find((i) => i.barcode === resv.allocatedBarcode);
            if (item && item.status === "reserved") {
              const nextResv = this.data.reservations.filter((r) => r.id !== resv.id && r.bookId === resv.bookId && (r.status === "pending" || r.status === "waiting")).sort((a, b) => new Date(a.requestDate || a.reservationDate || 0).getTime() - new Date(b.requestDate || b.reservationDate || 0).getTime())[0];
              if (nextResv) {
                nextResv.status = "ready";
                nextResv.allocatedBarcode = item.barcode;
                nextResv.readyDate = today;
              } else {
                item.status = "available";
              }
            }
            resv.allocatedBarcode = void 0;
          }
        }
      });
    }
    if (changed) {
      this.saveDatabase();
    }
  }
};
var db = new DatabaseService();

// server/auth.ts
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET || "widya-pustaka-sman3-nganjuk-super-secret-key-2026";
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Akses ditolak: Token autentikasi tidak ditemukan." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const users = db.getData().users;
    const user = users.find((u) => u.id === decoded.id && u.isActive);
    if (!user) {
      return res.status(401).json({ error: "Sesi kedaluwarsa atau pengguna tidak aktif." });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token autentikasi tidak valid atau telah kedaluwarsa." });
  }
}
function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Autentikasi diperlukan." });
    }
    if (allowedRoles.includes(req.user.role) || req.user.role === "superadmin") {
      return next();
    }
    return res.status(403).json({
      error: `Akses ditolak: Hak akses [${allowedRoles.join(", ")}] diperlukan untuk tindakan ini.`
    });
  };
}

// server/routes/auth.ts
var router = Router();
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username/Email dan Password wajib diisi." });
  }
  const data = db.getData();
  const user = data.users.find(
    (u) => (u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()) && u.isActive
  );
  if (!user) {
    return res.status(401).json({ error: "Username atau Password salah." });
  }
  const isMatch = bcrypt2.compareSync(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: "Username atau Password salah." });
  }
  user.lastLogin = (/* @__PURE__ */ new Date()).toISOString();
  db.saveDatabase();
  db.logActivity({
    userId: user.id,
    username: user.username,
    role: user.role,
    module: "AUTH",
    action: "LOGIN",
    description: `Pengguna ${user.fullName} (${user.role}) berhasil masuk ke sistem`,
    ipAddress: req.ip || req.socket.remoteAddress || "127.0.0.1"
  });
  const token = generateToken(user);
  const { passwordHash: _, ...safeUser } = user;
  return res.json({
    token,
    user: safeUser,
    settings: data.settings
  });
});
router.get("/me", authMiddleware, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Tidak terautentikasi" });
  }
  const { passwordHash: _, ...safeUser } = req.user;
  return res.json({
    user: safeUser,
    settings: db.getData().settings
  });
});
router.post("/demo-login", (req, res) => {
  const { role } = req.body;
  const data = db.getData();
  const user = data.users.find((u) => (u.role === role || u.username === role) && u.isActive);
  if (!user) {
    return res.status(404).json({ error: `Pengguna untuk role ${role} tidak ditemukan.` });
  }
  user.lastLogin = (/* @__PURE__ */ new Date()).toISOString();
  db.saveDatabase();
  db.logActivity({
    userId: user.id,
    username: user.username,
    role: user.role,
    module: "AUTH",
    action: "LOGIN",
    description: `Login cepat simulasi akun: ${user.fullName} (${user.role})`,
    ipAddress: req.ip || req.socket.remoteAddress || "127.0.0.1"
  });
  const token = generateToken(user);
  const { passwordHash: _, ...safeUser } = user;
  return res.json({
    token,
    user: safeUser,
    settings: data.settings
  });
});
router.put("/profile", authMiddleware, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Tidak terautentikasi" });
  }
  const { fullName, email, avatarUrl, name } = req.body;
  const user = req.user;
  if (fullName !== void 0) user.fullName = String(fullName).trim();
  if (name !== void 0) user.name = String(name).trim() || user.fullName;
  if (email !== void 0) {
    if (!email.includes("@")) {
      return res.status(400).json({ error: "Format email tidak valid." });
    }
    user.email = String(email).trim().toLowerCase();
  }
  if (avatarUrl !== void 0) user.avatarUrl = String(avatarUrl).trim();
  const dbData = db.getData();
  const dbUserIndex = dbData.users.findIndex((u) => u.id === user.id);
  if (dbUserIndex !== -1) {
    dbData.users[dbUserIndex] = { ...dbData.users[dbUserIndex], ...user };
  }
  db.saveDatabase();
  db.logActivity({
    userId: user.id,
    username: user.username,
    role: user.role,
    module: "AUTH",
    action: "UPDATE",
    description: `Pengguna ${user.fullName || user.username} memperbarui profil akun`,
    ipAddress: req.ip || req.socket.remoteAddress || "127.0.0.1"
  });
  const { passwordHash: _, ...safeUser } = user;
  return res.json({
    message: "Profil akun berhasil diperbarui.",
    user: safeUser
  });
});
router.get("/my-logs", authMiddleware, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Tidak terautentikasi" });
  }
  const user = req.user;
  const { module, q, limit = "100" } = req.query;
  const dbData = db.getData();
  let userLogs = dbData.activityLogs.filter(
    (log) => log.userId === user.id || log.username?.toLowerCase() === user.username.toLowerCase()
  );
  if (module && module !== "all") {
    userLogs = userLogs.filter((log) => log.module?.toUpperCase() === String(module).toUpperCase());
  }
  if (q) {
    const term = String(q).toLowerCase();
    userLogs = userLogs.filter(
      (log) => log.description?.toLowerCase().includes(term) || log.action?.toLowerCase().includes(term) || log.module?.toLowerCase().includes(term)
    );
  }
  const parsedLimit = parseInt(String(limit), 10) || 100;
  const paginatedLogs = userLogs.slice(0, parsedLimit);
  return res.json({
    logs: paginatedLogs,
    total: userLogs.length
  });
});
router.post("/change-password", authMiddleware, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "Password lama dan password baru wajib diisi." });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Password baru minimal 6 karakter." });
  }
  const user = req.user;
  if (!bcrypt2.compareSync(oldPassword, user.passwordHash)) {
    return res.status(400).json({ error: "Password lama tidak cocok." });
  }
  user.passwordHash = bcrypt2.hashSync(newPassword, 10);
  const dbData = db.getData();
  const dbUserIndex = dbData.users.findIndex((u) => u.id === user.id);
  if (dbUserIndex !== -1) {
    dbData.users[dbUserIndex].passwordHash = user.passwordHash;
  }
  db.saveDatabase();
  db.logActivity({
    userId: user.id,
    username: user.username,
    role: user.role,
    module: "AUTH",
    action: "UPDATE",
    description: `Pengguna ${user.fullName || user.username} memperbarui password akun`,
    ipAddress: req.ip || "127.0.0.1"
  });
  return res.json({ message: "Password berhasil diubah." });
});
var auth_default = router;

// server/routes/books.ts
import { Router as Router2 } from "express";
var router2 = Router2();
function enrichBookWithCopies(book) {
  const items = db.getData().items.filter((i) => i.bookId === book.id);
  const totalCopies = items.length;
  const availableCopies = items.filter((i) => i.status === "available").length;
  const borrowedCopies = items.filter((i) => i.status === "borrowed").length;
  const reservedCopies = items.filter((i) => i.status === "reserved").length;
  const lostCopies = items.filter((i) => i.status === "lost").length;
  const damagedCopies = items.filter((i) => i.status === "damaged").length;
  return {
    ...book,
    totalCopies,
    availableCopies,
    borrowedCopies,
    reservedCopies,
    lostCopies,
    damagedCopies,
    items
  };
}
router2.get("/opac", (req, res) => {
  const { query, category, availability, sort } = req.query;
  let books = db.getData().books.filter((b) => b.isOpacVisible);
  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    books = books.filter(
      (b) => b.title.toLowerCase().includes(q) || b.subtitle && b.subtitle.toLowerCase().includes(q) || (b.author || "").toLowerCase().includes(q) || (b.isbn || "").toLowerCase().includes(q) || (b.publisher || "").toLowerCase().includes(q) || (b.subject || "").toLowerCase().includes(q) || (b.category || "").toLowerCase().includes(q) || (b.callNumber || "").toLowerCase().includes(q)
    );
  }
  if (category && category !== "all") {
    books = books.filter((b) => b.category.toLowerCase() === category.toLowerCase());
  }
  let enriched = books.map(enrichBookWithCopies);
  if (availability === "available") {
    enriched = enriched.filter((b) => b.availableCopies > 0);
  } else if (availability === "borrowed") {
    enriched = enriched.filter((b) => b.availableCopies === 0 && b.borrowedCopies > 0);
  }
  if (sort === "title_asc") {
    enriched.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === "title_desc") {
    enriched.sort((a, b) => b.title.localeCompare(a.title));
  } else if (sort === "year_desc") {
    enriched.sort((a, b) => b.publishYear - a.publishYear);
  } else if (sort === "popular") {
    enriched.sort((a, b) => b.borrowedCopies - a.borrowedCopies);
  } else {
    enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return res.json({
    total: enriched.length,
    books: enriched
  });
});
router2.get("/", (req, res) => {
  const { query, category } = req.query;
  let books = db.getData().books;
  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    books = books.filter(
      (b) => b.title.toLowerCase().includes(q) || (b.author || "").toLowerCase().includes(q) || (b.isbn || "").toLowerCase().includes(q) || (b.publisher || "").toLowerCase().includes(q) || (b.callNumber || "").toLowerCase().includes(q)
    );
  }
  if (category && category !== "all") {
    books = books.filter((b) => b.category.toLowerCase() === category.toLowerCase());
  }
  const enriched = books.map(enrichBookWithCopies);
  return res.json({
    total: enriched.length,
    books: enriched
  });
});
router2.get("/:id", (req, res) => {
  const book = db.getData().books.find((b) => b.id === req.params.id);
  if (!book) {
    return res.status(404).json({ error: "Buku tidak ditemukan." });
  }
  const enriched = enrichBookWithCopies(book);
  return res.json(enriched);
});
router2.post(
  "/",
  authMiddleware,
  requireRoles("superadmin", "admin", "pustakawan"),
  (req, res) => {
    const {
      isbn,
      title,
      subtitle,
      author,
      editor,
      publisher,
      publishYear,
      publishCity,
      edition,
      language,
      category,
      subject,
      classificationCode,
      callNumber,
      description,
      pages,
      dimension,
      source,
      defaultLocation,
      coverUrl,
      digitalFileUrl,
      isOpacVisible = true,
      initialCopies = 1,
      copyPrice = 0
    } = req.body;
    if (!isbn || !title || !author || !publisher) {
      return res.status(400).json({ error: "ISBN, Judul, Penulis, dan Penerbit wajib diisi." });
    }
    const data = db.getData();
    const existingIsbn = data.books.find((b) => b.isbn.trim() === isbn.trim());
    if (existingIsbn) {
      return res.status(400).json({ error: `Buku dengan ISBN ${isbn} sudah terdaftar: "${existingIsbn.title}".` });
    }
    const newBookId = "bk-" + Date.now();
    const newBook = {
      id: newBookId,
      isbn: isbn.trim(),
      title: title.trim(),
      subtitle: subtitle?.trim(),
      author: author.trim(),
      editor: editor?.trim(),
      publisher: publisher.trim(),
      publishYear: Number(publishYear) || (/* @__PURE__ */ new Date()).getFullYear(),
      publishCity: publishCity?.trim() || "Jakarta",
      edition: edition?.trim(),
      language: language?.trim() || "Indonesia",
      category: category?.trim() || "Umum",
      subject: subject?.trim() || "Umum",
      classificationCode: classificationCode?.trim() || "000",
      callNumber: callNumber?.trim() || `${classificationCode || "000"} ${author.slice(0, 3).toUpperCase()} ${title[0]?.toLowerCase()}`,
      description: description?.trim() || "",
      pages: Number(pages) || 100,
      dimension: dimension?.trim() || "15 x 23 cm",
      source: source || "BOS",
      defaultLocation: defaultLocation?.trim() || "Rak A1 - Sains & MIPA",
      coverUrl: coverUrl?.trim() || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80",
      digitalFileUrl: digitalFileUrl?.trim(),
      isOpacVisible: isOpacVisible ?? true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    data.books.unshift(newBook);
    const numCopies = Math.max(1, Math.min(Number(initialCopies) || 1, 50));
    const createdItems = [];
    let maxBarcodeNum = data.items.reduce((max, item) => {
      const match = item.barcode.match(/WPL-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        return n > max ? n : max;
      }
      return max;
    }, 0);
    for (let i = 1; i <= numCopies; i++) {
      maxBarcodeNum++;
      const barcode = `WPL-${maxBarcodeNum.toString().padStart(6, "0")}`;
      const item = {
        id: `itm-${newBookId}-${i}`,
        bookId: newBookId,
        barcode,
        inventoryNumber: `INV/${newBook.publishYear}/${newBookId.slice(-4)}/${i.toString().padStart(2, "0")}`,
        location: newBook.defaultLocation,
        status: "available",
        condition: "good",
        entryDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        source: newBook.source,
        price: Number(copyPrice) || 5e4
      };
      data.items.push(item);
      createdItems.push(item);
    }
    db.saveDatabase();
    db.logActivity({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      module: "BOOKS",
      action: "CREATE",
      recordId: newBook.id,
      recordIdentifier: newBook.isbn,
      description: `Menambahkan bibliografi baru: "${newBook.title}" beserta ${numCopies} eksemplar.`,
      ipAddress: req.ip || "127.0.0.1"
    });
    return res.status(201).json({
      message: "Buku dan eksemplar berhasil ditambahkan.",
      book: enrichBookWithCopies(newBook)
    });
  }
);
router2.put(
  "/:id",
  authMiddleware,
  requireRoles("superadmin", "admin", "pustakawan"),
  (req, res) => {
    const data = db.getData();
    const bookIndex = data.books.findIndex((b) => b.id === req.params.id);
    if (bookIndex === -1) {
      return res.status(404).json({ error: "Buku tidak ditemukan." });
    }
    const updated = {
      ...data.books[bookIndex],
      ...req.body,
      id: req.params.id,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    data.books[bookIndex] = updated;
    db.saveDatabase();
    db.logActivity({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      module: "BOOKS",
      action: "UPDATE",
      recordId: updated.id,
      recordIdentifier: updated.isbn,
      description: `Memperbarui data bibliografi: "${updated.title}"`,
      ipAddress: req.ip || "127.0.0.1"
    });
    return res.json({
      message: "Data buku berhasil diperbarui.",
      book: enrichBookWithCopies(updated)
    });
  }
);
router2.delete(
  "/:id",
  authMiddleware,
  requireRoles("superadmin", "admin"),
  (req, res) => {
    const data = db.getData();
    const book = data.books.find((b) => b.id === req.params.id);
    if (!book) {
      return res.status(404).json({ error: "Buku tidak ditemukan." });
    }
    const items = data.items.filter((i) => i.bookId === book.id);
    const hasActiveLoans = items.some((i) => i.status === "borrowed");
    if (hasActiveLoans) {
      return res.status(400).json({
        error: "Tidak dapat menghapus buku karena ada eksemplar yang sedang dalam status dipinjam."
      });
    }
    data.books = data.books.filter((b) => b.id !== book.id);
    data.items = data.items.filter((i) => i.bookId !== book.id);
    db.saveDatabase();
    db.logActivity({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      module: "BOOKS",
      action: "DELETE",
      recordId: book.id,
      recordIdentifier: book.isbn,
      description: `Menghapus buku: "${book.title}" beserta seluruh eksemplarnya`,
      ipAddress: req.ip || "127.0.0.1"
    });
    return res.json({ message: "Buku dan seluruh eksemplar berhasil dihapus." });
  }
);
router2.get("/:id/items", (req, res) => {
  const data = db.getData();
  const items = data.items.filter((i) => i.bookId === req.params.id);
  return res.json({ total: items.length, items });
});
router2.post(
  "/:id/items",
  authMiddleware,
  requireRoles("superadmin", "admin", "pustakawan"),
  (req, res) => {
    const data = db.getData();
    const book = data.books.find((b) => b.id === req.params.id);
    if (!book) {
      return res.status(404).json({ error: "Buku tidak ditemukan." });
    }
    const { count = 1, location, source, price = 0, condition = "good" } = req.body;
    const numCopies = Math.max(1, Math.min(Number(count) || 1, 50));
    let maxBarcodeNum = data.items.reduce((max, item) => {
      const match = item.barcode.match(/WPL-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        return n > max ? n : max;
      }
      return max;
    }, 0);
    const created = [];
    for (let i = 1; i <= numCopies; i++) {
      maxBarcodeNum++;
      const barcode = `WPL-${maxBarcodeNum.toString().padStart(6, "0")}`;
      const item = {
        id: `itm-${book.id}-${Date.now()}-${i}`,
        bookId: book.id,
        barcode,
        inventoryNumber: `INV/${book.publishYear}/${book.id.slice(-4)}/${(data.items.filter((x) => x.bookId === book.id).length + i).toString().padStart(2, "0")}`,
        location: location || book.defaultLocation,
        status: "available",
        condition: condition || "good",
        entryDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        source: source || book.source,
        price: Number(price) || 5e4
      };
      data.items.push(item);
      created.push(item);
    }
    db.saveDatabase();
    db.logActivity({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      module: "ITEMS",
      action: "CREATE",
      recordId: book.id,
      recordIdentifier: book.title,
      description: `Menambahkan ${numCopies} eksemplar baru untuk buku "${book.title}"`,
      ipAddress: req.ip || "127.0.0.1"
    });
    return res.status(201).json({
      message: `${numCopies} eksemplar baru berhasil ditambahkan.`,
      item: created[0],
      items: created,
      book: enrichBookWithCopies(book)
    });
  }
);
router2.put(
  ["/items/:itemId", "/:bookId/items/:itemId"],
  authMiddleware,
  requireRoles("superadmin", "admin", "pustakawan"),
  (req, res) => {
    const data = db.getData();
    const itemIndex = data.items.findIndex((i) => i.id === req.params.itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ error: "Eksemplar tidak ditemukan." });
    }
    const item = data.items[itemIndex];
    const updated = {
      ...item,
      ...req.body,
      id: item.id,
      bookId: item.bookId,
      barcode: item.barcode
      // Barcode cannot be modified arbitrarily to maintain consistency
    };
    data.items[itemIndex] = updated;
    db.saveDatabase();
    db.logActivity({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      module: "ITEMS",
      action: "UPDATE",
      recordId: updated.id,
      recordIdentifier: updated.barcode,
      description: `Memperbarui eksemplar ${updated.barcode} (Status: ${updated.status}, Kondisi: ${updated.condition})`,
      ipAddress: req.ip || "127.0.0.1"
    });
    return res.json({
      message: "Eksemplar berhasil diperbarui.",
      item: updated
    });
  }
);
router2.delete(
  ["/items/:itemId", "/:bookId/items/:itemId"],
  authMiddleware,
  requireRoles("superadmin", "admin"),
  (req, res) => {
    const data = db.getData();
    const item = data.items.find((i) => i.id === req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: "Eksemplar tidak ditemukan." });
    }
    if (item.status === "borrowed") {
      return res.status(400).json({ error: "Tidak dapat menghapus eksemplar yang sedang dipinjam." });
    }
    data.items = data.items.filter((i) => i.id !== item.id);
    db.saveDatabase();
    db.logActivity({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      module: "ITEMS",
      action: "DELETE",
      recordId: item.id,
      recordIdentifier: item.barcode,
      description: `Menghapus eksemplar dengan barcode ${item.barcode}`,
      ipAddress: req.ip || "127.0.0.1"
    });
    return res.json({ message: "Eksemplar berhasil dihapus." });
  }
);
router2.get(["/item/:barcode", "/item-by-barcode/:barcode"], (req, res) => {
  const barcode = req.params.barcode.trim();
  const data = db.getData();
  const item = data.items.find((i) => i.barcode.toLowerCase() === barcode.toLowerCase());
  if (!item) {
    return res.status(404).json({ error: `Eksemplar dengan barcode "${barcode}" tidak ditemukan.` });
  }
  const book = data.books.find((b) => b.id === item.bookId);
  return res.json({
    item,
    book
  });
});
router2.post(
  "/bulk-import",
  authMiddleware,
  requireRoles("superadmin", "admin", "pustakawan"),
  (req, res) => {
    const { books } = req.body;
    if (!Array.isArray(books) || books.length === 0) {
      return res.status(400).json({ error: "Data buku kosong atau tidak valid." });
    }
    const data = db.getData();
    let importedCount = 0;
    const errors = [];
    let maxBarcodeNum = data.items.reduce((max, item) => {
      const match = item.barcode.match(/WPL-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        return n > max ? n : max;
      }
      return max;
    }, 0);
    books.forEach((b, index) => {
      if (!b.title || !b.author || !b.isbn) {
        errors.push(`Baris ${index + 1}: Judul, Penulis, dan ISBN wajib diisi.`);
        return;
      }
      if (data.books.some((existing) => existing.isbn.trim() === b.isbn.trim())) {
        errors.push(`Baris ${index + 1}: ISBN ${b.isbn} sudah ada dalam database.`);
        return;
      }
      const bookId = "bk-imp-" + Date.now() + "-" + index;
      const newBook = {
        id: bookId,
        isbn: b.isbn.trim(),
        title: b.title.trim(),
        subtitle: b.subtitle?.trim(),
        author: b.author.trim(),
        editor: b.editor?.trim(),
        publisher: b.publisher?.trim() || "Penerbit Nasional",
        publishYear: Number(b.publishYear) || 2024,
        publishCity: b.publishCity?.trim() || "Jakarta",
        edition: b.edition?.trim() || "Cetakan 1",
        language: b.language?.trim() || "Indonesia",
        category: b.category?.trim() || "Umum",
        subject: b.subject?.trim() || "Umum",
        classificationCode: b.classificationCode?.trim() || "000",
        callNumber: b.callNumber?.trim() || `000 ${b.author.slice(0, 3).toUpperCase()} ${b.title[0]?.toLowerCase()}`,
        description: b.description?.trim() || "Koleksi perpustakaan Politeknik Astra",
        pages: Number(b.pages) || 200,
        dimension: b.dimension?.trim() || "15 x 23 cm",
        source: b.source || "BOS Reguler",
        defaultLocation: b.location?.trim() || b.defaultLocation?.trim() || "Rak Koleksi Utama",
        coverUrl: b.coverUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80",
        isOpacVisible: true,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      data.books.push(newBook);
      importedCount++;
      const copiesToGenerate = Math.max(1, Math.min(50, Number(b.copiesCount || b.totalCopies) || 1));
      for (let c = 1; c <= copiesToGenerate; c++) {
        maxBarcodeNum++;
        const barcode = `WPL-${maxBarcodeNum.toString().padStart(6, "0")}`;
        data.items.push({
          id: `itm-${bookId}-${c}`,
          bookId,
          barcode,
          inventoryNumber: `INV/${newBook.publishYear}/${bookId.slice(-4)}/${c.toString().padStart(2, "0")}`,
          location: newBook.defaultLocation,
          status: "available",
          condition: "good",
          entryDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          source: newBook.source,
          price: Number(b.price) || 65e3
        });
      }
    });
    db.saveDatabase();
    db.logActivity({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      module: "BOOKS",
      action: "IMPORT",
      description: `Import massal bibliografi: ${importedCount} berhasil, ${errors.length} gagal`,
      ipAddress: req.ip || "127.0.0.1"
    });
    return res.json({
      message: `Import selesai. ${importedCount} buku berhasil diimpor.`,
      importedCount,
      errors
    });
  }
);
var books_default = router2;

// server/routes/members.ts
import { Router as Router3 } from "express";
var router3 = Router3();
function enrichMemberWithStats(member) {
  const loans = db.getData().loans.filter((l) => l.memberId === member.id);
  const activeLoans = loans.filter((l) => l.status === "active" || l.status === "overdue");
  const overdueLoans = loans.filter((l) => l.status === "overdue");
  const fines = db.getData().fines.filter((f) => f.memberId === member.id);
  const unpaidFines = fines.filter((f) => f.status === "unpaid" || f.status === "partial");
  const totalUnpaidFineAmount = unpaidFines.reduce((sum, f) => sum + (f.totalFine - f.paidAmount), 0);
  return {
    ...member,
    totalLoansCount: loans.length,
    activeLoansCount: activeLoans.reduce((sum, l) => sum + l.items.length, 0),
    overdueLoansCount: overdueLoans.length,
    unpaidFinesCount: unpaidFines.length,
    totalUnpaidFineAmount,
    activeLoans,
    unpaidFines
  };
}
function getGradeLevel(classGrade) {
  if (!classGrade) return "OTHER";
  const c = classGrade.toUpperCase().trim();
  if (c.startsWith("XII") || c.includes("KELAS XII") || c.includes("KELAS 12") || c.startsWith("12")) return "XII";
  if (c.startsWith("XI") || c.includes("KELAS XI") || c.includes("KELAS 11") || c.startsWith("11")) return "XI";
  if (c.startsWith("X") || c.includes("KELAS X") || c.includes("KELAS 10") || c.startsWith("10")) return "X";
  return "OTHER";
}
router3.get("/", authMiddleware, (req, res) => {
  const { query, q, type, status, grade, classGrade } = req.query;
  let members = db.getData().members;
  const searchQuery = (query || q || "").toLowerCase().trim();
  if (searchQuery) {
    members = members.filter(
      (m) => m.name.toLowerCase().includes(searchQuery) || m.memberCode.toLowerCase().includes(searchQuery) || m.identityNumber.toLowerCase().includes(searchQuery) || m.nisn && m.nisn.includes(searchQuery) || m.classGrade && m.classGrade.toLowerCase().includes(searchQuery) || m.subject && m.subject.toLowerCase().includes(searchQuery) || m.phone && m.phone.includes(searchQuery)
    );
  }
  if (type && type !== "all") {
    members = members.filter((m) => m.type.toUpperCase() === type.toUpperCase());
  }
  if (grade && grade !== "all") {
    members = members.filter((m) => {
      if (m.type !== "SISWA") return false;
      return getGradeLevel(m.classGrade) === grade;
    });
  }
  if (classGrade && classGrade !== "all") {
    members = members.filter((m) => {
      if (!m.classGrade) return false;
      return m.classGrade.trim().toLowerCase() === classGrade.trim().toLowerCase();
    });
  }
  if (status && status !== "all") {
    members = members.filter((m) => m.status === status);
  }
  const enriched = members.map(enrichMemberWithStats);
  return res.json({
    total: enriched.length,
    members: enriched
  });
});
router3.get(["/by-code/:code", "/code/:code"], (req, res) => {
  const code = req.params.code.trim();
  const data = db.getData();
  const member = data.members.find(
    (m) => m.memberCode.toLowerCase() === code.toLowerCase() || m.identityNumber.toLowerCase() === code.toLowerCase() || m.nisn && m.nisn.toLowerCase() === code.toLowerCase()
  );
  if (!member) {
    return res.status(404).json({ error: `Anggota dengan kode/identitas "${code}" tidak ditemukan.` });
  }
  const enriched = enrichMemberWithStats(member);
  return res.json(enriched);
});
router3.get("/:id", authMiddleware, (req, res) => {
  const member = db.getData().members.find((m) => m.id === req.params.id);
  if (!member) {
    return res.status(404).json({ error: "Anggota tidak ditemukan." });
  }
  const enriched = enrichMemberWithStats(member);
  const loanHistory = db.getData().loans.filter((l) => l.memberId === member.id);
  const fineHistory = db.getData().fines.filter((f) => f.memberId === member.id);
  return res.json({
    member: enriched,
    loanHistory,
    fineHistory
  });
});
router3.post(
  "/",
  authMiddleware,
  requireRoles("superadmin", "admin", "pustakawan"),
  (req, res) => {
    const {
      type,
      identityNumber,
      nisn,
      name,
      gender,
      classGrade,
      major,
      subject,
      position,
      entryYear,
      phone,
      email,
      address,
      photoUrl,
      notes
    } = req.body;
    if (!type || !identityNumber || !name) {
      return res.status(400).json({ error: "Tipe Anggota, Nomor Identitas (NIS/NIP), dan Nama wajib diisi." });
    }
    const data = db.getData();
    const existing = data.members.find(
      (m) => m.identityNumber.trim() === identityNumber.trim() || m.memberCode.trim() === identityNumber.trim()
    );
    if (existing) {
      return res.status(400).json({
        error: `Nomor identitas ${identityNumber} sudah terdaftar atas nama ${existing.name}.`
      });
    }
    const newMemberId = "mem-" + type.toLowerCase() + "-" + Date.now();
    const regDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const expDate = new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
    const newMember = {
      id: newMemberId,
      memberCode: identityNumber.trim(),
      type,
      identityNumber: identityNumber.trim(),
      nisn: nisn?.trim(),
      name: name.trim(),
      gender: gender || "L",
      classGrade: classGrade?.trim(),
      major: major?.trim(),
      subject: subject?.trim(),
      position: position?.trim(),
      entryYear: Number(entryYear) || (/* @__PURE__ */ new Date()).getFullYear(),
      phone: phone?.trim() || "-",
      email: email?.trim() || `${identityNumber.trim()}@sman3nganjuk.sch.id`,
      address: address?.trim() || "Nganjuk, Jawa Timur",
      photoUrl: photoUrl?.trim() || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`,
      status: "active",
      registeredDate: regDate,
      expiryDate: expDate,
      notes: notes?.trim()
    };
    data.members.unshift(newMember);
    db.saveDatabase();
    db.logActivity({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      module: "MEMBERS",
      action: "CREATE",
      recordId: newMember.id,
      recordIdentifier: newMember.memberCode,
      description: `Menambahkan anggota baru: ${newMember.name} (${newMember.type} - ${newMember.identityNumber})`,
      ipAddress: req.ip || "127.0.0.1"
    });
    return res.status(201).json({
      message: "Anggota berhasil didaftarkan.",
      member: enrichMemberWithStats(newMember)
    });
  }
);
router3.put(
  "/:id",
  authMiddleware,
  requireRoles("superadmin", "admin", "pustakawan"),
  (req, res) => {
    const data = db.getData();
    const index = data.members.findIndex((m) => m.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Anggota tidak ditemukan." });
    }
    const updated = {
      ...data.members[index],
      ...req.body,
      id: req.params.id
    };
    data.members[index] = updated;
    db.saveDatabase();
    db.logActivity({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      module: "MEMBERS",
      action: "UPDATE",
      recordId: updated.id,
      recordIdentifier: updated.memberCode,
      description: `Memperbarui data anggota: ${updated.name}`,
      ipAddress: req.ip || "127.0.0.1"
    });
    return res.json({
      message: "Data anggota berhasil diperbarui.",
      member: enrichMemberWithStats(updated)
    });
  }
);
router3.delete(
  "/:id",
  authMiddleware,
  requireRoles("superadmin", "admin"),
  (req, res) => {
    const data = db.getData();
    const member = data.members.find((m) => m.id === req.params.id);
    if (!member) {
      return res.status(404).json({ error: "Anggota tidak ditemukan." });
    }
    const hasActiveLoans = data.loans.some(
      (l) => l.memberId === member.id && (l.status === "active" || l.status === "overdue")
    );
    if (hasActiveLoans) {
      return res.status(400).json({
        error: "Tidak dapat menghapus anggota karena masih memiliki peminjaman buku yang aktif."
      });
    }
    data.members = data.members.filter((m) => m.id !== member.id);
    db.saveDatabase();
    db.logActivity({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      module: "MEMBERS",
      action: "DELETE",
      recordId: member.id,
      recordIdentifier: member.memberCode,
      description: `Menghapus anggota: ${member.name} (${member.memberCode})`,
      ipAddress: req.ip || "127.0.0.1"
    });
    return res.json({ message: "Anggota berhasil dihapus." });
  }
);
router3.patch(
  "/:id/status",
  authMiddleware,
  requireRoles("superadmin", "admin", "pustakawan"),
  (req, res) => {
    const { status, reason, classGrade } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Status wajib diisi." });
    }
    const data = db.getData();
    const member = data.members.find((m) => m.id === req.params.id);
    if (!member) {
      return res.status(404).json({ error: "Anggota tidak ditemukan." });
    }
    const oldStatus = member.status;
    member.status = status;
    if (classGrade) {
      member.classGrade = classGrade;
    }
    if (reason) {
      const dateStr = (/* @__PURE__ */ new Date()).toLocaleDateString("id-ID");
      member.notes = member.notes ? `${member.notes} | [${dateStr}] Ubah status (${oldStatus} -> ${status}): ${reason}` : `[${dateStr}] Ubah status (${oldStatus} -> ${status}): ${reason}`;
    }
    db.saveDatabase();
    db.logActivity({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      module: "MEMBERS",
      action: "UPDATE",
      recordId: member.id,
      recordIdentifier: member.memberCode,
      description: `Ubah status anggota ${member.name}: ${oldStatus} -> ${status} (${reason || "Update status"})`,
      ipAddress: req.ip || "127.0.0.1"
    });
    return res.json({
      message: `Status anggota ${member.name} berhasil diubah menjadi "${status}".`,
      member: enrichMemberWithStats(member)
    });
  }
);
router3.post(
  "/bulk-status",
  authMiddleware,
  requireRoles("superadmin", "admin", "pustakawan"),
  (req, res) => {
    const { memberIds, criteria, targetStatus, reason } = req.body;
    if (!targetStatus) {
      return res.status(400).json({ error: "Status target wajib dipilih." });
    }
    const data = db.getData();
    let targetMembers = [];
    if (Array.isArray(memberIds) && memberIds.length > 0) {
      targetMembers = data.members.filter((m) => memberIds.includes(m.id));
    } else if (criteria) {
      targetMembers = data.members.filter((m) => {
        if (criteria.type && criteria.type !== "all" && m.type.toUpperCase() !== criteria.type.toUpperCase()) {
          return false;
        }
        if (criteria.grade && criteria.grade !== "all") {
          const mGrade = getGradeLevel(m.classGrade);
          if (mGrade !== criteria.grade) return false;
        }
        if (criteria.classGrade && criteria.classGrade !== "all" && m.classGrade !== criteria.classGrade) {
          return false;
        }
        if (criteria.currentStatus && criteria.currentStatus !== "all" && m.status !== criteria.currentStatus) {
          return false;
        }
        return true;
      });
    }
    if (targetMembers.length === 0) {
      return res.status(400).json({ error: "Tidak ada data siswa/anggota yang sesuai dengan kriteria yang dipilih." });
    }
    const warnings = [];
    let updatedCount = 0;
    const dateStr = (/* @__PURE__ */ new Date()).toLocaleDateString("id-ID");
    targetMembers.forEach((member) => {
      if (targetStatus !== "active") {
        const hasActiveLoan = data.loans.some(
          (l) => l.memberId === member.id && (l.status === "active" || l.status === "overdue")
        );
        if (hasActiveLoan) {
          warnings.push(`${member.name} (${member.identityNumber}) masih memiliki peminjaman buku aktif.`);
        }
      }
      const oldStatus = member.status;
      member.status = targetStatus;
      if (reason) {
        member.notes = member.notes ? `${member.notes} | [${dateStr}] Massal (${oldStatus}->${targetStatus}): ${reason}` : `[${dateStr}] Massal (${oldStatus}->${targetStatus}): ${reason}`;
      }
      updatedCount++;
    });
    db.saveDatabase();
    db.logActivity({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      module: "MEMBERS",
      action: "UPDATE",
      description: `Ubah status massal ke "${targetStatus}" untuk ${updatedCount} anggota. Alasan: ${reason || "-"}`,
      ipAddress: req.ip || "127.0.0.1"
    });
    return res.json({
      message: `Berhasil memperbarui status ${updatedCount} anggota menjadi "${targetStatus}".`,
      count: updatedCount,
      warnings
    });
  }
);
router3.post(
  "/bulk-import",
  authMiddleware,
  requireRoles("superadmin", "admin", "pustakawan"),
  (req, res) => {
    const { members } = req.body;
    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: "Data anggota kosong atau tidak valid." });
    }
    const data = db.getData();
    let importedCount = 0;
    const errors = [];
    members.forEach((m, index) => {
      if (!m.name || !m.identityNumber) {
        errors.push(`Baris ${index + 1}: Nama dan Nomor Identitas (NIS/NIP) wajib diisi.`);
        return;
      }
      if (data.members.some((existing) => existing.identityNumber.trim() === m.identityNumber.trim())) {
        errors.push(`Baris ${index + 1}: Nomor identitas ${m.identityNumber} sudah terdaftar.`);
        return;
      }
      const type = m.type?.toUpperCase() === "GURU" ? "GURU" : m.type?.toUpperCase() === "TENDIK" ? "TENDIK" : "SISWA";
      const newMember = {
        id: "mem-imp-" + Date.now() + "-" + index,
        memberCode: m.identityNumber.trim(),
        type,
        identityNumber: m.identityNumber.trim(),
        nisn: m.nisn?.trim(),
        name: m.name.trim(),
        gender: m.gender === "P" ? "P" : "L",
        classGrade: m.classGrade?.trim(),
        major: m.major?.trim(),
        subject: m.subject?.trim(),
        position: m.position?.trim(),
        entryYear: Number(m.entryYear) || (/* @__PURE__ */ new Date()).getFullYear(),
        phone: m.phone?.trim() || "-",
        email: m.email?.trim() || `${m.identityNumber.trim()}@sman3nganjuk.sch.id`,
        address: m.address?.trim() || "Nganjuk, Jawa Timur",
        photoUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name.trim())}`,
        status: "active",
        registeredDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        expiryDate: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0]
      };
      data.members.push(newMember);
      importedCount++;
    });
    db.saveDatabase();
    db.logActivity({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      module: "MEMBERS",
      action: "IMPORT",
      description: `Import massal anggota: ${importedCount} berhasil, ${errors.length} gagal`,
      ipAddress: req.ip || "127.0.0.1"
    });
    return res.json({
      message: `Import anggota selesai. ${importedCount} data berhasil diimpor.`,
      importedCount,
      errors
    });
  }
);
var members_default = router3;

// server/routes/circulation.ts
import { Router as Router4 } from "express";
var router4 = Router4();
router4.get("/loans", authMiddleware, (req, res) => {
  db.syncOverdueLoans();
  const { status, memberId, query } = req.query;
  const data = db.getData();
  let loans = data.loans.map((l) => {
    const member = data.members.find((m) => m.id === l.memberId || m.memberCode === l.memberCode);
    return {
      ...l,
      memberPhone: l.memberPhone || member?.phone || "",
      memberEmail: l.memberEmail || member?.email || ""
    };
  });
  if (req.user?.role === "siswa") {
    const userMemberId = req.user.memberId;
    const userCode = req.user.username?.toLowerCase();
    const userName = req.user.fullName?.toLowerCase();
    loans = loans.filter(
      (l) => userMemberId && l.memberId === userMemberId || userCode && l.memberCode.toLowerCase() === userCode || userName && l.memberName.toLowerCase().includes(userName)
    );
  }
  if (status && status !== "all") {
    loans = loans.filter((l) => l.status === status);
  }
  if (memberId) {
    loans = loans.filter((l) => l.memberId === memberId);
  }
  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    loans = loans.filter(
      (l) => l.loanCode.toLowerCase().includes(q) || l.memberName.toLowerCase().includes(q) || l.memberCode.toLowerCase().includes(q) || l.items.some((item) => item.bookTitle.toLowerCase().includes(q) || item.barcode.toLowerCase().includes(q))
    );
  }
  loans.sort((a, b) => new Date(b.loanDate).getTime() - new Date(a.loanDate).getTime());
  return res.json({ total: loans.length, loans });
});
router4.post(
  "/borrow",
  authMiddleware,
  requireRoles("superadmin", "admin", "pustakawan"),
  (req, res) => {
    db.syncOverdueLoans();
    const { memberId, barcodes, notes } = req.body;
    if (!memberId) {
      return res.status(400).json({ error: "Pilih anggota peminjam." });
    }
    const barcodeList = Array.isArray(barcodes) ? barcodes : [barcodes].filter(Boolean);
    if (barcodeList.length === 0) {
      return res.status(400).json({ error: "Pindai minimal 1 buku yang akan dipinjam." });
    }
    const data = db.getData();
    const member = data.members.find(
      (m) => m.id === memberId || m.memberCode === memberId || m.identityNumber === memberId
    );
    if (!member) {
      return res.status(404).json({ error: "Data anggota tidak ditemukan." });
    }
    if (member.status !== "active") {
      return res.status(400).json({ error: `Anggota tidak dapat meminjam karena berstatus: ${member.status}.` });
    }
    const memberTypeKey = (member.type || "SISWA").toLowerCase();
    const rule = data.settings.loanRules[memberTypeKey] || {
      maxItems: 3,
      maxExtensions: 2,
      loanDurationDays: 7
    };
    const activeMemberLoans = data.loans.filter(
      (l) => (l.memberId === member.id || l.memberCode === member.memberCode) && (l.status === "active" || l.status === "overdue")
    );
    const currentBorrowedCount = activeMemberLoans.reduce((acc, l) => acc + l.items.filter((i) => !i.returnedAt).length, 0);
    if (currentBorrowedCount + barcodeList.length > rule.maxItems) {
      return res.status(400).json({
        error: `Batas kuota pinjam (${rule.maxItems} buku) terlampaui. Saat ini anggota masih meminjam ${currentBorrowedCount} buku.`
      });
    }
    const loanItems = [];
    for (const rawBarcode of barcodeList) {
      const barcode = String(rawBarcode).trim();
      const item = data.items.find((i) => i.barcode.toLowerCase() === barcode.toLowerCase());
      if (!item) {
        return res.status(404).json({ error: `Eksemplar buku dengan barcode "${barcode}" tidak ditemukan.` });
      }
      if (item.status !== "available") {
        return res.status(400).json({ error: `Eksemplar buku "${barcode}" sedang tidak tersedia (Status: ${item.status}).` });
      }
      const book = data.books.find((b) => b.id === item.bookId);
      loanItems.push({
        itemId: item.id,
        bookId: item.bookId,
        barcode: item.barcode,
        bookTitle: book?.title || "Koleksi Perpustakaan",
        author: book?.author || "",
        callNumber: book?.callNumber || "",
        coverUrl: book?.coverUrl || ""
      });
    }
    const today = /* @__PURE__ */ new Date();
    const todayStr = today.toISOString().split("T")[0];
    const dueDate = new Date(today.getTime() + rule.loanDurationDays * 24 * 60 * 60 * 1e3);
    const dueDateStr = dueDate.toISOString().split("T")[0];
    const loanCode = `PJ-${todayStr.replace(/-/g, "")}-${(data.loans.length + 1).toString().padStart(4, "0")}`;
    const newLoan = {
      id: "loan-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
      loanCode,
      memberId: member.id,
      memberCode: member.memberCode,
      memberName: member.name,
      memberType: member.type,
      memberPhone: member.phone || "",
      memberEmail: member.email || "",
      officerId: req.user.id,
      officerName: req.user.fullName,
      loanDate: todayStr,
      dueDate: dueDateStr,
      status: "active",
      extensionCount: 0,
      maxExtensions: rule.maxExtensions || 2,
      items: loanItems,
      notes: notes?.trim()
    };
    barcodeList.forEach((rawBarcode) => {
      const barcode = String(rawBarcode).trim();
      const item = data.items.find((i) => i.barcode.toLowerCase() === barcode.toLowerCase());
      if (item) {
        item.status = "borrowed";
      }
    });
    data.loans.unshift(newLoan);
    db.saveDatabase();
    db.logActivity({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      module: "LOANS",
      action: "BORROW",
      recordId: newLoan.id,
      recordIdentifier: newLoan.loanCode,
      description: `Peminjaman ${newLoan.items.length} buku oleh ${newLoan.memberName} (${newLoan.memberCode}) hingga ${dueDateStr}`,
      ipAddress: req.ip || "127.0.0.1"
    });
    return res.status(201).json({
      message: `Peminjaman ${loanCode} berhasil diproses!`,
      loan: newLoan
    });
  }
);
router4.post(
  "/bulk-loan-import",
  authMiddleware,
  requireRoles("superadmin", "admin", "pustakawan"),
  (req, res) => {
    const { loans } = req.body;
    if (!loans || !Array.isArray(loans)) {
      return res.status(400).json({ error: "Data peminjaman tidak valid." });
    }
    const data = db.getData();
    const results = {
      importedCount: 0,
      errors: []
    };
    loans.forEach((loan, index) => {
      const member = data.members.find(
        (m) => m.memberCode === loan.memberCode || m.identityNumber === loan.memberCode
      );
      if (!member || member.status !== "active") {
        results.errors.push(`Baris ${index + 1}: Anggota ${loan.memberCode} tidak ditemukan atau tidak aktif.`);
        return;
      }
      const item = data.items.find((i) => i.barcode === loan.barcode);
      if (!item || item.status !== "available") {
        results.errors.push(`Baris ${index + 1}: Buku ${loan.barcode} tidak ditemukan atau tidak tersedia.`);
        return;
      }
      const book = data.books.find((b) => b.id === item.bookId);
      if (!book || book.category !== "Buku Mata Pelajaran") {
        results.errors.push(`Baris ${index + 1}: Buku ${loan.barcode} bukan merupakan Buku Mata Pelajaran.`);
        return;
      }
      const newLoan = {
        id: "loan-" + Date.now() + index,
        loanCode: `PJ-${loan.loanDate.replace(/-/g, "")}-${(data.loans.length + results.importedCount + 1).toString().padStart(4, "0")}`,
        memberId: member.id,
        memberCode: member.memberCode,
        memberName: member.name,
        memberType: member.type,
        officerId: req.user.id,
        officerName: req.user.fullName,
        loanDate: loan.loanDate,
        dueDate: loan.dueDate,
        status: "active",
        extensionCount: 0,
        maxExtensions: 2,
        items: [{
          itemId: item.id,
          bookId: book.id,
          barcode: item.barcode,
          bookTitle: book.title,
          author: book.author,
          callNumber: book.callNumber,
          coverUrl: book.coverUrl
        }]
      };
      item.status = "borrowed";
      data.loans.unshift(newLoan);
      results.importedCount++;
    });
    db.saveDatabase();
    return res.json({
      message: `Berhasil mengimpor ${results.importedCount} data peminjaman.`,
      importedCount: results.importedCount,
      errors: results.errors
    });
  }
);
router4.post(
  ["/return", "/return-by-barcode"],
  authMiddleware,
  requireRoles("superadmin", "admin", "pustakawan"),
  (req, res) => {
    db.syncOverdueLoans();
    const { barcode, condition = "good", isDamaged = false, isLost = false, notes } = req.body;
    if (!barcode) {
      return res.status(400).json({ error: "Barcode buku wajib dipindai." });
    }
    const data = db.getData();
    const cleanBarcode = barcode.trim();
    const loan = data.loans.find(
      (l) => (l.status === "active" || l.status === "overdue") && l.items.some((item) => item.barcode.toLowerCase() === cleanBarcode.toLowerCase() && !item.returnedAt)
    );
    if (!loan) {
      return res.status(404).json({
        error: `Tidak ada transaksi peminjaman aktif untuk buku dengan barcode "${cleanBarcode}".`
      });
    }
    const loanItem = loan.items.find(
      (item) => item.barcode.toLowerCase() === cleanBarcode.toLowerCase() && !item.returnedAt
    );
    const bookItem = data.items.find((i) => i.id === loanItem.itemId);
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const returnTime = (/* @__PURE__ */ new Date()).toISOString();
    const dueDate = new Date(loan.dueDate);
    const returnDate = new Date(todayStr);
    const diffTime = returnDate.getTime() - dueDate.getTime();
    const daysLate = Math.max(0, Math.ceil(diffTime / (1e3 * 60 * 60 * 24)));
    let overdueFine = 0;
    if (daysLate > data.settings.gracePeriodDays) {
      overdueFine = daysLate * data.settings.finePerDay;
    }
    let damageFine = 0;
    let lostFine = 0;
    const itemPrice = bookItem?.price || 5e4;
    if (isDamaged || condition === "damaged") {
      damageFine = Math.round(itemPrice * data.settings.fineDamagedPercent / 100);
    }
    if (isLost) {
      lostFine = Math.round(itemPrice * data.settings.fineLostMultiplier / 100);
    }
    const totalFine = overdueFine + damageFine + lostFine;
    let createdFine = null;
    if (totalFine > 0) {
      const fineCode = `FN-${todayStr.replace(/-/g, "").slice(0, 6)}-${(data.fines.length + 1).toString().padStart(4, "0")}`;
      let reason = "Keterlambatan";
      if ((damageFine > 0 || lostFine > 0) && overdueFine > 0) reason = "Kombinasi";
      else if (damageFine > 0) reason = "Buku Rusak";
      else if (lostFine > 0) reason = "Buku Hilang";
      createdFine = {
        id: "fn-" + Date.now(),
        fineCode,
        loanId: loan.id,
        memberId: loan.memberId,
        memberName: loan.memberName,
        memberCode: loan.memberCode,
        itemId: loanItem.itemId,
        bookTitle: loanItem.bookTitle,
        barcode: loanItem.barcode,
        daysLate,
        finePerDay: data.settings.finePerDay,
        damageFine,
        lostFine,
        totalFine,
        paidAmount: 0,
        status: "unpaid",
        reason,
        officerId: req.user.id,
        officerName: req.user.fullName,
        createdAt: returnTime,
        notes: notes?.trim()
      };
      data.fines.push(createdFine);
    }
    loanItem.returnedAt = returnTime;
    loanItem.returnCondition = isDamaged ? "damaged" : condition;
    loanItem.fineAmount = totalFine;
    const allReturned = loan.items.every((i) => i.returnedAt);
    if (allReturned) {
      loan.status = "returned";
      loan.returnDate = todayStr;
    }
    if (bookItem) {
      if (isLost) {
        bookItem.status = "lost";
      } else if (isDamaged || condition === "damaged") {
        bookItem.status = "damaged";
        bookItem.condition = "damaged";
      } else {
        const pendingReservation = data.reservations.find(
          (r) => r.bookId === bookItem.bookId && r.status === "waiting"
        );
        if (pendingReservation) {
          bookItem.status = "reserved";
          pendingReservation.status = "ready";
          pendingReservation.allocatedBarcode = bookItem.barcode;
        } else {
          bookItem.status = "available";
        }
      }
    }
    db.saveDatabase();
    db.logActivity({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      module: "RETURNS",
      action: "RETURN",
      recordId: loan.id,
      recordIdentifier: loanItem.barcode,
      description: `Pengembalian buku "${loanItem.bookTitle}" (${loanItem.barcode}) oleh ${loan.memberName}. Terlambat: ${daysLate} hari. Denda: Rp ${totalFine.toLocaleString("id-ID")}`,
      ipAddress: req.ip || "127.0.0.1"
    });
    return res.json({
      message: `Buku "${loanItem.bookTitle}" berhasil dikembalikan.`,
      bookTitle: loanItem.bookTitle,
      loan,
      daysLate,
      fine: createdFine,
      allReturned
    });
  }
);
router4.post(
  "/extend/:loanId",
  authMiddleware,
  (req, res) => {
    const data = db.getData();
    const loan = data.loans.find((l) => l.id === req.params.loanId);
    if (!loan) {
      return res.status(404).json({ error: "Transaksi peminjaman tidak ditemukan." });
    }
    if (loan.status === "returned") {
      return res.status(400).json({ error: "Peminjaman sudah selesai dikembalikan." });
    }
    if (loan.extensionCount >= loan.maxExtensions) {
      return res.status(400).json({
        error: `Batas perpanjangan maksimal (${loan.maxExtensions} kali) sudah tercapai.`
      });
    }
    const memberTypeKey = loan.memberType.toLowerCase();
    const rule = data.settings.loanRules[memberTypeKey] || { loanDurationDays: 7 };
    const currentDue = new Date(loan.dueDate);
    const newDue = new Date(currentDue.getTime() + rule.loanDurationDays * 24 * 60 * 60 * 1e3);
    const newDueDateStr = newDue.toISOString().split("T")[0];
    loan.dueDate = newDueDateStr;
    loan.extensionCount += 1;
    loan.status = "active";
    db.saveDatabase();
    db.logActivity({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      module: "LOANS",
      action: "EXTEND",
      recordId: loan.id,
      recordIdentifier: loan.loanCode,
      description: `Perpanjangan peminjaman ${loan.loanCode} (ke-${loan.extensionCount}) hingga ${newDueDateStr}`,
      ipAddress: req.ip || "127.0.0.1"
    });
    return res.json({
      message: `Peminjaman berhasil diperpanjang hingga ${newDueDateStr}.`,
      loan
    });
  }
);
router4.get("/fines", authMiddleware, (req, res) => {
  const { status, memberId, query } = req.query;
  let fines = db.getData().fines;
  if (status && status !== "all") {
    fines = fines.filter((f) => f.status === status);
  }
  if (memberId) {
    fines = fines.filter((f) => f.memberId === memberId);
  }
  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    fines = fines.filter(
      (f) => f.fineCode.toLowerCase().includes(q) || f.memberName.toLowerCase().includes(q) || f.memberCode.toLowerCase().includes(q) || f.bookTitle.toLowerCase().includes(q) || f.barcode.toLowerCase().includes(q)
    );
  }
  fines.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ total: fines.length, fines });
});
router4.post(
  "/fines/:id/pay",
  authMiddleware,
  requireRoles("superadmin", "admin", "pustakawan"),
  (req, res) => {
    const { amount, action = "pay", notes } = req.body;
    const data = db.getData();
    const fine = data.fines.find((f) => f.id === req.params.id);
    if (!fine) {
      return res.status(404).json({ error: "Data denda tidak ditemukan." });
    }
    if (fine.status === "paid" || fine.status === "waived") {
      return res.status(400).json({ error: `Denda ini sudah berstatus ${fine.status.toUpperCase()}.` });
    }
    if (action === "waive") {
      fine.status = "waived";
      fine.notes = notes || "Denda dibebaskan oleh petugas perpustakaan";
      fine.paidAt = (/* @__PURE__ */ new Date()).toISOString();
      db.logActivity({
        userId: req.user.id,
        username: req.user.username,
        role: req.user.role,
        module: "FINES",
        action: "WAIVE_FINE",
        recordId: fine.id,
        recordIdentifier: fine.fineCode,
        description: `Pembebasan denda ${fine.fineCode} (${fine.memberName}) sebesar Rp ${fine.totalFine.toLocaleString("id-ID")}`,
        ipAddress: req.ip || "127.0.0.1"
      });
    } else {
      const payVal = Number(amount) || fine.totalFine - fine.paidAmount;
      fine.paidAmount += payVal;
      if (fine.paidAmount >= fine.totalFine) {
        fine.status = "paid";
        fine.paidAt = (/* @__PURE__ */ new Date()).toISOString();
      } else {
        fine.status = "partial";
      }
      fine.notes = notes || fine.notes;
      db.logActivity({
        userId: req.user.id,
        username: req.user.username,
        role: req.user.role,
        module: "FINES",
        action: "PAY_FINE",
        recordId: fine.id,
        recordIdentifier: fine.fineCode,
        description: `Pembayaran denda ${fine.fineCode} (${fine.memberName}) sejumlah Rp ${payVal.toLocaleString("id-ID")}`,
        ipAddress: req.ip || "127.0.0.1"
      });
    }
    db.saveDatabase();
    return res.json({ message: "Pembayaran denda berhasil dicatat.", fine });
  }
);
router4.get("/reservations", authMiddleware, (req, res) => {
  const { status, bookId } = req.query;
  let reservations = db.getData().reservations || [];
  if (status && status !== "all") {
    reservations = reservations.filter((r) => r.status === status);
  }
  if (bookId) {
    reservations = reservations.filter((r) => r.bookId === bookId);
  }
  if (req.user?.role === "siswa") {
    const userMemberId = req.user.memberId;
    const userCode = req.user.username?.toLowerCase();
    const userName = req.user.fullName?.toLowerCase();
    reservations = reservations.filter(
      (r) => userMemberId && r.memberId === userMemberId || userCode && r.memberCode.toLowerCase() === userCode || userName && r.memberName.toLowerCase().includes(userName)
    );
  }
  reservations.sort((a, b) => new Date(b.requestDate || b.reservationDate || 0).getTime() - new Date(a.requestDate || a.reservationDate || 0).getTime());
  return res.json({ total: reservations.length, reservations });
});
var handleCreateReservation = (req, res) => {
  const { bookId, notes } = req.body;
  let memberId = req.body.memberId;
  if (!bookId) {
    return res.status(400).json({ error: "Buku wajib dipilih." });
  }
  const data = db.getData();
  const book = data.books.find((b) => b.id === bookId);
  if (!book) {
    return res.status(404).json({ error: "Buku tidak ditemukan." });
  }
  let member = data.members.find((m) => m.id === memberId || m.memberCode === memberId);
  if (!member && req.user?.memberId) {
    member = data.members.find((m) => m.id === req.user?.memberId || m.memberCode === req.user?.memberId);
  }
  if (!member && req.user) {
    member = data.members.find(
      (m) => req.user?.email && m.email.toLowerCase() === req.user.email.toLowerCase() || req.user?.fullName && m.name.toLowerCase() === req.user.fullName.toLowerCase() || req.user?.username && m.memberCode.toLowerCase() === req.user.username.toLowerCase()
    );
  }
  if (!member && req.user) {
    const newMemberId = req.user.memberId || "mem-" + req.user.id;
    member = {
      id: newMemberId,
      memberCode: (req.user.username || "SISWA").toUpperCase(),
      type: req.user.role === "guru" ? "GURU" : "SISWA",
      identityNumber: req.user.username || "10101",
      name: req.user.fullName || req.user.name || req.user.username,
      gender: "L",
      phone: "081234567890",
      email: req.user.email || `${req.user.username}@polytechnic.astra.ac.id`,
      status: "active",
      registeredDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      notes: "Otomatis dibuat saat booking buku mandiri"
    };
    data.members.push(member);
    req.user.memberId = newMemberId;
    const uIdx = data.users.findIndex((u) => u.id === req.user.id);
    if (uIdx !== -1) {
      data.users[uIdx].memberId = newMemberId;
    }
  }
  if (!member) {
    return res.status(400).json({ error: "Data anggota pemohon reservasi tidak valid." });
  }
  const existing = data.reservations.find(
    (r) => r.bookId === book.id && r.memberId === member.id && (r.status === "pending" || r.status === "waiting" || r.status === "ready")
  );
  if (existing) {
    return res.status(400).json({ error: "Anda sudah memiliki antrean reservasi aktif untuk buku ini." });
  }
  const today = /* @__PURE__ */ new Date();
  const todayStr = today.toISOString().split("T")[0];
  const exp = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1e3);
  const expStr = exp.toISOString().split("T")[0];
  const reservationCode = `RSV-${todayStr.replace(/-/g, "")}-${(data.reservations.length + 1).toString().padStart(4, "0")}`;
  const reservation = {
    id: "res-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
    reservationCode,
    bookId: book.id,
    bookTitle: book.title,
    coverUrl: book.coverUrl,
    memberId: member.id,
    memberName: member.name,
    memberCode: member.memberCode,
    requestDate: todayStr,
    reservationDate: todayStr,
    expiryDate: expStr,
    status: "pending",
    notes: notes?.trim() || "Reservasi dibuat mandiri via OPAC"
  };
  data.reservations.unshift(reservation);
  db.saveDatabase();
  db.logActivity({
    userId: req.user?.id || "usr-guest",
    username: req.user?.username || "member",
    role: req.user?.role || "siswa",
    module: "CIRCULATION",
    action: "RESERVE",
    description: `Booking/Reservasi buku "${book.title}" (${reservationCode}) oleh ${member.name}`,
    ipAddress: req.ip || req.socket.remoteAddress || "127.0.0.1"
  });
  return res.status(201).json({
    message: `Reservasi buku "${book.title}" berhasil ditempatkan dalam antrean.`,
    reservation
  });
};
router4.post("/reservations", authMiddleware, handleCreateReservation);
router4.post("/reserve", authMiddleware, handleCreateReservation);
var handleUpdateReservationStatus = (req, res) => {
  const { status } = req.body;
  const data = db.getData();
  const resv = data.reservations.find((r) => r.id === req.params.id);
  if (!resv) {
    return res.status(404).json({ error: "Reservasi tidak ditemukan." });
  }
  const isOwner = req.user && (resv.memberId === req.user.memberId || resv.memberCode?.toLowerCase() === req.user.username?.toLowerCase() || resv.memberName?.toLowerCase() === req.user.fullName?.toLowerCase());
  const isStaff = ["superadmin", "admin", "pustakawan"].includes(req.user?.role || "");
  if (status === "cancelled") {
    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: "Anda tidak memiliki hak untuk membatalkan reservasi ini." });
    }
  } else {
    if (!isStaff) {
      return res.status(403).json({ error: "Hanya petugas perpustakaan yang dapat mengubah status reservasi ini." });
    }
  }
  resv.status = status;
  db.saveDatabase();
  db.logActivity({
    userId: req.user?.id || "usr-system",
    username: req.user?.username || "system",
    role: req.user?.role || "siswa",
    module: "CIRCULATION",
    action: "UPDATE_STATUS",
    description: `Status reservasi ${resv.reservationCode || resv.id} diubah menjadi "${status}"`,
    ipAddress: req.ip || req.socket.remoteAddress || "127.0.0.1"
  });
  return res.json({ message: "Status reservasi berhasil diperbarui.", reservation: resv });
};
router4.put("/reservations/:id/status", authMiddleware, handleUpdateReservationStatus);
router4.patch("/reservations/:id/status", authMiddleware, handleUpdateReservationStatus);
var circulation_default = router4;

// server/routes/stockOpname.ts
import { Router as Router5 } from "express";
var router5 = Router5();
function prepareSessionItems(session) {
  const data = db.getData();
  const scannedMap = new Map(session.scannedItems.map((s) => [s.barcode.toLowerCase(), s]));
  return data.items.map((item) => {
    const book = data.books.find((b) => b.id === item.bookId);
    const scanInfo = scannedMap.get(item.barcode.toLowerCase());
    const isScanned = !!scanInfo;
    return {
      id: item.id,
      barcode: item.barcode,
      bookTitle: book?.title || "Judul Tidak Ditemukan",
      author: book?.author || "-",
      callNumber: book?.callNumber || "-",
      expectedLocation: item.location,
      scannedLocation: scanInfo?.scannedLocation || item.location,
      status: scanInfo ? scanInfo.status : session.status === "completed" ? "missing" : "unscanned",
      condition: scanInfo?.condition || item.condition || "good",
      isScanned,
      scannedAt: scanInfo?.scannedAt || null,
      officer: scanInfo?.officer || null
    };
  });
}
router5.get(["/", "/sessions"], authMiddleware, (req, res) => {
  const sessions = db.getData().stockOpnames;
  sessions.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  return res.json({ total: sessions.length, sessions });
});
router5.get(["/:id", "/sessions/:id"], authMiddleware, (req, res) => {
  const session = db.getData().stockOpnames.find((s) => s.id === req.params.id);
  if (!session) {
    return res.status(404).json({ error: "Sesi Stock Opname tidak ditemukan." });
  }
  const items = prepareSessionItems(session);
  return res.json({
    session,
    items,
    totalCatalogItems: items.length
  });
});
router5.post(
  ["/", "/sessions"],
  authMiddleware,
  requireRoles("superadmin", "admin", "pustakawan"),
  (req, res) => {
    const { title, notes } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Judul Sesi Stock Opname wajib diisi." });
    }
    const data = db.getData();
    const sessionId = "so-" + Date.now();
    const sessionCode = `SO-SMAN3-${(/* @__PURE__ */ new Date()).getFullYear()}-${(data.stockOpnames.length + 1).toString().padStart(2, "0")}`;
    const totalCatalogItems = data.items.length;
    const newSession = {
      id: sessionId,
      sessionCode,
      title: title.trim(),
      startDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      status: "active",
      officerName: req.user.fullName,
      totalCatalogItems,
      scannedCount: 0,
      foundCount: 0,
      missingCount: totalCatalogItems,
      damagedCount: 0,
      misplacedCount: 0,
      notes: notes?.trim(),
      scannedItems: []
    };
    data.stockOpnames.unshift(newSession);
    db.saveDatabase();
    db.logActivity({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      module: "STOCK_OPNAME",
      action: "CREATE",
      recordId: newSession.id,
      recordIdentifier: newSession.sessionCode,
      description: `Membuka sesi Stock Opname baru: "${newSession.title}" (${totalCatalogItems} item katalog)`,
      ipAddress: req.ip || "127.0.0.1"
    });
    return res.status(201).json({ message: "Sesi Stock Opname berhasil dibuka.", session: newSession });
  }
);
router5.post(
  ["/:id/scan", "/sessions/:id/scan"],
  authMiddleware,
  requireRoles("superadmin", "admin", "pustakawan"),
  (req, res) => {
    const { barcode, currentShelfLocation, condition = "good" } = req.body;
    if (!barcode) {
      return res.status(400).json({ error: "Barcode buku wajib dipindai." });
    }
    const data = db.getData();
    const session = data.stockOpnames.find((s) => s.id === req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Sesi Stock Opname tidak ditemukan." });
    }
    if (session.status !== "active") {
      return res.status(400).json({ error: "Sesi Stock Opname ini sudah tidak aktif / telah diselesaikan." });
    }
    const cleanBarcode = barcode.trim();
    const alreadyScanned = session.scannedItems.find((s) => s.barcode.toLowerCase() === cleanBarcode.toLowerCase());
    if (alreadyScanned) {
      return res.status(400).json({
        error: `Barcode "${cleanBarcode}" sudah pernah dipindai sebelumnya pada ${new Date(alreadyScanned.scannedAt).toLocaleTimeString("id-ID")}.`
      });
    }
    const item = data.items.find((i) => i.barcode.toLowerCase() === cleanBarcode.toLowerCase());
    let bookTitle = "Buku Tidak Terdaftar";
    let expectedLocation = "-";
    let scanStatus = "unregistered";
    if (item) {
      const book = data.books.find((b) => b.id === item.bookId);
      bookTitle = book ? book.title : "Judul Tidak Ditemukan";
      expectedLocation = item.location;
      if (condition === "damaged" || item.condition === "damaged") {
        scanStatus = "damaged";
        session.damagedCount += 1;
        session.foundCount += 1;
      } else if (currentShelfLocation && currentShelfLocation.trim() !== expectedLocation.trim()) {
        scanStatus = "misplaced";
        session.misplacedCount += 1;
        session.foundCount += 1;
      } else {
        scanStatus = "matched";
        session.foundCount += 1;
      }
    }
    const scanRecord = {
      barcode: cleanBarcode,
      bookTitle,
      expectedLocation,
      scannedLocation: currentShelfLocation || expectedLocation,
      scannedAt: (/* @__PURE__ */ new Date()).toISOString(),
      officer: req.user.fullName,
      condition,
      status: scanStatus
    };
    session.scannedItems.unshift(scanRecord);
    session.scannedCount = session.scannedItems.length;
    session.missingCount = Math.max(0, session.totalCatalogItems - session.foundCount);
    db.saveDatabase();
    return res.json({
      message: `Barcode ${cleanBarcode} berhasil diverifikasi (${scanStatus}).`,
      item: {
        barcode: cleanBarcode,
        bookTitle,
        expectedLocation,
        status: scanStatus,
        condition,
        isScanned: true
      },
      scanResult: {
        barcode: cleanBarcode,
        bookTitle,
        expectedLocation,
        status: scanStatus,
        condition
      },
      session
    });
  }
);
router5.post(
  ["/:id/finalize", "/sessions/:id/finalize", "/:id/finish", "/sessions/:id/finish"],
  authMiddleware,
  requireRoles("superadmin", "admin"),
  (req, res) => {
    const data = db.getData();
    const session = data.stockOpnames.find((s) => s.id === req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Sesi Stock Opname tidak ditemukan." });
    }
    session.status = "completed";
    session.endDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    db.saveDatabase();
    db.logActivity({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      module: "STOCK_OPNAME",
      action: "UPDATE",
      recordId: session.id,
      recordIdentifier: session.sessionCode,
      description: `Menyelesaikan sesi Stock Opname ${session.sessionCode}. Ditemukan: ${session.foundCount}, Hilang/Belum discan: ${session.missingCount}`,
      ipAddress: req.ip || "127.0.0.1"
    });
    return res.json({ message: "Sesi Stock Opname berhasil diselesaikan.", session });
  }
);
var stockOpname_default = router5;

// server/routes/reports.ts
import { Router as Router6 } from "express";
var router6 = Router6();
router6.get("/dashboard-stats", (req, res) => {
  db.syncOverdueLoans();
  const data = db.getData();
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const totalTitles = data.books.length;
  const totalCopies = data.items.length;
  const totalMembers = data.members.length;
  const totalStudents = data.members.filter((m) => m.type === "SISWA").length;
  const totalTeachers = data.members.filter((m) => m.type === "GURU").length;
  const totalTendik = data.members.filter((m) => m.type === "TENDIK").length;
  const availableCopies = data.items.filter((i) => i.status === "available").length;
  const borrowedCopies = data.items.filter((i) => i.status === "borrowed").length;
  const reservedCopies = data.items.filter((i) => i.status === "reserved").length;
  const lostCopies = data.items.filter((i) => i.status === "lost").length;
  const damagedCopies = data.items.filter((i) => i.status === "damaged").length;
  const activeLoans = data.loans.filter((l) => l.status === "active" || l.status === "overdue");
  const overdueLoans = data.loans.filter((l) => l.status === "overdue");
  const loansToday = data.loans.filter((l) => l.loanDate === today).length;
  const returnsToday = data.loans.filter((l) => l.returnDate === today).length;
  const visitors = data.visitors || data.visitorLogs || [];
  const visitorsToday = visitors.filter((v) => (v.visitDate || "").startsWith(today)).length;
  const totalFinesCollected = data.fines.filter((f) => f.status === "paid" || f.status === "partial").reduce((sum, f) => sum + f.paidAmount, 0);
  const totalUnpaidFines = data.fines.filter((f) => f.status === "unpaid" || f.status === "partial").reduce((sum, f) => sum + (f.totalFine - f.paidAmount), 0);
  const categoryMap = {};
  data.books.forEach((b) => {
    categoryMap[b.category] = (categoryMap[b.category] || 0) + 1;
  });
  const categoryStats = Object.entries(categoryMap).map(([name, count]) => ({ name, count }));
  const monthlyLoans = {};
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  for (let i = 5; i >= 0; i--) {
    const d = /* @__PURE__ */ new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    monthlyLoans[key] = { month: label, peminjaman: 0, pengembalian: 0 };
  }
  data.loans.forEach((l) => {
    const loanMonth = l.loanDate.slice(0, 7);
    if (monthlyLoans[loanMonth]) {
      monthlyLoans[loanMonth].peminjaman += l.items.length;
    }
    if (l.returnDate) {
      const returnMonth = l.returnDate.slice(0, 7);
      if (monthlyLoans[returnMonth]) {
        monthlyLoans[returnMonth].pengembalian += l.items.length;
      }
    }
  });
  const bookBorrowCount = {};
  data.loans.forEach((l) => {
    l.items.forEach((item) => {
      if (!bookBorrowCount[item.bookId]) {
        bookBorrowCount[item.bookId] = {
          id: item.bookId,
          title: item.bookTitle,
          author: item.author,
          coverUrl: item.coverUrl,
          count: 0
        };
      }
      bookBorrowCount[item.bookId].count += 1;
    });
  });
  const popularBooks = Object.values(bookBorrowCount).sort((a, b) => b.count - a.count).slice(0, 10);
  const memberActivity = {};
  data.loans.forEach((l) => {
    if (!memberActivity[l.memberId]) {
      const member = data.members.find((m) => m.id === l.memberId);
      memberActivity[l.memberId] = {
        id: l.memberId,
        name: l.memberName,
        memberCode: l.memberCode,
        type: l.memberType,
        photoUrl: member?.photoUrl,
        count: 0
      };
    }
    memberActivity[l.memberId].count += l.items.length;
  });
  const activeMembers = Object.values(memberActivity).sort((a, b) => b.count - a.count).slice(0, 10);
  return res.json({
    kpis: {
      totalTitles,
      totalCopies,
      totalMembers,
      totalStudents,
      totalTeachers,
      totalTendik,
      availableCopies,
      borrowedCopies,
      reservedCopies,
      lostCopies,
      damagedCopies,
      activeLoansCount: activeLoans.length,
      overdueLoansCount: overdueLoans.length,
      loansToday,
      returnsToday,
      visitorsToday,
      totalFinesCollected,
      totalUnpaidFines
    },
    categoryStats,
    monthlyTrends: Object.values(monthlyLoans),
    popularBooks,
    activeMembers,
    recentLoans: data.loans.slice(0, 8),
    recentLogs: data.activityLogs.slice(0, 6)
  });
});
router6.get("/circulation", authMiddleware, (req, res) => {
  const { startDate, endDate, status, memberType } = req.query;
  let loans = db.getData().loans;
  if (startDate) {
    loans = loans.filter((l) => l.loanDate >= startDate);
  }
  if (endDate) {
    loans = loans.filter((l) => l.loanDate <= endDate);
  }
  if (status && status !== "all") {
    loans = loans.filter((l) => l.status === status);
  }
  if (memberType && memberType !== "all") {
    loans = loans.filter((l) => l.memberType.toUpperCase() === memberType.toUpperCase());
  }
  return res.json({
    totalRecords: loans.length,
    totalBooksBorrowed: loans.reduce((sum, l) => sum + l.items.length, 0),
    loans,
    data: loans
  });
});
router6.get("/visitors", (req, res) => {
  const { startDate, endDate, limit } = req.query;
  const data = db.getData();
  let visitors = data.visitors || data.visitorLogs || [];
  if (startDate) {
    visitors = visitors.filter((v) => v.visitDate.slice(0, 10) >= startDate);
  }
  if (endDate) {
    visitors = visitors.filter((v) => v.visitDate.slice(0, 10) <= endDate);
  }
  const parsedLimit = limit ? parseInt(limit, 10) : 100;
  const sliced = visitors.slice(0, parsedLimit);
  return res.json({
    total: visitors.length,
    visitors: sliced,
    data: sliced
  });
});
router6.post("/visitors", (req, res) => {
  const { memberCode, purpose = "Membaca & Meminjam Buku" } = req.body;
  if (!memberCode) {
    return res.status(400).json({ error: "Kode anggota / Barcode / NIS / NIP wajib diisi." });
  }
  const data = db.getData();
  const code = String(memberCode).trim().toLowerCase();
  const member = data.members.find(
    (m) => m.memberCode.toLowerCase() === code || m.identityNumber.toLowerCase() === code || m.nisn && m.nisn.toLowerCase() === code || m.name.toLowerCase() === code
  );
  if (!member) {
    return res.status(404).json({ error: `Anggota dengan identitas "${memberCode}" tidak ditemukan.` });
  }
  if (!data.visitors) {
    data.visitors = [];
  }
  const newVisitor = {
    id: "vis-" + Date.now(),
    memberId: member.id,
    memberCode: member.memberCode,
    memberName: member.name,
    memberType: member.type,
    classGrade: member.classGrade,
    visitDate: (/* @__PURE__ */ new Date()).toISOString(),
    purpose
  };
  data.visitors.unshift(newVisitor);
  db.saveDatabase();
  return res.status(201).json({
    message: `Presensi atas nama ${member.name} berhasil dicatat.`,
    visitor: newVisitor
  });
});
router6.get("/books", (req, res) => {
  const data = db.getData();
  const books = data.books.map((b) => {
    const items = data.items.filter((i) => i.bookId === b.id);
    return {
      ...b,
      totalCopies: items.length,
      availableCopies: items.filter((i) => i.status === "available").length,
      borrowedCopies: items.filter((i) => i.status === "borrowed").length,
      damagedCopies: items.filter((i) => i.status === "damaged").length,
      lostCopies: items.filter((i) => i.status === "lost").length
    };
  });
  return res.json({
    total: books.length,
    books,
    data: books
  });
});
router6.get("/fines", authMiddleware, (req, res) => {
  const { startDate, endDate, status } = req.query;
  let fines = db.getData().fines;
  if (startDate) {
    fines = fines.filter((f) => f.createdAt.slice(0, 10) >= startDate);
  }
  if (endDate) {
    fines = fines.filter((f) => f.createdAt.slice(0, 10) <= endDate);
  }
  if (status && status !== "all") {
    fines = fines.filter((f) => f.status === status);
  }
  const totalAmount = fines.reduce((sum, f) => sum + f.totalFine, 0);
  const totalPaid = fines.reduce((sum, f) => sum + f.paidAmount, 0);
  const totalPending = totalAmount - totalPaid;
  return res.json({
    totalRecords: fines.length,
    totalAmount,
    totalPaid,
    totalPending,
    fines,
    data: fines
  });
});
router6.get("/recap", (req, res) => {
  const data = db.getData();
  const totalTitles = data.books.length;
  const totalCopies = data.items.length;
  const totalMembers = data.members.length;
  const totalLoans = data.loans.length;
  const activeLoans = data.loans.filter((l) => l.status === "active" || l.status === "overdue").length;
  const recap = [
    {
      indicator: "Total Judul Buku Koleksi (Bibliografi)",
      value: totalTitles,
      unit: "Judul",
      notes: "Memenuhi standar akreditasi perpustakaan sekolah"
    },
    {
      indicator: "Total Eksemplar Fisik Tersedia",
      value: totalCopies,
      unit: "Eksemplar",
      notes: `Rasio per siswa ~ ${(totalCopies / Math.max(1, totalMembers)).toFixed(1)} buku/anggota`
    },
    {
      indicator: "Total Pemustaka Terdaftar (Siswa, Guru, Tendik)",
      value: totalMembers,
      unit: "Orang",
      notes: "Keanggotaan aktif terintegrasi NISN & NIP"
    },
    {
      indicator: "Total Transaksi Sirkulasi Peminjaman",
      value: totalLoans,
      unit: "Transaksi",
      notes: "Tercatat dalam sistem otomasi Astra Library"
    },
    {
      indicator: "Peminjaman Aktif Berjalan",
      value: activeLoans,
      unit: "Transaksi",
      notes: "Sirkulasi realtime"
    }
  ];
  return res.json({
    total: recap.length,
    data: recap
  });
});
router6.get("/stats", (req, res) => {
  const data = db.getData();
  return res.json({
    totalTitles: data.books.length,
    totalCopies: data.items.length,
    totalMembers: data.members.length,
    totalLoans: data.loans.length,
    data: []
  });
});
var reports_default = router6;

// server/routes/settings.ts
import { Router as Router7 } from "express";
import bcrypt3 from "bcryptjs";
var router7 = Router7();
router7.get("/", (req, res) => {
  return res.json(db.getData().settings);
});
router7.put(
  "/",
  authMiddleware,
  requireRoles("superadmin", "admin"),
  (req, res) => {
    const data = db.getData();
    data.settings = {
      ...data.settings,
      ...req.body
    };
    db.saveDatabase();
    db.logActivity({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      module: "SETTINGS",
      action: "UPDATE",
      description: "Memperbarui konfigurasi sistem dan parameter perpustakaan",
      ipAddress: req.ip || "127.0.0.1"
    });
    return res.json({ message: "Pengaturan perpustakaan berhasil disimpan.", settings: data.settings });
  }
);
router7.get(
  "/users",
  authMiddleware,
  requireRoles("superadmin", "admin"),
  (req, res) => {
    const data = db.getData();
    const members = data.members || [];
    const users = data.users.map(({ passwordHash: _, ...u }) => {
      const member = members.find(
        (m) => u.memberId && m.id === u.memberId || m.identityNumber === u.username || m.email && m.email.toLowerCase() === u.email.toLowerCase()
      );
      return {
        ...u,
        memberInfo: member ? {
          id: member.id,
          identityNumber: member.identityNumber,
          type: member.type,
          classGrade: member.classGrade,
          subject: member.subject,
          phone: member.phone,
          gender: member.gender,
          status: member.status
        } : void 0
      };
    });
    const studentMembers = members.filter((m) => m.type?.toUpperCase() === "SISWA");
    const existingUserIdentities = new Set(data.users.map((u) => u.username.toLowerCase()));
    const existingUserMemberIds = new Set(data.users.filter((u) => u.memberId).map((u) => u.memberId));
    const unregisteredStudents = studentMembers.filter(
      (m) => !existingUserIdentities.has(m.identityNumber.toLowerCase()) && !existingUserMemberIds.has(m.id)
    );
    return res.json({
      total: users.length,
      users,
      stats: {
        totalUsers: users.length,
        superadmins: users.filter((u) => u.role === "superadmin").length,
        admins: users.filter((u) => u.role === "admin").length,
        librarians: users.filter((u) => u.role === "pustakawan").length,
        teachers: users.filter((u) => u.role === "guru").length,
        students: users.filter((u) => u.role === "siswa").length,
        activeUsers: users.filter((u) => u.isActive !== false).length,
        totalStudentMembers: studentMembers.length,
        unregisteredStudentsCount: unregisteredStudents.length
      }
    });
  }
);
router7.get(
  "/users/students-preview",
  authMiddleware,
  requireRoles("superadmin"),
  (req, res) => {
    const data = db.getData();
    const members = data.members || [];
    const studentMembers = members.filter((m) => m.type?.toUpperCase() === "SISWA");
    const existingUserIdentities = new Set(data.users.map((u) => u.username.toLowerCase()));
    const existingUserMemberIds = new Set(data.users.filter((u) => u.memberId).map((u) => u.memberId));
    const unregisteredStudents = studentMembers.filter(
      (m) => !existingUserIdentities.has(m.identityNumber.toLowerCase()) && !existingUserMemberIds.has(m.id)
    );
    const registeredStudents = studentMembers.filter(
      (m) => existingUserIdentities.has(m.identityNumber.toLowerCase()) || existingUserMemberIds.has(m.id)
    );
    return res.json({
      totalStudents: studentMembers.length,
      unregisteredCount: unregisteredStudents.length,
      registeredCount: registeredStudents.length,
      unregisteredStudents,
      registeredStudents
    });
  }
);
router7.post(
  "/users/auto-generate-students",
  authMiddleware,
  requireRoles("superadmin"),
  (req, res) => {
    const {
      passwordType = "nis",
      // 'nis' | 'custom' | 'siswa123'
      customPassword = "",
      usernameFormat = "nis",
      // 'nis' | 'prefix_nis'
      overwriteExisting = false
    } = req.body;
    console.log("Generating student accounts, config:", { passwordType, usernameFormat, overwriteExisting });
    const data = db.getData();
    const members = data.members || [];
    const studentMembers = members.filter((m) => m.type?.toUpperCase() === "SISWA");
    console.log("Found", studentMembers.length, "students.");
    if (studentMembers.length === 0) {
      return res.status(400).json({ error: "Tidak ada data pemustaka bertipe SISWA di dalam database." });
    }
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const generatedList = [];
    for (const student of studentMembers) {
      const nis = student.identityNumber?.trim() || student.id;
      const targetUsername = usernameFormat === "prefix_nis" ? `siswa_${nis}` : nis;
      let plainPassword = "siswa123";
      if (passwordType === "nis") {
        plainPassword = nis;
      } else if (passwordType === "custom" && customPassword.trim().length >= 6) {
        plainPassword = customPassword.trim();
      }
      const existingUserIndex = data.users.findIndex(
        (u) => u.username.toLowerCase() === targetUsername.toLowerCase() || u.memberId && u.memberId === student.id
      );
      if (existingUserIndex !== -1) {
        if (overwriteExisting) {
          data.users[existingUserIndex].passwordHash = bcrypt3.hashSync(plainPassword, 10);
          data.users[existingUserIndex].fullName = student.name;
          data.users[existingUserIndex].name = student.name;
          data.users[existingUserIndex].role = "siswa";
          data.users[existingUserIndex].memberId = student.id;
          data.users[existingUserIndex].isActive = true;
          updatedCount++;
          generatedList.push({
            id: data.users[existingUserIndex].id,
            fullName: student.name,
            username: targetUsername,
            plainPassword,
            email: student.email || `${nis}@sman3nganjuk.sch.id`,
            nis,
            classGrade: student.classGrade,
            status: "updated"
          });
        } else {
          skippedCount++;
          generatedList.push({
            id: data.users[existingUserIndex].id,
            fullName: student.name,
            username: targetUsername,
            plainPassword: "*** (sudah ada)",
            email: data.users[existingUserIndex].email,
            nis,
            classGrade: student.classGrade,
            status: "skipped"
          });
        }
      } else {
        const newUserId = "usr-std-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
        const email = student.email && student.email.includes("@") ? student.email.trim().toLowerCase() : `${nis}@sman3nganjuk.sch.id`;
        const newStudentUser = {
          id: newUserId,
          username: targetUsername,
          email,
          fullName: student.name,
          name: student.name,
          role: "siswa",
          passwordHash: bcrypt3.hashSync(plainPassword, 10),
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.name)}`,
          memberId: student.id,
          isActive: true,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        data.users.push(newStudentUser);
        createdCount++;
        generatedList.push({
          id: newUserId,
          fullName: student.name,
          username: targetUsername,
          plainPassword,
          email,
          nis,
          classGrade: student.classGrade,
          status: "created"
        });
      }
    }
    try {
      db.saveDatabase();
      db.logActivity({
        userId: req.user.id,
        username: req.user.username,
        role: req.user.role,
        module: "SETTINGS",
        action: "CREATE",
        description: `Generasi otomatis akun pengguna siswa: ${createdCount} akun baru dibuat, ${updatedCount} diperbarui, ${skippedCount} dilewati`,
        ipAddress: req.ip || "127.0.0.1"
      });
    } catch (dbErr) {
      console.error("Error saving database or logging activity:", dbErr);
      return res.status(500).json({ error: `Gagal menyimpan perubahan ke database: ${dbErr instanceof Error ? dbErr.message : String(dbErr)}` });
    }
    return res.json({
      message: `Berhasil memproses pembuatan akun siswa otomatis (${createdCount} akun baru dibuat, ${updatedCount} diperbarui).`,
      stats: {
        totalStudents: studentMembers.length,
        createdCount,
        updatedCount,
        skippedCount
      },
      generatedList
    });
  }
);
router7.post(
  "/users",
  authMiddleware,
  requireRoles("superadmin"),
  (req, res) => {
    const { username, email, fullName, name, role, password, avatarUrl, memberId, isActive = true } = req.body;
    if (!username || !email || !fullName && !name || !role || !password) {
      return res.status(400).json({ error: "Seluruh kolom wajib diisi." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password minimal terdiri dari 6 karakter." });
    }
    const data = db.getData();
    if (data.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({ error: `Username "${username}" sudah digunakan.` });
    }
    if (data.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: `Email "${email}" sudah digunakan.` });
    }
    const finalName = (fullName || name || "").trim();
    const newUser = {
      id: "usr-" + Date.now(),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      fullName: finalName,
      name: finalName,
      role,
      passwordHash: bcrypt3.hashSync(password, 10),
      avatarUrl: avatarUrl?.trim() || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(finalName)}`,
      memberId: memberId || void 0,
      isActive: Boolean(isActive),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    data.users.push(newUser);
    db.saveDatabase();
    db.logActivity({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      module: "SETTINGS",
      action: "CREATE",
      recordId: newUser.id,
      recordIdentifier: newUser.username,
      description: `Membuat akun pengguna baru: ${newUser.fullName} (${newUser.role})`,
      ipAddress: req.ip || "127.0.0.1"
    });
    const { passwordHash: _, ...safeUser } = newUser;
    return res.status(201).json({ message: "Pengguna baru berhasil ditambahkan.", user: safeUser });
  }
);
router7.put(
  "/users/:id",
  authMiddleware,
  requireRoles("superadmin"),
  (req, res) => {
    const data = db.getData();
    const userIndex = data.users.findIndex((u) => u.id === req.params.id);
    if (userIndex === -1) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan." });
    }
    const user = data.users[userIndex];
    const { fullName, name, username, email, role, isActive, memberId, avatarUrl } = req.body;
    if (username && username.trim().toLowerCase() !== user.username.toLowerCase()) {
      const exists = data.users.some((u) => u.id !== user.id && u.username.toLowerCase() === username.trim().toLowerCase());
      if (exists) {
        return res.status(400).json({ error: `Username "${username}" sudah digunakan oleh akun lain.` });
      }
      user.username = username.trim();
    }
    if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const exists = data.users.some((u) => u.id !== user.id && u.email.toLowerCase() === email.trim().toLowerCase());
      if (exists) {
        return res.status(400).json({ error: `Email "${email}" sudah digunakan oleh akun lain.` });
      }
      user.email = email.trim().toLowerCase();
    }
    if (fullName !== void 0 || name !== void 0) {
      const newName = (fullName || name || "").trim();
      user.fullName = newName;
      user.name = newName;
    }
    if (role !== void 0 && role !== user.role) {
      if (user.role === "superadmin" && role !== "superadmin") {
        const superadminCount = data.users.filter((u) => u.role === "superadmin" && u.isActive).length;
        if (superadminCount <= 1) {
          return res.status(400).json({ error: "Tidak dapat mengubah role: Minimal harus ada 1 Superadmin aktif di dalam sistem." });
        }
      }
      user.role = role;
    }
    if (isActive !== void 0) {
      if (user.id === req.user.id && !isActive) {
        return res.status(400).json({ error: "Anda tidak dapat menonaktifkan akun Superadmin Anda sendiri yang sedang aktif." });
      }
      user.isActive = Boolean(isActive);
    }
    if (memberId !== void 0) {
      user.memberId = memberId ? String(memberId) : void 0;
    }
    if (avatarUrl !== void 0) {
      user.avatarUrl = avatarUrl.trim();
    }
    db.saveDatabase();
    db.logActivity({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      module: "SETTINGS",
      action: "UPDATE",
      recordId: user.id,
      recordIdentifier: user.username,
      description: `Memperbarui profil akun pengguna: ${user.fullName} (${user.role})`,
      ipAddress: req.ip || "127.0.0.1"
    });
    const { passwordHash: _, ...safeUser } = user;
    return res.json({ message: "Data pengguna berhasil diperbarui.", user: safeUser });
  }
);
router7.post(
  "/users/:id/reset-password",
  authMiddleware,
  requireRoles("superadmin"),
  (req, res) => {
    const data = db.getData();
    const user = data.users.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan." });
    }
    const { newPassword, passwordType = "custom" } = req.body;
    let finalPassword = "";
    if (newPassword && newPassword.trim().length >= 6) {
      finalPassword = newPassword.trim();
    } else if (passwordType === "nis" && user.memberId) {
      const member = data.members.find((m) => m.id === user.memberId);
      finalPassword = member?.identityNumber || user.username;
    } else if (passwordType === "role_default") {
      finalPassword = user.role === "siswa" ? "siswa123" : user.role === "guru" ? "guru123" : "admin123";
    } else if (passwordType === "random") {
      finalPassword = "WP-" + Math.random().toString(36).substring(2, 8).toUpperCase() + "!";
    } else {
      finalPassword = "password123";
    }
    user.passwordHash = bcrypt3.hashSync(finalPassword, 10);
    db.saveDatabase();
    db.logActivity({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      module: "SETTINGS",
      action: "UPDATE",
      recordId: user.id,
      recordIdentifier: user.username,
      description: `Mereset password pengguna: ${user.fullName} (@${user.username})`,
      ipAddress: req.ip || "127.0.0.1"
    });
    const { passwordHash: _, ...safeUser } = user;
    return res.json({
      message: `Password pengguna @${user.username} berhasil direset.`,
      newPassword: finalPassword,
      user: safeUser
    });
  }
);
router7.post(
  "/users/:id/toggle-status",
  authMiddleware,
  requireRoles("superadmin"),
  (req, res) => {
    const data = db.getData();
    const user = data.users.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan." });
    }
    if (user.id === req.user.id) {
      return res.status(400).json({ error: "Anda tidak dapat menonaktifkan akun Superadmin Anda sendiri yang sedang aktif." });
    }
    user.isActive = !user.isActive;
    db.saveDatabase();
    db.logActivity({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      module: "SETTINGS",
      action: "UPDATE",
      recordId: user.id,
      recordIdentifier: user.username,
      description: `Mengubah status akun pengguna ${user.fullName} menjadi ${user.isActive ? "AKTIF" : "NONAKTIF"}`,
      ipAddress: req.ip || "127.0.0.1"
    });
    const { passwordHash: _, ...safeUser } = user;
    return res.json({
      message: `Status akun @${user.username} berhasil diubah menjadi ${user.isActive ? "Aktif" : "Nonaktif"}.`,
      user: safeUser
    });
  }
);
router7.delete(
  "/users/:id",
  authMiddleware,
  requireRoles("superadmin"),
  (req, res) => {
    const data = db.getData();
    const user = data.users.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan." });
    }
    if (user.id === req.user.id) {
      return res.status(400).json({ error: "Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif." });
    }
    if (user.role === "superadmin") {
      const superadminCount = data.users.filter((u) => u.role === "superadmin").length;
      if (superadminCount <= 1) {
        return res.status(400).json({ error: "Tidak dapat menghapus: Minimal harus ada 1 akun Superadmin tersisa di sistem." });
      }
    }
    data.users = data.users.filter((u) => u.id !== user.id);
    db.saveDatabase();
    db.logActivity({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      module: "SETTINGS",
      action: "DELETE",
      recordId: user.id,
      recordIdentifier: user.username,
      description: `Menghapus akun pengguna: ${user.fullName} (@${user.username})`,
      ipAddress: req.ip || "127.0.0.1"
    });
    return res.json({ message: `Pengguna ${user.fullName} (@${user.username}) berhasil dihapus.` });
  }
);
router7.get(
  ["/logs", "/activity-logs"],
  authMiddleware,
  (req, res) => {
    const { module, action, query } = req.query;
    let logs = db.getData().activityLogs;
    if (module && module !== "all") {
      logs = logs.filter((l) => l.module === module);
    }
    if (action && action !== "all") {
      logs = logs.filter((l) => l.action === action);
    }
    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      logs = logs.filter(
        (l) => l.description.toLowerCase().includes(q) || l.username.toLowerCase().includes(q) || l.recordIdentifier && l.recordIdentifier.toLowerCase().includes(q)
      );
    }
    return res.json({ total: logs.length, logs });
  }
);
router7.get(
  ["/backup", "/backups/download"],
  authMiddleware,
  requireRoles("superadmin", "admin"),
  (req, res) => {
    const data = db.getData();
    return res.json(data);
  }
);
router7.post(
  "/gas-sync",
  authMiddleware,
  async (req, res) => {
    try {
      const data = db.getData();
      const settings = data.settings;
      const gasUrl = req.body.gasWebAppUrl || settings.gasWebAppUrl;
      if (!gasUrl) {
        return res.status(400).json({
          error: "URL Web App Google Apps Script belum diisi. Silakan masukkan URL Web App yang telah disebarkan (deploy)."
        });
      }
      const payload = {
        action: "SYNC_ALL",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        spreadsheetId: settings.googleSpreadsheetId || "1VlKdmIhyMOIQtdgGu5SebRy4wP216THGt9dMPuQfyOA",
        driveFolderId: settings.googleDriveFolderId || "1KpUK7yn2CZeTQGKAjdvQWdC662dkOna3",
        data: {
          books: data.books.map((b) => ({
            ID: b.id,
            ISBN: b.isbn || "-",
            Judul: b.title,
            Pengarang: b.author,
            Penerbit: b.publisher,
            Tahun: b.publishYear,
            Kategori: b.category,
            No_Panggil: b.callNumber,
            Total_Eksemplar: b.totalCopies || 0,
            Tersedia: b.availableCopies || 0
          })),
          members: data.members.map((m) => ({
            ID: m.id,
            Kode_Anggota: m.memberCode,
            Nama: m.name,
            Tipe: m.type,
            NIS_NIP: m.identityNumber,
            Kelas: m.classGrade || "-",
            Status: m.status,
            Email: m.email
          })),
          loans: data.loans.map((l) => ({
            Kode_Pinjam: l.loanCode,
            Member: l.memberName,
            Member_Code: l.memberCode,
            Tgl_Pinjam: l.loanDate,
            Tgl_Jatuh_Tempo: l.dueDate,
            Tgl_Kembali: l.returnDate || "-",
            Status: l.status,
            Jumlah_Buku: l.items.length
          })),
          fines: data.fines.map((f) => ({
            ID: f.id,
            Kode_Denda: f.fineCode || f.id,
            Anggota: f.memberName,
            Buku: f.bookTitle,
            Total_Denda: f.totalFine,
            Dibayar: f.paidAmount,
            Status: f.status
          })),
          visitors: data.visitors?.map((v) => ({
            ID: v.id,
            Nama: v.memberName,
            Kode: v.memberCode,
            Tipe: v.memberType,
            Tgl_Kunjung: v.visitDate,
            Tujuan: v.purpose
          })) || []
        }
      };
      const response = await fetch(gasUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const resultText = await response.text();
      let resultJson;
      try {
        resultJson = JSON.parse(resultText);
      } catch (e) {
        resultJson = { raw: resultText };
      }
      return res.json({
        message: "Sinkronisasi ke Google Spreadsheet & Drive berhasil dikirim.",
        status: response.status,
        result: resultJson
      });
    } catch (err) {
      return res.status(500).json({ error: "Gagal melakukan sinkronisasi: " + err.message });
    }
  }
);
router7.post(
  ["/restore", "/backups/restore"],
  authMiddleware,
  requireRoles("superadmin", "admin"),
  (req, res) => {
    const databaseContent = req.body.data || req.body.databaseContent || req.body;
    if (!databaseContent || !databaseContent.books || !databaseContent.users) {
      return res.status(400).json({ error: "File data backup tidak valid atau struktur tidak cocok." });
    }
    db.saveDatabase(databaseContent);
    db.logActivity({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      module: "BACKUP",
      action: "BACKUP_RESTORE",
      description: "Melakukan pemulihan (Restore) penuh database sistem dari file cadangan",
      ipAddress: req.ip || "127.0.0.1"
    });
    return res.json({ message: "Database berhasil dipulihkan dari cadangan." });
  }
);
router7.get(
  "/backups",
  authMiddleware,
  requireRoles("superadmin", "admin"),
  (req, res) => {
    const backups = db.getData().backups;
    return res.json({ total: backups.length, backups });
  }
);
router7.post(
  "/backups",
  authMiddleware,
  requireRoles("superadmin", "admin"),
  (req, res) => {
    const { notes } = req.body;
    const data = db.getData();
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const filename = `backup_sman3nganjuk_${timestamp}.json`;
    const jsonString = JSON.stringify(data, null, 2);
    const fileSizeKb = Math.round(Buffer.byteLength(jsonString, "utf8") / 1024) || 1;
    const backup = {
      id: "bak-" + Date.now(),
      filename,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      createdBy: req.user.fullName,
      fileSizeKb,
      itemCount: data.items.length,
      status: "success",
      notes: notes || "Backup database sistem"
    };
    data.backups.unshift(backup);
    db.saveDatabase();
    db.logActivity({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      module: "BACKUP",
      action: "BACKUP_CREATE",
      recordId: backup.id,
      recordIdentifier: backup.filename,
      description: `Membuat file snapshot backup database (${backup.fileSizeKb} KB)`,
      ipAddress: req.ip || "127.0.0.1"
    });
    return res.status(201).json({ message: "Backup database berhasil dibuat.", backup });
  }
);
router7.get("/master", (req, res) => {
  const data = db.getData();
  const categoryNames = data.categories.map((c) => typeof c === "string" ? c : c.name);
  const locationNames = data.locations.map((l) => typeof l === "string" ? l : l.name);
  return res.json({
    categories: categoryNames,
    categoryDetails: data.categories,
    locations: locationNames,
    locationDetails: data.locations,
    publishers: data.publishers,
    authors: data.authors,
    serials: data.serials
  });
});
router7.post(
  "/master",
  authMiddleware,
  requireRoles("superadmin", "admin", "pustakawan"),
  (req, res) => {
    const { categories, locations } = req.body;
    const data = db.getData();
    if (Array.isArray(categories)) {
      data.categories = categories.map((c, index) => {
        if (typeof c === "object" && c !== null) return c;
        const name = String(c);
        const existing = data.categories.find((item) => typeof item === "object" ? item.name === name : item === name);
        if (existing && typeof existing === "object") return existing;
        return {
          id: `cat-${index + 1}-${Date.now()}`,
          code: String(index * 100).padStart(3, "0"),
          name,
          ddcRange: `${index * 100} - ${index * 100 + 99}`
        };
      });
    }
    if (Array.isArray(locations)) {
      data.locations = locations.map((l, index) => {
        if (typeof l === "object" && l !== null) return l;
        const name = String(l);
        const existing = data.locations.find((item) => typeof item === "object" ? item.name === name : item === name);
        if (existing && typeof existing === "object") return existing;
        return {
          id: `loc-${index + 1}-${Date.now()}`,
          code: `RAK-${index + 1}`,
          name,
          room: "Ruang Koleksi Utama",
          shelf: `Lantai 1, Baris ${index + 1}`,
          capacity: 150
        };
      });
    }
    db.saveDatabase();
    db.logActivity({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      module: "SETTINGS",
      action: "UPDATE",
      description: "Memperbarui master data kategori dan rak perpustakaan",
      ipAddress: req.ip || "127.0.0.1"
    });
    const categoryNames = data.categories.map((c) => typeof c === "string" ? c : c.name);
    const locationNames = data.locations.map((l) => typeof l === "string" ? l : l.name);
    return res.json({
      message: "Master data berhasil diperbarui.",
      categories: categoryNames,
      locations: locationNames
    });
  }
);
router7.post(
  "/reset-database",
  authMiddleware,
  requireRoles("superadmin"),
  (req, res) => {
    const internalData = db.getData();
    internalData.books = [];
    internalData.items = [];
    internalData.loans = [];
    internalData.fines = [];
    internalData.members = [];
    internalData.activityLogs = [];
    internalData.reservations = [];
    internalData.stockOpnames = [];
    internalData.serials = [];
    internalData.backups = [];
    db.saveDatabase();
    db.logActivity({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      module: "SETTINGS",
      action: "RESET_DATABASE",
      description: "Menghapus seluruh data perpustakaan (buku, anggota, peminjaman, denda, log).",
      ipAddress: req.ip || "127.0.0.1"
    });
    return res.json({ message: "Database perpustakaan berhasil direset." });
  }
);
var settings_default = router7;

// server/routes/ai.ts
import { Router as Router8 } from "express";
import { GoogleGenAI } from "@google/genai";
var router8 = Router8();
var aiClient = null;
function getGenAI() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}
router8.post("/recommend", async (req, res) => {
  const { interest, role = "siswa", topic = "" } = req.body;
  const books = db.getData().books;
  const catalogSummary = books.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    category: b.category,
    subject: b.subject,
    synopsis: b.description
  }));
  const ai = getGenAI();
  if (!ai) {
    const query = (interest || topic || "fiksi").toLowerCase();
    const matched = books.filter(
      (b) => b.title.toLowerCase().includes(query) || (b.category || "").toLowerCase().includes(query) || (b.subject || "").toLowerCase().includes(query) || (b.author || "").toLowerCase().includes(query) || (b.description || "").toLowerCase().includes(query)
    );
    const selected = matched.length > 0 ? matched.slice(0, 3) : books.slice(0, 3);
    return res.json({
      recommendations: selected.map((b) => ({
        bookId: b.id,
        title: b.title,
        author: b.author,
        coverUrl: b.coverUrl,
        reason: `Buku ini sangat relevan untuk ${role} yang tertarik mendalami topik "${interest || topic}". Mengembangkan wawasan literasi dan pemahaman kontekstual.`
      })),
      aiPowered: false
    });
  }
  try {
    const prompt = `Anda adalah Asisten Pustakawan AI Cerdas untuk Perpustakaan Politeknik Astra bernama "Astra Library".
Berikut adalah sebagian katalog buku yang tersedia di perpustakaan:
${JSON.stringify(catalogSummary, null, 2)}

Pengguna (${role}) memiliki minat baca / topik belajar: "${interest || topic || "Teknik, Vokasi, dan Sains Terapan"}".

Tolong pilihkan 3 buku terbaik dari katalog di atas dan berikan alasan inspiratif mengapa buku tersebut sangat direkomendasikan untuk mahasiswa/dosen Politeknik Astra.
Berikan respons HANYA dalam format JSON valid berupa array objek:
[
  {
    "bookId": "string (sesuai id buku)",
    "title": "string",
    "author": "string",
    "reason": "string alasan singkat 1-2 kalimat dalam bahasa Indonesia formal dan inspiratif"
  }
]`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    const text = response.text || "[]";
    const parsed = JSON.parse(text);
    const enriched = parsed.map((item) => {
      const original = books.find((b) => b.id === item.bookId || b.title.toLowerCase() === item.title?.toLowerCase());
      return {
        ...item,
        bookId: original?.id || item.bookId,
        coverUrl: original?.coverUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80"
      };
    });
    return res.json({
      recommendations: enriched,
      aiPowered: true
    });
  } catch (error) {
    console.error("Gemini AI recommendation error:", error);
    const selected = books.slice(0, 3);
    return res.json({
      recommendations: selected.map((b) => ({
        bookId: b.id,
        title: b.title,
        author: b.author,
        coverUrl: b.coverUrl,
        reason: `Rekomendasi buku unggulan literasi Politeknik Astra untuk memperluas cakrawala berpikir.`
      })),
      aiPowered: false
    });
  }
});
router8.post(
  "/catalog-helper",
  authMiddleware,
  async (req, res) => {
    const { title, author, subject } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Judul buku wajib diisi." });
    }
    const ai = getGenAI();
    if (!ai) {
      return res.json({
        classificationCode: "813",
        callNumber: `813 ${author ? author.slice(0, 3).toUpperCase() : "NN"} ${title[0]?.toLowerCase()}`,
        category: "Kesusastraan & Fiksi",
        description: `Buku "${title}" karya ${author || "Penulis"} merupakan referensi literasi yang bermanfaat untuk mahasiswa dan dosen di perpustakaan Politeknik Astra.`,
        subject: subject || "Karya Sastra, Pendidikan",
        aiPowered: false
      });
    }
    try {
      const prompt = `Anda adalah Ahli Bibliografi & Klasifikasi Perpustakaan (Dewey Decimal Classification - DDC).
Bantu pustakawan mengisi metadata buku berikut:
Judul: "${title}"
Penulis: "${author || "-"}"
Topik/Subjek Awal: "${subject || "-"}"

Tolong hasilkan:
1. classificationCode: Kode DDC 3 digit (contoh: 510 untuk Matematika, 813 untuk Fiksi Indonesia, 530 untuk Fisika, 158 untuk Self-Improvement, dll.)
2. category: Salah satu dari ["Karya Umum & Komputer", "Filsafat & Psikologi", "Agama", "Ilmu Sosial & Pendidikan", "Bahasa & Linguistik", "Sains & Matematika", "Teknologi & Ilmu Terapan", "Seni, Musik & Olahraga", "Kesusastraan & Fiksi", "Sejarah & Geografi", "Buku Teks Pelajaran", "Referensi & Ensiklopedia"]
3. subject: Daftar kata kunci subjek yang tepat (dipisah koma)
4. description: Sinopsis ringkas profesional dan edukatif 2-3 kalimat dalam bahasa Indonesia.

Hasilkan HANYA JSON valid:
{
  "classificationCode": "string",
  "category": "string",
  "subject": "string",
  "description": "string"
}`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const parsed = JSON.parse(response.text || "{}");
      const authorCode = author ? author.trim().slice(0, 3).toUpperCase() : "NN";
      const titleCode = title.trim()[0]?.toLowerCase() || "a";
      const callNumber = `${parsed.classificationCode || "000"} ${authorCode} ${titleCode}`;
      return res.json({
        ...parsed,
        callNumber,
        aiPowered: true
      });
    } catch (error) {
      console.error("Gemini catalog helper error:", error);
      return res.json({
        classificationCode: "813",
        callNumber: `813 ${author ? author.slice(0, 3).toUpperCase() : "NN"} ${title[0]?.toLowerCase()}`,
        category: "Kesusastraan & Fiksi",
        description: `Buku "${title}" karya ${author || "Penulis"} merupakan referensi literasi untuk Politeknik Astra.`,
        subject: subject || "Pendidikan, Karya Sastra",
        aiPowered: false
      });
    }
  }
);
var ai_default = router8;

// server/api.ts
dotenv2.config();
var app = express();
var isDbReady = false;
var dbInitPromise = null;
async function ensureDbInit() {
  if (isDbReady) return;
  if (!dbInitPromise) {
    dbInitPromise = db.init().then(() => {
      isDbReady = true;
    }).catch((err) => {
      console.error("[API] Database init error:", err);
      isDbReady = true;
    });
  }
  return dbInitPromise;
}
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(async (req, res, next) => {
  await ensureDbInit();
  next();
});
app.use("/api/auth", auth_default);
app.use("/api/books", books_default);
app.use("/api/members", members_default);
app.use("/api/circulation", circulation_default);
app.use("/api/stock-opname", stockOpname_default);
app.use("/api/reports", reports_default);
app.use("/api/settings", settings_default);
app.use("/api/ai", ai_default);
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Astra Library System - Politeknik Astra",
    version: "1.0.0",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
var api_default = app;
export {
  api_default as default
};
