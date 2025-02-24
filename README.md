
# **@tsdiapi/s3 – AWS S3 Plugin for TSDIAPI-Server**  

**@tsdiapi/s3** is a plugin for the **TSDIAPI-Server** framework that enables seamless file management with AWS S3. It supports **public and private bucket configurations**, allowing you to **upload, retrieve, delete files, and generate presigned URLs** with ease.

---

## **🚀 Features**  

✅ **Public and Private Buckets** – Manage files separately across public and private S3 buckets.  
✅ **Presigned URLs** – Generate time-limited URLs for secure access to private files.  
✅ **File Uploads** – Upload single or multiple files using buffers or file objects.  
✅ **File Deletion** – Remove files from both public and private buckets.  
✅ **Flexible Configuration** – Use inline options or environment variables for AWS credentials and bucket details.  
✅ **Global Provider Access** – Use `getS3Provider()` to access S3 services from anywhere in your app.  

---

## **📦 Installation**  

### **Install via NPM**  
```sh
npm install @tsdiapi/s3
```

### **Or Use the CLI**  
```sh
tsdiapi plugins add s3
```

---

## **🔧 Configuration & Usage**  

### **Registering the Plugin in TSDIAPI**  

Add the plugin to your **TSDIAPI-Server** setup:

```typescript
import { createApp } from "@tsdiapi/server";
import createPlugin from "@tsdiapi/s3";

createApp({
  plugins: [
    createPlugin({
      publicBucketName: "your-public-bucket",
      privateBucketName: "your-private-bucket",
      accessKeyId: "your-access-key-id",
      secretAccessKey: "your-secret-access-key",
      region: "your-region",
      customHost: "your-custom-host", // Optional (CDN or custom domain)
    }),
  ],
});
```

### **Alternatively, Configure via Environment Variables**  

Instead of hardcoding credentials, use `.env` variables:

```env
AWS_PUBLIC_BUCKET_NAME=your-public-bucket
AWS_PRIVATE_BUCKET_NAME=your-private-bucket
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=your-region
AWS_CUSTOM_HOST=your-custom-host
```

Then initialize without passing options:  
```typescript
import createPlugin from "@tsdiapi/s3";
import { createApp } from "@tsdiapi/server";

createApp({
  plugins: [createPlugin()],
});
```

---

## **⚙️ Plugin Options**  

| Option              | Description                                  | Required |
| ------------------- | -------------------------------------------- | -------- |
| `publicBucketName`  | Name of the public S3 bucket                | No       |
| `privateBucketName` | Name of the private S3 bucket               | No       |
| `accessKeyId`       | AWS access key ID                           | Yes      |
| `secretAccessKey`   | AWS secret access key                       | Yes      |
| `region`            | AWS region                                  | Yes      |
| `customHost`        | Custom host or CDN URL                      | No       |

> **Note:** At least one of `publicBucketName` or `privateBucketName` **must be set**.

---

## **🛠 API Methods**  

### **1️⃣ Upload a File**  
```typescript
import { getS3Provider } from "@tsdiapi/s3";

const s3 = getS3Provider();
const response = await s3.uploadFile(
  "your-public-bucket",
  "example.png",
  fileBuffer,
  "image/png"
);

console.log(response.url);
```

### **2️⃣ Upload Multiple Files**  
```typescript
const responses = await getS3Provider().uploadFiles(fileArray);
```

### **3️⃣ Delete a File**  
```typescript
await getS3Provider().deleteFile("path/to/file.png", false);
```

### **4️⃣ Generate a Presigned URL**  
```typescript
const presignedUrl = await getS3Provider().getPresignedUrl("path/to/file.png", true);
```

### **5️⃣ Get Public URL**  
```typescript
const publicUrl = getS3Provider().getPublicURL("path/to/file.png");
```

---

## **🔄 Example Workflow**  

1️⃣ **Upload Files** → Upload files to public or private buckets.  
2️⃣ **Access Secure Files** → Use presigned URLs to grant secure, temporary access to private files.  
3️⃣ **Batch Operations** → Upload and manage multiple files at once.  

---

## **⚠️ Error Handling**  

All methods include built-in error handling and logging:

```typescript
try {
  const response = await getS3Provider().uploadFile(
    "your-public-bucket",
    "example.pdf",
    fileBuffer,
    "application/pdf"
  );
  console.log("File uploaded successfully:", response);
} catch (error) {
  console.error("File upload failed:", error);
}
```

---

## **🌐 Standalone Usage (Without TSDIAPI)**  

You can also use `@tsdiapi/s3` **outside of TSDIAPI-Server**:

```typescript
import { S3Provider } from "@tsdiapi/s3";

const s3 = new S3Provider();
s3.init({
    accessKeyId: "your-access-key",
    secretAccessKey: "your-secret-key",
    region: "your-region",
});

await s3.uploadFile("your-bucket", "example.txt", Buffer.from("Hello, S3!"), "text/plain");
```

---

## **🚀 Why Use @tsdiapi/s3?**  

- 🔥 **Easy AWS S3 Integration** – No complex setup required.  
- 🔄 **Works Inside & Outside TSDIAPI** – Flexible plugin design.  
- 🏆 **Full Feature Set** – Upload, delete, presigned URLs, and more.  
- 📌 **Secure & Configurable** – Supports `.env` and custom authentication.  

---

## **📢 Contributing**  

We welcome contributions! If you have **feature requests or bug reports**, submit them via  
👉 [GitHub Issues](https://github.com/unbywyd/tsdiapi-s3/issues).  

---

## **📜 License**  

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## **👨‍💻 Author**  

**Artyom Gorlovetskiy**  

📌 GitHub: [@unbywyd](https://github.com/unbywyd)  
📩 Email: [unbywyd@gmail.com](mailto:unbywyd@gmail.com)  

---

### ✅ **Now you're ready to manage files with AWS S3 using @tsdiapi/s3!** 🚀  

