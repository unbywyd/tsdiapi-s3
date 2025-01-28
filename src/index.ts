import "reflect-metadata";
import { AppContext, AppPlugin } from "tsdiapi-server";
import { s3 } from "./s3";
export { s3 as s3Client } from './s3';

export type PluginOptions = {
    publicBucketName?: string;
    privateBucketName?: string;
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
}

class App implements AppPlugin {
    name = 'tsdiapi-s3';
    config: PluginOptions;
    context: AppContext;
    constructor(config?: PluginOptions) {
        this.config = { ...config };
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
    async onInit(ctx: AppContext) {
        this.context = ctx;
    }
}

export default function createPlugin(config?: PluginOptions) {
    return new App(config);
}