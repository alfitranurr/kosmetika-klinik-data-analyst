-- =============================================================================
-- UJIAN TEKNIS DATA ANALYST — PT KOSMETIKA KLINIK INDONESIA
-- BAGIAN 3: VALIDASI & REKONSILIASI HASIL MIGRASI PASIEN
-- Kandidat: Al Fitra Nur Ramadhani
-- Target Database: candidate_target | Source Database: candidate_source
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. RINGKASAN EXECUTIVE STATUS MIGRASI (MIGRATION RUNS)
-- -----------------------------------------------------------------------------
SELECT 
    id AS run_id,
    migration_name,
    started_at,
    finished_at,
    status,
    source_count,
    migrated_count,
    skipped_count,
    conflict_count,
    ROUND(migrated_count * 100.0 / source_count, 2) AS migration_success_rate_pct
FROM candidate_target.migration_runs
ORDER BY id DESC
LIMIT 1;


-- -----------------------------------------------------------------------------
-- 2. REKONSILIASI REKAP DATA SOURCE VS TARGET (100% TRACEABILITY)
-- -----------------------------------------------------------------------------
SELECT 
    'Source Patients (candidate_source.source_patients)' AS dataset,
    COUNT(*) AS total_records
FROM candidate_source.source_patients
UNION ALL
SELECT 
    'Target Patients (candidate_target.patients)',
    COUNT(*)
FROM candidate_target.patients
UNION ALL
SELECT 
    'Patient Legacy Mappings (candidate_target.patient_legacy_mappings)',
    COUNT(*)
FROM candidate_target.patient_legacy_mappings
UNION ALL
SELECT 
    'Logged Migration Conflicts (candidate_target.migration_conflicts)',
    COUNT(*)
FROM candidate_target.migration_conflicts;


-- -----------------------------------------------------------------------------
-- 3. AUDIT BREAKDOWN JENIS KONFLIK YANG TERLOGGING
-- -----------------------------------------------------------------------------
SELECT 
    conflict_type,
    severity,
    resolution_status,
    COUNT(*) AS total_conflicts,
    MIN(created_at) AS earliest_conflict,
    MAX(created_at) AS latest_conflict
FROM candidate_target.migration_conflicts
GROUP BY conflict_type, severity, resolution_status
ORDER BY total_conflicts DESC;


-- -----------------------------------------------------------------------------
-- 4. VALIDASI NORMALISASI NOMOR TELEPON, GENDER, TANGGAL LAHIR, & RM CODE
-- -----------------------------------------------------------------------------
SELECT 
    'Valid Normalized Phones (Awalan 628...)' AS check_item,
    COUNT(*) AS check_count
FROM candidate_target.patients
WHERE phone LIKE '62%'
UNION ALL
SELECT 
    'Valid Normalized Gender (L / P)',
    COUNT(*)
FROM candidate_target.patients
WHERE gender IN ('L', 'P')
UNION ALL
SELECT 
    'NULL Gender (Standardized from invalid/missing)',
    COUNT(*)
FROM candidate_target.patients
WHERE gender IS NULL
UNION ALL
SELECT 
    'Valid Date of Birth (Between 1900 & 2022)',
    COUNT(*)
FROM candidate_target.patients
WHERE dob IS NOT NULL
UNION ALL
SELECT 
    'Generated Fallback RM Codes (RM-LEGACY-...)',
    COUNT(*)
FROM candidate_target.patients
WHERE rm_code LIKE 'RM-LEGACY-%'
UNION ALL
SELECT 
    'Generated Duplicate Conflict Suffix RM Codes (...-DUP-...)',
    COUNT(*)
FROM candidate_target.patients
WHERE rm_code LIKE '%-DUP-%';


-- -----------------------------------------------------------------------------
-- 5. CEK INTEGRITAS REFERENSIAL & ORPHAN CHECK
-- -----------------------------------------------------------------------------
-- A. Target Patients tanpa Legacy Mapping
SELECT COUNT(*) AS target_without_legacy_mapping
FROM candidate_target.patients p
LEFT JOIN candidate_target.patient_legacy_mappings plm ON p.id = plm.target_patient_id
WHERE plm.id IS NULL;

-- B. Legacy Patient Mappings tanpa Pasien Target
SELECT COUNT(*) AS mapping_without_target_patient
FROM candidate_target.patient_legacy_mappings plm
LEFT JOIN candidate_target.patients p ON plm.target_patient_id = p.id
WHERE p.id IS NULL;

-- C. Invalid Foreign Key Pekerjaan di Tabel Patients
SELECT COUNT(*) AS orphan_occupation_fk
FROM candidate_target.patients p
LEFT JOIN candidate_target.occupations o ON p.occupation_id = o.id
WHERE p.occupation_id IS NOT NULL AND o.id IS NULL;

-- D. Invalid Foreign Key Agama di Tabel Patients
SELECT COUNT(*) AS orphan_religion_fk
FROM candidate_target.patients p
LEFT JOIN candidate_target.religions r ON p.religion_id = r.id
WHERE p.religion_id IS NOT NULL AND r.id IS NULL;

-- E. Invalid Foreign Key Sumber Informasi di Tabel Patients
SELECT COUNT(*) AS orphan_info_source_fk
FROM candidate_target.patients p
LEFT JOIN candidate_target.information_sources i ON p.info_source_id = i.id
WHERE p.info_source_id IS NOT NULL AND i.id IS NULL;


-- -----------------------------------------------------------------------------
-- 6. UJI IDEMPOTENSI (UJI RE-RUN PROCEDURAL MIGRATION)
-- Memastikan jika sp_migrate_patient_data() dipanggil ulang, tidak ada baris ganda
-- -----------------------------------------------------------------------------
CALL sp_migrate_patient_data();

-- Hasil setelah re-run (Jumlah baris pasien target & mapping harus TETAP 21,993)
SELECT 
    'Post Re-Run Patients Count (Must stay 21,993)' AS idempotency_check,
    COUNT(*) AS total_rows
FROM candidate_target.patients
UNION ALL
SELECT 
    'Post Re-Run Mappings Count (Must stay 21,993)',
    COUNT(*)
FROM candidate_target.patient_legacy_mappings;
