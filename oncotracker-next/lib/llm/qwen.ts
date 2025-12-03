import { generateText } from 'ai';
import { qwen } from '@/lib/ai/model';

export async function analyzeStructure(fileHeader: any[], sampleRows: any[]) {
    const prompt = `
    You are a medical data assistant. Your task is to map raw patient data to a structured format.
    
    Here is a sample of the data:
    Headers: ${JSON.stringify(fileHeader)}
    First 3 Rows: ${JSON.stringify(sampleRows)}

    Identify the following fields:
    - date_col: The key/column name for the date.
    - metrics: A map of keys to standard metric names (e.g., "Marker1" -> "CA19-9", "CEA" -> "CEA").
    - events: Keys containing text descriptions of events or phases.

    Return ONLY a valid JSON object with this structure:
    {
        "date_col": "string",
        "metrics": { "original_col": "standard_name" },
        "events": ["col1", "col2"]
    }
    `;

    try {
        const { text } = await generateText({
            model: qwen,
            prompt: prompt,
            temperature: 0.1,
        });

        // Basic cleanup to ensure JSON
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr || '{}');
    } catch (error) {
        console.error('Qwen API Error:', error);
        throw new Error('Failed to analyze file structure');
    }
}
