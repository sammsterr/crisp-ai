import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to count words
function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

// Helper function to determine target length based on word count
function getTargetLength(wordCount: number): { words: number, seconds: number } {
  if (wordCount < 1000) {
    return { words: 50, seconds: 30 };
  } else if (wordCount < 3000) {
    return { words: 75, seconds: 45 };
  } else {
    return { words: 100, seconds: 60 };
  }
}

export async function POST(request: Request) {
  try {
    const { text, url } = await request.json();

    if (!text && !url) {
      return NextResponse.json(
        { error: 'Either text or URL is required' },
        { status: 400 }
      );
    }

    let content = text;
    
    // If URL is provided, fetch the content
    if (url) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch URL: ${response.statusText}`);
        }
        const html = await response.text();
        // Basic HTML to text conversion (you might want to use a proper HTML parser)
        content = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      } catch (error) {
        console.error('Error fetching URL:', error);
        return NextResponse.json(
          { error: 'Failed to fetch article from URL' },
          { status: 400 }
        );
      }
    }

    // Truncate content if it's too long (OpenAI has token limits)
    const maxLength = 12000; // Adjust based on your needs
    if (content.length > maxLength) {
      content = content.substring(0, maxLength) + '...';
    }

    // Get word count and target length
    const wordCount = countWords(content);
    const target = getTargetLength(wordCount);

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a professional article summarizer. Your task is to:
1. Summarize the given article to approximately ${target.seconds} seconds of reading time (about ${target.words} words)
2. Maintain the key points and main ideas
3. Keep the summary clear and concise
4. Preserve any important statistics or specific data points
5. Structure the summary in a logical flow
6. Start the summary with a brief fact to grab the listener's attention 

The original article is ${wordCount} words long. Create a summary that's engaging and easy to understand while staying within the target length.

Format the summary in a way that's easy to read and understand.`
        },
        {
          role: "user",
          content: content
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const summary = completion.choices[0].message.content;

    return NextResponse.json({ 
      summary,
      metadata: {
        originalWordCount: wordCount,
        targetLength: target.seconds,
        targetWords: target.words
      }
    });
  } catch (error) {
    console.error('Summarization error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to summarize text' },
      { status: 500 }
    );
  }
} 