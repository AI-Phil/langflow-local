'use client';

import { useState } from 'react';

export default function MinioUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    // Step 1: Request a pre-signed URL from the backend
    const presignedUrlResponse = await fetch(`/api/upload?fileName=${encodeURIComponent(file.name)}`);
    const { url } = await presignedUrlResponse.json();

    if (!url) {
      setMessage('Failed to get pre-signed URL');
      return;
    }

    // Step 2: Upload the file directly to MinIO using the pre-signed URL
    const uploadResponse = await fetch(url, {
      method: 'PUT',
      body: file,
    });

    if (uploadResponse.ok) {
      setMessage('File uploaded successfully');
    } else {
      setMessage('File upload failed');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Upload a File to MinIO</h1>
      <input type="file" onChange={handleFileChange} className="mb-4" />
      <button
        onClick={handleUpload}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Upload
      </button>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
