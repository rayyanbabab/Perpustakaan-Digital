import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { db } from '../db';
import { authMiddleware, AuthenticatedRequest } from '../auth';

const router = Router();

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// POST /api/ai/recommend - AI Smart Book Recommendations for students & teachers
router.post('/recommend', async (req: Request, res: Response) => {
  const { interest, role = 'siswa', topic = '' } = req.body;
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
    // Smart fallback recommendation based on keyword matching
    const query = (interest || topic || 'fiksi').toLowerCase();
    const matched = books.filter(
      (b) =>
        b.title.toLowerCase().includes(query) ||
        (b.category || '').toLowerCase().includes(query) ||
        (b.subject || '').toLowerCase().includes(query) ||
        (b.author || '').toLowerCase().includes(query) ||
        (b.description || '').toLowerCase().includes(query)
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

Pengguna (${role}) memiliki minat baca / topik belajar: "${interest || topic || 'Teknik, Vokasi, dan Sains Terapan'}".

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
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '[]';
    const parsed = JSON.parse(text);

    // Enrich with coverUrl
    const enriched = parsed.map((item: any) => {
      const original = books.find((b) => b.id === item.bookId || b.title.toLowerCase() === item.title?.toLowerCase());
      return {
        ...item,
        bookId: original?.id || item.bookId,
        coverUrl: original?.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80'
      };
    });

    return res.json({
      recommendations: enriched,
      aiPowered: true
    });
  } catch (error) {
    console.error('Gemini AI recommendation error:', error);
    // Fallback
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

// POST /api/ai/catalog-helper - Smart Cataloging helper (suggests DDC, Call number & synopsis for librarians)
router.post(
  '/catalog-helper',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    const { title, author, subject } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Judul buku wajib diisi.' });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.json({
        classificationCode: '813',
        callNumber: `813 ${author ? author.slice(0, 3).toUpperCase() : 'NN'} ${title[0]?.toLowerCase()}`,
        category: 'Kesusastraan & Fiksi',
        description: `Buku "${title}" karya ${author || 'Penulis'} merupakan referensi literasi yang bermanfaat untuk mahasiswa dan dosen di perpustakaan Politeknik Astra.`,
        subject: subject || 'Karya Sastra, Pendidikan',
        aiPowered: false
      });
    }

    try {
      const prompt = `Anda adalah Ahli Bibliografi & Klasifikasi Perpustakaan (Dewey Decimal Classification - DDC).
Bantu pustakawan mengisi metadata buku berikut:
Judul: "${title}"
Penulis: "${author || '-'}"
Topik/Subjek Awal: "${subject || '-'}"

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
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      const authorCode = author ? author.trim().slice(0, 3).toUpperCase() : 'NN';
      const titleCode = title.trim()[0]?.toLowerCase() || 'a';
      const callNumber = `${parsed.classificationCode || '000'} ${authorCode} ${titleCode}`;

      return res.json({
        ...parsed,
        callNumber,
        aiPowered: true
      });
    } catch (error) {
      console.error('Gemini catalog helper error:', error);
      return res.json({
        classificationCode: '813',
        callNumber: `813 ${author ? author.slice(0, 3).toUpperCase() : 'NN'} ${title[0]?.toLowerCase()}`,
        category: 'Kesusastraan & Fiksi',
        description: `Buku "${title}" karya ${author || 'Penulis'} merupakan referensi literasi untuk Politeknik Astra.`,
        subject: subject || 'Pendidikan, Karya Sastra',
        aiPowered: false
      });
    }
  }
);

export default router;
