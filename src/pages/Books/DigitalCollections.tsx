import React, { useState, useEffect } from 'react';
import { Book, Download, ExternalLink, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const DigitalCollections: React.FC = () => {
  const [digitalBooks, setDigitalBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchDigitalBooks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/books/digital', {
        headers: { Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}` }
      });
      if (res.ok) {
        const json = await res.json();
        setDigitalBooks(json.books || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDigitalBooks();
  }, []);

  const filteredBooks = digitalBooks.filter(book => 
    book.title.toLowerCase().includes(search.toLowerCase()) ||
    book.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Book className="w-6 h-6 text-indigo-600" />
            Koleksi E-Book & Referensi Digital
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Akses materi bacaan digital secara langsung.
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari judul atau pengarang e-book..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
        />
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Memuat koleksi digital...</div>
      ) : filteredBooks.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400">Tidak ada koleksi digital tersedia.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBooks.map((book) => (
            <div key={book.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col gap-3">
              <img src={book.coverUrl} alt={book.title} className="w-full h-48 object-cover rounded-xl" />
              <div className="flex-1 space-y-1">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{book.title}</h4>
                <p className="text-xs text-slate-500">{book.author}</p>
              </div>
              <a
                href={book.digitalFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                <Download className="w-4 h-4" />
                Baca / Unduh
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
