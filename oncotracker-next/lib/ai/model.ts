import { createOpenAI } from '@ai-sdk/openai';

// Create an OpenAI-compatible client for Alibaba Qwen
const qwenClient = createOpenAI({
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: process.env.QWEN_API_KEY,
});

// Export the specific model instance
// 'qwen-plus' is a balanced model (good for general tasks)
// 'qwen-max' is the most capable model (good for complex reasoning)
export const qwen = qwenClient.chat('qwen-plus');

export const qwenMax = qwenClient.chat('qwen-max');
