-- =============================================================================
-- UJIAN TEKNIS DATA ANALYST — PT KOSMETIKA KLINIK INDONESIA
-- BAGIAN 3: MIGRASI DATA PASIEN (SCRIPT MIGRASI SAFE & IDEMPOTENT)
-- Kandidat: Al Fitra Nur Ramadhani
-- Target Database: candidate_target | Source Database: candidate_source
-- =============================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_migrate_patient_data$$

CREATE PROCEDURE sp_migrate_patient_data()
BEGIN
    DECLARE v_run_id BIGINT;
    DECLARE v_source_count BIGINT DEFAULT 0;
    DECLARE v_migrated_count BIGINT DEFAULT 0;
    DECLARE v_skipped_count BIGINT DEFAULT 0;
    DECLARE v_conflict_count BIGINT DEFAULT 0;
    DECLARE v_now DATETIME;

    SET v_now = NOW();

    -- 1. Catat Mulai Eksekusi di migration_runs
    INSERT INTO candidate_target.migration_runs (
        migration_name, started_at, status, source_count, migrated_count, skipped_count, conflict_count
    ) VALUES (
        'PATIENT_MIGRATION_Q4_2022', v_now, 'RUNNING', 0, 0, 0, 0
    );
    SET v_run_id = LAST_INSERT_ID();

    -- 2. Populate Tabel Master Lookup (Occupations, Religions, Information Sources) jika belum ada
    INSERT IGNORE INTO candidate_target.occupations (name, created_at, updated_at)
    SELECT DISTINCT TRIM(legacy_occupation), v_now, v_now
    FROM candidate_source.source_patients
    WHERE legacy_occupation IS NOT NULL AND TRIM(legacy_occupation) != '';

    INSERT IGNORE INTO candidate_target.religions (name, created_at, updated_at)
    SELECT DISTINCT TRIM(legacy_religion), v_now, v_now
    FROM candidate_source.source_patients
    WHERE legacy_religion IS NOT NULL AND TRIM(legacy_religion) != '';

    INSERT IGNORE INTO candidate_target.information_sources (name, created_at, updated_at)
    SELECT DISTINCT TRIM(legacy_information_source), v_now, v_now
    FROM candidate_source.source_patients
    WHERE legacy_information_source IS NOT NULL AND TRIM(legacy_information_source) != '';

    -- 3. Hitung Jumlah Data Source Pasien
    SELECT COUNT(*) INTO v_source_count FROM candidate_source.source_patients;

    -- 4. Catat Konflik Tanggal Lahir Placeholder (1970-01-01)
    INSERT IGNORE INTO candidate_target.migration_conflicts (
        migration_run_id, entity_type, legacy_id, conflict_type, source_value, proposed_value, severity, notes
    )
    SELECT 
        v_run_id, 'PATIENT', legacy_patient_id, 'DOB_PLACEHOLDER_1970', 
        CAST(legacy_birth_date AS CHAR), NULL, 'LOW', 
        'Tanggal lahir 1970-01-01 diidentifikasi sebagai placeholder dan dinormalisasi menjadi NULL'
    FROM candidate_source.source_patients
    WHERE legacy_birth_date = '1970-01-01';

    -- 5. Catat Konflik RM Code Kosong / Blank
    INSERT IGNORE INTO candidate_target.migration_conflicts (
        migration_run_id, entity_type, legacy_id, conflict_type, source_value, proposed_value, severity, notes
    )
    SELECT 
        v_run_id, 'PATIENT', legacy_patient_id, 'EMPTY_RM_CODE', 
        legacy_rm_code, CONCAT('RM-LEGACY-', legacy_patient_id), 'MEDIUM', 
        'RM code kosong/null; dibuatkan fallback konsisten berbasis ID legacy'
    FROM candidate_source.source_patients
    WHERE legacy_rm_code IS NULL OR TRIM(legacy_rm_code) = '';

    -- 6. Catat Konflik RM Code Duplikat
    INSERT IGNORE INTO candidate_target.migration_conflicts (
        migration_run_id, entity_type, legacy_id, conflict_type, source_value, proposed_value, severity, notes
    )
    SELECT 
        v_run_id, 'PATIENT', sp.legacy_patient_id, 'DUPLICATE_RM_CODE', 
        sp.legacy_rm_code, CONCAT(TRIM(sp.legacy_rm_code), '-DUP-', sp.legacy_patient_id), 'HIGH', 
        'RM code duplikat ditemukan di source; ditambahkan suffix unik ID legacy agar tidak menimpa data'
    FROM candidate_source.source_patients sp
    INNER JOIN (
        SELECT TRIM(legacy_rm_code) AS rm_code, COUNT(*) AS cnt
        FROM candidate_source.source_patients
        WHERE legacy_rm_code IS NOT NULL AND TRIM(legacy_rm_code) != ''
        GROUP BY TRIM(legacy_rm_code)
        HAVING COUNT(*) > 1
    ) dup ON TRIM(sp.legacy_rm_code) = dup.rm_code;

    -- Hitung Jumlah Konflik Logged
    SELECT COUNT(*) INTO v_conflict_count 
    FROM candidate_target.migration_conflicts 
    WHERE migration_run_id = v_run_id;

    -- 7. Eksekusi Migrasi Data Pasien ke candidate_target.patients (Idempotent via Temporary Table / Mapping Check)
    -- Memastikan pasien yang sudah pernah dimigrasi tidak diduplikasi
    INSERT INTO candidate_target.patients (
        rm_code, name, phone, dob, gender, address, occupation_id, religion_id, info_source_id, created_at, updated_at
    )
    SELECT 
        -- Normalisasi RM Code (RM unik, fallback jika kosong, suffix jika duplikat)
        CASE 
            WHEN sp.legacy_rm_code IS NULL OR TRIM(sp.legacy_rm_code) = '' 
                THEN CONCAT('RM-LEGACY-', sp.legacy_patient_id)
            WHEN dup.rm_code IS NOT NULL 
                THEN CONCAT(TRIM(sp.legacy_rm_code), '-DUP-', sp.legacy_patient_id)
            ELSE TRIM(sp.legacy_rm_code)
        END AS rm_code,

        -- Nama Pasien (Fallback ke 'Patient [ID]' jika nama kosong)
        COALESCE(TRIM(sp.legacy_name), CONCAT('Patient ', sp.legacy_patient_id)) AS name,

        -- Normalisasi Telepon: 08... -> 628..., 8... -> 628..., +62... -> 62...
        CASE 
            WHEN sp.legacy_phone IS NULL OR TRIM(sp.legacy_phone) = '' THEN NULL
            WHEN REGEXP_REPLACE(sp.legacy_phone, '[^0-9]', '') LIKE '08%' 
                THEN CONCAT('628', SUBSTRING(REGEXP_REPLACE(sp.legacy_phone, '[^0-9]', ''), 3))
            WHEN REGEXP_REPLACE(sp.legacy_phone, '[^0-9]', '') LIKE '8%' 
                THEN CONCAT('628', SUBSTRING(REGEXP_REPLACE(sp.legacy_phone, '[^0-9]', ''), 2))
            WHEN REGEXP_REPLACE(sp.legacy_phone, '[^0-9]', '') LIKE '62%' 
                THEN REGEXP_REPLACE(sp.legacy_phone, '[^0-9]', '')
            ELSE NULL
        END AS phone,

        -- Normalisasi Tanggal Lahir (0000-00-00, < 1900-01-01, > 2022-12-31, 1970-01-01 -> NULL)
        CASE 
            WHEN sp.legacy_birth_date IS NULL THEN NULL
            WHEN sp.legacy_birth_date = '0000-00-00' OR sp.legacy_birth_date = '1970-01-01' THEN NULL
            WHEN sp.legacy_birth_date < '1900-01-01' OR sp.legacy_birth_date > '2022-12-31' THEN NULL
            ELSE sp.legacy_birth_date
        END AS dob,

        -- Normalisasi Gender (L/LAKI-LAKI/PRIA/MALE -> L; P/W/PEREMPUAN/WANITA/FEMALE -> P)
        CASE 
            WHEN UPPER(TRIM(sp.legacy_gender)) IN ('L', 'LAKI-LAKI', 'PRIA', 'MALE') THEN 'L'
            WHEN UPPER(TRIM(sp.legacy_gender)) IN ('P', 'W', 'PEREMPUAN', 'WANITA', 'FEMALE') THEN 'P'
            ELSE NULL
        END AS gender,

        -- Alamat Pasien
        TRIM(sp.legacy_address) AS address,

        -- Foreign Key Mappings
        occ.id AS occupation_id,
        rel.id AS religion_id,
        inf.id AS info_source_id,

        -- Timestamps
        COALESCE(sp.legacy_registered_at, v_now) AS created_at,
        COALESCE(sp.legacy_updated_at, v_now) AS updated_at

    FROM candidate_source.source_patients sp
    LEFT JOIN candidate_target.patient_legacy_mappings plm ON sp.legacy_patient_id = plm.legacy_patient_id
    LEFT JOIN (
        SELECT TRIM(legacy_rm_code) AS rm_code
        FROM candidate_source.source_patients
        WHERE legacy_rm_code IS NOT NULL AND TRIM(legacy_rm_code) != ''
        GROUP BY TRIM(legacy_rm_code)
        HAVING COUNT(*) > 1
    ) dup ON TRIM(sp.legacy_rm_code) = dup.rm_code
    LEFT JOIN candidate_target.occupations occ ON TRIM(sp.legacy_occupation) = occ.name
    LEFT JOIN candidate_target.religions rel ON TRIM(sp.legacy_religion) = rel.name
    LEFT JOIN candidate_target.information_sources inf ON TRIM(sp.legacy_information_source) = inf.name
    WHERE plm.id IS NULL; -- Hanya masukkan jika belum pernah dimigrasikan (Idempotent)

    -- 8. Populate patient_legacy_mappings untuk Traceability
    INSERT INTO candidate_target.patient_legacy_mappings (
        source_system, legacy_patient_id, target_patient_id, migration_run_id, source_updated_at, migrated_at
    )
    SELECT 
        'clinic_prod' AS source_system,
        sp.legacy_patient_id,
        tp.id AS target_patient_id,
        v_run_id,
        sp.legacy_updated_at,
        v_now
    FROM candidate_source.source_patients sp
    JOIN candidate_target.patients tp ON (
        tp.rm_code = CASE 
            WHEN sp.legacy_rm_code IS NULL OR TRIM(sp.legacy_rm_code) = '' 
                THEN CONCAT('RM-LEGACY-', sp.legacy_patient_id)
            WHEN EXISTS (
                SELECT 1 FROM candidate_source.source_patients d 
                WHERE TRIM(d.legacy_rm_code) = TRIM(sp.legacy_rm_code) 
                GROUP BY TRIM(d.legacy_rm_code) HAVING COUNT(*) > 1
            ) THEN CONCAT(TRIM(sp.legacy_rm_code), '-DUP-', sp.legacy_patient_id)
            ELSE TRIM(sp.legacy_rm_code)
        END
    )
    LEFT JOIN candidate_target.patient_legacy_mappings plm ON sp.legacy_patient_id = plm.legacy_patient_id
    WHERE plm.id IS NULL;

    -- Hitung Data Ter-migrasi
    SELECT COUNT(*) INTO v_migrated_count FROM candidate_target.patient_legacy_mappings WHERE migration_run_id = v_run_id;
    SET v_skipped_count = v_source_count - v_migrated_count;

    -- 9. Update Status Eksekusi Selesai di migration_runs
    UPDATE candidate_target.migration_runs
    SET finished_at = NOW(),
        status = 'SUCCESS',
        source_count = v_source_count,
        migrated_count = v_migrated_count,
        skipped_count = v_skipped_count,
        conflict_count = v_conflict_count
    WHERE id = v_run_id;

END$$

DELIMITER ;

-- Panggil Stored Procedure Migrasi Data Pasien
CALL sp_migrate_patient_data();
