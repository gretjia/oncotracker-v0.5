import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { FormalDataset } from './types';
import { createClient } from '@supabase/supabase-js';

// Admin client for reading user metadata
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * Loads dataset for a specific patient by ID, or falls back to newest file
 * @param patientId - Optional patient ID to load specific patient's data
 */
export async function loadDataset(patientId?: string): Promise<FormalDataset> {
    const dataDir = path.resolve(process.cwd(), 'data');
    let xlsxFile: string | null = null;
    let patientName: string | null = null;

    // If patientId provided, look up patient name from database
    if (patientId) {
        try {
            // First, get the original full name from auth.users (stored in user_metadata)
            // The full_name contains the ORIGINAL Chinese name used when creating the patient
            const { data: authData } = await supabaseAdmin.auth.admin.getUserById(patientId);
            const originalFullName = authData?.user?.user_metadata?.full_name;
            
            // Also get patient record for fallback
            const { data: patient } = await supabaseAdmin
                .from('patients')
                .select('family_name, given_name')
                .eq('id', patientId)
                .single();

            // Build list of possible file names to check
            const possibleNames: string[] = [];
            
            // Priority 1: Original full name (Chinese characters like "高玉修")
            if (originalFullName) {
                possibleNames.push(originalFullName);
                // Also try with underscores replacing special chars
                possibleNames.push(originalFullName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_'));
            }
            
            // Priority 2: Pinyin combinations from patient record
            if (patient) {
                possibleNames.push(
                    `${patient.family_name}${patient.given_name}`,
                    `${patient.given_name}${patient.family_name}`,
                    `${patient.family_name}_${patient.given_name}`,
                    `${patient.given_name} ${patient.family_name}`,
                );
            }

            // Try each possible name
            for (const name of possibleNames) {
                if (!name) continue;
                const testPath = path.join(dataDir, `${name}.xlsx`);
                if (fs.existsSync(testPath)) {
                    xlsxFile = `${name}.xlsx`;
                    patientName = name;
                    console.log(`[data-loader] Found patient file: ${xlsxFile}`);
                    break;
                }
            }

            // Fallback: search for files containing any part of the name
            if (!xlsxFile && (originalFullName || patient)) {
                const searchTerms = [originalFullName, patient?.family_name, patient?.given_name].filter(Boolean);
                const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));
                
                for (const file of files) {
                    const baseName = path.parse(file).name;
                    if (searchTerms.some(term => term && baseName.includes(term))) {
                        xlsxFile = file;
                        patientName = baseName;
                        console.log(`[data-loader] Found patient file by partial match: ${xlsxFile}`);
                        break;
                    }
                }
            }
        } catch (error) {
            console.error('[data-loader] Error looking up patient:', error);
        }
    }

    // Fallback: Find newest .xlsx file if no specific patient found
    if (!xlsxFile) {
        const files = fs.readdirSync(dataDir)
            .filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'))
            .map(f => ({
                name: f,
                time: fs.statSync(path.join(dataDir, f)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

        xlsxFile = files.length > 0 ? files[0].name : null;
        patientName = xlsxFile ? path.parse(xlsxFile).name : null;
        console.log(`[data-loader] Fallback to newest file: ${xlsxFile}`);
    }

    if (!xlsxFile) {
        throw new Error(`No .xlsx dataset file found in ${dataDir}`);
    }

    const filePath = path.join(dataDir, xlsxFile);

    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON with raw values (defval: null ensures empty cells are present if needed, but "Unnamed" keys come from header: A)
    // Actually, the HTML expects "Unnamed: 0", etc. This usually happens when pandas reads without a header.
    // We need to emulate this structure.

    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: "A", defval: "" });

    // We need to map "A", "B", "C" to "Unnamed: 0", "Unnamed: 1", etc.
    // Column A -> Unnamed: 0
    // Column B -> Unnamed: 1

    const mappedData = rawData.map((row: any) => {
        const newRow: any = {};
        Object.keys(row).forEach(key => {
            const colIndex = XLSX.utils.decode_col(key);
            newRow[`Unnamed: ${colIndex}`] = row[key];
        });
        return newRow;
    });

    return { FormalDataset: mappedData, patientName };
}
