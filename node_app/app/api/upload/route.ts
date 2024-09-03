import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'minio';

let minioClient: Client | null = null;

function getMinioClient() {
  if (!minioClient) {
    if (!process.env.MINIO_ENDPOINT || !process.env.MINIO_PORT || !process.env.MINIO_ACCESS_KEY || !process.env.MINIO_SECRET_KEY) {
      throw new Error("MinIO environment variables are not set.");
    }

    minioClient = new Client({
      endPoint: process.env.MINIO_ENDPOINT,
      port: parseInt(process.env.MINIO_PORT, 10),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
    });
  }
  return minioClient;
}

// Use pre-signed URL 
export async function GET(req: NextRequest) {
    try {
      const fileName = req.nextUrl.searchParams.get('fileName');
  
      if (!fileName) {
        return NextResponse.json({ error: 'File name is required' }, { status: 400 });
      }

      const client = getMinioClient();

      const presignedUrl = await client.presignedPutObject(process.env.MINIO_BUCKET!, fileName, 60);
  
      return NextResponse.json({ url: presignedUrl });
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      return NextResponse.json({ error: 'Failed to generate presigned URL' }, { status: 500 });
    }
}
