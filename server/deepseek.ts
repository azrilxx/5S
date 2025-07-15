import axios from 'axios';

// Simple PDF text extraction helper
export function extractTextFromPdf(pdfText: string): string {
  // Clean up the text by removing extra whitespace and formatting
  let cleanText = pdfText
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
    .trim();
  
  return cleanText;
}

interface DeepSeekResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export async function extractQuestionsFromText(text: string): Promise<string[]> {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  try {
    const response = await axios.post<DeepSeekResponse>(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are an expert in 5S workplace organization methodology. Your task is to extract audit questions from the provided text. 

5S Categories:
1. Sort (Seiri): Remove unnecessary items
2. Set in Order (Seiton): Organize remaining items
3. Shine (Seiso): Clean and inspect
4. Standardize (Seiketsu): Maintain and improve
5. Sustain (Shitsuke): Maintain discipline

Extract questions and format them as a JSON array. Each question should be clear, specific, and suitable for a 5S audit checklist. Only extract actual questions, not statements or descriptions.

Example output:
[
  "Are all unnecessary items removed from the work area?",
  "Is each tool in its designated location?",
  "Are all surfaces clean and free of debris?"
]`
          },
          {
            role: 'user',
            content: `Please extract 5S audit questions from this text:\n\n${text}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from DeepSeek API');
    }

    // Try to parse JSON response
    try {
      const questions = JSON.parse(content);
      if (Array.isArray(questions)) {
        return questions.filter(q => typeof q === 'string' && q.trim().length > 0);
      }
    } catch (parseError) {
      // If JSON parsing fails, try to extract questions from text
      const lines = content.split('\n');
      const questions: string[] = [];
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.endsWith('?') && trimmed.length > 10) {
          questions.push(trimmed);
        }
      }
      
      if (questions.length > 0) {
        return questions;
      }
    }

    throw new Error('Could not extract questions from the response');
  } catch (error) {
    console.error('DeepSeek API Error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(`DeepSeek API Error: ${error.response?.data?.error?.message || error.message}`);
    }
    throw error;
  }
}