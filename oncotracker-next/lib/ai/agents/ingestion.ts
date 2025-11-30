import { generateObject } from 'ai';
import { qwen } from '@/lib/ai/model';
import { z } from 'zod';

// Define the FormalDataset Schema (Simplified mCODE subset)
// This matches the structure we want to extract from medical reports.
const FormalDatasetSchema = z.object({
  patient: z.object({
    mrn: z.string().optional(),
    name: z.string().optional(),
  }),
  observations: z.array(z.object({
    date: z.string().describe('ISO 8601 date string (YYYY-MM-DD)'),
    category: z.enum(['laboratory', 'vital-signs', 'tumor-marker', 'procedure', 'event']),
    name: z.string(),
    value: z.union([z.number(), z.string()]),
    unit: z.string().optional(),
    originalText: z.string().optional().describe('The original text snippet from the report'),
  })),
  summary: z.string().describe('A brief summary of the clinical findings in this report'),
});

export async function runIngestionAgent(task: string, payload: any) {
  if (task === 'parse_text') {
    const { text } = payload;

    if (!text) {
      throw new Error('Payload must contain "text" for parse_text task');
    }

    console.log('[Ingestion Agent] Parsing text...');

    const result = await generateObject({
      model: qwen,
      schema: FormalDatasetSchema,
      prompt: `
        You are an expert oncology data specialist.
        Your task is to extract structured clinical data from the following medical report text.
        Respond in JSON format matching the schema.
        
        The output MUST follow this structure:
        {
          "patient": { "mrn": "...", "name": "..." },
          "observations": [
            {
              "date": "YYYY-MM-DD",
              "category": "laboratory" | "vital-signs" | "tumor-marker" | "procedure" | "event",
              "name": "...",
              "value": number | string,
              "unit": "...",
              "originalText": "..."
            }
          ],
          "summary": "..."
        }

        Focus on:
        1. Tumor markers (CEA, CA19-9, etc.) -> category: 'tumor-marker'
        2. Vital signs (Weight, ECOG, etc.) -> category: 'vital-signs'
        3. Key events (Chemotherapy cycles, Surgeries) -> category: 'event' or 'procedure'
        
        Report Text:
        """
        ${text}
        """
      `,
    });

    console.log('[Ingestion Agent] Parsing complete.');
    return result.object;
  } else if (task === 'map_columns') {
    const { headers } = payload;

    if (!headers || !Array.isArray(headers)) {
      throw new Error('Payload must contain "headers" array for map_columns task');
    }

    console.log('[Ingestion Agent] Mapping columns:', headers);

    const MappingSchema = z.object({
      mappings: z.array(z.object({
        original: z.string(),
        target: z.string().describe('The standard column name to map to, or null if no match'),
        confidence: z.number().describe('Confidence score 0-1'),
      })),
    });

    const result = await generateObject({
      model: qwen,
      schema: MappingSchema,
      prompt: `
        You are an expert data analyst.
        Map the following Excel column headers to the standard OncoTracker schema.
        
        Standard Schema Columns:
        - "Weight" (Body weight)
        - "ECOG" (Performance status)
        - "CEA", "CA19-9", "CA125", "AFP" (Tumor markers)
        - "WBC", "PLT", "NE", "HGB" (Blood counts)
        - "ALT", "AST" (Liver function)
        
        Input Headers:
        ${JSON.stringify(headers)}
        
        Return a mapping for each input header. If a header doesn't match any standard column, map it to itself or null if irrelevant.
      `,
    });

    return result.object;
  }

  throw new Error(`Unknown task: ${task}`);
}
