Here’s a well-structured `README.md` for your `tsdiapi-s3` plugin:

# TSDIAPI-S3

`TSDIAPI-S3` is a plugin for the `TSDIAPI-Server` framework that provides seamless integration with AWS S3 for file storage and management. It includes utilities for uploading, retrieving, and deleting files in both public and private S3 buckets, along with support for generating presigned URLs for secure file access.

---

## Key Features

- **Public and Private Buckets:** Easily manage files in separate public and private S3 buckets.
- **Presigned URLs:** Generate time-limited access URLs for secure file sharing.
- **File Uploads:** Upload files using buffers or directly from `Multer`.
- **File Deletion:** Delete files from S3 buckets with minimal effort.
- **Multiple File Support:** Batch upload functionality for both public and private buckets.
- **Customizable Configuration:** Configure bucket names, AWS credentials, and regions to suit your needs.
- **Class Validator Compatibility:** Includes DTOs for better schema validation and response management.

---

## Installation

To install the plugin, run:

```bash
npm install tsdiapi-s3
```

---

Here’s the updated section:

## Usage

### Register the Plugin

In your `TSDIAPI-Server` application, import and register the plugin:

```typescript
import createPlugin from "tsdiapi-s3";
import { createApp } from "tsdiapi-server";

createApp({
  plugins: [
    createPlugin({
      publicBucketName: "your-public-bucket", // Optional if defined in ENV (AWS_PUBLIC_BUCKET_NAME)
      privateBucketName: "your-private-bucket", // Optional if defined in ENV (AWS_PRIVATE_BUCKET_NAME)
      accessKeyId: "your-access-key-id", // Optional if defined in ENV (AWS_ACCESS_KEY_ID)
      secretAccessKey: "your-secret-access-key", // Optional if defined in ENV (AWS_SECRET_ACCESS_KEY)
      region: "your-region", // Optional if defined in ENV (AWS_REGION)
    }),
  ],
});
```

### Alternative: Use Environment Variables

You can also define the configuration keys in your project's `.env` file. The plugin will automatically pick up these values:

```dotenv
AWS_PUBLIC_BUCKET_NAME=your-public-bucket
AWS_PRIVATE_BUCKET_NAME=your-private-bucket
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=your-region
```

This approach allows you to avoid hardcoding sensitive information in your code. If both the `.env` configuration and the plugin options are provided, the plugin options take precedence.

### Plugin Configuration Options

| Option              | Description                   | Required |
| ------------------- | ----------------------------- | -------- |
| `publicBucketName`  | Name of the public S3 bucket  | No       |
| `privateBucketName` | Name of the private S3 bucket | No       |
| `accessKeyId`       | AWS access key ID             | Yes      |
| `secretAccessKey`   | AWS secret access key         | Yes      |
| `region`            | AWS region                    | Yes      |

---

## API Methods

### Upload a File

Uploads a single file to the public or private S3 bucket.

```typescript
import { s3Client } from "tsdiapi-s3";

const response = await s3Client.uploadToS3(
  {
    buffer: fileBuffer,
    mimetype: "image/png",
    originalname: "example.png",
  },
  false
); // Set to true for private bucket

console.log(response.url); // Public or presigned URL
```

### Upload Multiple Files

```typescript
const responses = await s3Client.uploadFiles(fileArray); // For public bucket
const privateResponses = await s3Client.uploadPrivateFiles(fileArray); // For private bucket
```

### Delete a File

```typescript
await s3Client.deleteFromS3("path/to/file.png", false); // false for public bucket
```

### Get a Presigned URL

```typescript
const presignedUrl = await s3Client.getPresignedUrl("path/to/file.png", true); // true for private bucket
```

### Get Public URL

```typescript
const publicUrl = s3Client.getPublicURL("path/to/file.png");
```

---

## Example Use Case

Here’s how you can use `TSDIAPI-S3` to upload and manage files in your API:

1. **Upload a File:**

   Use the provided methods to upload files to either public or private S3 buckets, depending on your application's requirements.

2. **Generate Secure URLs:**

   For private files, generate presigned URLs to share secure access with limited expiration time.

3. **Batch File Uploads:**

   Easily upload multiple files to S3 and retrieve their URLs for further processing.

---

## Error Handling

All methods include robust error handling, logging issues in file uploads, deletions, or retrievals.

Example:

```typescript
try {
  const response = await s3Client.uploadToS3({
    buffer: fileBuffer,
    mimetype: "application/pdf",
    originalname: "example.pdf",
  });
  console.log("File uploaded successfully:", response);
} catch (error) {
  console.error("File upload failed:", error);
}
```

---

## Contributing

Feel free to submit issues or feature requests via [GitHub Issues](https://github.com/unbywyd/tsdiapi-s3/issues). Pull requests are welcome!

---

## License

`TSDIAPI-S3` is open-sourced software licensed under the [MIT license](LICENSE).

---

## About the Author

**Artyom Gorlovetskiy**

- GitHub: [@unbywyd](https://github.com/unbywyd)
- Email: [unbywyd@gmail.com](mailto:unbywyd@gmail.com)

```

```
