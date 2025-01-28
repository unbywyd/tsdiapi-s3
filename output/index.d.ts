import "reflect-metadata";
import { AppContext, AppPlugin } from "tsdiapi-server";
export { s3 as s3Client } from './s3';
export type PluginOptions = {
    publicBucketName?: string;
    privateBucketName?: string;
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
};
declare class App implements AppPlugin {
    name: string;
    config: PluginOptions;
    context: AppContext;
    constructor(config?: PluginOptions);
    onInit(ctx: AppContext): Promise<void>;
}
export default function createPlugin(config?: PluginOptions): App;
//# sourceMappingURL=index.d.ts.map