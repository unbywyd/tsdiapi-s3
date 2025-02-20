"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3 = exports.checkFilesAreImages = exports.S3Config = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const crypto_1 = require("crypto");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
function generateFileName(file) {
    const now = new Date();
    const dateFolder = now.toISOString().split('T')[0];
    const uniqueHash = (0, crypto_1.randomBytes)(8).toString('hex');
    const fileExtension = file.originalname.split('.').pop();
    return `${dateFolder}/${uniqueHash}.${fileExtension}`;
}
class S3Config {
    publicBucketName;
    privateBucketName;
    accessKeyId;
    secretAccessKey;
    customHost;
    region;
    client;
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
        const s3Config = {
            region: this.region,
            credentials: {
                accessKeyId: this.accessKeyId,
                secretAccessKey: this.secretAccessKey,
            },
        };
        this.client = new client_s3_1.S3Client(s3Config);
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
            const command = new client_s3_1.DeleteObjectCommand(params);
            await this.client.send(command);
            return true;
        }
        catch (err) {
            console.error('deleteFromS3 error:', err);
            return false;
        }
    };
    /**
     * Retrieves a presigned URL for a file in the public S3 bucket.
     * @param fileKey - The key (path) of the file in S3.
     * @returns A string containing the presigned URL.
     */
    getPresignedUrl(fileKey, isPrivate = false) {
        const params = {
            Bucket: isPrivate ? this.privateBucketName : this.publicBucketName,
            Key: fileKey,
        };
        const command = new client_s3_1.GetObjectCommand(params);
        return (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn: 3600 });
    }
    /**
     * Uploads a buffer to an S3 bucket (public by default).
     * @param buffer - The file contents as a buffer.
     * @param mimetype - The MIME type of the file (e.g., image/png).
     * @param originalname - The original name of the file.
     * @param bucket - The target S3 bucket; defaults to the public bucket.
     * @returns An object containing the public URL or presigned URL (if private) and the S3 key.
     */
    async uploadBufferToS3(buffer, mimetype, originalname, isPrivate = false) {
        const fileName = generateFileName({ originalname });
        const bucket = isPrivate ? this.privateBucketName : this.publicBucketName;
        const params = {
            Bucket: bucket,
            Key: fileName,
            Body: buffer,
            ContentType: mimetype,
            ServerSideEncryption: 'AES256',
        };
        return new Promise((resolve, reject) => {
            const command = new client_s3_1.PutObjectCommand(params);
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
    async uploadToS3(file, isPrivate = false) {
        const fileName = generateFileName(file);
        const bucket = isPrivate ? this.privateBucketName : this.publicBucketName;
        const params = {
            Bucket: bucket,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
            ServerSideEncryption: 'AES256',
        };
        return new Promise((resolve, reject) => {
            const command = new client_s3_1.PutObjectCommand(params);
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
    getPublicURL = (key) => {
        return `${this.url}${key}`;
    };
    /**
     * Retrieves a presigned URL for a file in the private bucket.
     * @param fileName - The key (path) of the file in S3.
     * @returns A presigned URL giving access to the file.
     */
    getPrivateURL = (fileName) => {
        return this.getPresignedUrl(fileName, true);
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
exports.S3Config = S3Config;
/**
 * Checks if multiple uploaded files are images.
 * @param files - An array of file objects (e.g., from Multer).
 * @throws Error if any file is not an image.
 */
const checkFilesAreImages = (files) => {
    for (const file of files) {
        if (!file.mimetype.startsWith('image')) {
            throw new Error('File is not an image');
        }
    }
};
exports.checkFilesAreImages = checkFilesAreImages;
exports.s3 = new S3Config();
//# sourceMappingURL=s3.js.map