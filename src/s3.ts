
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    S3ClientConfig,
    PutObjectCommandInput,
    GetObjectCommandInput,
    DeleteObjectCommandInput,
} from '@aws-sdk/client-s3';

import { randomBytes } from 'crypto';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PluginOptions } from './index';

export type FileMeta = { mimetype: string; originalname: string; bucket: string; region: string };
export function generateFileName(file: FileMeta): string {
    const now = new Date();
    const dateFolder = now.toISOString().split('T')[0];
    const uniqueHash = randomBytes(8).toString('hex');
    const fileExtension = file.originalname.split('.').pop();

    return `${dateFolder}/${uniqueHash}.${fileExtension}`;
}

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
}

export class S3Provider {
    publicBucketName: string;
    privateBucketName: string;
    accessKeyId: string;
    secretAccessKey: string;
    customHost?: string;
    region: string;
    client: S3Client;
    generateFileNameFunc: (file: FileMeta) => string = generateFileName;
    get url() {
        const host = this?.customHost ? this.customHost : `https://${this.publicBucketName}.s3.${this.region}.amazonaws.com`;
        return host.endsWith('/') ? host : `${host}/`;
    }
    init(options: PluginOptions) {
        this.publicBucketName = options.publicBucketName;
        this.privateBucketName = options.privateBucketName;
        this.accessKeyId = options.accessKeyId;
        this.secretAccessKey = options.secretAccessKey;
        this.region = options.region;
        this.customHost = options.customHost;
        if (options.generateFileNameFunc && typeof options.generateFileNameFunc === 'function') {
            this.generateFileNameFunc = options.generateFileNameFunc;
        }
        const s3Config: S3ClientConfig = {
            region: this.region,
            credentials: {
                accessKeyId: this.accessKeyId as string,
                secretAccessKey: this.secretAccessKey as string,
            },
        };
        this.client = new S3Client(s3Config);
    }

    /**
     * Deletes a file from an S3 bucket.
     * @param key - S3 object key (path) to delete.
     * @param isPrivate - If true, deletes from the private bucket; otherwise from the public bucket.
     * @returns A boolean indicating success/failure.
     */
    deleteFromS3 = async (
        key: string,
        isPrivate = false
    ): Promise<boolean> => {
        try {
            const params: DeleteObjectCommandInput = {
                Bucket: isPrivate ? this.privateBucketName : this.publicBucketName,
                Key: key,
            };
            const command = new DeleteObjectCommand(params);
            await this.client.send(command);
            return true;
        } catch (err) {
            console.error('deleteFromS3 error:', err);
            return false;
        }
    }

    /**
     * Retrieves a presigned URL for a file in the public S3 bucket.
     * @param fileKey - The key (path) of the file in S3.
     * @returns A string containing the presigned URL.
     */
    getPresignedUrl(fileKey: string, isPrivate = false): Promise<string> {
        const params: GetObjectCommandInput = {
            Bucket: isPrivate ? this.privateBucketName : this.publicBucketName,
            Key: fileKey,
        };
        const command = new GetObjectCommand(params);
        return getSignedUrl(this.client, command, { expiresIn: 3600 });
    }


    /**
     * Uploads a buffer to an S3 bucket (public by default).
     * @param buffer - The file contents as a buffer.
     * @param mimetype - The MIME type of the file (e.g., image/png).
     * @param originalname - The original name of the file.
     * @param bucket - The target S3 bucket; defaults to the public bucket.
     * @returns An object containing the public URL or presigned URL (if private) and the S3 key.
     */
    async uploadBufferToS3(
        buffer: Buffer,
        mimetype: string,
        originalname: string,
        isPrivate = false,
    ): Promise<UploadFileResponse> {
        const bucket = isPrivate ? this.privateBucketName : this.publicBucketName;

        const fileName = this.generateFileNameFunc({
            mimetype,
            originalname,
            bucket,
            region: this.region
        });

        const params: PutObjectCommandInput = {
            Bucket: bucket,
            Key: fileName,
            Body: buffer,
            ContentType: mimetype,
            ServerSideEncryption: 'AES256',
        };

        return new Promise<UploadFileResponse>((resolve, reject) => {
            const command = new PutObjectCommand(params);
            this.client.send(command, async (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        url: isPrivate
                            ? await this.getPresignedUrl(fileName, true)
                            : `${this.url}${fileName}`,
                        key: fileName,
                        bucket: bucket,
                        region: this.region
                    });
                }
            });
        });
    }


    /**
        * Uploads a file to an S3 bucket (public by default).
        * @param file - A file object (e.g., from Multer) with buffer, mimetype, and originalname.
        * @param bucket - The target S3 bucket; defaults to the public bucket.
        * @returns An object containing the public URL or presigned URL (if private) and the S3 key.
        */

    async uploadToS3(
        file: { buffer: Buffer; mimetype: string; originalname: string },
        isPrivate = false,
    ): Promise<UploadFileResponse> {
        const bucket = isPrivate ? this.privateBucketName : this.publicBucketName;

        const fileName = this.generateFileNameFunc({
            ...file,
            bucket,
            region: this.region
        });


        const params: PutObjectCommandInput = {
            Bucket: bucket,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
            ServerSideEncryption: 'AES256',
        };

        return new Promise<UploadFileResponse>((resolve, reject) => {
            const command = new PutObjectCommand(params);
            this.client.send(command, async (error: any) => {
                if (error) {
                    console.error('uploadToS3 error:', error);
                    reject(error);
                } else {
                    resolve({
                        url: isPrivate
                            ? await this.getPresignedUrl(fileName, true)
                            : `${this.url}${fileName}`,
                        key: fileName,
                        bucket: bucket,
                        region: this.region
                    });
                }
            });
        });
    }

    /**
     * Constructs a public URL for a file in the public bucket (non-presigned).
     * @param key - The key (path) of the file in S3.
     * @returns A publicly accessible URL.
     */
    getPublicURL = (key: string): string => {
        return `${this.url}${key}`;
    };

    /**
     * Retrieves a presigned URL for a file in the private bucket.
     * @param fileName - The key (path) of the file in S3.
     * @returns A presigned URL giving access to the file.
     */
    getPrivateURL = (fileName: string): Promise<string> => {
        return this.getPresignedUrl(fileName, true);
    };

    /**
     * Uploads multiple files to the private S3 bucket.
     * @param files - An array of file objects (e.g., from Multer).
     * @returns An array of UploadFileResponse objects for each uploaded file.
     */
    uploadPrivateFiles = async (
        files: { buffer: Buffer; mimetype: string; originalname: string }[]
    ): Promise<UploadFileResponse[]> => {
        const results: UploadFileResponse[] = [];
        for (const file of files) {
            const uploaded = await this.uploadToS3(file, true);
            results.push(uploaded);
        }
        return results;
    };

    /**
     * Uploads multiple files to the public S3 bucket.
     * @param files - An array of file objects (e.g., from Multer).
     * @returns An array of UploadFileResponse objects for each uploaded file.
     */
    uploadFiles = async (
        files: { buffer: Buffer; mimetype: string; originalname: string }[]
    ): Promise<UploadFileResponse[]> => {
        const results: UploadFileResponse[] = [];
        for (const file of files) {
            const uploaded = await this.uploadToS3(file, false);
            results.push(uploaded);
        }
        return results;
    };
}
