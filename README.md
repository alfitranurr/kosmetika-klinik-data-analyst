# Ujian Teknis Data Analyst — PT Kosmetika Klinik Indonesia

**Kandidat:** Al Fitra Nur Ramadhani  
**Posisi:** Data Analyst  
**Periode Data:** Q4 2022 (Oktober – Desember 2022) | Cabang 1 – 4  
**Target Deliverables:** Interactive Web Dashboard & Patient Data Migration  

---

## 📁 Struktur Berkas Deliverables

Seluruh berkas hasil pengerjaan ujian teknis ini tersusun secara rapi di dalam folder `Al_Fitra_Nur_Ramadhani/`:

```
Al_Fitra_Nur_Ramadhani/
├── 01_profiling_and_analysis.sql   # SQL Profiling, Performa Bisnis, Segmentasi, Produk/Treatment/Dokter, & Analisis Cabang
├── 02_patient_migration.sql        # Script SQL Stored Procedure Migrasi Pasien (Idempotent, Normalisasi, Logging & Konflik)
├── 03_migration_validation.sql     # SQL Validasi, Audit Rekonsiliasi, & Uji Idempotensi
├── dashboard/                      # Web Dashboard Interaktif (React + Tailwind + Recharts)
│   ├── package.json
│   ├── src/
│   │   ├── App.jsx                 # UI Dashboard Interaktif
│   │   ├── data/clinicData.json    # Dataset Q4 2022 Parsed Real Metrics
│   │   └── ...
│   └── dist/                       # Production Web Bundle
├── executive_summary.pdf           # Executive Summary PDF (Maksimal 2 Halaman, Desain Komersial & Profesional)
└── README.md                       # Dokumentasi Hasil Analisis & Petunjuk Eksekusi SQL
```

---

## 📊 1. Ringkasan Performa Bisnis Q4 2022

Pada kuartal ke-4 tahun 2022 (Oktober - Desember 2022), PT Kosmetika Klinik Indonesia membukukan total revenue bersih non-deposit sebesar **Rp 24,33 Miliar** dari **50.856 invoice** dan **21.993 pasien unik**, dengan *Average Transaction Value* (ATV) rata-rata **Rp 478.488**.

### Tabel Ringkasan Performa Bulanan & Cabang

| Bulan | Cabang | Total Revenue (IDR) | Total Invoice | Pasien Unik | ATV (IDR) | MoM Growth | Kontribusi Cabang |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **2022-10** | MALANG | Rp 1.706.668.000 | 3.753 | 2.301 | Rp 454.748 | - | 21,08% |
| **2022-10** | SURABAYA | Rp 3.115.397.000 | 5.795 | 3.881 | Rp 537.601 | - | 38,48% |
| **2022-10** | BANDUNG | Rp 2.185.006.000 | 4.836 | 3.594 | Rp 451.821 | - | 26,99% |
| **2022-10** | SIDOARJO | Rp 1.088.803.000 | 2.884 | 1.822 | Rp 377.532 | - | 13,45% |
| **2022-11** | MALANG | Rp 1.689.014.000 | 3.530 | 2.271 | Rp 478.474 | -1.03% | 21,86% |
| **2022-11** | SURABAYA | Rp 2.755.729.000 | 5.469 | 3.614 | Rp 503.882 | -11.54% | 35,67% |
| **2022-11** | BANDUNG | Rp 2.110.099.000 | 4.493 | 3.372 | Rp 469.642 | -3.43% | 27,31% |
| **2022-11** | SIDOARJO | Rp 1.170.662.000 | 2.562 | 1.645 | Rp 456.933 | +7.52% | 15,15% |
| **2022-12** | MALANG | Rp 1.783.965.000 | 3.779 | 2.495 | Rp 472.073 | +5.62% | 20,96% |
| **2022-12** | SURABAYA | Rp 3.064.978.000 | 5.789 | 3.880 | Rp 529.449 | +11.22% | 36,01% |
| **2022-12** | BANDUNG | Rp 2.315.223.000 | 4.952 | 3.591 | Rp 467.533 | +9.72% | 27,20% |
| **2022-12** | SIDOARJO | Rp 1.348.460.000 | 3.014 | 1.901 | Rp 447.399 | +15.19% | 15,84% |
| **TOTAL** | **Q4 2022** | **Rp 24.334.004.520** | **50.856** | **21.993** | **Rp 478.488** | **+10.18% (Dec)** | **100,00%** |

---

## 👥 2. Segmentasi Customer & Performa Kategori

| Kategori Customer | Total Invoice | Pasien Unik | Total Revenue (IDR) | ATV (IDR) | Kontribusi Revenue |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Repeat Customer** | 31.044 | 15.047 | Rp 16.146.520.000 | Rp 520.117 | **66.35%** |
| **Reactivated Customer** | 5.156 | 5.156 | Rp 3.195.877.000 | Rp 619.836 | **13.13%** |
| **New Customer** | 4.176 | 4.176 | Rp 3.131.604.000 | Rp 749.905 | **12.87%** |
| **Non Member** | 10.480 | - | Rp 1.860.009.000 | Rp 177.482 | **7.64%** |

---

## 💉 3. Top 5 Treatment & Produk Hero

### Top 5 Treatment
1. **SKIN BOOSTER 3 IN 1 1CC:** Rp 609.935.000 (385 transaksi)
2. **PICO CLEAR MELASMA:** Rp 573.730.000 (402 transaksi)
3. **PERFECT WHITE PEELING:** Rp 556.357.000 (1.431 transaksi)
4. **BABY SKIN:** Rp 460.200.000 (244 transaksi)
5. **PROFHILO KING BOOSTER:** Rp 382.149.000 (64 transaksi)

### Top 5 Produk
1. **WHITENING SUN CREAM 3:** Rp 1.614.575.000 (12.948 unit)
2. **SUPER CLEAN FACIAL WASH:** Rp 1.124.883.000 (19.167 unit)
3. **WHITENING NIGHT PREMIUM 1:** Rp 1.098.076.000 (8.136 unit)
4. **WHITENING SUN CREAM 4:** Rp 983.625.000 (7.896 unit)
5. **WHITENING MELASMA PREMIUM:** Rp 886.410.000 (6.571 unit)

---

## 💡 4. 5 Insight Bisnis Utama & 3 Action Plan Prioritas

### 5 Insight Bisnis berbasis Angka Konkret
1. **Konsentrasi Revenue:** Surabaya & Bandung menyumbang **63.88% (Rp 15.54 M)** revenue Q4.
2. **Loyalitas Pasien Lama:** Repeat Customer menjadi fondasi bisnis utama (**66.35% revenue, Rp 16.15 M**).
3. **Peluang High ATV Pasien Baru:** Pasien Baru mencatatkan ATV tertinggi **Rp 749.905** (+42% di atas ATV rata-rata).
4. **Kekuatan Paket Mixed:** Transaksi Campuran (Treatment + Skincare) menghasilkan ATV **Rp 1.432.772** (5x Product Only).
5. **Potensi Konversi Non-Member:** Terdapat **10.480 invoice Non Member (20.6%)** dengan ATV terendah (Rp 177rb).

### 3 Priority Action Plan
1. **Revitalisasi Cabang Sidoarjo:** Promo bundling Treatment Hero + Pelatihan Cross-selling staf (Target: ATV naik ke Rp 480rb, PIC: Branch Manager & Head of Medical).
2. **Pendaftaran Member Instan:** Program voucher 10% next visit di kasir untuk konversi Non Member (Target: +4.000 Member Terdaftar, PIC: CRM Lead).
3. **SOP Upselling Mixed Package:** Wajib rekomendasi skincare pasca-treatment oleh dokter (Target: Porsi transaksi Mixed naik dari 14% ke 25%, PIC: Commercial Lead).

---

## 🔄 5. Rekonsiliasi & Validasi Migrasi Data Pasien

- **Total Source Patients:** 21.993 pasien legacy.
- **Total Migrated Target Patients:** 21.993 pasien ter-migrasi (**100% Success Rate**).
- **Traceability:** 21.993 baris terpetakan 1-to-1 di `patient_legacy_mappings`.
- **Log Konflik Terkelola (640 Konflik):**
  - `DOB_PLACEHOLDER_1970`: 501 baris (dikonversi ke NULL).
  - `EMPTY_RM_CODE`: 105 baris (dibuatkan fallback `RM-LEGACY-[ID]`).
  - `DUPLICATE_RM_CODE`: 34 baris (diberi suffix `-DUP-[ID]`).
- **Idempotensi:** Uji re-run script `sp_migrate_patient_data()` tidak menambah duplikasi data pada target.

---

## 🛠️ 6. TUTORIAL STEP-BY-STEP EKSEKUSI FILE SQL

1. **Persiapan Database:**
   Pastikan Anda memiliki akses ke MySQL/MariaDB Server. Buat 2 database:
   ```sql
   CREATE DATABASE candidate_source;
   CREATE DATABASE candidate_target;
   ```
2. **Import Data Dump:**
   ```bash
   mysql -u root -p candidate_source < 01_candidate_source_Q4_2022_toko_1_4.sql
   mysql -u root -p candidate_target < 02_candidate_target_migration.sql
   ```
3. **Menjalankan Query Profiling & Analisis:**
   Eksekusi `Al_Fitra_Nur_Ramadhani/01_profiling_and_analysis.sql` di MySQL Workbench / DBeaver untuk melihat seluruh tabel analisis performa Q4.
4. **Menjalankan Migrasi Data Pasien:**
   Eksekusi `Al_Fitra_Nur_Ramadhani/02_patient_migration.sql` untuk membuat dan memanggil Stored Procedure `sp_migrate_patient_data()`.
5. **Menjalankan Validasi & Rekonsiliasi:**
   Eksekusi `Al_Fitra_Nur_Ramadhani/03_migration_validation.sql` untuk mengecek audit migrasi & memastikan status 100% SUCCESS.

---

*Disusun secara teliti & profesional oleh **Al Fitra Nur Ramadhani**.*
