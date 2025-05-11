import { PrismaClient } from "@generated/prisma/index.js";
import { Type } from "@sinclair/typebox";
import { JWTGuard, useSession } from "@tsdiapi/jwt-auth";
import { usePrisma } from "@tsdiapi/prisma";
import { useS3Provider } from "@tsdiapi/s3";
import { AppContext, response200, response400, ResponseErrorSchema } from "@tsdiapi/server";

export default function UploadModule({ useRoute }: AppContext): void {
    const useS3 = useS3Provider();
    const prisma = usePrisma<PrismaClient>();

    useRoute('files')
        .code(400, ResponseErrorSchema)
        .code(403, ResponseErrorSchema)
        .auth('bearer')
        .guard(JWTGuard())
        .code(200, Type.Object({
            url: Type.String(),
            key: Type.String(),
        }))
        .post('/public/direct/file/upload')
        .description('Upload file')
        .body(Type.Object({
            file: Type.String({
                format: 'binary',
            }),
            deleteKey: Type.Optional(Type.String()),
        }))
        .acceptMultipart()
        .fileOptions({
            maxFileSize: 1024 * 1024 * 100,
            maxFiles: 1,
        })
        .handler(async (req, res) => {
            if (!req.tempFiles) {
                return response400("No file uploaded");
            }
            const deleteKey = req.body.deleteKey;
            if (deleteKey) {
                try {
                    await useS3.deleteFromS3(deleteKey);
                } catch (e) { }
            }

            const results = await useS3.uploadFiles(req.tempFiles?.map(el => {
                return {
                    buffer: el.buffer,
                    mimetype: el.mimetype,
                    originalname: el.filename,
                }
            }));

            return response200({
                url: results[0].url,
                key: results[0].key,
            });
        })
        .build();

    useRoute('files')
        .code(400, ResponseErrorSchema)
        .code(403, ResponseErrorSchema)
        .auth('bearer')
        .guard(JWTGuard())
        .code(200, Type.Object({
            status: Type.Boolean(),
        }))
        .delete('/public/direct/file')
        .description('Delete file')
        .body(Type.Object({
            key: Type.String(),
        }))
        .handler(async (req, res) => {
            const deleteKey = req.body.key;
            if (deleteKey) {
                try {
                    await useS3.deleteFromS3(deleteKey);
                } catch (e) { }
            }

            return response200({
                status: true,
            });
        })
        .build();



    useRoute('files')
        .code(200, Type.Object({
            status: Type.Boolean(),
        }))
        .code(400, ResponseErrorSchema)
        .code(403, ResponseErrorSchema)
        .auth('bearer')
        .guard(JWTGuard())
        .delete('/upload/public')
        .body(Type.Object({
            keys: Type.Optional(Type.Array(Type.String())),
            urls: Type.Optional(Type.Array(Type.String())),
        }))
        .handler(async (req, res) => {
            const session = useSession<{ id?: string, userId?: string, adminId?: string }>(req);
            const sessionId = session?.id || session?.adminId || session?.userId;
            const isAdmin = session?.adminId;
            if (!req.body.keys && !req.body.urls) {
                return response400("No keys provided");
            }
            if (req.body.keys) {
                for (const key of req.body.keys) {
                    try {
                        await useS3.deleteFromS3(key);
                    } catch (error) {
                    }
                }
                try {
                    await prisma.file.deleteMany({
                        where: {
                            key: {
                                in: req.body.keys,
                            },
                        },
                    });
                } catch (error) {
                }
            }
            if (req.body.urls) {
                const files = await prisma.file.findMany({
                    where: {
                        url: {
                            in: req.body.urls,
                        },
                    },
                });
                for (const file of files) {
                    if (isAdmin || file.ownerId === sessionId || file.ownerId === 'common') {
                        try {
                            await useS3.deleteFromS3(file.key);
                            await prisma.file.delete({
                                where: {
                                    id: file.id,
                                },
                            });
                        } catch (error) {
                        }
                    }
                }
            }
            return response200({
                status: true,
            });
        })
        .build()

    useRoute('files')
        .code(400, ResponseErrorSchema)
        .code(403, ResponseErrorSchema)
        .auth('bearer')
        .guard(JWTGuard())
        .code(200, Type.Array(Type.Object({
            url: Type.String(),
            key: Type.String(),
            bucket: Type.String(),
            region: Type.String(),
            size: Type.Number(),
            mimeType: Type.String(),
            extension: Type.String(),
            name: Type.String(),
            ownerId: Type.Optional(Type.String()),
        })))
        .post('/upload/public/images')
        .description('Upload public images')
        .body(Type.Object({
            files: Type.Array(Type.String({
                format: 'binary',
            })),
            deleteKeys: Type.Optional(Type.Array(Type.String())),
            deleteUrls: Type.Optional(Type.Array(Type.String())),
        }))
        .acceptMultipart()
        .fileOptions({
            accept: ['image/*'],
            maxFileSize: 1024 * 1024 * 10,
            maxFiles: 10,
        })
        .handler(async (req, res) => {
            const session = useSession<{ id?: string, userId?: string, adminId?: string }>(req);
            if (!req.tempFiles) {
                return response400("No file uploaded");
            }
            const deleteKeys = req.body.deleteKeys || [];
            if (deleteKeys.length > 0) {
                try {
                    for (const key of deleteKeys) {
                        await useS3.deleteFromS3(key);
                    }
                    await prisma.file.deleteMany({
                        where: {
                            key: {
                                in: deleteKeys,
                            },
                        },
                    });
                } catch (e) { }
            }

            const deleteUrls = req.body.deleteUrls || [];
            if (deleteUrls.length > 0) {
                try {
                    const files = await prisma.file.findMany({
                        where: {
                            url: {
                                in: deleteUrls,
                            },
                        },
                    });
                    for (const file of files) {
                        await useS3.deleteFromS3(file.key);
                        await prisma.file.delete({
                            where: {
                                id: file.id,
                            },
                        });
                    }
                } catch (e) {

                }
            }



            const results = await useS3.uploadFiles(req.tempFiles?.map(el => {
                return {
                    buffer: el.buffer,
                    mimetype: el.mimetype,
                    originalname: el.filename,
                }
            }));

            await prisma.file.createMany({
                data: results.map(el => {
                    return {
                        name: el.meta?.name!,
                        ownerId: session?.id || session?.adminId || session?.userId || null,
                        url: el.url,
                        key: el.key,
                        bucket: el.bucket,
                        region: el.region,
                        size: el.meta?.size!,
                        mimeType: el.meta?.type!,
                        extension: el.meta?.extension!,
                    }
                })
            })

            return response200(results.map(el => {
                return {
                    url: el.url,
                    key: el.key,
                    bucket: el.bucket,
                    region: el.region,
                    size: el.meta?.size!,
                    mimeType: el.meta?.type!,
                    extension: el.meta?.extension!,
                    name: el.meta?.name!,
                    ownerId: session?.id || session?.adminId || session?.userId || null,
                }
            }))
        })
        .build();

    useRoute('files')
        .code(403, ResponseErrorSchema)
        .code(200, Type.Array(Type.Object({
            url: Type.String(),
            key: Type.String(),
            bucket: Type.String(),
            region: Type.String(),
            size: Type.Number(),
            mimeType: Type.String(),
            extension: Type.String(),
            name: Type.String(),
            ownerId: Type.Optional(Type.String()),
        })))
        .code(400, ResponseErrorSchema)
        .auth('bearer')
        .guard(JWTGuard())
        .post('/upload/public/documents')
        .body(Type.Object({
            files: Type.Array(Type.String({
                format: 'binary',
            })),
            deleteKeys: Type.Optional(Type.Array(Type.String())),
        }))
        .acceptMultipart()
        .fileOptions({
            accept: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
            maxFileSize: 1024 * 1024 * 50,
            maxFiles: 10,
        })
        .description('Upload public documents')
        .handler(async (req, res) => {
            const session = useSession<{ id?: string, userId?: string, adminId?: string }>(req);
            if (!req.tempFiles) {
                return response400("No file uploaded");
            }

            const deleteKeys = req.body.deleteKeys || [];
            if (deleteKeys.length > 0) {
                try {
                    for (const key of deleteKeys) {
                        await useS3.deleteFromS3(key);
                    }
                    await prisma.file.deleteMany({
                        where: {
                            key: {
                                in: deleteKeys,
                            },
                        },
                    });
                } catch (e) { }
            }

            const results = await useS3.uploadFiles(req.tempFiles?.map(el => {
                return {
                    buffer: el.buffer,
                    mimetype: el.mimetype,
                    originalname: el.filename,
                }
            }));

            await prisma.file.createMany({
                data: results.map(el => {
                    return {
                        name: el.meta?.name!,
                        ownerId: session?.id || session?.adminId || session?.userId || null,
                        url: el.url,
                        key: el.key,
                        bucket: el.bucket,
                        region: el.region,
                        size: el.meta?.size!,
                        mimeType: el.meta?.type!,
                        extension: el.meta?.extension!,
                    }
                })
            })

            return response200(results.map(el => {
                return {
                    url: el.url,
                    key: el.key,
                    bucket: el.bucket,
                    region: el.region,
                    size: el.meta?.size!,
                    mimeType: el.meta?.type!,
                    extension: el.meta?.extension!,
                    name: el.meta?.name!,
                    ownerId: session?.id || session?.adminId || session?.userId || null,
                }
            }))
        })
        .build();

    useRoute('files')
        .code(403, ResponseErrorSchema)
        .code(200, Type.Array(Type.Object({
            url: Type.String(),
            key: Type.String(),
            bucket: Type.String(),
            region: Type.String(),
            size: Type.Number(),
            mimeType: Type.String(),
            extension: Type.String(),
            name: Type.String(),
            ownerId: Type.Optional(Type.String()),
        })))
        .code(400, ResponseErrorSchema)
        .auth('bearer')
        .guard(JWTGuard())
        .post('/upload/public/media')
        .body(Type.Object({
            files: Type.Array(Type.String({
                format: 'binary',
            })),
            deleteKeys: Type.Optional(Type.Array(Type.String())),
        }))
        .acceptMultipart()
        .fileOptions({
            accept: ['video/*', 'audio/*'],
            maxFileSize: 1024 * 1024 * 50,
            maxFiles: 10,
        })
        .description('Upload public media')
        .handler(async (req, res) => {
            const session = useSession<{ id?: string, userId?: string, adminId?: string }>(req);
            if (!req.tempFiles) {
                return response400("No file uploaded");
            }
            const deleteKeys = req.body.deleteKeys || [];
            if (deleteKeys.length > 0) {
                try {
                    for (const key of deleteKeys) {
                        await useS3.deleteFromS3(key);
                    }
                    await prisma.file.deleteMany({
                        where: {
                            key: {
                                in: deleteKeys,
                            },
                        },
                    });
                } catch (e) { }
            }

            const results = await useS3.uploadFiles(req.tempFiles?.map(el => {
                return {
                    buffer: el.buffer,
                    mimetype: el.mimetype,
                    originalname: el.filename,
                }
            }));

            await prisma.file.createMany({
                data: results.map(el => {
                    return {
                        name: el.meta?.name!,
                        url: el.url,
                        key: el.key,
                        bucket: el.bucket,
                        region: el.region,
                        size: el.meta?.size!,
                        mimeType: el.meta?.type!,
                        extension: el.meta?.extension!,
                        ownerId: session?.id || session?.adminId || session?.userId || null,
                    }
                })
            })

            return response200(results.map(el => {
                return {
                    url: el.url,
                    key: el.key,
                    bucket: el.bucket,
                    region: el.region,
                    size: el.meta?.size!,
                    mimeType: el.meta?.type!,
                    extension: el.meta?.extension!,
                    name: el.meta?.name!,
                    ownerId: session?.id || session?.adminId || session?.userId || null,
                }
            }))
        })
        .build();
}