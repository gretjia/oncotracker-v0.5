import { generateObject } from 'ai';
import { z } from 'zod';
import { qwen } from '@/lib/ai/model';

// Schema for the agent's response
const JourneyResponseSchema = z.object({
    message: z.string().describe('The text response to the user'),
    showChart: z.boolean().describe('Whether to show the patient journey chart'),
    chartConfig: z.object({
        viewMode: z.enum(['full', 'compact']).optional(),
        highlightMetric: z.string().optional(),
    }).optional(),
});

export async function runJourneyExplainerAgent(task: string) {
    const result = await generateObject({
        model: qwen,
        schema: JourneyResponseSchema,
        prompt: `
      You are an expert oncology data specialist.
      The user is asking about the patient's journey.
      
      User Query: "${task}"
      
      Decide if you should show the Patient Journey Chart.
      If the user asks about trends, timeline, treatment history, weight, or tumor markers, you SHOULD show the chart.
      
      Respond with a message and the chart configuration.
    `,
    });

    return result.object;
}
