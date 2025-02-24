import type { AppContext, AppPlugin } from "@tsdiapi/server";
import { FileMeta, S3Provider, UploadFileResponse } from './s3';
export { S3Provider, generateFileName } from './s3';
export type PluginOptions = {
    publicBucketName?: string;
    privateBucketName?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
    customHost?: string;
    generateFileNameFunc?: (file: FileMeta) => string;
};
declare class App implements AppPlugin {
    name: string;
    config: PluginOptions;
    context: AppContext;
    provider: S3Provider;
    constructor(config?: PluginOptions);
    onInit(ctx: AppContext): Promise<void>;
}
export declare function getS3Provider(): S3Provider;
export type { FileMeta, UploadFileResponse };
export default function createPlugin(config?: PluginOptions): App;
//# sourceMappingURL=index.d.ts.map