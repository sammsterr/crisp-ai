'use client';

import { useState } from 'react';

export default function Home() {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<{
    originalWordCount: number;
    targetLength: number;
    targetWords: number;
  } | null>(null);

  const handleSummarize = async () => {
    if (!text.trim() && !url.trim()) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error: ${response.status}`);
      }

      setSummary(data.summary);
      setMetadata(data.metadata);
    } catch (error) {
      console.error('Error summarizing:', error);
      setError(error instanceof Error ? error.message : 'Failed to summarize text');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: summary || text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error: ${response.status}`);
      }

      if (!data.audio) {
        throw new Error('No audio data received from the server');
      }

      // Convert base64 to blob URL
      try {
        const audioData = atob(data.audio);
        const arrayBuffer = new ArrayBuffer(audioData.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < audioData.length; i++) {
          uint8Array[i] = audioData.charCodeAt(i);
        }
        const blob = new Blob([uint8Array], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      } catch (e) {
        console.error('Error processing audio data:', e);
        throw new Error('Failed to process audio data');
      }
    } catch (error) {
      console.error('Error generating audio:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate audio');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Article Summarizer & Text-to-Speech</h1>
          
          {/* URL Input */}
          <div className="mb-6">
            <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Article URL (optional)
            </label>
            <input
              type="url"
              id="url-input"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          {/* Text Input Area */}
          <div className="mb-6">
            <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Article Text
            </label>
            <textarea
              id="text-input"
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Paste your article text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-md">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleSummarize}
              disabled={isLoading || (!text.trim() && !url.trim())}
              className={`flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                ${isLoading || (!text.trim() && !url.trim())
                  ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
            >
              {isLoading ? 'Processing...' : 'Summarize'}
            </button>
            <button
              onClick={handleGenerateAudio}
              disabled={isLoading || (!summary && !text.trim())}
              className={`flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                ${isLoading || (!summary && !text.trim())
                  ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                }`}
            >
              {isLoading ? 'Generating...' : 'Generate Audio'}
            </button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="mt-6 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
          )}

          {/* Summary */}
          {summary && (
            <div className="mt-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Summary</h2>
              {metadata && (
                <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  <p>Original article: {metadata.originalWordCount} words</p>
                  <p>Target length: {metadata.targetLength} seconds ({metadata.targetWords} words)</p>
                </div>
              )}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{summary}</p>
              </div>
            </div>
          )}

          {/* Audio Player */}
          {audioUrl && (
            <div className="mt-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Generated Audio</h2>
              <audio
                controls
                className="w-full"
                src={audioUrl}
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
