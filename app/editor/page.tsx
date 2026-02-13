"use client";

import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import type { OutputData } from '@editorjs/editorjs';

const Editor = dynamic(() => import('@/components/editor/editor').then(mod => ({ default: mod.Editor })), {
  ssr: false,
  loading: () => <div className="p-6 text-center">Loading editor...</div>,
});

export default function EditorPage() {
  const [editorData, setEditorData] = useState<OutputData>();

  const handleSave = async () => {
    // Here you can send editorData to your backend or S3
    // For example, POST to /api/save or directly to S3
    // This is a placeholder for integration
    alert('Editor data saved!');
    // await fetch('/api/save', { method: 'POST', body: JSON.stringify(editorData) });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 p-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Rich Editor (S3 Integration)</h1>
        <Suspense fallback={<div>Loading editor...</div>}>
          <Editor data={editorData} onChange={setEditorData} />
        </Suspense>
        <button
          className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          onClick={handleSave}
        >
          Save
        </button>
      </div>
    </div>
  );
}
