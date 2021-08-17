import { PermissionLevel, Prisma, PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import faker from 'faker';
import { render } from '../src/helpers';

const prisma = new PrismaClient();

const boards = [
  { boardId: 'b', title: 'Random' },
  { boardId: 'g', title: 'Technology' },
  { boardId: 'gif', title: 'Gif & Video' },
  { boardId: 'k', title: 'Weapons' },
  { boardId: 'pol', title: 'Politics' },
  { boardId: 'v', title: 'Video Games' },
  { boardId: 'x', title: 'Paranormal' },
];

let counter = 0;

const ipAddresses: string[] = Array.from({ length: 10 }).map(generateIpAddress);

/*
 * Main function.
 */
async function main() {
  const start = Date.now();

  await prisma.board.deleteMany();
  await prisma.thread.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.file.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});

  await seedStats();
  await seedBoards();
  await seedThreads();
  await seedUsers();

  // Update stat object to last post ID.
  await prisma.stat.update({
    where: {
      key: 'PostCount',
    },
    data: {
      value: counter,
    },
  });

  console.log('Elapsed:', (Date.now() - start) / 1000);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    process.exit();
  });

/*
 * Seeds stat counters.
 */
async function seedStats() {
  await prisma.stat.create({
    data: {
      key: 'PostCount',
      value: 0,
    },
  });
}

/*
 * Seeds boards.
 */
async function seedBoards() {
  // Create site owner role.
  await prisma.role.create({
    data: {
      level: PermissionLevel.OWNER,
    },
  });

  for (const { boardId, title } of boards) {
    // Seed the board.
    await prisma.board.create({
      data: {
        id: boardId,
        title,
      },
    });

    // Seed roles for this board.
    await prisma.role.createMany({
      data: [
        {
          boardId,
          level: PermissionLevel.ADMIN,
        },
        {
          boardId,
          level: PermissionLevel.MODERATOR,
        },
        {
          boardId,
          level: PermissionLevel.JANITOR,
        },
      ],
    });

    console.log(`Seeded board /${boardId}/`);
  }
}

/*
 * Seeds threads.
 */
async function seedThreads() {
  for (const { boardId } of boards) {
    // Seed sticky threads.
    for (let i = 0; i < 3; i++) {
      await seedThread({
        title: faker.lorem.sentence(),
        boardId,
        sticky: true,
        locked: false,
        anchored: false,
        cycle: false,
        archived: false,
      });
    }

    // Seed regular threads.
    for (let i = 0; i < 17; i++) {
      await seedThread({
        title: faker.lorem.sentence(),
        boardId,
        sticky: false,
        locked: percentChance(10),
        anchored: percentChance(10),
        cycle: percentChance(10),
        archived: false,
      });
    }
  }
}

/*
 * Seeds one thread.
 */
async function seedThread(params: any) {
  const threadId = ++counter;
  const ipAddress = getRandomIpAddress();
  const authorId = crypto
    .createHash('sha256')
    .update(ipAddress + threadId)
    .digest('hex');

  // Create root post.
  const bodyMd = generateRandomPostBody();
  const { rendered: bodyHtml } = render(bodyMd);
  await prisma.post.create({
    data: {
      id: threadId,
      ipAddress,
      name: 'Anonymous',
      authorId,
      tripcode: undefined,
      bodyMd,
      bodyHtml,
      bannedForThisPost: percentChance(5),
      board: {
        connect: {
          id: params.boardId,
        },
      },
      files: {
        connectOrCreate: getRandomFiles().map((file) => {
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
      },
    },
  });

  // Create thread.
  await prisma.thread.create({
    data: {
      id: threadId,
      title: params.title,
      sticky: params.sticky,
      locked: params.locked,
      anchored: params.anchored,
      cycle: params.cycle,
      archived: params.archived,
      rootPost: {
        connect: {
          id: threadId,
        },
      },
      board: {
        connect: {
          id: params.boardId,
        },
      },
    },
  });

  // Create first reply with all available formatting useres.
  const bodyMdFormatting = [
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
  const { rendered: bodyHtmlFormatting } = render(bodyMdFormatting);
  await prisma.post.create({
    data: {
      id: ++counter,
      thread: {
        connect: {
          id: threadId,
        },
      },
      rootPost: {
        connect: {
          id: threadId,
        },
      },
      board: {
        connect: {
          id: params.boardId,
        },
      },
      ipAddress,
      name: 'Anonymous',
      authorId,
      tripcode: undefined,
      bodyMd: bodyMdFormatting,
      bodyHtml: bodyHtmlFormatting,
      bannedForThisPost: percentChance(5),
    },
  });

  // Create reply posts.
  await prisma.post.createMany({
    data: Array.from({ length: random(1, 250) }).map((obj, i) => {
      const ipAddress = getRandomIpAddress();
      const authorId = crypto
        .createHash('sha256')
        .update(ipAddress + threadId)
        .digest('hex');
      const bodyMd = generateRandomPostBody();
      const { rendered: bodyHtml } = render(bodyMd);
      return {
        id: ++counter,
        rootPostId: threadId,
        threadId: threadId,
        boardId: params.boardId,
        ipAddress,
        name: 'Anonymous',
        authorId,
        tripcode: undefined,
        bodyMd,
        bodyHtml,
        bannedForThisPost: percentChance(5),
      };
    }),
  });

  console.log(`Seeded thread /${params.boardId}/${threadId}/`);
}

/*
 * Seeds user users.
 */
async function seedUsers() {
  const users = [
    {
      email: 'owner@starchan.org',
      password: 'password',
      username: 'asterisk',
      permissionLevel: PermissionLevel.OWNER,
    },
    {
      email: 'admin@starchan.org',
      password: 'password',
      username: 'admin',
      permissionLevel: PermissionLevel.ADMIN,
    },
    {
      email: 'moderator@starchan.org',
      password: 'password',
      username: 'moderator',
      permissionLevel: PermissionLevel.MODERATOR,
    },
    {
      email: 'janitor@starchan.org',
      password: 'password',
      username: 'janitor',
      permissionLevel: PermissionLevel.JANITOR,
    },
  ];

  for (const user of users) {
    const salt = bcrypt.genSaltSync();
    const password = bcrypt.hashSync(user.password, salt);
    const data = {
      email: user.email,
      username: user.username,
      salt,
      password,
    } as Prisma.UserCreateInput;

    if (user.permissionLevel === PermissionLevel.OWNER) {
      // Connect the OWNER role.
      const role = await prisma.role.findFirst({
        where: {
          level: PermissionLevel.OWNER,
        },
      });
      data.roles = {
        connect: [{ id: role?.id }],
      };
    } else {
      // Connect all roles with this user's permission level.
      const roles = await prisma.role.findMany({
        where: {
          level: user.permissionLevel,
        },
      });
      data.roles = {
        connect: roles.map(({ id }) => ({ id })),
      };
    }

    // Seed the user.
    await prisma.user.create({ data });
    console.log(`Seeded user ${user.username} (${user.email})`);
  }
}

/*
 * Returns a random whole number (min <= n < max) in the given range.
 */
function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min) + min);
}

/*
 * Returns true/false based on the given percent chance.
 */
function percentChance(percent: number) {
  return Math.random() < percent / 100;
}

/*
 * Generates a random IP address in the format ###.###.###.###.
 */
function generateIpAddress(): string {
  const ipAddress = Array.from({ length: 4 })
    .map(() => Math.floor(Math.random() * 255) + 1)
    .join('.');
  return ipAddress;
}

/*
 * Returns a random IP address.
 */
function getRandomIpAddress(): string {
  return ipAddresses[random(0, ipAddresses.length)];
}

/*
 * Generates a randomly formatted 'lorem ipsum' post body.
 */
function generateRandomPostBody() {
  const loremIpsum = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiususer tempor incididunt ut labore et dolore magna aliqua. Ornare arcu odio ut sem nulla pharetra diam sit amet. Amet venenatis urna cursus eget nunc scelerisque. Elementum nisi quis eleifend quam adipiscing vitae proin sagittis nisl. Sem et tortor consequat id. Euisuser nisi porta lorem mollis aliquam ut porttitor. Mi bibendum neque egestas congue quisque. Egestas integer eget aliquet nibh praesent tristique magna sit amet. Vitae ultricies leo integer malesuada nunc. Nunc pulvinar sapien et ligula ullamcorper malesuada proin libero nunc. Neque sodales ut etiam sit. Sollicitudin ac orci phasellus egestas tellus rutrum. Gravida cum sociis natoque penatibus. Potenti nullam ac tortor vitae purus faucibus. Porta non pulvinar neque laoreet suspendisse. Vulputate sapien nec sagittis aliquam malesuada. Malesuada proin libero nunc consequat interdum varius sit. Congue mauris rhoncus aenean vel elit scelerisque mauris pellentesque pulvinar. Erat velit scelerisque in dictum non consectetur a. Nulla posuere sollicitudin aliquam ultrices sagittis. Lectus urna duis convallis convallis tellus. In vitae turpis massa sed elementum tempus egestas. Mi eget mauris pharetra et ultrices neque ornare aenean. Malesuada proin libero nunc consequat interdum varius sit. Feugiat in ante metus dictum at tempor comusero ullamcorper. Non quam lacus suspendisse faucibus. Tempus iaculis urna id volutpat lacus. Et leo duis ut diam quam nulla porttitor massa. Malesuada proin libero nunc consequat. Tellus in metus vulputate eu scelerisque felis imperdiet. Fusce id velit ut tortor pretium. Tristique risus nec feugiat in fermentum posuere urna nec. Leo vel orci porta non pulvinar neque laoreet. Convallis a cras semper auctor neque. Semper risus in hendrerit gravida rutrum quisque. Nibh sed pulvinar proin gravida hendrerit. Amet risus nullam eget felis eget nunc lobortis mattis aliquam. Odio facilisis mauris sit amet massa vitae tortor condimentum. Non nisi est sit amet facilisis. Fermentum dui faucibus in ornare quam viverra orci sagittis. Donec enim diam vulputate ut pharetra sit amet. Nullam ac tortor vitae purus faucibus ornare suspendisse sed. Aliquet enim tortor at auctor urna nunc. Rhoncus urna neque viverra justo nec ultrices dui. Nisl pretium fusce id velit ut. Odio eu feugiat pretium nibh ipsum consequat. Tristique magna sit amet purus gravida quis blandit turpis cursus. Adipiscing bibendum est ultricies integer quis auctor elit sed vulputate. Nulla facilisi nullam vehicula ipsum. Felis imperdiet proin fermentum leo vel orci porta. Id semper risus in hendrerit gravida rutrum. Suspendisse in est ante in nibh mauris cursus. Eu consequat ac felis donec et odio pellentesque. Velit sed ullamcorper morbi tincidunt ornare massa. Donec massa sapien faucibus et molestie ac feugiat. Eget aliquet nibh praesent tristique magna sit amet. Cursus vitae congue mauris rhoncus. Tincidunt ornare massa eget egestas purus. Sed odio morbi quis comusero. Quis vel eros donec ac odio tempor orci dapibus ultrices. Ac tincidunt vitae semper quis lectus. Convallis aenean et tortor at. Cras sed felis eget velit aliquet. Morbi tempus iaculis urna id volutpat lacus laoreet non. Magna fringilla urna porttitor rhoncus dolor purus non enim. Massa massa ultricies mi quis hendrerit dolor magna eget est. Lorem ipsum dolor sit amet consectetur adipiscing elit pellentesque. Nisi est sit amet facilisis magna etiam. Etiam erat velit scelerisque in dictum non. Pulvinar neque laoreet suspendisse interdum consectetur libero id faucibus. Turpis massa sed elementum tempus egestas sed sed. Hendrerit dolor magna eget est lorem ipsum dolor. A diam maecenas sed enim ut sem viverra aliquet. Tortor vitae purus faucibus ornare suspendisse. Pharetra sit amet aliquam id. Est ante in nibh mauris cursus mattis. Scelerisque viverra mauris in aliquam sem fringilla ut. Lacus viverra vitae congue eu consequat ac felis donec et. In pellentesque massa placerat duis ultricies lacus. Id interdum velit laoreet id. Convallis a cras semper auctor neque. Malesuada proin libero nunc consequat interdum varius sit amet mattis. Mattis nunc sed blandit libero volutpat. Id aliquet risus feugiat in ante metus. Lectus proin nibh nisl condimentum id venenatis a. Facilisis leo vel fringilla est. Odio ut enim blandit volutpat maecenas volutpat blandit. Facilisi cras fermentum odio eu feugiat pretium nibh ipsum. Etiam sit amet nisl purus in mollis. Lobortis elementum nibh tellus molestie nunc non. Diam volutpat comusero sed egestas egestas fringilla. Ut tortor pretium viverra suspendisse potenti. Fringilla phasellus faucibus scelerisque eleifend donec pretium vulputate sapien nec. Etiam sit amet nisl purus in mollis nunc sed id. Lorem ipsum dolor sit amet. Ut ornare lectus sit amet est placerat in egestas. Egestas sed tempus urna et pharetra pharetra massa. Quis vel eros donec ac. Morbi tristique senectus et netus et malesuada. Fermentum posuere urna nec tincidunt praesent. Elit duis tristique sollicitudin nibh. Diam donec adipiscing tristique risus nec. Dignissim sodales ut eu sem integer vitae. Malesuada fames ac turpis egestas maecenas pharetra convallis posuere. Ut porttitor leo a diam sollicitudin tempor. Viverra nibh cras pulvinar mattis nunc sed blandit libero. Ut tellus elementum sagittis vitae et leo. Sagittis orci a scelerisque purus semper. Facilisi etiam dignissim diam quis enim lobortis scelerisque fermentum dui. Quam vulputate dignissim suspendisse in est. Integer vitae justo eget magna fermentum iaculis eu non. Mattis rhoncus urna neque viverra justo nec. Quis vel eros donec ac odio tempor. Pellentesque nec nam aliquam sem. Vulputate odio ut enim blandit. Comusero ullamcorper a lacus vestibulum sed arcu non. Non enim praesent elementum facilisis leo. Congue eu consequat ac felis donec et odio. Maecenas accumsan lacus vel facilisis volutpat. Et tortor at risus viverra adipiscing. Vel orci porta non pulvinar neque laoreet suspendisse interdum. Dignissim enim sit amet venenatis urna cursus eget nunc scelerisque. Proin sed libero enim sed faucibus turpis. Orci ac auctor augue mauris augue. Vitae aliquet nec ullamcorper sit amet risus. Mauris in aliquam sem fringilla ut. Aenean vel elit scelerisque mauris pellentesque pulvinar pellentesque. Amet nisl purus in mollis nunc. Porta non pulvinar neque laoreet suspendisse interdum. Tincidunt praesent semper feugiat nibh sed pulvinar proin gravida. Risus comusero viverra maecenas accumsan lacus. Non quam lacus suspendisse faucibus interdum. Mollis nunc sed id semper. Sit amet consectetur adipiscing elit ut. Enim lobortis scelerisque fermentum dui. Quis ipsum suspendisse ultrices gravida dictum fusce. Condimentum vitae sapien pellentesque habitant morbi tristique senectus. Comusero ullamcorper a lacus vestibulum sed arcu. Sem nulla pharetra diam sit amet. Quis hendrerit dolor magna eget est lorem ipsum dolor sit. Mollis aliquam ut porttitor leo. Nunc congue nisi vitae suscipit tellus mauris a. Feugiat nisl pretium fusce id. Nec sagittis aliquam malesuada bibendum. Eu volutpat odio facilisis mauris sit amet massa. Viverra vitae congue eu consequat ac. Dolor magna eget est lorem ipsum dolor sit. Ut venenatis tellus in metus vulputate eu scelerisque. Nibh nisl condimentum id venenatis a condimentum vitae sapien pellentesque. Dui vivamus arcu felis bibendum ut. Id semper risus in hendrerit gravida rutrum quisque non tellus. Scelerisque mauris pellentesque pulvinar pellentesque habitant morbi tristique senectus et. Mattis aliquam faucibus purus in massa tempor nec. Amet nulla facilisi morbi tempus iaculis urna. Semper auctor neque vitae tempus quam pellentesque nec nam aliquam. Interdum varius sit amet mattis vulputate enim nulla aliquet. Elementum tempus egestas sed sed risus pretium quam. Ac ut consequat semper viverra nam. Mattis aliquam faucibus purus in massa. Sit amet comusero nulla facilisi nullam vehicula. Sit amet comusero nulla facilisi nullam vehicula ipsum. Lectus mauris ultrices eros in cursus. Tincidunt dui ut ornare lectus sit amet est. At auctor urna nunc id cursus. Tincidunt id aliquet risus feugiat in ante metus dictum at. Sapien eget mi proin sed libero. Dictum fusce ut placerat orci nulla pellentesque dignissim. Lectus urna duis convallis convallis tellus id interdum. Eget nullam non nisi est sit amet facilisis magna etiam. Vestibulum lorem sed risus ultricies. Vel quam elementum pulvinar etiam. Arcu non odio euisuser lacinia at. Phasellus vestibulum lorem sed risus ultricies tristique nulla aliquet. Nullam eget felis eget nunc lobortis mattis aliquam. Venenatis urna cursus eget nunc scelerisque viverra mauris. Vel risus comusero viverra maecenas accumsan lacus. Sed velit dignissim sodales ut eu sem integer vitae justo. Risus viverra adipiscing at in tellus. Id venenatis a condimentum vitae sapien pellentesque. A arcu cursus vitae congue. At tempor comusero ullamcorper a lacus vestibulum sed. Tristique sollicitudin nibh sit amet comusero nulla facilisi. Gravida neque convallis a cras semper auctor neque vitae tempus. Sit amet aliquam id diam maecenas. Vitae et leo duis ut diam quam nulla porttitor. Odio eu feugiat pretium nibh ipsum consequat. Viverra adipiscing at in tellus integer. Volutpat lacus laoreet non curabitur gravida arcu ac tortor. Libero justo laoreet sit amet cursus. Orci dapibus ultrices in iaculis nunc sed augue. Tortor pretium viverra suspendisse potenti. Eleifend donec pretium vulputate sapien nec sagittis aliquam malesuada. Sapien eget mi proin sed libero. Cras pulvinar mattis nunc sed blandit libero volutpat sed cras. Diam phasellus vestibulum lorem sed risus ultricies tristique nulla. Vitae nunc sed velit dignissim sodales ut eu sem. Enim ut tellus elementum sagittis vitae et. Sed vulputate mi sit amet mauris comusero quis imperdiet. Cursus metus aliquam eleifend mi in nulla posuere. Nulla facilisi etiam dignissim diam quis. Lacus laoreet non curabitur gravida arcu ac. In tellus integer feugiat scelerisque varius morbi enim nunc faucibus. Accumsan sit amet nulla facilisi morbi. Quis imperdiet massa tincidunt nunc pulvinar sapien et. Mauris comusero quis imperdiet massa. Eget nullam non nisi est sit. Dignissim sodales ut eu sem integer vitae justo. Nec ultrices dui sapien eget mi proin sed. At auctor urna nunc id cursus. Posuere ac ut consequat semper. Arcu non odio euisuser lacinia at. Vel pretium lectus quam id leo.`;
  const sentences = loremIpsum.split(/\.\s/g);
  // Each post body contains 1 to 5 paragraphs.
  const paragraphCount = random(1, 5);
  const body = [];
  for (let p = 0; p < paragraphCount; p++) {
    const paragraph = [];
    // Each paragraph contains 1 to 10 sentences.
    const sentenceCount = random(1, 10);
    for (let s = 0; s < sentenceCount; s++) {
      let sentence = sentences[random(0, sentences.length)];
      // There is a 10 percent chance that a random word in this
      // sentence will be formatted, randomly.
      if (percentChance(10)) {
        const split = sentence.split(' ');
        const index = random(0, split.length);
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
function randomFormatWord(str: string) {
  const format = [
    { start: '*', stop: '*' },
    { start: '/', stop: '/' },
    { start: '_', stop: '_' },
    { start: '~', stop: '~' },
    { start: '[', stop: ']' },
    { start: '(((', stop: ')))' },
    { start: '`', stop: '`' },
  ];
  const { start, stop } = format[random(0, format.length)];
  return `${start}${str}${stop}`;
}

/*
 * Generates random file data.
 */
function getRandomFiles(minFileCount = 1) {
  const fileKeys = [
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

  const files = Array.from({ length: random(minFileCount, 5) });
  return files.map(() => {
    const filename = fileKeys[Math.floor(Math.random() * fileKeys.length)];
    return {
      id: filename,
      size: Math.floor(Math.random() * 500000) + 10000,
      filename,
      mimetype: 'image/jpeg',
      nsfw: percentChance(20),
    };
  });
}
