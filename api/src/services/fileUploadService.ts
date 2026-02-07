import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import {
    SUPABASE_BUCKET_ENDPOINT,
    SUPABASE_BUCKET_ACCESS_KEY_ID,
    SUPABASE_BUCKET_SECRET_ACCESS_KEY,
    SUPABASE_PROJECT_URL,
    FILES_BUCKET
} from '../config/supabase';
import { MulterFile } from '../types/multer';
import { validateSupabaseConfig } from '../validators/supabaseValidator';

export interface UploadFileResult {
    path: string;
    url: string;
    publicUrl: string;
}

// Initialize S3 client for Supabase S3-compatible storage
const s3Client = new S3Client({
    endpoint: SUPABASE_BUCKET_ENDPOINT,
    region: 'us-east-1', // Supabase S3 typically uses us-east-1, adjust if needed
    credentials: {
        accessKeyId: SUPABASE_BUCKET_ACCESS_KEY_ID,
        secretAccessKey: SUPABASE_BUCKET_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true, // Required for S3-compatible storage
});

/**
 * Upload a file to Supabase S3-compatible storage bucket
 * @param file - The file buffer or file object
 * @param fileName - The name to save the file as
 * @param contentType - The MIME type of the file (e.g., 'application/pdf')
 * @returns The uploaded file path and URL
 */
export const uploadFileToSupabase = async (
    file: Buffer | MulterFile,
    fileName: string,
    contentType: string
): Promise<UploadFileResult> => {
    try {
        // Validate configuration
        const configError = validateSupabaseConfig();
        if (configError) {
            throw new Error(configError);
        }

        // Get file buffer
        const fileBuffer = Buffer.isBuffer(file) ? file : file.buffer;

        // Generate a unique file name with timestamp to avoid conflicts
        const timestamp = Date.now();
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueFileName = `${timestamp}_${sanitizedFileName}`;
        const filePath = `${uniqueFileName}`;

        // Upload file to Supabase S3-compatible storage
        const command = new PutObjectCommand({
            Bucket: FILES_BUCKET,
            Key: filePath,
            Body: fileBuffer,
            ContentType: contentType,
        });

        await s3Client.send(command);

        // Construct public URL
        // Supabase public URL format: https://{project-ref}.supabase.co/storage/v1/object/public/{bucket}/{path}
        const baseUrl = SUPABASE_PROJECT_URL.replace(/\/$/, ''); // Remove trailing slash
        const publicUrl = `${baseUrl}/storage/v1/object/public/${FILES_BUCKET}/${filePath}`;

        return {
            path: filePath,
            url: publicUrl,
            publicUrl: publicUrl,
        };
    } catch (error) {
        console.error('Error uploading file to Supabase:', error);
        throw error;
    }
};

/**
 * Delete a file from Supabase S3-compatible storage bucket
 * @param filePath - The path of the file to delete
 */
export const deleteFileFromSupabase = async (filePath: string): Promise<void> => {
    try {
        // Validate configuration
        const configError = validateSupabaseConfig();
        if (configError) {
            throw new Error(configError);
        }

        const command = new DeleteObjectCommand({
            Bucket: FILES_BUCKET,
            Key: filePath,
        });

        await s3Client.send(command);
    } catch (error) {
        console.error('Error deleting file from Supabase:', error);
        throw error;
    }
};
