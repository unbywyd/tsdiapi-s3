import type { AppContext, AppPlugin } from "@tsdiapi/server";
import { UploadFileData, S3Provider, UploadFileResponse } from './s3.js';
export { S3Provider, generateFileName, getFileMeta } from './s3.js';
import { FastifyInstance } from 'fastify';

declare module "fastify" {
    interface FastifyInstance {
        s3: S3Provider;
    }
}

let s3Provider: S3Provider | null = null;
export type PluginOptions = {
    publicBucketName?: string;
    privateBucketName?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
    customHost?: string;
    generateFileNameFunc?: (file: UploadFileData) => string;
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
            ctx.fastify.log.warn('S3 Plugin already initialized');
            return;
        }
        this.context = ctx;
        const config = this.config;
        const projectConfig = this.context.projectConfig;
        const publicBucketName = projectConfig.get('AWS_PUBLIC_BUCKET_NAME', config.publicBucketName) as string;
        const privateBucketName = projectConfig.get('AWS_PRIVATE_BUCKET_NAME', config.privateBucketName) as string;
        const accessKeyId = projectConfig.get('AWS_ACCESS_KEY_ID', config.accessKeyId) as string;
        const secretAccessKey = projectConfig.get('AWS_SECRET_ACCESS_KEY', config.secretAccessKey) as string;
        const region = projectConfig.get('AWS_REGION', config.region) as string;
        const customHost = projectConfig.get('AWS_CUSTOM_HOST', config.customHost) as string;

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
        ctx.fastify.decorate('s3', this.provider);
    }
}

export function useS3Provider(): S3Provider {
    if (!s3Provider) {
        throw new Error('S3 Plugin not initialized');
    }
    return s3Provider;
}

export type { UploadFileData as FileMeta, UploadFileResponse };

export default function createPlugin(config?: PluginOptions) {
    return new App(config);
}