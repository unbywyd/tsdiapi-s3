import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, } from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
export function generateFileName(file) {
    const now = new Date();
    const dateFolder = now.toISOString().split('T')[0];
    const uniqueHash = randomBytes(8).toString('hex');
    const fileExtension = file.originalname.split('.').pop();
    return `${dateFolder}/${uniqueHash}.${fileExtension}`;
}
export async function getFileMeta(file) {
    const { buffer, mimetype, originalname } = file;
    const fileType = await fileTypeFromBuffer(buffer);
    return {
        type: fileType?.mime || file?.mimetype || 'application/octet-stream',
        name: file?.originalname || fileType?.ext || 'unknown',
        size: buffer.length,
        extension: fileType?.ext || 'unknown',
    };
}
export class S3Provider {
    publicBucketName;
    privateBucketName;
    accessKeyId;
    secretAccessKey;
    customHost;
    region;
    client;
    generateFileNameFunc = generateFileName;
    get url() {
        const host = this?.customHost ? this.customHost : `https://${this.publicBucketName}.s3.${this.region}.amazonaws.com`;
        return host.endsWith('/') ? host : `${host}/`;
    }
    init(options) {
        this.publicBucketName = options.publicBucketName;
        this.privateBucketName = options.privateBucketName;
        this.accessKeyId = options.accessKeyId;
        this.secretAccessKey = options.secretAccessKey;
        this.region = options.region;
        this.customHost = options.customHost;
        if (options.generateFileNameFunc && typeof options.generateFileNameFunc === 'function') {
            this.generateFileNameFunc = options.generateFileNameFunc;
        }
        const s3Config = {
            region: this.region,
            credentials: {
                accessKeyId: this.accessKeyId,
                secretAccessKey: this.secretAccessKey,
            },
            // Принудительно используем UTC время для всех операций
            systemClockOffset: 0,
        };
        this.client = new S3Client(s3Config);
        // Проверяем синхронизацию времени при инициализации
        this.checkClockSync();
    }
    /**
     * Проверяет синхронизацию времени сервера с AWS.
     * Помогает диагностировать проблемы с presigned URLs.
     */
    async checkClockSync() {
        try {
            console.log(`Server local time: ${new Date().toString()}`);
            console.log(`Server UTC time: ${new Date().toISOString()}`);
            console.log(`Timezone offset: ${new Date().getTimezoneOffset()} minutes`);
            // Можно добавить запрос к AWS для получения серверного времени
            // Но это требует дополнительного API вызова
        }
        catch (error) {
            console.warn('Could not check clock synchronization:', error);
        }
    }
    /**
     * Deletes a file from an S3 bucket.
     * @param key - S3 object key (path) to delete.
     * @param isPrivate - If true, deletes from the private bucket; otherwise from the public bucket.
     * @returns A boolean indicating success/failure.
     */
    deleteFromS3 = async (key, isPrivate = false) => {
        try {
            const params = {
                Bucket: isPrivate ? this.privateBucketName : this.publicBucketName,
                Key: key,
            };
            const command = new DeleteObjectCommand(params);
            await this.client.send(command);
            return true;
        }
        catch (err) {
            console.error('deleteFromS3 error:', err);
            return false;
        }
    };
    /**
     * Retrieves a presigned URL for a file in S3.
     * @param fileKey - The key (path) of the file in S3.
     * @param isPrivate - If true, uses the private bucket; otherwise uses the public bucket.
     * @param expiresIn - Time in seconds until the URL expires (default: 3600 = 1 hour).
     * @returns A string containing the presigned URL.
     */
    async getPresignedUrl(fileKey, isPrivate = false, expiresIn = 3600) {
        const params = {
            Bucket: isPrivate ? this.privateBucketName : this.publicBucketName,
            Key: fileKey,
        };
        const command = new GetObjectCommand(params);
        try {
            // Создаем точное UTC время для подписи
            const signingDate = new Date();
            const signedUrl = await getSignedUrl(this.client, command, {
                expiresIn,
                signingDate,
                // Дополнительные опции для стабильности
                unhoistableHeaders: new Set(),
                signableHeaders: new Set(['host'])
            });
            const expirationTime = new Date(signingDate.getTime() + (expiresIn * 1000));
            console.log(`Generated presigned URL for ${fileKey}`);
            console.log(`Signing time (UTC): ${signingDate.toISOString()}`);
            console.log(`Expiration time (UTC): ${expirationTime.toISOString()}`);
            console.log(`Expires in: ${expiresIn} seconds`);
            return signedUrl;
        }
        catch (error) {
            console.error('Error generating presigned URL:', error);
            throw error;
        }
    }
    /**
     * Создает presigned URL с расширенными опциями для диагностики проблем с временем.
     * @param fileKey - The key (path) of the file in S3.
     * @param isPrivate - If true, uses the private bucket; otherwise uses the public bucket.
     * @param expiresIn - Time in seconds until the URL expires.
     * @param options - Дополнительные опции для генерации URL.
     * @returns Объект с presigned URL и метаданными.
     */
    async getPresignedUrlWithMeta(fileKey, isPrivate = false, expiresIn = 3600, options = {}) {
        // Добавляем толерантность к расхождению часов (5 минут)
        const actualExpiresIn = options.addClockSkewTolerance ? expiresIn + 300 : expiresIn;
        const bucket = isPrivate ? this.privateBucketName : this.publicBucketName;
        const params = {
            Bucket: bucket,
            Key: fileKey,
        };
        const command = new GetObjectCommand(params);
        const signingDate = new Date();
        const expirationTime = new Date(signingDate.getTime() + (actualExpiresIn * 1000));
        try {
            const signedUrl = await getSignedUrl(this.client, command, {
                expiresIn: actualExpiresIn,
                signingDate,
                unhoistableHeaders: new Set(),
                signableHeaders: new Set(['host'])
            });
            return {
                url: signedUrl,
                signingTime: signingDate.toISOString(),
                expirationTime: expirationTime.toISOString(),
                expiresIn: actualExpiresIn,
                bucket,
                key: fileKey
            };
        }
        catch (error) {
            console.error('Error generating presigned URL with meta:', error);
            throw error;
        }
    }
    /**
     * Uploads a buffer to an S3 bucket (public by default).
     * @param buffer - The file contents as a buffer.
     * @param mimetype - The MIME type of the file (e.g., image/png).
     * @param originalname - The original name of the file.
     * @param bucket - The target S3 bucket; defaults to the public bucket.
     * @returns An object containing the public URL or presigned URL (if private) and the S3 key.
     */
    async uploadBufferToS3(buffer, mimetype, originalname, isPrivate = false, id) {
        const bucket = isPrivate ? this.privateBucketName : this.publicBucketName;
        const fileName = this.generateFileNameFunc({
            buffer,
            mimetype,
            originalname,
            bucket,
            region: this.region
        });
        const params = {
            Bucket: bucket,
            Key: fileName,
            Body: buffer,
            ContentType: mimetype,
            ServerSideEncryption: 'AES256',
        };
        return new Promise((resolve, reject) => {
            const command = new PutObjectCommand(params);
            this.client.send(command, async (error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve({
                        url: isPrivate
                            ? await this.getPresignedUrl(fileName, true)
                            : `${this.url}${fileName}`,
                        key: fileName,
                        bucket: bucket,
                        region: this.region,
                        id: id,
                        meta: await getFileMeta({ buffer, mimetype, originalname, bucket, region: this.region })
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
    async uploadToS3(file, isPrivate = false) {
        const bucket = isPrivate ? this.privateBucketName : this.publicBucketName;
        const fileName = this.generateFileNameFunc({
            ...file,
            bucket,
            region: this.region
        });
        const params = {
            Bucket: bucket,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
            ServerSideEncryption: 'AES256',
        };
        return new Promise((resolve, reject) => {
            const command = new PutObjectCommand(params);
            this.client.send(command, async (error) => {
                if (error) {
                    console.error('uploadToS3 error:', error);
                    reject(error);
                }
                else {
                    resolve({
                        url: isPrivate
                            ? await this.getPresignedUrl(fileName, true)
                            : `${this.url}${fileName}`,
                        key: fileName,
                        bucket: bucket,
                        region: this.region,
                        id: file.id,
                        meta: await getFileMeta({ buffer: file.buffer, mimetype: file.mimetype, originalname: file.originalname, bucket, region: this.region })
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
    getPublicURL = (key) => {
        return `${this.url}${key}`;
    };
    /**
     * Retrieves a presigned URL for a file in the private bucket.
     * @param fileName - The key (path) of the file in S3.
     * @param expiresIn - Time in seconds until the URL expires (default: 3600 = 1 hour).
     * @returns A presigned URL giving access to the file.
     */
    getPrivateURL = (fileName, expiresIn = 3600) => {
        return this.getPresignedUrl(fileName, true, expiresIn);
    };
    /**
     * Uploads multiple files to the private S3 bucket.
     * @param files - An array of file objects (e.g., from Multer).
     * @returns An array of UploadFileResponse objects for each uploaded file.
     */
    uploadPrivateFiles = async (files) => {
        const results = [];
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
    uploadFiles = async (files) => {
        const results = [];
        for (const file of files) {
            const uploaded = await this.uploadToS3(file, false);
            results.push(uploaded);
        }
        return results;
    };
}
//# sourceMappingURL=s3.js.map