"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Client = void 0;
exports.default = createPlugin;
const s3_1 = require("./s3");
var s3_2 = require("./s3");
Object.defineProperty(exports, "s3Client", { enumerable: true, get: function () { return s3_2.s3; } });
class App {
    name = 'tsdiapi-s3';
    config;
    context;
    constructor(config) {
        this.config = { ...config };
    }
    async onInit(ctx) {
        this.context = ctx;
        const config = this.config;
        const appConfig = this.context.config.appConfig;
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
        s3_1.s3.init(this.config);
    }
}
function createPlugin(config) {
    return new App(config);
}
//# sourceMappingURL=index.js.map