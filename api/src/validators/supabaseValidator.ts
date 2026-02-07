import {
    SUPABASE_BUCKET_ENDPOINT,
    SUPABASE_BUCKET_ACCESS_KEY_ID,
    SUPABASE_BUCKET_SECRET_ACCESS_KEY,
} from '../config/supabase';

/**
 * Validates Supabase S3 configuration
 * @returns Error message string if validation fails, null if valid
 */
export const validateSupabaseConfig = (): string | null => {
    if (!SUPABASE_BUCKET_ENDPOINT || !SUPABASE_BUCKET_ACCESS_KEY_ID || !SUPABASE_BUCKET_SECRET_ACCESS_KEY) {
        return 'Supabase S3 configuration is missing. Please check your environment variables.';
    }
    return null;
};
