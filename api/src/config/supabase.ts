// Supabase S3-compatible storage configuration
export const SUPABASE_BUCKET_ENDPOINT = process.env.SUPABASE_BUCKET_ENDPOINT || '';
export const SUPABASE_BUCKET_ACCESS_KEY_ID = process.env.SUPABASE_BUCKET_ACCESS_KEY_ID || '';
export const SUPABASE_BUCKET_SECRET_ACCESS_KEY = process.env.SUPABASE_BUCKET_SECRET_ACCESS_KEY || '';
export const SUPABASE_PROJECT_URL = process.env.SUPABASE_PROJECT_URL || '';
export const FILES_BUCKET = 'files';

if (!SUPABASE_BUCKET_ENDPOINT || !SUPABASE_BUCKET_ACCESS_KEY_ID || !SUPABASE_BUCKET_SECRET_ACCESS_KEY) {
    console.warn('WARNING: Supabase S3 configuration is missing. File uploads will not work.');
    console.warn('Please set the following environment variables in your .env file:');
    console.warn('  - SUPABASE_BUCKET_ENDPOINT');
    console.warn('  - SUPABASE_BUCKET_ACCESS_KEY_ID');
    console.warn('  - SUPABASE_BUCKET_SECRET_ACCESS_KEY');
}

if (!SUPABASE_PROJECT_URL) {
    console.warn('WARNING: SUPABASE_PROJECT_URL is not set. Public URLs may not be constructed correctly.');
}
