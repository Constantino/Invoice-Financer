import multer from 'multer';

// Configure multer for file uploads (memory storage)
export const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});
