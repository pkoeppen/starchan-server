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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var client_1 = require("@prisma/client");
var bcrypt_1 = __importDefault(require("bcrypt"));
var crypto_1 = __importDefault(require("crypto"));
var faker_1 = __importDefault(require("faker"));
var helpers_1 = require("../src/helpers");
var prisma = new client_1.PrismaClient();
var boards = [
    { boardId: 'b', title: 'Random' },
    { boardId: 'g', title: 'Technology' },
    { boardId: 'gif', title: 'Gif & Video' },
    { boardId: 'k', title: 'Weapons' },
    { boardId: 'pol', title: 'Politics' },
    { boardId: 'v', title: 'Video Games' },
    { boardId: 'x', title: 'Paranormal' },
];
var counter = 0;
var ipAddresses = Array.from({ length: 10 }).map(generateIpAddress);
/*
 * Main function.
 */
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var start;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    start = Date.now();
                    return [4 /*yield*/, prisma.board.deleteMany()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, prisma.thread.deleteMany({})];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, prisma.post.deleteMany({})];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, prisma.file.deleteMany({})];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, prisma.user.deleteMany({})];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, prisma.role.deleteMany({})];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, seedStats()];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, seedBoards()];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, seedThreads()];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, seedUsers()];
                case 10:
                    _a.sent();
                    // Update stat object to last post ID.
                    return [4 /*yield*/, prisma.stat.update({
                            where: {
                                key: 'PostCount'
                            },
                            data: {
                                value: counter
                            }
                        })];
                case 11:
                    // Update stat object to last post ID.
                    _a.sent();
                    console.log('Elapsed:', (Date.now() - start) / 1000);
                    return [2 /*return*/];
            }
        });
    });
}
main()["catch"](function (error) {
    console.error(error);
    process.exit(1);
})["finally"](function () {
    process.exit();
});
/*
 * Seeds stat counters.
 */
function seedStats() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.stat.create({
                        data: {
                            key: 'PostCount',
                            value: 0
                        }
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/*
 * Seeds boards.
 */
function seedBoards() {
    return __awaiter(this, void 0, void 0, function () {
        var _i, boards_1, _a, boardId, title;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: 
                // Create site owner role.
                return [4 /*yield*/, prisma.role.create({
                        data: {
                            level: client_1.PermissionLevel.OWNER
                        }
                    })];
                case 1:
                    // Create site owner role.
                    _b.sent();
                    _i = 0, boards_1 = boards;
                    _b.label = 2;
                case 2:
                    if (!(_i < boards_1.length)) return [3 /*break*/, 6];
                    _a = boards_1[_i], boardId = _a.boardId, title = _a.title;
                    // Seed the board.
                    return [4 /*yield*/, prisma.board.create({
                            data: {
                                id: boardId,
                                title: title
                            }
                        })];
                case 3:
                    // Seed the board.
                    _b.sent();
                    // Seed roles for this board.
                    return [4 /*yield*/, prisma.role.createMany({
                            data: [
                                {
                                    boardId: boardId,
                                    level: client_1.PermissionLevel.ADMIN
                                },
                                {
                                    boardId: boardId,
                                    level: client_1.PermissionLevel.MODERATOR
                                },
                                {
                                    boardId: boardId,
                                    level: client_1.PermissionLevel.JANITOR
                                },
                            ]
                        })];
                case 4:
                    // Seed roles for this board.
                    _b.sent();
                    console.log("Seeded board /" + boardId + "/");
                    _b.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 2];
                case 6: return [2 /*return*/];
            }
        });
    });
}
/*
 * Seeds threads.
 */
function seedThreads() {
    return __awaiter(this, void 0, void 0, function () {
        var _i, boards_2, boardId, i, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _i = 0, boards_2 = boards;
                    _a.label = 1;
                case 1:
                    if (!(_i < boards_2.length)) return [3 /*break*/, 10];
                    boardId = boards_2[_i].boardId;
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < 3)) return [3 /*break*/, 5];
                    return [4 /*yield*/, seedThread({
                            title: faker_1["default"].lorem.sentence(),
                            boardId: boardId,
                            sticky: true,
                            locked: false,
                            anchored: false,
                            cycle: false,
                            archived: false
                        })];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 2];
                case 5:
                    i = 0;
                    _a.label = 6;
                case 6:
                    if (!(i < 17)) return [3 /*break*/, 9];
                    return [4 /*yield*/, seedThread({
                            title: faker_1["default"].lorem.sentence(),
                            boardId: boardId,
                            sticky: false,
                            locked: percentChance(10),
                            anchored: percentChance(10),
                            cycle: percentChance(10),
                            archived: false
                        })];
                case 7:
                    _a.sent();
                    _a.label = 8;
                case 8:
                    i++;
                    return [3 /*break*/, 6];
                case 9:
                    _i++;
                    return [3 /*break*/, 1];
                case 10: return [2 /*return*/];
            }
        });
    });
}
/*
 * Seeds one thread.
 */
function seedThread(params) {
    return __awaiter(this, void 0, void 0, function () {
        var threadId, ipAddress, authorId, bodyMd, bodyHtml, date, bodyMdFormatting, bodyHtmlFormatting;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    threadId = ++counter;
                    ipAddress = getRandomIpAddress();
                    authorId = crypto_1["default"]
                        .createHash('sha256')
                        .update(ipAddress + threadId)
                        .digest('hex');
                    bodyMd = generateRandomPostBody();
                    bodyHtml = helpers_1.render(bodyMd).rendered;
                    return [4 /*yield*/, prisma.post.create({
                            data: {
                                id: threadId,
                                ipAddress: ipAddress,
                                name: 'Anonymous',
                                authorId: authorId,
                                tripcode: undefined,
                                bodyMd: bodyMd,
                                bodyHtml: bodyHtml,
                                bannedForThisPost: percentChance(5),
                                board: {
                                    connect: {
                                        id: params.boardId
                                    }
                                },
                                files: {
                                    connectOrCreate: getRandomFiles().map(function (file) {
                                        return {
                                            where: {
                                                id: file.id
                                            },
                                            create: {
                                                id: file.id,
                                                size: file.size,
                                                filename: file.filename,
                                                mimetype: file.mimetype,
                                                nsfw: file.nsfw
                                            }
                                        };
                                    })
                                }
                            }
                        })];
                case 1:
                    _a.sent();
                    date = new Date();
                    date.setHours(date.getHours() - random(0, 6));
                    // Create thread.
                    return [4 /*yield*/, prisma.thread.create({
                            data: {
                                id: threadId,
                                title: params.title,
                                sticky: params.sticky,
                                locked: params.locked,
                                anchored: params.anchored,
                                cycle: params.cycle,
                                archived: params.archived,
                                bumpedAt: date,
                                rootPost: {
                                    connect: {
                                        id: threadId
                                    }
                                },
                                board: {
                                    connect: {
                                        id: params.boardId
                                    }
                                }
                            }
                        })];
                case 2:
                    // Create thread.
                    _a.sent();
                    bodyMdFormatting = [
                        '*bold*',
                        '/italic/',
                        '_underline_',
                        '~strikethrough~',
                        '`code`',
                        '^sup^',
                        '¡sub¡',
                        '[spoiler]',
                        '>greentext',
                        '<redtext',
                        '(((echoes)))',
                        '>>123',
                        'Here is a footnote[ref 1 https://google.com "Some Article Title"].',
                    ].join('\n');
                    bodyHtmlFormatting = helpers_1.render(bodyMdFormatting).rendered;
                    return [4 /*yield*/, prisma.post.create({
                            data: {
                                id: ++counter,
                                thread: {
                                    connect: {
                                        id: threadId
                                    }
                                },
                                rootPost: {
                                    connect: {
                                        id: threadId
                                    }
                                },
                                board: {
                                    connect: {
                                        id: params.boardId
                                    }
                                },
                                ipAddress: ipAddress,
                                name: 'Anonymous',
                                authorId: authorId,
                                tripcode: undefined,
                                bodyMd: bodyMdFormatting,
                                bodyHtml: bodyHtmlFormatting,
                                bannedForThisPost: percentChance(5)
                            }
                        })];
                case 3:
                    _a.sent();
                    // Create reply posts.
                    return [4 /*yield*/, prisma.post.createMany({
                            data: Array.from({ length: random(1, 250) }).map(function (obj, i) {
                                var ipAddress = getRandomIpAddress();
                                var authorId = crypto_1["default"]
                                    .createHash('sha256')
                                    .update(ipAddress + threadId)
                                    .digest('hex');
                                var bodyMd = generateRandomPostBody();
                                var bodyHtml = helpers_1.render(bodyMd).rendered;
                                return {
                                    id: ++counter,
                                    rootPostId: threadId,
                                    threadId: threadId,
                                    boardId: params.boardId,
                                    ipAddress: ipAddress,
                                    sage: percentChance(5),
                                    name: 'Anonymous',
                                    authorId: authorId,
                                    tripcode: undefined,
                                    bodyMd: bodyMd,
                                    bodyHtml: bodyHtml,
                                    bannedForThisPost: percentChance(5)
                                };
                            })
                        })];
                case 4:
                    // Create reply posts.
                    _a.sent();
                    console.log("Seeded thread /" + params.boardId + "/" + threadId + "/");
                    return [2 /*return*/];
            }
        });
    });
}
/*
 * Seeds user users.
 */
function seedUsers() {
    return __awaiter(this, void 0, void 0, function () {
        var users, _i, users_1, user, salt, password, data, role, roles;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    users = [
                        {
                            email: 'owner@starchan.org',
                            password: 'password',
                            username: 'asterisk',
                            permissionLevel: client_1.PermissionLevel.OWNER
                        },
                        {
                            email: 'admin@starchan.org',
                            password: 'password',
                            username: 'admin',
                            permissionLevel: client_1.PermissionLevel.ADMIN
                        },
                        {
                            email: 'moderator@starchan.org',
                            password: 'password',
                            username: 'moderator',
                            permissionLevel: client_1.PermissionLevel.MODERATOR
                        },
                        {
                            email: 'janitor@starchan.org',
                            password: 'password',
                            username: 'janitor',
                            permissionLevel: client_1.PermissionLevel.JANITOR
                        },
                    ];
                    _i = 0, users_1 = users;
                    _a.label = 1;
                case 1:
                    if (!(_i < users_1.length)) return [3 /*break*/, 8];
                    user = users_1[_i];
                    salt = bcrypt_1["default"].genSaltSync();
                    password = bcrypt_1["default"].hashSync(user.password, salt);
                    data = {
                        email: user.email,
                        username: user.username,
                        salt: salt,
                        password: password
                    };
                    if (!(user.permissionLevel === client_1.PermissionLevel.OWNER)) return [3 /*break*/, 3];
                    return [4 /*yield*/, prisma.role.findFirst({
                            where: {
                                level: client_1.PermissionLevel.OWNER
                            }
                        })];
                case 2:
                    role = _a.sent();
                    data.roles = {
                        connect: [{ id: role === null || role === void 0 ? void 0 : role.id }]
                    };
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, prisma.role.findMany({
                        where: {
                            level: user.permissionLevel
                        }
                    })];
                case 4:
                    roles = _a.sent();
                    data.roles = {
                        connect: roles.map(function (_a) {
                            var id = _a.id;
                            return ({ id: id });
                        })
                    };
                    _a.label = 5;
                case 5: 
                // Seed the user.
                return [4 /*yield*/, prisma.user.create({ data: data })];
                case 6:
                    // Seed the user.
                    _a.sent();
                    console.log("Seeded user " + user.username + " (" + user.email + ")");
                    _a.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 1];
                case 8: return [2 /*return*/];
            }
        });
    });
}
/*
 * Returns a random whole number (min <= n < max) in the given range.
 */
function random(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}
/*
 * Returns true/false based on the given percent chance.
 */
function percentChance(percent) {
    return Math.random() < percent / 100;
}
/*
 * Generates a random IP address in the format ###.###.###.###.
 */
function generateIpAddress() {
    var ipAddress = Array.from({ length: 4 })
        .map(function () { return Math.floor(Math.random() * 255) + 1; })
        .join('.');
    return ipAddress;
}
/*
 * Returns a random IP address.
 */
function getRandomIpAddress() {
    return ipAddresses[random(0, ipAddresses.length)];
}
/*
 * Generates a randomly formatted 'lorem ipsum' post body.
 */
function generateRandomPostBody() {
    var loremIpsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiususer tempor incididunt ut labore et dolore magna aliqua. Ornare arcu odio ut sem nulla pharetra diam sit amet. Amet venenatis urna cursus eget nunc scelerisque. Elementum nisi quis eleifend quam adipiscing vitae proin sagittis nisl. Sem et tortor consequat id. Euisuser nisi porta lorem mollis aliquam ut porttitor. Mi bibendum neque egestas congue quisque. Egestas integer eget aliquet nibh praesent tristique magna sit amet. Vitae ultricies leo integer malesuada nunc. Nunc pulvinar sapien et ligula ullamcorper malesuada proin libero nunc. Neque sodales ut etiam sit. Sollicitudin ac orci phasellus egestas tellus rutrum. Gravida cum sociis natoque penatibus. Potenti nullam ac tortor vitae purus faucibus. Porta non pulvinar neque laoreet suspendisse. Vulputate sapien nec sagittis aliquam malesuada. Malesuada proin libero nunc consequat interdum varius sit. Congue mauris rhoncus aenean vel elit scelerisque mauris pellentesque pulvinar. Erat velit scelerisque in dictum non consectetur a. Nulla posuere sollicitudin aliquam ultrices sagittis. Lectus urna duis convallis convallis tellus. In vitae turpis massa sed elementum tempus egestas. Mi eget mauris pharetra et ultrices neque ornare aenean. Malesuada proin libero nunc consequat interdum varius sit. Feugiat in ante metus dictum at tempor comusero ullamcorper. Non quam lacus suspendisse faucibus. Tempus iaculis urna id volutpat lacus. Et leo duis ut diam quam nulla porttitor massa. Malesuada proin libero nunc consequat. Tellus in metus vulputate eu scelerisque felis imperdiet. Fusce id velit ut tortor pretium. Tristique risus nec feugiat in fermentum posuere urna nec. Leo vel orci porta non pulvinar neque laoreet. Convallis a cras semper auctor neque. Semper risus in hendrerit gravida rutrum quisque. Nibh sed pulvinar proin gravida hendrerit. Amet risus nullam eget felis eget nunc lobortis mattis aliquam. Odio facilisis mauris sit amet massa vitae tortor condimentum. Non nisi est sit amet facilisis. Fermentum dui faucibus in ornare quam viverra orci sagittis. Donec enim diam vulputate ut pharetra sit amet. Nullam ac tortor vitae purus faucibus ornare suspendisse sed. Aliquet enim tortor at auctor urna nunc. Rhoncus urna neque viverra justo nec ultrices dui. Nisl pretium fusce id velit ut. Odio eu feugiat pretium nibh ipsum consequat. Tristique magna sit amet purus gravida quis blandit turpis cursus. Adipiscing bibendum est ultricies integer quis auctor elit sed vulputate. Nulla facilisi nullam vehicula ipsum. Felis imperdiet proin fermentum leo vel orci porta. Id semper risus in hendrerit gravida rutrum. Suspendisse in est ante in nibh mauris cursus. Eu consequat ac felis donec et odio pellentesque. Velit sed ullamcorper morbi tincidunt ornare massa. Donec massa sapien faucibus et molestie ac feugiat. Eget aliquet nibh praesent tristique magna sit amet. Cursus vitae congue mauris rhoncus. Tincidunt ornare massa eget egestas purus. Sed odio morbi quis comusero. Quis vel eros donec ac odio tempor orci dapibus ultrices. Ac tincidunt vitae semper quis lectus. Convallis aenean et tortor at. Cras sed felis eget velit aliquet. Morbi tempus iaculis urna id volutpat lacus laoreet non. Magna fringilla urna porttitor rhoncus dolor purus non enim. Massa massa ultricies mi quis hendrerit dolor magna eget est. Lorem ipsum dolor sit amet consectetur adipiscing elit pellentesque. Nisi est sit amet facilisis magna etiam. Etiam erat velit scelerisque in dictum non. Pulvinar neque laoreet suspendisse interdum consectetur libero id faucibus. Turpis massa sed elementum tempus egestas sed sed. Hendrerit dolor magna eget est lorem ipsum dolor. A diam maecenas sed enim ut sem viverra aliquet. Tortor vitae purus faucibus ornare suspendisse. Pharetra sit amet aliquam id. Est ante in nibh mauris cursus mattis. Scelerisque viverra mauris in aliquam sem fringilla ut. Lacus viverra vitae congue eu consequat ac felis donec et. In pellentesque massa placerat duis ultricies lacus. Id interdum velit laoreet id. Convallis a cras semper auctor neque. Malesuada proin libero nunc consequat interdum varius sit amet mattis. Mattis nunc sed blandit libero volutpat. Id aliquet risus feugiat in ante metus. Lectus proin nibh nisl condimentum id venenatis a. Facilisis leo vel fringilla est. Odio ut enim blandit volutpat maecenas volutpat blandit. Facilisi cras fermentum odio eu feugiat pretium nibh ipsum. Etiam sit amet nisl purus in mollis. Lobortis elementum nibh tellus molestie nunc non. Diam volutpat comusero sed egestas egestas fringilla. Ut tortor pretium viverra suspendisse potenti. Fringilla phasellus faucibus scelerisque eleifend donec pretium vulputate sapien nec. Etiam sit amet nisl purus in mollis nunc sed id. Lorem ipsum dolor sit amet. Ut ornare lectus sit amet est placerat in egestas. Egestas sed tempus urna et pharetra pharetra massa. Quis vel eros donec ac. Morbi tristique senectus et netus et malesuada. Fermentum posuere urna nec tincidunt praesent. Elit duis tristique sollicitudin nibh. Diam donec adipiscing tristique risus nec. Dignissim sodales ut eu sem integer vitae. Malesuada fames ac turpis egestas maecenas pharetra convallis posuere. Ut porttitor leo a diam sollicitudin tempor. Viverra nibh cras pulvinar mattis nunc sed blandit libero. Ut tellus elementum sagittis vitae et leo. Sagittis orci a scelerisque purus semper. Facilisi etiam dignissim diam quis enim lobortis scelerisque fermentum dui. Quam vulputate dignissim suspendisse in est. Integer vitae justo eget magna fermentum iaculis eu non. Mattis rhoncus urna neque viverra justo nec. Quis vel eros donec ac odio tempor. Pellentesque nec nam aliquam sem. Vulputate odio ut enim blandit. Comusero ullamcorper a lacus vestibulum sed arcu non. Non enim praesent elementum facilisis leo. Congue eu consequat ac felis donec et odio. Maecenas accumsan lacus vel facilisis volutpat. Et tortor at risus viverra adipiscing. Vel orci porta non pulvinar neque laoreet suspendisse interdum. Dignissim enim sit amet venenatis urna cursus eget nunc scelerisque. Proin sed libero enim sed faucibus turpis. Orci ac auctor augue mauris augue. Vitae aliquet nec ullamcorper sit amet risus. Mauris in aliquam sem fringilla ut. Aenean vel elit scelerisque mauris pellentesque pulvinar pellentesque. Amet nisl purus in mollis nunc. Porta non pulvinar neque laoreet suspendisse interdum. Tincidunt praesent semper feugiat nibh sed pulvinar proin gravida. Risus comusero viverra maecenas accumsan lacus. Non quam lacus suspendisse faucibus interdum. Mollis nunc sed id semper. Sit amet consectetur adipiscing elit ut. Enim lobortis scelerisque fermentum dui. Quis ipsum suspendisse ultrices gravida dictum fusce. Condimentum vitae sapien pellentesque habitant morbi tristique senectus. Comusero ullamcorper a lacus vestibulum sed arcu. Sem nulla pharetra diam sit amet. Quis hendrerit dolor magna eget est lorem ipsum dolor sit. Mollis aliquam ut porttitor leo. Nunc congue nisi vitae suscipit tellus mauris a. Feugiat nisl pretium fusce id. Nec sagittis aliquam malesuada bibendum. Eu volutpat odio facilisis mauris sit amet massa. Viverra vitae congue eu consequat ac. Dolor magna eget est lorem ipsum dolor sit. Ut venenatis tellus in metus vulputate eu scelerisque. Nibh nisl condimentum id venenatis a condimentum vitae sapien pellentesque. Dui vivamus arcu felis bibendum ut. Id semper risus in hendrerit gravida rutrum quisque non tellus. Scelerisque mauris pellentesque pulvinar pellentesque habitant morbi tristique senectus et. Mattis aliquam faucibus purus in massa tempor nec. Amet nulla facilisi morbi tempus iaculis urna. Semper auctor neque vitae tempus quam pellentesque nec nam aliquam. Interdum varius sit amet mattis vulputate enim nulla aliquet. Elementum tempus egestas sed sed risus pretium quam. Ac ut consequat semper viverra nam. Mattis aliquam faucibus purus in massa. Sit amet comusero nulla facilisi nullam vehicula. Sit amet comusero nulla facilisi nullam vehicula ipsum. Lectus mauris ultrices eros in cursus. Tincidunt dui ut ornare lectus sit amet est. At auctor urna nunc id cursus. Tincidunt id aliquet risus feugiat in ante metus dictum at. Sapien eget mi proin sed libero. Dictum fusce ut placerat orci nulla pellentesque dignissim. Lectus urna duis convallis convallis tellus id interdum. Eget nullam non nisi est sit amet facilisis magna etiam. Vestibulum lorem sed risus ultricies. Vel quam elementum pulvinar etiam. Arcu non odio euisuser lacinia at. Phasellus vestibulum lorem sed risus ultricies tristique nulla aliquet. Nullam eget felis eget nunc lobortis mattis aliquam. Venenatis urna cursus eget nunc scelerisque viverra mauris. Vel risus comusero viverra maecenas accumsan lacus. Sed velit dignissim sodales ut eu sem integer vitae justo. Risus viverra adipiscing at in tellus. Id venenatis a condimentum vitae sapien pellentesque. A arcu cursus vitae congue. At tempor comusero ullamcorper a lacus vestibulum sed. Tristique sollicitudin nibh sit amet comusero nulla facilisi. Gravida neque convallis a cras semper auctor neque vitae tempus. Sit amet aliquam id diam maecenas. Vitae et leo duis ut diam quam nulla porttitor. Odio eu feugiat pretium nibh ipsum consequat. Viverra adipiscing at in tellus integer. Volutpat lacus laoreet non curabitur gravida arcu ac tortor. Libero justo laoreet sit amet cursus. Orci dapibus ultrices in iaculis nunc sed augue. Tortor pretium viverra suspendisse potenti. Eleifend donec pretium vulputate sapien nec sagittis aliquam malesuada. Sapien eget mi proin sed libero. Cras pulvinar mattis nunc sed blandit libero volutpat sed cras. Diam phasellus vestibulum lorem sed risus ultricies tristique nulla. Vitae nunc sed velit dignissim sodales ut eu sem. Enim ut tellus elementum sagittis vitae et. Sed vulputate mi sit amet mauris comusero quis imperdiet. Cursus metus aliquam eleifend mi in nulla posuere. Nulla facilisi etiam dignissim diam quis. Lacus laoreet non curabitur gravida arcu ac. In tellus integer feugiat scelerisque varius morbi enim nunc faucibus. Accumsan sit amet nulla facilisi morbi. Quis imperdiet massa tincidunt nunc pulvinar sapien et. Mauris comusero quis imperdiet massa. Eget nullam non nisi est sit. Dignissim sodales ut eu sem integer vitae justo. Nec ultrices dui sapien eget mi proin sed. At auctor urna nunc id cursus. Posuere ac ut consequat semper. Arcu non odio euisuser lacinia at. Vel pretium lectus quam id leo.";
    var sentences = loremIpsum.split(/\.\s/g);
    // Each post body contains 1 to 5 paragraphs.
    var paragraphCount = random(1, 5);
    var body = [];
    for (var p = 0; p < paragraphCount; p++) {
        var paragraph = [];
        // Each paragraph contains 1 to 10 sentences.
        var sentenceCount = random(1, 10);
        for (var s = 0; s < sentenceCount; s++) {
            var sentence = sentences[random(0, sentences.length)];
            // There is a 10 percent chance that a random word in this
            // sentence will be formatted, randomly.
            if (percentChance(10)) {
                var split = sentence.split(' ');
                var index = random(0, split.length);
                split[index] = randomFormatWord(split[index]);
                sentence = split.join(' ');
            }
            paragraph.push(sentence + '.');
        }
        body.push(paragraph.join(' '));
    }
    return body.join('\n\n');
}
/*
 * Randomly formats the given string.
 */
function randomFormatWord(str) {
    var format = [
        { start: '*', stop: '*' },
        { start: '/', stop: '/' },
        { start: '_', stop: '_' },
        { start: '~', stop: '~' },
        { start: '[', stop: ']' },
        { start: '(((', stop: ')))' },
        { start: '`', stop: '`' },
    ];
    var _a = format[random(0, format.length)], start = _a.start, stop = _a.stop;
    return "" + start + str + stop;
}
/*
 * Generates random file data.
 */
function getRandomFiles(minFileCount) {
    if (minFileCount === void 0) { minFileCount = 1; }
    var fileKeys = [
        'alley.jpg',
        'canyon.jpg',
        'forest.jpg',
        'galaxy.jpg',
        'laptop.jpg',
        'mountains.jpg',
        'river.jpg',
        'sailing.jpg',
        'skateboard.jpg',
        'surfers.jpg',
    ];
    var files = Array.from({ length: random(minFileCount, 5) });
    return files.map(function () {
        var filename = fileKeys[Math.floor(Math.random() * fileKeys.length)];
        return {
            id: filename,
            size: Math.floor(Math.random() * 500000) + 10000,
            filename: filename,
            mimetype: 'image/jpeg',
            nsfw: percentChance(20)
        };
    });
}
//# sourceMappingURL=seed.js.map