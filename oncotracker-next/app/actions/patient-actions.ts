'use server';

import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

// Admin client for creating users
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

import pinyin from 'pinyin';

export async function createPatientAction(formData: FormData) {
    const fullName = formData.get('fullName') as string;

    if (!fullName) {
        return { success: false, error: 'Missing required fields' };
    }

    // 1. Generate MRN
    // Format: MRN-YYYYMMDD-XXXX (Random 4 digits)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const mrn = `MRN-${dateStr}-${randomSuffix}`;

    // 2. Auto-generate credentials
    const email = `patient+${mrn.toLowerCase().replace(/[^a-z0-9]/g, '')}@oncotracker.com`;
    const password = `Patient${mrn}!`;

    // 3. Parse and Translate Name
    let familyName = '';
    let givenName = '';

    // Check if name contains Chinese characters
    const hasChinese = /[\u4e00-\u9fa5]/.test(fullName);

    if (hasChinese) {
        // Transliterate to Pinyin
        // pinyin returns array of arrays (e.g. [['zhang'], ['li']])
        // style: pinyin.STYLE_NORMAL (no tone marks)
        const pinyinArr = pinyin(fullName, {
            style: pinyin.STYLE_NORMAL,
            heteronym: false
        });

        // Flatten
        const pinyinName = pinyinArr.map(item => item[0]);

        // Assume first character/syllable is Family Name (standard Chinese)
        // Unless it's a compound surname, but for MVP 1st is safe.
        if (pinyinName.length >= 2) {
            familyName = pinyinName[0]; // e.g. "zhang"
            givenName = pinyinName.slice(1).join(''); // e.g. "li"

            // Capitalize
            familyName = familyName.charAt(0).toUpperCase() + familyName.slice(1);
            givenName = givenName.charAt(0).toUpperCase() + givenName.slice(1);
        } else {
            familyName = pinyinName.join('');
            givenName = pinyinName.join(''); // Fallback
        }
    } else {
        // Western Name Logic
        const trimmedName = fullName.trim();
        const spaceIndex = trimmedName.lastIndexOf(' ');
        if (spaceIndex !== -1) {
            givenName = trimmedName.substring(0, spaceIndex);
            familyName = trimmedName.substring(spaceIndex + 1);
        } else {
            givenName = trimmedName;
            familyName = trimmedName;
        }
    }

    try {
        // 1. Get current doctor's session to verify they are authorized
        const supabase = await createServerClient();
        let { data: { user: doctorUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !doctorUser) {
            console.warn('getUser failed, trying getSession fallback...');
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (session?.user) {
                doctorUser = session.user;
                authError = null;
            } else {
                console.error('Create Patient Unauthorized:', authError, sessionError);
                console.log('Doctor User:', doctorUser);
                // Debug cookies
                const { cookies } = await import('next/headers');
                const cookieStore = await cookies();
                console.log('Cookies available:', cookieStore.getAll().map(c => c.name));

                return { success: false, error: `Unauthorized: ${authError?.message || 'No user found'}` };
            }
        }

        // Verify the user is actually a doctor (optional but recommended)
        // For now we assume if they are on the dashboard they are a doctor, 
        // but RLS will prevent them from assigning patients if they aren't a doctor in the `doctors` table?
        // Actually RLS on `patients` allows insert? We haven't defined INSERT policy for patients yet!
        // We need to fix RLS for INSERT if we want strict security.
        // But since we are using `supabaseAdmin` here to bypass RLS for user creation, we are fine for now.
        // However, we should ensure the `assigned_doctor_id` is the current user.

        // 2. Create Auth User
        const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                role: 'patient'
            }
        });

        if (createUserError) {
            console.error('Create User Error:', createUserError);
            return { success: false, error: createUserError.message };
        }

        if (!newUser.user) {
            return { success: false, error: 'Failed to create user' };
        }

        // 3. Create Patient Record
        // Note: The `profiles` record is created automatically by the trigger `handle_new_user`
        // We just need to create the `patients` record.

        const { error: createPatientError } = await supabaseAdmin
            .from('patients')
            .insert({
                id: newUser.user.id, // Link to Auth User
                mrn,
                family_name: familyName,
                given_name: givenName,
                assigned_doctor_id: doctorUser.id
            });

        if (createPatientError) {
            console.error('Create Patient Error:', createPatientError);
            // Rollback user creation? Ideally yes, but for MVP we might skip.
            // await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
            return { success: false, error: 'Failed to create patient record: ' + createPatientError.message };
        }

        // 4. Process Dataset if uploaded
        const datasetFile = formData.get('dataset') as File;
        const mappingStr = formData.get('mapping') as string;
        const mappingData = mappingStr ? JSON.parse(mappingStr) : null;
        
        // Extract isCanonical flag and actual mapping from the response
        const isCanonical = mappingData?.isCanonical === true;
        const mapping = isCanonical ? null : mappingData?.mapping || mappingData;

        if (datasetFile && datasetFile.size > 0) {
            try {
                // Pass mapping and isCanonical flag to process function
                await processAndSaveDataset(
                    datasetFile, 
                    newUser.user.id, 
                    supabaseAdmin, 
                    mapping, 
                    fullName,
                    isCanonical
                );

            } catch (err) {
                console.error('Failed to process dataset:', err);
            }
        }

        revalidatePath('/dashboard/doctor');
        return { success: true };

    } catch (error: any) {
        console.error('Unexpected Error:', error);
        return { success: false, error: error.message };
    }
}

export async function deletePatientAction(patientId: string) {
    try {
        const supabase = await createServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'Unauthorized' };
        }

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(patientId);

        if (deleteError) {
            console.error('Delete User Error:', deleteError);
            return { success: false, error: deleteError.message };
        }

        revalidatePath('/dashboard/doctor');
        return { success: true };

    } catch (error: any) {
        console.error('Delete Patient Error:', error);
        return { success: false, error: error.message };
    }
}

// Helper to process dataset
import * as XLSX from 'xlsx';
import { 
    transformToCanonicalFormat, 
    validateCanonicalData, 
    writeCanonicalXLSX,
    TransformResult 
} from '@/lib/schema/data-transformer';
import { SCHEMA_VERSION, ROW_INDICES, FIXED_COLUMNS } from '@/lib/schema/oncology-dataset.schema';
import { getCanonicalMetricName, lookupMetric, isKnownMetric } from '@/lib/schema/metric-dictionary';

/**
 * Detects if a file is ALREADY in 张莉.xlsx canonical format.
 * 
 * STRICT CRITERIA - Only returns true for files that EXACTLY match:
 * - Header row has CHINESE headers: '子类', '项目', '周期', '方案', '处置', '方案'
 * - Units row has: '日期\单位', '当下周期', '前序周期'
 * - REAL metric names (Weight, CEA, MRD), NOT generic names like "Lab Result"
 */
function detectCanonicalFormat(headers: any[], unitsRow: any[]): boolean {
    if (!Array.isArray(headers) || headers.length < 10) return false;
    
    // STRICT: Check CHINESE fixed column headers (EXACT match required)
    // Files with English headers like "Date", "Phase" should NOT be detected as canonical
    const hasDateHeader = headers[0] === '子类';
    const hasPhaseHeader = headers[1] === '项目';
    const hasCycleHeader = headers[2] === '周期';
    const hasSchemeHeader = headers[4] === '方案';
    const hasEventHeader = headers[5] === '处置';
    const hasSchemeDetail = headers[6] === '方案'; // Second '方案' column
    
    // STRICT: Check for REAL canonical metric headers (NOT generic or Chinese alternative names)
    // ONLY accept the exact canonical names from 张莉.xlsx
    const canonicalMetrics = ['Weight', 'Handgrip', 'ECOG', 'MRD', 'aMRD', 'CEA', 'HE4', 
        'CA19-9', 'CA125', 'CA724', 'AFP', '肺', '肝脏', '淋巴', '盆腔', 
        '白细胞', '血小板', '中性粒细胞', '谷草转氨酶', '谷丙转氨酶',
        'ROMA绝经后指数', 'ROMA绝经前指数'];
    
    // BLACKLIST: Generic names or Chinese alternatives that indicate non-canonical data
    // '体重' and '握力' are Chinese versions of Weight/Handgrip - they need transformation
    const invalidHeaders = ['Lab Result', 'Tumor Burden', 'Tumor Size', 'Performance Status',
        '体重', '握力', '细胞角蛋白19片段', 'Date', 'Phase', 'Cycle', 'Scheme', 'Event'];
    const hasInvalidHeaders = headers.some(h => h && invalidHeaders.includes(h));
    
    let metricCount = 0;
    headers.forEach(h => {
        if (h && canonicalMetrics.includes(h)) metricCount++;
    });
    
    // Check units row for CHINESE canonical indicators
    const hasUnitsRowIndicator = unitsRow && (
        unitsRow[0] === '日期\\单位' || 
        (unitsRow[2] === '当下周期' && unitsRow[3] === '前序周期')
    );
    
    // Calculate fixed column score (ONLY Chinese headers count)
    const fixedColScore = [hasDateHeader, hasPhaseHeader, hasCycleHeader, hasSchemeHeader, hasEventHeader, hasSchemeDetail]
        .filter(Boolean).length;
    
    // STRICT canonical criteria:
    // - Must have at least 4 of 6 CHINESE fixed headers (子类, 项目, etc.)
    // - Must have at least 5 real metric names (Weight, CEA, MRD, etc.)
    // - Must NOT have any blacklisted generic headers
    // - Should have Chinese units row indicators
    const isCanonical = fixedColScore >= 4 && metricCount >= 5 && !hasInvalidHeaders && hasUnitsRowIndicator;
    
    console.log(`[Canonical Detection] fixedColScore=${fixedColScore}, metricCount=${metricCount}, hasInvalidHeaders=${hasInvalidHeaders}, unitsRow=${hasUnitsRowIndicator}, isCanonical=${isCanonical}`);
    
    return isCanonical;
}

async function processAndSaveDataset(
    file: File, 
    patientId: string, 
    supabaseAdmin: any, 
    mapping: any, 
    patientName: string,
    isAlreadyCanonical: boolean = false  // NEW: Skip transformation if file is already canonical
) {
    const buffer = await file.arrayBuffer();
    let rawData: any[][] = [];

    const log = (msg: string) => {
        try {
            fs.appendFileSync(path.resolve(process.cwd(), 'debug-log.txt'), msg + '\n');
        } catch (e) { console.error(e); }
    };

    log(`--- Process Start (Schema v${SCHEMA_VERSION}) ---`);
    log(`Patient: ${patientName}, File: ${file.name}, isAlreadyCanonical: ${isAlreadyCanonical}`);

    // 1. Read Raw Data
    if (file.name.endsWith('.json')) {
        const text = new TextDecoder().decode(buffer);
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
            rawData = json;
        } else {
            rawData = [json];
        }
        if (rawData.length > 0 && typeof rawData[0] === 'object') {
            const headers = Object.keys(rawData[0]);
            const rows = rawData.map((obj: any) => headers.map(h => obj[h]));
            rawData = [[], [], headers, ...rows];
        }
    } else {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    }

    log(`Raw data rows: ${rawData.length}`);

    let observations: any[] = [];
    let canonicalData: any[][] = [];

    // 2. FAST PATH: File is already in canonical format - skip transformation
    if (isAlreadyCanonical) {
        log('File is ALREADY CANONICAL - skipping transformation, saving as-is');
        
        // Detect the actual header row (might be at index 2 or 3 depending on structure)
        let headerRowIdx = 2; // Default for saved canonical files
        for (let i = 0; i < Math.min(5, rawData.length); i++) {
            const row = rawData[i];
            if (row && row[0] === '子类' && row[1] === '项目') {
                headerRowIdx = i;
                break;
            }
        }
        
        // Normalize to standard format: [title, categories, headers, units, ...data]
        // Check if raw data has correct structure
        if (rawData[0] && String(rawData[0][0] || '').includes('肿瘤病程周期表')) {
            // Already has title row at 0
            canonicalData = rawData;
        } else if (rawData[1] && String(rawData[1][0] || '').includes('肿瘤病程周期表')) {
            // Has empty row 0, title at row 1 (original dataset structure)
            // Shift: remove empty row 0
            canonicalData = rawData.slice(1);
        } else {
            // Just use as-is
            canonicalData = rawData;
        }
        
        // Update title with patient name if not already there
        if (canonicalData[0] && !String(canonicalData[0][0] || '').includes(patientName)) {
            canonicalData[0][0] = `${patientName} - 肿瘤病程周期表`;
        }
        
        log(`Canonical data preserved: ${canonicalData.length} rows`);
        
        // Still extract observations for DB from canonical data
        // Wrap in try-catch so errors don't prevent file save
        try {
            // Find header row - look for '子类' or check for metric names
            let actualHeaderRowIdx = canonicalData.findIndex(row => row && row[0] === '子类');
            if (actualHeaderRowIdx < 0) {
                // Fallback: find row with metric headers
                actualHeaderRowIdx = canonicalData.findIndex(row => 
                    row && (row.includes('Weight') || row.includes('CEA') || row.includes('MRD') || 
                            row.includes('体重') || row.includes('握力'))
                );
            }
            
            if (actualHeaderRowIdx >= 0) {
                const headerRow = canonicalData[actualHeaderRowIdx];
                for (let i = actualHeaderRowIdx + 2; i < canonicalData.length; i++) { // Skip units row
                    const row = canonicalData[i];
                    const dateVal = row[0];
                    if (!dateVal) continue;
                    
                    let dateStr: string;
                    try {
                        if (typeof dateVal === 'number') {
                            // Excel serial date
                            const date = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
                            dateStr = date.toISOString();
                        } else if (typeof dateVal === 'string' && dateVal.includes('T')) {
                            // Already ISO string - validate and use as-is
                            const parsed = new Date(dateVal);
                            if (isNaN(parsed.getTime())) continue;
                            dateStr = parsed.toISOString();
                        } else {
                            // Try parsing as date string
                            const parsed = new Date(dateVal);
                            if (isNaN(parsed.getTime())) continue;
                            dateStr = parsed.toISOString();
                        }
                    } catch (e) {
                        log(`Skipping row ${i}: invalid date value "${dateVal}"`);
                        continue;
                    }
                    
                    // Extract metrics (columns 7+)
                    for (let j = 7; j < Math.min(row.length, headerRow.length); j++) {
                        const metricName = headerRow[j];
                        const value = row[j];
                        if (!metricName || value === undefined || value === null || value === '') continue;
                        
                        const metricDef = lookupMetric(metricName);
                        observations.push({
                            patient_id: patientId,
                            effective_datetime: dateStr,
                            category: metricDef?.category === 'MOLECULAR' ? 'tumor-marker' : 'laboratory',
                            code: getCanonicalMetricName(metricName),
                            code_display: metricDef?.chinese || metricName,
                            status: 'final',
                            value_quantity: typeof value === 'number' ? value : parseFloat(value) || null,
                            value_string: typeof value === 'string' ? value : String(value)
                        });
                    }
                }
            }
            
            log(`Extracted ${observations.length} observations from canonical data`);
        } catch (extractError: any) {
            log(`Warning: Failed to extract observations: ${extractError.message}`);
            // Continue - file will still be saved
        }
    }
    // 3. Transform non-canonical data to CANONICAL format (张莉.xlsx standard)
    else if (mapping) {
        log('Using AI Mapping with CANONICAL schema: ' + JSON.stringify(mapping, null, 2));

        // Use the new canonical transformer
        const transformResult = transformToCanonicalFormat(rawData, {
            date_col: mapping.date_col,
            date_col_index: mapping.date_col_index,  // Explicit index from AI
            metrics: mapping.metrics || {},
            events: mapping.events || [],
        }, { patientName });

        if (!transformResult.success) {
            log('Transform FAILED: ' + transformResult.errors.join(', '));
            throw new Error('Failed to transform data: ' + transformResult.errors.join(', '));
        }

        canonicalData = transformResult.data;
        log(`Transform SUCCESS: ${transformResult.stats.dataRows} data rows, ${transformResult.stats.metricsFound} metrics`);
        
        if (transformResult.warnings.length > 0) {
            log('Warnings: ' + transformResult.warnings.join(', '));
        }

        // Validate the transformed data
        const validation = validateCanonicalData(canonicalData);
        if (!validation.valid) {
            log('Validation FAILED: ' + validation.errors.join(', '));
            throw new Error('Canonical validation failed: ' + validation.errors.join(', '));
        }

        // Extract observations for DB
        // Data rows start at index 4 (ROW_INDICES.DATA_START)
        for (let i = ROW_INDICES.DATA_START; i < canonicalData.length; i++) {
            const row = canonicalData[i];
            const dateVal = row[FIXED_COLUMNS.DATE];
            
                    if (!dateVal) continue;

            // Convert Excel serial or timestamp to ISO string
                    let dateStr: string;
                    if (typeof dateVal === 'number') {
                        const date = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
                        dateStr = date.toISOString();
                    } else {
                dateStr = new Date(dateVal).toISOString();
            }

            // Extract metric values (columns after fixed columns)
            const headerRow = canonicalData[ROW_INDICES.HEADERS];
            for (let j = FIXED_COLUMNS.SCHEME_DETAIL + 1; j < row.length; j++) {
                const metricName = headerRow[j];
                        const value = row[j];
                
                if (!metricName || value === undefined || value === null || value === '') continue;

                const metricDef = lookupMetric(metricName);
                        observations.push({
                            patient_id: patientId,
                            effective_datetime: dateStr,
                    category: metricDef?.category === 'MOLECULAR' ? 'tumor-marker' : 'laboratory',
                    code: getCanonicalMetricName(metricName),
                    code_display: metricDef?.chinese || metricName,
                            status: 'final',
                            value_quantity: typeof value === 'number' ? value : parseFloat(value) || null,
                            value_string: typeof value === 'string' ? value : String(value)
                        });
                    }
                }

        log(`Extracted ${observations.length} observations for DB`);

    } else {
        // No mapping provided - check if file is already in canonical format
        log('No AI mapping - checking if file is already canonical...');
        
        // Try to detect if it's already canonical
        const headerRow = rawData[ROW_INDICES.HEADERS];
        const isCanonical = headerRow && (
            headerRow[FIXED_COLUMNS.DATE] === '子类' ||
            headerRow[FIXED_COLUMNS.PHASE] === '项目'
        );

        if (isCanonical) {
            log('File appears to be in canonical format - using as-is');
            canonicalData = rawData;
        } else {
            log('File is not canonical and no mapping provided - saving raw file');
            // Will save raw file below
        }
    }

    // 3. Insert Observations to DB
    if (observations.length > 0) {
        log(`Inserting ${observations.length} observations to DB...`);
        const { error } = await supabaseAdmin
            .from('observations')
            .insert(observations);
        if (error) {
            log('DB insert error: ' + JSON.stringify(error));
            console.error('Error inserting observations:', error);
        } else {
            log('DB insert SUCCESS');
        }
    }

    // 4. Save File to Data Directory (ALWAYS in canonical format)
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

    // Sanitize filename
    const safeName = patientName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    const filePath = path.join(dataDir, `${safeName}.xlsx`);

    if (canonicalData.length > 0) {
        // Write CANONICAL format data
        log('Writing CANONICAL format to: ' + filePath);
        const xlsxBuffer = writeCanonicalXLSX(canonicalData);
        fs.writeFileSync(filePath, xlsxBuffer);
        log('File saved successfully');
    } else {
        // Write Raw Data (Legacy/Fallback)
        log('Writing RAW file to: ' + filePath);
        fs.writeFileSync(filePath, Buffer.from(buffer));
    }

    log('--- Process Complete ---\n');
}

import { analyzeStructure } from '@/lib/llm/qwen';

export async function parseAndMapUpload(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        if (!file) throw new Error('No file uploaded');

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (rawData.length === 0) throw new Error('Empty file');

        // Smart Header Detection - Look for METRIC HEADERS not units/dates
        // The original dataset structure:
        // Row 0: Empty or minimal
        // Row 1: Title row ("肿瘤病程周期表")
        // Row 2: Categories ("分类", "节拍", "事件"...)
        // Row 3: HEADERS ("子类", "项目", "Weight", "CEA", "MRD"...)  <-- WE WANT THIS
        // Row 4: UNITS ("日期\单位", "KG", "<5"...)  <-- NOT THIS
        
        let headerRowIndex = 0;
        
        // METRIC_HEADERS are definitive indicators of the header row
        // These are actual column names, not units like "<5", "KG", "mm"
        const metricHeaders = [
            'Weight', 'Handgrip', 'ECOG', 'MRD', 'aMRD', 'CEA', 'HE4', 
            'CA19-9', 'CA125', 'CA724', 'AFP', 'ROMA',
            '白细胞', '血小板', '中性粒细胞', '谷草转氨酶', '谷丙转氨酶',
            '肺', '肝脏', '淋巴', '盆腔'
        ];
        
        // Fixed column headers (more reliable than "日期" which appears in units row too)
        const fixedHeaders = ['子类', '项目', '周期', '方案', '处置'];
        
        // Unit patterns to AVOID - these indicate it's NOT the header row
        const unitPatterns = ['日期\\单位', '日期', 'KG', 'mtm/ml', '<', '>', 'mm', '当下周期', '前序周期'];

        for (let i = 0; i < Math.min(rawData.length, 20); i++) {
            const row = rawData[i];
            if (!Array.isArray(row) || row.length < 5) continue;

            const rowStr = row.join(' ');
            
            // Check if row has metric headers (Weight, CEA, etc.)
            const hasMetricHeaders = metricHeaders.some(m => rowStr.includes(m));
            
            // Check if row has fixed headers (子类, 项目, etc.)
            const hasFixedHeaders = fixedHeaders.filter(f => rowStr.includes(f)).length >= 2;
            
            // Check if row looks like a UNITS row (has <, KG, mm, 日期\单位)
            const looksLikeUnits = unitPatterns.filter(u => rowStr.includes(u)).length >= 2;
            
            // Accept if it has metric headers OR multiple fixed headers AND doesn't look like units
            if ((hasMetricHeaders || hasFixedHeaders) && !looksLikeUnits) {
                headerRowIndex = i;
                console.log('[Header Detection] Found header row at index:', i, 'Sample:', row.slice(0, 10));
                break;
            }
        }

        // Extract headers and sample rows based on detected index
        const headers = rawData[headerRowIndex];
        // Skip the UNITS row (next row after headers) and get actual data rows
        const unitsRow = rawData[headerRowIndex + 1];
        const samples = rawData.slice(headerRowIndex + 2, headerRowIndex + 5); // Skip units, get 3 data rows
        
        console.log('[Header Detection] Headers:', headers?.slice(0, 15));
        console.log('[Header Detection] Units row:', unitsRow?.slice(0, 10));
        console.log('[Header Detection] First data sample:', samples[0]?.slice(0, 10));

        // CRITICAL: Check if file is ALREADY in 张莉.xlsx canonical format
        // If so, return isCanonical=true to skip transformation entirely
        const isCanonical = detectCanonicalFormat(headers, unitsRow);
        if (isCanonical) {
            console.log('[Header Detection] File is ALREADY in canonical 张莉.xlsx format - no transformation needed');
            return { 
                success: true, 
                isCanonical: true, 
                headerRowIndex, // Pass row index for proper data extraction
                mapping: null, 
                headers, 
                samples 
            };
        }

        // Call LLM for non-canonical files
        const mapping = await analyzeStructure(headers, samples);

        return { success: true, isCanonical: false, mapping, headers, samples };
    } catch (error: any) {
        console.error('Parse Error:', error);
        return { success: false, error: error.message };
    }
}
