"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePost = exports.addPost = void 0;
const globals_1 = require("../globals");
const helpers_1 = require("../helpers");
/*
 * Adds a post reply to the given thread.
 */
function addPost(params, files, includeSensitiveData = false) {
    return __awaiter(this, void 0, void 0, function* () {
        // Update stat object to obtain post ID.
        const stat = yield globals_1.prisma.stat.update({
            where: {
                key: 'PostCount',
            },
            data: {
                value: {
                    increment: 1,
                },
            },
        });
        const postId = stat.value;
        if (!postId) {
            throw new Error(`Error incrementing post counter. prisma.stat.update() returned ${JSON.stringify(stat)}`);
        }
        let bodyMd = null;
        let bodyHtml = null;
        let references = null;
        if (params.body) {
            const { original, rendered, metadata } = helpers_1.render(params.body);
            bodyMd = original;
            bodyHtml = rendered;
            if (metadata.references) {
                references = Array.from(metadata.references);
            }
        }
        const data = {
            id: postId,
            ipAddress: params.ipAddress,
            name: params.name,
            authorId: params.authorId,
            tripcode: params.tripcode,
            sage: params.sage,
            bodyMd,
            bodyHtml,
            bannedForThisPost: false,
            rootPost: {
                connect: {
                    id: params.threadId,
                },
            },
            thread: {
                connect: {
                    id: params.threadId,
                },
            },
            board: {
                connect: {
                    id: params.boardId,
                },
            },
        };
        if (files === null || files === void 0 ? void 0 : files.length) {
            data.files = {
                connectOrCreate: files.map((file) => {
                    return {
                        where: {
                            id: file.id,
                        },
                        create: {
                            id: file.id,
                            size: file.size,
                            filename: file.filename,
                            mimetype: file.mimetype,
                            nsfw: file.nsfw,
                        },
                    };
                }),
            };
        }
        if (params.userId) {
            data.user = {
                connect: {
                    id: params.userId,
                },
            };
        }
        // Create the post (and the files).
        const post = (yield globals_1.prisma.post.create({
            data,
            include: {
                files: true,
                referencedBy: {
                    select: {
                        id: true,
                    },
                },
            },
        }));
        if (!includeSensitiveData) {
            // Delete ipAddress field.
            delete post.ipAddress;
        }
        if (!params.sage) {
            // Bump the thread.
            yield globals_1.prisma.thread.update({
                where: {
                    id: params.threadId,
                },
                data: {
                    bumpedAt: new Date(),
                },
            });
        }
        // If there are references, connect them.
        if (references) {
            for (const id of references) {
                try {
                    yield globals_1.prisma.post.update({
                        where: {
                            id: post.id,
                        },
                        data: {
                            references: {
                                connect: [{ id: id }],
                            },
                        },
                    });
                }
                catch (error) {
                    // Likely thrown because the referenced ID does not exist.
                }
            }
        }
        return post;
    });
}
exports.addPost = addPost;
/*
 * Deletes a post.
 */
function deletePost(params) {
    return __awaiter(this, void 0, void 0, function* () {
        if (params.deleteOnAllBoards) {
            // Delete all posts by this IP across all boards.
            yield globals_1.prisma.post.deleteMany({
                where: {
                    ipAddress: params.ipAddress,
                },
            });
            globals_1.logger.debug(`Deleted all posts by ${params.ipAddress}`);
        }
        else if (params.deleteOnBoard) {
            // Delete all posts by this IP on the given board.
            yield globals_1.prisma.post.deleteMany({
                where: {
                    ipAddress: params.ipAddress,
                    boardId: params.boardId,
                },
            });
            globals_1.logger.debug(`Deleted all posts by ${params.ipAddress} on /${params.boardId}/`);
        }
        else {
            // Delete one post.
            yield globals_1.prisma.post.delete({
                where: {
                    id: params.postId,
                },
            });
            globals_1.logger.debug(`Deleted post ${params.postId}`);
        }
    });
}
exports.deletePost = deletePost;
