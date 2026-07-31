-- =============================================================================
-- UJIAN TEKNIS DATA ANALYST — PT KOSMETIKA KLINIK INDONESIA
-- BAGIAN 1: SQL DAN ANALISIS DATA (PROFILING, PERFORMA, CUSTOMER, PRODUK/DOCTOR, CABANG)
-- Kandidat: Al Fitra Nur Ramadhani
-- Periode Data: Oktober - Desember 2022 (Q4 2022) | Cabang: 1 - 4
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A. PROFILING DATA & DUPLICATE / NULL / INTEGRITY / DOUBLE COUNTING CHECKS
-- -----------------------------------------------------------------------------

-- 1. Total Volume Data Per Tabel (Pengecekan Jumlah Data)
SELECT 'branches' AS table_name, COUNT(*) AS total_rows FROM candidate_source.branches
UNION ALL
SELECT 'doctors', COUNT(*) FROM candidate_source.doctors
UNION ALL
SELECT 'patient_transaction_sequence', COUNT(*) FROM candidate_source.patient_transaction_sequence
UNION ALL
SELECT 'patients_anonymized', COUNT(*) FROM candidate_source.patients_anonymized
UNION ALL
SELECT 'source_patients', COUNT(*) FROM candidate_source.source_patients
UNION ALL
SELECT 'transactions', COUNT(*) FROM candidate_source.transactions
UNION ALL
SELECT 'treatment_details', COUNT(*) FROM candidate_source.treatment_details
UNION ALL
SELECT 'product_details', COUNT(*) FROM candidate_source.product_details
UNION ALL
SELECT 'payment_details', COUNT(*) FROM candidate_source.payment_details;

-- 2. Analisis Data Kosong (NULL) pada source_patients
SELECT 
    COUNT(*) AS total_patients,
    SUM(CASE WHEN legacy_rm_code IS NULL OR TRIM(legacy_rm_code) = '' THEN 1 ELSE 0 END) AS null_rm_code,
    ROUND(SUM(CASE WHEN legacy_rm_code IS NULL OR TRIM(legacy_rm_code) = '' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS pct_null_rm,
    SUM(CASE WHEN legacy_phone IS NULL OR TRIM(legacy_phone) = '' THEN 1 ELSE 0 END) AS null_phone,
    ROUND(SUM(CASE WHEN legacy_phone IS NULL OR TRIM(legacy_phone) = '' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS pct_null_phone,
    SUM(CASE WHEN legacy_birth_date IS NULL THEN 1 ELSE 0 END) AS null_dob,
    ROUND(SUM(CASE WHEN legacy_birth_date IS NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS pct_null_dob,
    SUM(CASE WHEN legacy_birth_date = '1970-01-01' THEN 1 ELSE 0 END) AS placeholder_dob_1970,
    ROUND(SUM(CASE WHEN legacy_birth_date = '1970-01-01' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS pct_placeholder_dob
FROM candidate_source.source_patients;

-- 3. Analisis Duplikasi RM Code dan Nomor Telepon pada source_patients
SELECT legacy_rm_code, COUNT(*) AS duplicate_count
FROM candidate_source.source_patients
WHERE legacy_rm_code IS NOT NULL AND TRIM(legacy_rm_code) != ''
GROUP BY legacy_rm_code
HAVING COUNT(*) > 1;

SELECT legacy_phone, COUNT(*) AS duplicate_count
FROM candidate_source.source_patients
WHERE legacy_phone IS NOT NULL AND TRIM(legacy_phone) != ''
GROUP BY legacy_phone
HAVING COUNT(*) > 1;

-- 4. Pengecekan Transaksi Tanpa Pasien (Non Member) dan Transaksi Tanpa Dokter (OTC / Product Only)
SELECT 
    'Transaksi Tanpa Patient Key (Non Member)' AS check_type,
    COUNT(*) AS total_transactions,
    SUM(CASE WHEN is_non_member = 1 THEN 1 ELSE 0 END) AS valid_non_member_flag,
    SUM(header_total_amount) AS impact_revenue
FROM candidate_source.transactions
WHERE patient_key IS NULL OR TRIM(patient_key) = ''
UNION ALL
SELECT 
    'Transaksi Tanpa Dokter (Product Only Kasir)',
    COUNT(*),
    SUM(CASE WHEN tipe_transaksi = 1 THEN 1 ELSE 0 END),
    SUM(header_total_amount)
FROM candidate_source.transactions
WHERE doctor_id IS NULL OR TRIM(doctor_id) = '';

-- 5. Pengecekan Detail Tanpa Header (Orphan Item Details)
SELECT 'Orphan Treatment Details' AS check_type, COUNT(*) AS orphan_count
FROM candidate_source.treatment_details
WHERE transaction_key NOT IN (SELECT transaction_key FROM candidate_source.transactions)
UNION ALL
SELECT 'Orphan Product Details', COUNT(*)
FROM candidate_source.product_details
WHERE transaction_key NOT IN (SELECT transaction_key FROM candidate_source.transactions);

-- 6. Analisis Double Counting (Header Revenue vs Sum Item Details vs Naive Join)
SELECT 
    'Header Only Total Revenue' AS metric_type,
    SUM(header_total_amount) AS total_revenue
FROM candidate_source.transactions
WHERE jenis_transaksi != 4 
  AND transaction_date BETWEEN '2022-10-01' AND '2022-12-31'
UNION ALL
SELECT 
    'Sum of Treatment Details + Product Details' AS metric_type,
    (
        SELECT COALESCE(SUM(item_final_amount), 0) FROM candidate_source.treatment_details WHERE jenis_transaksi != 4 AND transaction_date BETWEEN '2022-10-01' AND '2022-12-31'
    ) + (
        SELECT COALESCE(SUM(item_final_amount), 0) FROM candidate_source.product_details WHERE jenis_transaksi != 4 AND transaction_date BETWEEN '2022-10-01' AND '2022-12-31'
    ) AS total_revenue
UNION ALL
SELECT 
    'Naive Join Header with Treatment Details (INFLATED DUE TO DOUBLE COUNTING)' AS metric_type,
    SUM(t.header_total_amount)
FROM candidate_source.transactions t
JOIN candidate_source.treatment_details td ON t.transaction_key = td.transaction_key
WHERE t.jenis_transaksi != 4 
  AND t.transaction_date BETWEEN '2022-10-01' AND '2022-12-31';


-- -----------------------------------------------------------------------------
-- B. ANALISIS PERFORMA BISNIS (REVENUE, INVOICE, PASIEN, ATV, MOM GROWTH, KONTRIBUSI)
-- -----------------------------------------------------------------------------
WITH monthly_branch_perf AS (
    SELECT 
        DATE_FORMAT(t.transaction_date, '%Y-%m') AS period_month,
        t.branch_id,
        b.branch_name,
        COUNT(DISTINCT t.transaction_key) AS total_invoices,
        COUNT(DISTINCT CASE WHEN t.patient_key IS NOT NULL AND t.patient_key != '' THEN t.patient_key END) AS unique_patients,
        SUM(t.header_total_amount) AS total_revenue,
        AVG(t.header_total_amount) AS average_transaction_value
    FROM candidate_source.transactions t
    JOIN candidate_source.branches b ON t.branch_id = b.branch_id
    WHERE t.jenis_transaksi != 4 
      AND t.transaction_date BETWEEN '2022-10-01' AND '2022-12-31'
    GROUP BY DATE_FORMAT(t.transaction_date, '%Y-%m'), t.branch_id, b.branch_name
),
monthly_totals AS (
    SELECT period_month, SUM(total_revenue) AS month_total_revenue
    FROM monthly_branch_perf
    GROUP BY period_month
)
SELECT 
    p.period_month,
    p.branch_id,
    p.branch_name,
    p.total_revenue,
    p.total_invoices,
    p.unique_patients,
    ROUND(p.average_transaction_value, 2) AS atv,
    ROUND((p.total_revenue - LAG(p.total_revenue) OVER (PARTITION BY p.branch_id ORDER BY p.period_month)) * 100.0 / LAG(p.total_revenue) OVER (PARTITION BY p.branch_id ORDER BY p.period_month), 2) AS mom_growth_pct,
    ROUND((p.total_revenue * 100.0 / m.month_total_revenue), 2) AS branch_contribution_pct
FROM monthly_branch_perf p
JOIN monthly_totals m ON p.period_month = m.period_month
ORDER BY p.period_month ASC, p.branch_id ASC;


-- -----------------------------------------------------------------------------
-- C. ANALISIS CUSTOMER (SEGMENTASI: NEW, REPEAT, REACTIVATED, NON MEMBER)
-- -----------------------------------------------------------------------------
WITH customer_segmented_tx AS (
    SELECT 
        t.transaction_key,
        DATE_FORMAT(t.transaction_date, '%Y-%m') AS period_month,
        t.branch_id,
        b.branch_name,
        t.patient_key,
        t.header_total_amount AS revenue,
        CASE 
            WHEN t.is_non_member = 1 THEN 'Non Member'
            WHEN pts.lifetime_transaction_number = 1 THEN 'New Customer'
            WHEN pts.days_from_previous_transaction <= 90 THEN 'Repeat Customer'
            WHEN pts.days_from_previous_transaction > 90 THEN 'Reactivated Customer'
            ELSE 'Repeat Customer'
        END AS customer_segment
    FROM candidate_source.transactions t
    JOIN candidate_source.branches b ON t.branch_id = b.branch_id
    LEFT JOIN candidate_source.patient_transaction_sequence pts ON t.transaction_key = pts.transaction_key
    WHERE t.jenis_transaksi != 4 
      AND t.transaction_date BETWEEN '2022-10-01' AND '2022-12-31'
)
SELECT 
    period_month,
    branch_id,
    branch_name,
    customer_segment,
    COUNT(DISTINCT CASE WHEN patient_key IS NOT NULL AND patient_key != '' THEN patient_key ELSE transaction_key END) AS customer_count,
    COUNT(DISTINCT transaction_key) AS invoice_count,
    SUM(revenue) AS total_revenue,
    ROUND(AVG(revenue), 2) AS atv
FROM customer_segmented_tx
GROUP BY period_month, branch_id, branch_name, customer_segment
ORDER BY period_month ASC, branch_id ASC, customer_segment ASC;


-- -----------------------------------------------------------------------------
-- D. ANALISIS PRODUK, TREATMENT, DOKTER, DAN KOMPOSISI TRANSAKSI
-- -----------------------------------------------------------------------------

-- 1. Top 10 Treatment Berdasarkan Total Revenue
SELECT 
    treatment_name,
    COUNT(*) AS transaction_item_count,
    SUM(quantity) AS total_quantity,
    SUM(item_final_amount) AS total_revenue
FROM candidate_source.treatment_details
WHERE jenis_transaksi != 4 
  AND transaction_date BETWEEN '2022-10-01' AND '2022-12-31'
GROUP BY treatment_name
ORDER BY total_revenue DESC
LIMIT 10;

-- 2. Top 10 Produk Berdasarkan Total Revenue
SELECT 
    product_name,
    SUM(quantity) AS total_quantity,
    SUM(item_final_amount) AS total_revenue
FROM candidate_source.product_details
WHERE jenis_transaksi != 4 
  AND transaction_date BETWEEN '2022-10-01' AND '2022-12-31'
GROUP BY product_name
ORDER BY total_revenue DESC
LIMIT 10;

-- 3. Performa Dokter Berdasarkan Transaksi & Revenue
SELECT 
    d.doctor_id,
    d.doctor_alias,
    b.branch_name AS primary_branch,
    COUNT(DISTINCT t.transaction_key) AS total_transactions,
    SUM(t.header_total_amount) AS total_revenue,
    ROUND(AVG(t.header_total_amount), 2) AS atv_per_doctor
FROM candidate_source.transactions t
JOIN candidate_source.doctors d ON t.doctor_id = d.doctor_id
JOIN candidate_source.branches b ON d.primary_branch_id = b.branch_id
WHERE t.jenis_transaksi != 4 
  AND t.transaction_date BETWEEN '2022-10-01' AND '2022-12-31'
GROUP BY d.doctor_id, d.doctor_alias, b.branch_name
ORDER BY total_revenue DESC;

-- 4. Komposisi Tipe Transaksi (Product Only, Treatment Only, Mixed)
SELECT 
    CASE tipe_transaksi
        WHEN 1 THEN 'Product Only (Obat)'
        WHEN 2 THEN 'Treatment Only'
        WHEN 3 THEN 'Mixed (Campuran)'
        ELSE 'Other'
    END AS tipe_transaksi_label,
    COUNT(*) AS total_invoices,
    SUM(header_total_amount) AS total_revenue,
    ROUND(AVG(header_total_amount), 2) AS atv,
    ROUND(SUM(header_total_amount) * 100.0 / (
        SELECT SUM(header_total_amount) FROM candidate_source.transactions WHERE jenis_transaksi != 4 AND transaction_date BETWEEN '2022-10-01' AND '2022-12-31'
    ), 2) AS revenue_contribution_pct
FROM candidate_source.transactions
WHERE jenis_transaksi != 4 
  AND transaction_date BETWEEN '2022-10-01' AND '2022-12-31'
GROUP BY tipe_transaksi
ORDER BY total_revenue DESC;


-- -----------------------------------------------------------------------------
-- E. ANALISIS CABANG PRIORITAS (DEEP DIVE SIDOARJO VS CABANG LAIN)
-- -----------------------------------------------------------------------------
SELECT 
    b.branch_name,
    COUNT(DISTINCT t.transaction_key) AS total_invoices,
    COUNT(DISTINCT t.patient_key) AS unique_patients,
    SUM(t.header_total_amount) AS total_revenue,
    ROUND(AVG(t.header_total_amount), 2) AS atv,
    ROUND(SUM(CASE WHEN t.tipe_transaksi = 3 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS mixed_tx_pct
FROM candidate_source.transactions t
JOIN candidate_source.branches b ON t.branch_id = b.branch_id
WHERE t.jenis_transaksi != 4 
  AND t.transaction_date BETWEEN '2022-10-01' AND '2022-12-31'
GROUP BY b.branch_name
ORDER BY total_revenue DESC;
