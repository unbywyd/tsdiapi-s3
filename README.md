# @tsdiapi/s3

**@tsdiapi/s3** is a plugin for the **TSDIAPI-Server** framework that enables seamless file management with AWS S3. It supports both public and private bucket configurations, allowing you to upload, retrieve, delete files, and generate presigned URLs with ease.

---

## Features

- **Public and Private Buckets**: Manage files separately across public and private S3 buckets.
- **Presigned URLs**: Generate time-limited URLs for secure access to private files.
- **File Uploads**: Upload single or multiple files using buffers or file objects.
- **File Deletion**: Delete files from both public and private buckets.
- **Handlebars Template Support**: Use templating for file management workflows.
- **Flexible Configuration**: Supports both inline configuration and environment variables for AWS credentials and bucket details.

---

## Installation

```bash
npm install @tsdiapi/s3
```

Alternatively, use the CLI tool to add the plugin:

```bash
tsdiapi add plugin s3
```

---

## Usage

### Register the Plugin

Add the plugin to your **TSDIAPI-Server** setup:

```typescript
import { createApp } from "@tsdiapi/server";
import createPlugin from "@tsdiapi/s3";

createApp({
  plugins: [
    createPlugin({
      provider: "s3",
      publicBucketName: "your-public-bucket",
      privateBucketName: "your-private-bucket",
      accessKeyId: "your-access-key-id",
      secretAccessKey: "your-secret-access-key",
      region: "your-region",
    }),
  ],
});
```

### Environment Variables Setup

Alternatively, you can use `.env` configuration to avoid hardcoding sensitive data:

```env
AWS_PUBLIC_BUCKET_NAME=your-public-bucket
AWS_PRIVATE_BUCKET_NAME=your-private-bucket
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=your-region
```

### Plugin Options

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

```typescript
import { s3Client } from "@tsdiapi/s3";

const response = await s3Client.uploadToS3(
  {
    buffer: fileBuffer,
    mimetype: "image/png",
    originalname: "example.png",
  },
  false // Use `true` for private bucket
);

console.log(response.url);
```

### Upload Multiple Files

```typescript
const responses = await s3Client.uploadFiles(fileArray);
```

### Delete a File

```typescript
await s3Client.deleteFromS3("path/to/file.png", false);
```

### Generate a Presigned URL

```typescript
const presignedUrl = await s3Client.getPresignedUrl("path/to/file.png", true);
```

### Get Public URL

```typescript
const publicUrl = s3Client.getPublicURL("path/to/file.png");
```

---

## Example Workflow

1. **Upload Files**: Upload files to public or private buckets.
2. **Access Secure Files**: Use presigned URLs to grant secure, temporary access to private files.
3. **Batch Operations**: Handle multiple files at once for efficient management.

---

## Error Handling

All methods are designed with built-in error handling and logging.

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

We welcome contributions! Feel free to submit issues or pull requests to improve the plugin via [GitHub Issues](https://github.com/unbywyd/tsdiapi-s3/issues).

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Author

**Artyom Gorlovetskiy**

- GitHub: [@unbywyd](https://github.com/unbywyd)
- Email: [unbywyd@gmail.com](mailto:unbywyd@gmail.com)
