export interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
  fullName?: string;
  role: 'superadmin' | 'admin' | 'pustakawan' | 'kepala_sekolah' | 'guru' | 'siswa' | string;
  password?: string;
  passwordHash?: string;
  avatarUrl?: string;
  memberId?: string;
  isActive?: boolean;
  createdAt?: string;
  lastLogin?: string;
}

export interface SystemSettings {
  schoolName: string;
  address: string;
  phone: string;
  email: string;
  headmasterName?: string;
  headmasterNip?: string;
  headOfLibrary: string;
  headOfLibraryNip?: string;
  loanQuotaSiswa?: number;
  loanQuotaGuru?: number;
  loanDurationDaysSiswa?: number;
  loanDurationDaysGuru?: number;
  finePerDay: number;
  maxExtensionsAllowed?: number;
  receiptFooterMessage?: string;
  // SLiMS style extended settings
  libraryName?: string;
  shortName?: string;
  city?: string;
  postalCode?: string;
  province?: string;
  website?: string;
  tagline?: string;
  headmaster?: string;
  gracePeriodDays?: number;
  fineDamagedPercent?: number;
  fineLostMultiplier?: number;
  loanRules?: {
    siswa: { maxItems: number; loanDurationDays: number; maxExtensions: number };
    guru: { maxItems: number; loanDurationDays: number; maxExtensions: number };
    tendik: { maxItems: number; loanDurationDays: number; maxExtensions: number };
  };
  enableSelfReservation?: boolean;
  enableAiAssistant?: boolean;
  themeColor?: string;
  // Google Apps Script & Google Sheets / Drive Integration
  gasWebAppUrl?: string;
  googleSpreadsheetUrl?: string;
  googleSpreadsheetId?: string;
  googleDriveFolderUrl?: string;
  googleDriveFolderId?: string;
  enableGoogleSheetsSync?: boolean;
  autoSyncIntervalMinutes?: number;
}

export type LibrarySettings = SystemSettings;

export interface Book {
  id: string;
  isbn?: string;
  title: string;
  subtitle?: string;
  author: string;
  editor?: string;
  publisher: string;
  publishYear: number;
  publishCity?: string;
  edition?: string;
  language?: string;
  category: string;
  subject?: string;
  classificationCode: string; // DDC e.g. 510, 813
  callNumber: string; // e.g. 510 MAR m
  description?: string;
  pages?: number;
  dimension?: string;
  source: string;
  location?: string;
  defaultLocation?: string;
  coverUrl: string;
  digitalFileUrl?: string;
  isOpacVisible?: boolean;
  totalCopies?: number;
  availableCopies?: number;
  copiesCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type ItemStatus = 'available' | 'borrowed' | 'reserved' | 'lost' | 'damaged' | 'maintenance';
export type ItemCondition = 'good' | 'fair' | 'damaged';

export interface BookItem {
  id: string;
  bookId: string;
  barcode: string; // e.g. WPL-000001
  inventoryNumber: string; // e.g. INV/2024/001
  location: string; // e.g. Rak B-01 (Kesusastraan)
  status: ItemStatus;
  condition?: ItemCondition;
  entryDate?: string;
  source?: string;
  price?: number;
  notes?: string;
}

export type MemberType = 'SISWA' | 'GURU' | 'TENDIK';
export type MemberStatus = 'active' | 'inactive' | 'graduated' | 'transferred' | 'suspended' | 'expired';

export interface Member {
  id: string;
  memberCode: string; // e.g. SMAN3-S-2024-001 or NIS/NIP
  type: MemberType;
  identityNumber: string; // NIS for Siswa, NIP for Guru
  nisn?: string;
  name: string;
  gender: 'L' | 'P';
  classGrade?: string;
  major?: string;
  subject?: string;
  position?: string;
  entryYear?: number;
  phone: string;
  email: string;
  address?: string;
  photoUrl?: string;
  status: MemberStatus;
  registeredDate?: string;
  expiryDate?: string;
  notes?: string;
}

export type LoanStatus = 'active' | 'returned' | 'overdue';

export interface LoanItem {
  itemId: string;
  bookId: string;
  barcode: string;
  bookTitle: string;
  author?: string;
  callNumber?: string;
  coverUrl?: string;
  returnedAt?: string;
  returnCondition?: ItemCondition;
  fineAmount?: number;
  finePaid?: boolean;
}

export interface Loan {
  id: string;
  loanCode: string; // e.g. PJ-202608-0001
  memberId: string;
  memberCode: string;
  memberName: string;
  memberType: MemberType;
  memberPhone?: string;
  memberEmail?: string;
  officerId?: string;
  officerName?: string;
  loanDate: string;
  dueDate: string;
  returnDate?: string;
  status: LoanStatus;
  extensionCount: number;
  maxExtensions?: number;
  items: LoanItem[];
  notes?: string;
}

export type FineStatus = 'unpaid' | 'partial' | 'paid' | 'waived';

export interface Fine {
  id: string;
  fineCode: string;
  loanId?: string;
  memberId: string;
  memberName: string;
  memberCode: string;
  itemId?: string;
  bookTitle: string;
  barcode: string;
  daysLate: number;
  finePerDay?: number;
  damageFine?: number;
  lostFine?: number;
  totalFine: number;
  paidAmount: number;
  status: FineStatus;
  reason: string;
  officerId?: string;
  officerName?: string;
  createdAt: string;
  paidAt?: string;
  paymentMethod?: string;
  notes?: string;
}

export type ReservationStatus = 'pending' | 'waiting' | 'requested' | 'ready' | 'completed' | 'collected' | 'cancelled' | 'expired';

export interface Reservation {
  id: string;
  reservationCode?: string;
  bookId: string;
  bookTitle: string;
  coverUrl?: string;
  memberId: string;
  memberName: string;
  memberCode: string;
  requestDate?: string;
  reservationDate?: string;
  expiryDate?: string;
  readyDate?: string;
  status: ReservationStatus;
  allocatedBarcode?: string;
  notes?: string;
}

export interface ScannedStockItem {
  barcode: string;
  bookTitle: string;
  expectedLocation: string;
  scannedLocation: string;
  scannedAt: string;
  officer: string;
  condition: ItemCondition | string;
  status: 'matched' | 'misplaced' | 'unregistered' | 'damaged' | string;
}

export interface StockOpnameItem {
  id: string;
  itemId: string;
  barcode: string;
  bookTitle: string;
  callNumber: string;
  location: string;
  isScanned: boolean;
  scannedAt?: string;
  condition?: string;
}

export interface StockOpnameSession {
  id: string;
  sessionCode?: string;
  title: string;
  startDate: string;
  endDate?: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  createdByName?: string;
  officerName?: string;
  totalItems?: number;
  missingItems?: number;
  totalCatalogItems?: number;
  scannedCount?: number;
  foundCount?: number;
  missingCount?: number;
  damagedCount?: number;
  misplacedCount?: number;
  notes?: string;
  items?: StockOpnameItem[];
  scannedItems?: ScannedStockItem[];
  scannedItemList?: ScannedStockItem[];
}

export interface VisitorLog {
  id: string;
  memberId?: string;
  memberCode?: string;
  memberName: string;
  memberType?: string;
  classGrade?: string;
  institution?: string;
  visitDate: string;
  purpose: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName?: string;
  username?: string;
  role: string;
  module: string;
  action: string;
  details?: string;
  description?: string;
  recordId?: string;
  recordIdentifier?: string;
  ipAddress?: string;
}

export interface SerialPublication {
  id: string;
  title: string;
  type: 'Majalah' | 'Jurnal' | 'Koran' | 'Buletin' | 'Terbitan Berkala' | string;
  issn?: string;
  publisher: string;
  frequency: string;
  editionNumber: string;
  publishDate: string;
  location: string;
  totalCopies: number;
  availableCopies: number;
  coverUrl?: string;
  digitalPdfUrl?: string;
  notes?: string;
}

export interface DatabaseBackup {
  id: string;
  filename: string;
  createdAt: string;
  createdBy: string;
  fileSizeKb: number;
  itemCount: number;
  status: 'success' | 'failed';
  notes?: string;
}

export interface MasterCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  ddcRange?: string;
}

export interface MasterLocation {
  id: string;
  code: string;
  name: string;
  room: string;
  shelf: string;
  capacity?: number;
}

export interface MasterPublisher {
  id: string;
  name: string;
  city: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface MasterAuthor {
  id: string;
  name: string;
  type: 'Personal' | 'Organisasi' | 'Konferensi';
  nationality?: string;
}
