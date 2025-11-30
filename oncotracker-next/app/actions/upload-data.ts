'use server';

import { runIngestionAgent } from '@/lib/ai/agents/ingestion';
import * as XLSX from 'xlsx';

export async function uploadData(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) {
        throw new Error('No file uploaded');
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON (array of arrays)
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    if (rawData.length < 5) {
        throw new Error('File too short to be a valid dataset');
    }

    // Extract headers (assuming row 2 based on our knowledge, but let's be dynamic)
    // Let's grab the first non-empty row as potential headers for mapping
    const potentialHeaders = rawData[2] as string[]; // Index 2 is Metric Names in our standard

    console.log('Potential Headers:', potentialHeaders);

    // Call Agent to map columns
    const mappingResult = await runIngestionAgent('map_columns', { headers: potentialHeaders });

    console.log('Mapping Result:', mappingResult);

    // In a real app, we would apply this mapping to transform the data.
    // For now, we'll just return the raw data and the mapping for the UI to display.

    // We need to return a structure that fits FormalDataset for the UI preview
    // Construct a FormalDataset-like object
    const formalDataset = rawData.map((row, idx) => {
        const obj: any = {};
        row.forEach((cell: any, i: number) => {
            const key = potentialHeaders[i] || `Unnamed: ${i}`;
            obj[key] = cell;
        });
        return obj;
    });

    return {
        dataset: { FormalDataset: formalDataset },
        mapping: mappingResult
    };
}
