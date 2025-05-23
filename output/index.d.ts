import type { AppContext, AppPlugin } from "@tsdiapi/server";
import { UploadFileData, S3Provider, UploadFileResponse } from './s3.js';
export { S3Provider, generateFileName, getFileMeta } from './s3.js';
declare module "fastify" {
    interface FastifyInstance {
        s3: S3Provider;
    }
}
export type PluginOptions = {
    publicBucketName?: string;
    privateBucketName?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
    customHost?: string;
    generateFileNameFunc?: (file: UploadFileData) => string;
};
declare class App implements AppPlugin {
    name: string;
    config: PluginOptions;
    context: AppContext;
    provider: S3Provider;
    constructor(config?: PluginOptions);
    onInit(ctx: AppContext): Promise<void>;
}
export declare function useS3Provider(): S3Provider;
export type { UploadFileData as FileMeta, UploadFileResponse };
export default function createPlugin(config?: PluginOptions): App;
//# sourceMappingURL=index.d.ts.map