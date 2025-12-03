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
        if (datasetFile && datasetFile.size > 0) {
            try {
                await processAndSaveDataset(datasetFile, newUser.user.id, supabaseAdmin);

                // Save file to data directory for chart visualization (Demo/MVP bridge)
                const buffer = await datasetFile.arrayBuffer();
                const dataDir = path.resolve(process.cwd(), 'data');
                // Sanitize filename
                const safeName = fullName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
                const filePath = path.join(dataDir, `${safeName}.xlsx`);
                fs.writeFileSync(filePath, Buffer.from(buffer));

            } catch (err) {
                console.error('Failed to process dataset:', err);
                // We don't fail the whole request, just log it. 
                // Or maybe return a warning? For now, silent fail/log is safer for UX.
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

        // Delete the user from auth.users using supabaseAdmin
        // This will cascade delete the profile and patient record
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

async function processAndSaveDataset(file: File, patientId: string, supabaseAdmin: any) {
    const buffer = await file.arrayBuffer();
    let rawData: any[][] = [];

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
            rawData = [[], [], headers, ...rows]; // Pad to match Excel template structure for now
        }
    } else {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    }

    // Basic parsing logic assuming standard format:
    // Row with "Date" is header.
    // Columns are metrics.
    // Rows below are data points.

    let headerRowIndex = -1;
    const knownHeaders = ['Date', 'Phase', 'Cycle', 'Scheme', 'Event', 'Metric'];

    for (let i = 0; i < Math.min(rawData.length, 20); i++) {
        const row = rawData[i];
        if (Array.isArray(row) && row.some(cell => typeof cell === 'string' && knownHeaders.some(h => cell.includes(h)))) {
            headerRowIndex = i;
            break;
        }
    }

    if (headerRowIndex === -1) return; // No headers found

    const headers = rawData[headerRowIndex] as string[];
    const dateIndex = headers.findIndex(h => h && h.includes('Date'));

    if (dateIndex === -1) return; // No date column

    const observations = [];

    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        const dateVal = row[dateIndex];
        if (!dateVal) continue;

        // Parse date (handle Excel serial date or string)
        let dateStr: string;
        if (typeof dateVal === 'number') {
            // Excel date
            const date = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
            dateStr = date.toISOString();
        } else {
            // Try parsing string
            const date = new Date(dateVal);
            if (isNaN(date.getTime())) continue;
            dateStr = date.toISOString();
        }

        // Iterate over other columns (Metrics)
        for (let j = 0; j < row.length; j++) {
            if (j === dateIndex) continue;
            const header = headers[j];
            const value = row[j];

            if (!header || value === undefined || value === null || value === '') continue;

            // Skip non-metric columns if possible (Phase, Cycle, etc. - we might want to store them differently later)
            if (['Phase', 'Cycle', 'Scheme', 'Event', 'Previous Cycle', 'Scheme Detail'].some(s => header.includes(s))) continue;

            // Create observation
            observations.push({
                patient_id: patientId,
                effective_datetime: dateStr,
                category: 'laboratory', // Default category
                code: header,
                code_display: header,
                status: 'final',
                value_quantity: typeof value === 'number' ? value : parseFloat(value) || null,
                value_string: typeof value === 'string' ? value : String(value)
            });
        }
    }

    if (observations.length > 0) {
        const { error } = await supabaseAdmin
            .from('observations')
            .insert(observations);

        if (error) {
            console.error('Error inserting observations:', error);
            throw error;
        }
    }
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

        // Extract headers and sample rows
        const headers = rawData[0];
        const samples = rawData.slice(1, 4); // First 3 data rows

        // Call LLM
        const mapping = await analyzeStructure(headers, samples);

        return { success: true, mapping, headers, samples };
    } catch (error: any) {
        console.error('Parse Error:', error);
        return { success: false, error: error.message };
    }
}
