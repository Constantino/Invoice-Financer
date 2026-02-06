import { Request } from 'express';

/**
 * Multer file interface for uploaded files
 */
export interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}

/**
 * Extended Express Request interface with multer file property
 * Uses intersection type to avoid conflicts with Express.Request's file property
 */
export type MulterRequest = Request & {
    file?: MulterFile;
};
