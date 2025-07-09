import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';
import { sanitizeFileName } from '@famatic/shared';

// Cloudflare R2 client (S3-compatible)
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: config.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: config.CLOUDFLARE_R2_ACCESS_KEY,
    secretAccessKey: config.CLOUDFLARE_R2_SECRET_KEY,
  },
});

export const R2_BUCKET = config.CLOUDFLARE_R2_BUCKET_NAME;

export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
  size: number;
}

// Upload file to R2
export async function uploadToR2(
  file: Buffer | Uint8Array,
  originalFileName: string,
  userId: string,
  contentType = 'image/jpeg'
): Promise<UploadResult> {
  const sanitizedName = sanitizeFileName(originalFileName);
  const timestamp = Date.now();
  const key = `users/${userId}/assets/${timestamp}-${sanitizedName}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: file,
    ContentType: contentType,
    Metadata: {
      'user-id': userId,
      'original-filename': originalFileName,
      'upload-timestamp': timestamp.toString(),
    },
  });

  try {
    await r2Client.send(command);
    
    return {
      url: `${config.CLOUDFLARE_R2_ENDPOINT}/${R2_BUCKET}/${key}`,
      key,
      bucket: R2_BUCKET,
      size: file.length,
    };
  } catch (error) {
    console.error('R2 upload error:', error);
    throw new Error(`Failed to upload to R2: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Generate presigned URL for secure access
export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });

  try {
    return await getSignedUrl(r2Client, command, { expiresIn });
  } catch (error) {
    console.error('R2 presigned URL error:', error);
    throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Delete file from R2
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });

  try {
    await r2Client.send(command);
  } catch (error) {
    console.error('R2 delete error:', error);
    throw new Error(`Failed to delete from R2: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Extract key from R2 URL
export function extractKeyFromUrl(r2Url: string): string {
  const url = new URL(r2Url);
  let pathParts = url.pathname.split('/').filter(Boolean); // Remove empty parts
  
  console.log('URL pathname:', url.pathname);
  console.log('Path parts:', pathParts);
  console.log('Looking for bucket:', R2_BUCKET);
  
  // Check if the URL includes the bucket name in the path
  // Format: https://endpoint.com/bucket-name/key/path
  const bucketIndex = pathParts.indexOf(R2_BUCKET);
  if (bucketIndex !== -1) {
    // Remove everything up to and including the bucket name
    const key = pathParts.slice(bucketIndex + 1).join('/');
    console.log('Found bucket at index', bucketIndex, 'extracted key:', key);
    return key;
  }
  
  // Check if the first part is the bucket name
  if (pathParts.length > 0 && pathParts[0] === R2_BUCKET) {
    const key = pathParts.slice(1).join('/');
    console.log('Bucket at start, extracted key:', key);
    return key;
  }
  
  // If no bucket found in path, assume entire path is the key
  // This handles cases where bucket name is in subdomain
  const key = pathParts.join('/');
  console.log('No bucket in path, using full path as key:', key);
  return key;
}

// Validate file type for uploads
export function validateImageFile(buffer: Buffer, originalName: string): {
  isValid: boolean;
  contentType?: string;
  error?: string;
} {
  // Check file extension
  const ext = originalName.toLowerCase().split('.').pop();
  const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
  
  if (!ext || !validExtensions.includes(ext)) {
    return {
      isValid: false,
      error: `Invalid file extension. Supported: ${validExtensions.join(', ')}`
    };
  }

  // Check file signature (magic bytes)
  const signatures = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header
  };

  let contentType = 'image/jpeg'; // default
  let isValid = false;

  for (const [type, signature] of Object.entries(signatures)) {
    if (signature.every((byte, index) => buffer[index] === byte)) {
      contentType = type;
      isValid = true;
      break;
    }
  }

  // For HEIC/HEIF, check for ftypheic or ftypmif1
  if (!isValid && (ext === 'heic' || ext === 'heif')) {
    const header = buffer.slice(0, 20).toString('ascii');
    if (header.includes('ftypheic') || header.includes('ftypmif1')) {
      contentType = 'image/heic';
      isValid = true;
    }
  }

  if (!isValid) {
    return {
      isValid: false,
      error: 'Invalid image file format or corrupted file'
    };
  }

  return { isValid: true, contentType };
}

// Health check for R2 connectivity
export async function testR2Connection(): Promise<{ connected: boolean; error?: string }> {
  try {
    // Try to list objects in the bucket (with limit)
    const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      MaxKeys: 1,
    });

    await r2Client.send(command);
    return { connected: true };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown R2 connection error'
    };
  }
}