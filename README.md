# SPK Kue Basah - Sistem Pendukung Keputusan

Sistem Pendukung Keputusan (SPK) untuk menentukan prioritas produksi kue basah menggunakan metode **SMART (Simple Multi-Attribute Rating Technique)**.

## 🎯 Fitur Utama

- **Dashboard Prioritas Produksi** - Menampilkan peringkat produk berdasarkan skor SMART
- **Manajemen Produk** - CRUD untuk data master produk kue
- **Rekap Harian** - Input data produksi dan penjualan harian
- **Pengaturan Kriteria** - Konfigurasi bobot kriteria SMART

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router, Server Actions)
- **Database:** NeonDB (Serverless PostgreSQL)
- **ORM:** Prisma ORM
- **Styling:** Tailwind CSS + Shadcn UI
- **Language:** TypeScript

## 📊 Metode SMART

### Kriteria Penilaian:
| Kode | Kriteria | Tipe | Deskripsi |
|------|----------|------|-----------|
| C1 | Margin Keuntungan | BENEFIT | Harga Jual - HPP |
| C2 | Rata-rata Penjualan | BENEFIT | Rata-rata penjualan 30 hari |
| C3 | Daya Tahan | BENEFIT | Lama produk bertahan (jam) |
| C4 | Tingkat Kesulitan | COST | Tingkat kesulitan pembuatan (1-5) |

### Formula Normalisasi:
- **BENEFIT:** (Nilai - Min) / (Max - Min)
- **COST:** (Max - Nilai) / (Max - Min)

### Rekomendasi:
- 🟢 **Skor > 0.8:** Tingkatkan Stok
- 🔵 **Skor 0.4 - 0.8:** Pertahankan
- 🔴 **Skor < 0.4:** Kurangi/Hentikan

## 🚀 Cara Memulai

### 1. Setup Database NeonDB

1. Buat akun di [NeonDB](https://console.neon.tech/)
2. Buat project baru dan salin connection string
3. Buat file `.env` berdasarkan `.env.example`:

```bash
cp .env.example .env
```

4. Isi `DATABASE_URL` dengan connection string dari NeonDB

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database Schema

```bash
npx prisma db push
```

### 4. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 📁 Struktur Folder

```
src/
├── app/
│   ├── actions.ts          # Server Actions
│   ├── page.tsx            # Dashboard
│   ├── daily-recap/        # Halaman Rekap Harian
│   ├── products/           # Halaman Manajemen Produk
│   └── settings/           # Halaman Pengaturan
├── components/
│   ├── ui/                 # Komponen Shadcn UI
│   └── ...                 # Komponen custom
├── lib/
│   ├── db.ts               # Prisma Client
│   ├── smart-calculation.ts # Logika SMART
│   └── utils.ts            # Utility functions
└── prisma/
    └── schema.prisma       # Database Schema
```

## 📝 Database Schema

- **users** - Data pengguna (admin/owner)
- **products** - Data master produk kue
- **daily_stocks** - Log transaksi harian
- **criteria** - Konfigurasi kriteria SMART
- **smart_results** - Riwayat hasil perhitungan

## 🔧 Development

### Generate Prisma Client

```bash
npx prisma generate
```

### Push Schema ke Database

```bash
npx prisma db push
```

### Buka Prisma Studio

```bash
npx prisma studio
```

## 📄 License

MIT License
