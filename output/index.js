import { S3Provider } from './s3.js';
export { S3Provider, generateFileName } from './s3.js';
let s3Provider = null;
const defaultConfig = {
    publicBucketName: "",
    privateBucketName: "",
    accessKeyId: "",
    secretAccessKey: "",
    region: "",
    customHost: "",
};
class App {
    name = 'tsdiapi-s3';
    config;
    context;
    provider;
    constructor(config) {
        this.config = {
            ...defaultConfig,
            ...config
        };
        this.provider = new S3Provider();
    }
    async onInit(ctx) {
        if (s3Provider) {
            ctx.fastify.log.warn('S3 Plugin already initialized');
            return;
        }
        this.context = ctx;
        const config = this.config;
        const projectConfig = this.context.projectConfig;
        const publicBucketName = projectConfig.get('AWS_PUBLIC_BUCKET_NAME', config.publicBucketName);
        const privateBucketName = projectConfig.get('AWS_PRIVATE_BUCKET_NAME', config.privateBucketName);
        const accessKeyId = projectConfig.get('AWS_ACCESS_KEY_ID', config.accessKeyId);
        const secretAccessKey = projectConfig.get('AWS_SECRET_ACCESS_KEY', config.secretAccessKey);
        const region = projectConfig.get('AWS_REGION', config.region);
        const customHost = projectConfig.get('AWS_CUSTOM_HOST', config.customHost);
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
export function useS3Provider() {
    if (!s3Provider) {
        throw new Error('S3 Plugin not initialized');
    }
    return s3Provider;
}
export default function createPlugin(config) {
    return new App(config);
}
//# sourceMappingURL=index.js.map