import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { FormalDataset } from './types';

export async function loadDataset(): Promise<FormalDataset> {
    const filePath = path.resolve(process.cwd(), 'data/dataset.xlsx');

    // Check if file exists
    if (!fs.existsSync(filePath)) {
        throw new Error(`Dataset file not found at ${filePath}`);
    }

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

    return { FormalDataset: mappedData };
}
