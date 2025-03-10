import type { AppContext, AppPlugin } from "@tsdiapi/server";
import { FileMeta, S3Provider, UploadFileResponse } from './s3.js';
export { S3Provider, generateFileName } from './s3.js';

let s3Provider: S3Provider | null = null;

export type PluginOptions = {
    publicBucketName?: string;
    privateBucketName?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
    customHost?: string;
    generateFileNameFunc?: (file: FileMeta) => string;
}
const defaultConfig: PluginOptions = {
    publicBucketName: "",
    privateBucketName: "",
    accessKeyId: "",
    secretAccessKey: "",
    region: "",
    customHost: "",
};

class App implements AppPlugin {
    name = 'tsdiapi-s3';
    config: PluginOptions;
    context: AppContext;
    provider: S3Provider;
    constructor(config?: PluginOptions) {
        this.config = {
            ...defaultConfig,
            ...config
        };
        this.provider = new S3Provider();
    }
    async onInit(ctx: AppContext) {
        if (s3Provider) {
            ctx.logger.warn("⚠ S3 Plugin already initialized");
            return;
        }
        this.context = ctx;
        const config = this.config;
        const appConfig = this.context.config.appConfig || {};
        const publicBucketName = appConfig?.publicBucketName || appConfig['AWS_PUBLIC_BUCKET_NAME'] || config.publicBucketName;
        const privateBucketName = appConfig?.privateBucketName || appConfig['AWS_PRIVATE_BUCKET_NAME'] || config.privateBucketName;
        const accessKeyId = appConfig?.accessKeyId || appConfig['AWS_ACCESS_KEY_ID'] || config.accessKeyId;
        const secretAccessKey = appConfig?.secretAccessKey || appConfig['AWS_SECRET_ACCESS_KEY'] || config.secretAccessKey;
        const region = appConfig?.region || appConfig['AWS_REGION'] || config.region;
        const customHost = appConfig?.customHost || appConfig['AWS_CUSTOM_HOST'] || config.customHost;

        this.config.customHost = customHost;
        this.config.publicBucketName = publicBucketName;
        this.config.privateBucketName = privateBucketName;
        this.config.accessKeyId = accessKeyId;
        this.config.secretAccessKey = secretAccessKey;
        this.config.region = region;

        if (!this.config.publicBucketName && !this.config.privateBucketName) {
            throw new Error('You must provide either a publicBucketName or a privateBucketName');
        }
        if (!this.config.accessKeyId) {
            throw new Error('accessKeyId is required');
        }
        if (!this.config.secretAccessKey) {
            throw new Error('secretAccessKey is required');
        }
        if (!this.config.region) {
            throw new Error('region is required');
        }
        this.provider.init(this.config);
        s3Provider = this.provider;
        ctx.logger.info("✅ S3 Plugin initialized");
    }
}

export function getS3Provider(): S3Provider {
    if (!s3Provider) {
        throw new Error('S3 Plugin not initialized');
    }
    return s3Provider;
}

export type { FileMeta, UploadFileResponse };

export default function createPlugin(config?: PluginOptions) {
    return new App(config);
}