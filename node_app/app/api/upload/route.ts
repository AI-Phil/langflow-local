import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'minio';

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT!,
  port: parseInt(process.env.MINIO_PORT!, 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { file, fileName } = await req.json();

    // Convert the base64 string back to a buffer
    const buffer = Buffer.from(file, 'base64');

    // Use the original file name for storage
    await minioClient.putObject(process.env.MINIO_BUCKET!, fileName, buffer);

    return NextResponse.json({ message: 'File uploaded successfully', fileName });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
  }
}
