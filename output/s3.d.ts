import { S3Client } from '@aws-sdk/client-s3';
import { PluginOptions } from './index.js';
export type FileMeta = {
    type: string;
    name: string;
    size?: number;
    extension?: string;
};
export type UploadFileData = {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
    id?: string;
    bucket?: string;
    region?: string;
};
export declare function generateFileName(file: UploadFileData): string;
export declare function getFileMeta(file: UploadFileData): Promise<FileMeta>;
/**
 * Represents the response for a successful file upload.
 */
export interface UploadFileResponse {
    /**
     * Publicly accessible URL of the uploaded file (or a presigned URL if private).
     */
    url: string;
    key: string;
    bucket: string;
    region: string;
    id?: string;
    meta?: FileMeta;
}
export declare class S3Provider {
    publicBucketName: string;
    privateBucketName: string;
    accessKeyId: string;
    secretAccessKey: string;
    customHost?: string;
    region: string;
    client: S3Client;
    generateFileNameFunc: (file: UploadFileData) => string;
    get url(): string;
    init(options: PluginOptions): void;
    /**
     * Проверяет синхронизацию времени сервера с AWS.
     * Помогает диагностировать проблемы с presigned URLs.
     */
    private checkClockSync;
    /**
     * Deletes a file from an S3 bucket.
     * @param key - S3 object key (path) to delete.
     * @param isPrivate - If true, deletes from the private bucket; otherwise from the public bucket.
     * @returns A boolean indicating success/failure.
     */
    deleteFromS3: (key: string, isPrivate?: boolean) => Promise<boolean>;
    /**
     * Retrieves a presigned URL for a file in S3.
     * @param fileKey - The key (path) of the file in S3.
     * @param isPrivate - If true, uses the private bucket; otherwise uses the public bucket.
     * @param expiresIn - Time in seconds until the URL expires (default: 3600 = 1 hour).
     * @returns A string containing the presigned URL.
     */
    getPresignedUrl(fileKey: string, isPrivate?: boolean, expiresIn?: number): Promise<string>;
    /**
     * Создает presigned URL с расширенными опциями для диагностики проблем с временем.
     * @param fileKey - The key (path) of the file in S3.
     * @param isPrivate - If true, uses the private bucket; otherwise uses the public bucket.
     * @param expiresIn - Time in seconds until the URL expires.
     * @param options - Дополнительные опции для генерации URL.
     * @returns Объект с presigned URL и метаданными.
     */
    getPresignedUrlWithMeta(fileKey: string, isPrivate?: boolean, expiresIn?: number, options?: {
        addClockSkewTolerance?: boolean;
    }): Promise<{
        url: string;
        signingTime: string;
        expirationTime: string;
        expiresIn: number;
        bucket: string;
        key: string;
    }>;
    /**
     * Uploads a buffer to an S3 bucket (public by default).
     * @param buffer - The file contents as a buffer.
     * @param mimetype - The MIME type of the file (e.g., image/png).
     * @param originalname - The original name of the file.
     * @param bucket - The target S3 bucket; defaults to the public bucket.
     * @returns An object containing the public URL or presigned URL (if private) and the S3 key.
     */
    uploadBufferToS3(buffer: Buffer, mimetype: string, originalname: string, isPrivate?: boolean, id?: string): Promise<UploadFileResponse>;
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
        id?: string;
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
     * @param expiresIn - Time in seconds until the URL expires (default: 3600 = 1 hour).
     * @returns A presigned URL giving access to the file.
     */
    getPrivateURL: (fileName: string, expiresIn?: number) => Promise<string>;
    /**
     * Uploads multiple files to the private S3 bucket.
     * @param files - An array of file objects (e.g., from Multer).
     * @returns An array of UploadFileResponse objects for each uploaded file.
     */
    uploadPrivateFiles: (files: {
        buffer: Buffer;
        mimetype: string;
        originalname: string;
        id?: string;
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
        id?: string;
    }[]) => Promise<UploadFileResponse[]>;
}
//# sourceMappingURL=s3.d.ts.map