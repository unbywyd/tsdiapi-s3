"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Client = void 0;
exports.default = createPlugin;
require("reflect-metadata");
const s3_1 = require("./s3");
var s3_2 = require("./s3");
Object.defineProperty(exports, "s3Client", { enumerable: true, get: function () { return s3_2.s3; } });
class App {
    name = 'tsdiapi-s3';
    config;
    context;
    constructor(config) {
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
        s3_1.s3.init(this.config);
    }
    async onInit(ctx) {
        this.context = ctx;
    }
}
function createPlugin(config) {
    return new App(config);
}
//# sourceMappingURL=index.js.map