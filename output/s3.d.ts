import { S3Client } from '@aws-sdk/client-s3';
import { PluginOptions } from './index';
/**
 * Represents the response for a successful file upload.
 */
export interface UploadFileResponse {
    /**
     * Publicly accessible URL of the uploaded file (or a presigned URL if private).
     */
    url: string;
    /**
     * Key (path) of the file stored in S3.
     */
    key: string;
    bucket: string;
    region: string;
}
/**
 * Class-validator DTO representation of the upload file response.
 */
export interface UploadFileResponseDTO {
    url: string;
    key: string;
}
export interface InputFileKeyDTO {
    key: string;
    isPrivate: boolean;
}
export declare class S3Config {
    publicBucketName: string;
    privateBucketName: string;
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    client: S3Client;
    init(options: PluginOptions): void;
    /**
     * Deletes a file from an S3 bucket.
     * @param key - S3 object key (path) to delete.
     * @param isPrivate - If true, deletes from the private bucket; otherwise from the public bucket.
     * @returns A boolean indicating success/failure.
     */
    deleteFromS3: (key: string, isPrivate?: boolean) => Promise<boolean>;
    /**
     * Retrieves a presigned URL for a file in the public S3 bucket.
     * @param fileKey - The key (path) of the file in S3.
     * @returns A string containing the presigned URL.
     */
    getPresignedUrl(fileKey: string, isPrivate?: boolean): Promise<string>;
    /**
     * Uploads a buffer to an S3 bucket (public by default).
     * @param buffer - The file contents as a buffer.
     * @param mimetype - The MIME type of the file (e.g., image/png).
     * @param originalname - The original name of the file.
     * @param bucket - The target S3 bucket; defaults to the public bucket.
     * @returns An object containing the public URL or presigned URL (if private) and the S3 key.
     */
    uploadBufferToS3(buffer: Buffer, mimetype: string, originalname: string, isPrivate?: boolean): Promise<UploadFileResponse>;
    /**
        * Uploads a file to an S3 bucket (public by default).
        * @param file - A file object (e.g., from Multer) with buffer, mimetype, and originalname.
        * @param bucket - The target S3 bucket; defaults to the public bucket.
        * @returns An object containing the public URL or presigned URL (if private) and the S3 key.
        */
    uploadToS3(file: {
        buffer: Buffer;
        mimetype: string;
        originalname: string;
    }, isPrivate?: boolean): Promise<UploadFileResponse>;
    /**
     * Constructs a public URL for a file in the public bucket (non-presigned).
     * @param key - The key (path) of the file in S3.
     * @returns A publicly accessible URL.
     */
    getPublicURL: (key: string) => string;
    /**
     * Retrieves a presigned URL for a file in the private bucket.
     * @param fileName - The key (path) of the file in S3.
     * @returns A presigned URL giving access to the file.
     */
    getPrivateURL: (fileName: string) => Promise<string>;
    /**
     * Uploads multiple files to the private S3 bucket.
     * @param files - An array of file objects (e.g., from Multer).
     * @returns An array of UploadFileResponse objects for each uploaded file.
     */
    uploadPrivateFiles: (files: {
        buffer: Buffer;
        mimetype: string;
        originalname: string;
    }[]) => Promise<UploadFileResponse[]>;
    /**
     * Uploads multiple files to the public S3 bucket.
     * @param files - An array of file objects (e.g., from Multer).
     * @returns An array of UploadFileResponse objects for each uploaded file.
     */
    uploadFiles: (files: {
        buffer: Buffer;
        mimetype: string;
        originalname: string;
    }[]) => Promise<UploadFileResponse[]>;
}
/**
 * Checks if multiple uploaded files are images.
 * @param files - An array of file objects (e.g., from Multer).
 * @throws Error if any file is not an image.
 */
export declare const checkFilesAreImages: (files: {
    mimetype: string;
}[]) => void;
export declare const s3: S3Config;
//# sourceMappingURL=s3.d.ts.map