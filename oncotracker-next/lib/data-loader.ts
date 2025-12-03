import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { FormalDataset } from './types';

export async function loadDataset(): Promise<FormalDataset> {
    const dataDir = path.resolve(process.cwd(), 'data');

    // Find all .xlsx files
    const files = fs.readdirSync(dataDir)
        .filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'))
        .map(f => ({
            name: f,
            time: fs.statSync(path.join(dataDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time); // Sort by newest first

    const xlsxFile = files.length > 0 ? files[0].name : null;

    if (!xlsxFile) {
        throw new Error(`No .xlsx dataset file found in ${dataDir}`);
    }

    const filePath = path.join(dataDir, xlsxFile);
    const patientName = path.parse(xlsxFile).name;

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
