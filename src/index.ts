import type { AppContext, AppPlugin } from "@tsdiapi/server";
import { s3 } from "./s3";
export { s3 as s3Client } from './s3';

export type PluginOptions = {
    publicBucketName?: string;
    privateBucketName?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
}

class App implements AppPlugin {
    name = 'tsdiapi-s3';
    config: PluginOptions;
    context: AppContext;
    constructor(config?: PluginOptions) {
        this.config = { ...config };
    }
    async onInit(ctx: AppContext) {
        this.context = ctx;
        const config = this.config;
        const appConfig = this.context.config.appConfig;
        const publicBucketName = appConfig?.publicBucketName || appConfig['AWS_PUBLIC_BUCKET_NAME'] || config.publicBucketName;
        const privateBucketName = appConfig?.privateBucketName || appConfig['AWS_PRIVATE_BUCKET_NAME'] || config.privateBucketName;
        const accessKeyId = appConfig?.accessKeyId || appConfig['AWS_ACCESS_KEY_ID'] || config.accessKeyId;
        const secretAccessKey = appConfig?.secretAccessKey || appConfig['AWS_SECRET_ACCESS_KEY'] || config.secretAccessKey;
        const region = appConfig?.region || appConfig['AWS_REGION'] || config.region;

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
        s3.init(this.config);
    }
}

export default function createPlugin(config?: PluginOptions) {
    return new App(config);
}