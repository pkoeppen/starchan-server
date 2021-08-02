const { client, createCollections, ...globals } = require('../src/globals');
const resolvers = require('../src/resolvers');
const helpers = require('../src/helpers');

const ipAddresses = [];
for (let i = 0; i < 100; i++) {
  const ipAddress = new Array(4)
    .fill('')
    .map(() => random(127, 256))
    .join('.');
  ipAddresses.push(ipAddress);
}

(async function () {
  try {
    const start = Date.now();
    await client.connect();
    await client.db().dropDatabase().then(createCollections);
    await resolvers.addAdmin({
      username: 'admin',
      password: 'admin',
      permissions: globals.permissions,
    });
    for (let i = 0; i < 10; i++) {
      console.log(`Generating thread ${i + 1}...`);
      await generateThreadWithPosts();
    }
    console.log('Elapsed:', (Date.now() - start) / 1000);
  } catch (error) {
    console.error(error);
  }
})().finally(process.exit);

/*
 * Generates a thread with a random number of posts.
 */
async function generateThreadWithPosts() {
  const thread = await resolvers.addThread(generateRandomThread());
  // Each thread will generate 5 to 300 posts.
  for (let x = 0; x < random(5, 300); x++) {
    await resolvers.addPost(generateRandomPost(thread._id));
  }
}

/*
 * Selects a random IP address from the IP address array.
 */
function getRandomIpAddress() {
  return ipAddresses[random(0, ipAddresses.length)];
}

/*
 * Generates random file data.
 */
function getRandomFiles(minFileCount = 0) {
  const fileKeys = [
    '431d394a00c684334d42b6993ba60600003e680725abb3c022d82338a0c6c113',
  ];

  const files = new Array(random(minFileCount, 5)).fill(null);
  return files.map(() => ({
    filesize: Math.floor(Math.random() * 500000) + 10000,
    width: Math.floor(Math.random() * 2000) + 100,
    height: Math.floor(Math.random() * 2000) + 100,
    _id: fileKeys[Math.floor(Math.random() * fileKeys.length)],
    filename: `${Date.now()}.png`,
    mimetype: 'image/png',
    nsfw: percentChance(30),
  }));
}

/*
 * Generates random thread data.
 */
function generateRandomThread() {
  const files = getRandomFiles(1);
  const ip = getRandomIpAddress();
  return {
    sticky: percentChance(10),
    anchor: false,
    locked: false,
    subject: 'Test Subject',
    ip,
    name: `Anonymous${percentChance(10) ? '#password' : ''}`,
    body: generateRandomPostBody(),
    files,
  };
}

/*
 * Generates random post data.
 */
function generateRandomPost(threadId) {
  return {
    thread: threadId + '',
    ip: getRandomIpAddress(),
    name: `Anonymous${percentChance(10) ? '#password' : ''}`,
    subject: '',
    sage: percentChance(10),
    body: generateRandomPostBody(),
    files: percentChance(10) ? getRandomFiles() : [],
  };
}

/*
 * Generates a randomly formatted 'lorem ipsum' post body.
 */
function generateRandomPostBody() {
  const loremIpsum = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ornare arcu odio ut sem nulla pharetra diam sit amet. Amet venenatis urna cursus eget nunc scelerisque. Elementum nisi quis eleifend quam adipiscing vitae proin sagittis nisl. Sem et tortor consequat id. Euismod nisi porta lorem mollis aliquam ut porttitor. Mi bibendum neque egestas congue quisque. Egestas integer eget aliquet nibh praesent tristique magna sit amet. Vitae ultricies leo integer malesuada nunc. Nunc pulvinar sapien et ligula ullamcorper malesuada proin libero nunc. Neque sodales ut etiam sit. Sollicitudin ac orci phasellus egestas tellus rutrum. Gravida cum sociis natoque penatibus. Potenti nullam ac tortor vitae purus faucibus. Porta non pulvinar neque laoreet suspendisse. Vulputate sapien nec sagittis aliquam malesuada. Malesuada proin libero nunc consequat interdum varius sit. Congue mauris rhoncus aenean vel elit scelerisque mauris pellentesque pulvinar. Erat velit scelerisque in dictum non consectetur a. Nulla posuere sollicitudin aliquam ultrices sagittis. Lectus urna duis convallis convallis tellus. In vitae turpis massa sed elementum tempus egestas. Mi eget mauris pharetra et ultrices neque ornare aenean. Malesuada proin libero nunc consequat interdum varius sit. Feugiat in ante metus dictum at tempor commodo ullamcorper. Non quam lacus suspendisse faucibus. Tempus iaculis urna id volutpat lacus. Et leo duis ut diam quam nulla porttitor massa. Malesuada proin libero nunc consequat. Tellus in metus vulputate eu scelerisque felis imperdiet. Fusce id velit ut tortor pretium. Tristique risus nec feugiat in fermentum posuere urna nec. Leo vel orci porta non pulvinar neque laoreet. Convallis a cras semper auctor neque. Semper risus in hendrerit gravida rutrum quisque. Nibh sed pulvinar proin gravida hendrerit. Amet risus nullam eget felis eget nunc lobortis mattis aliquam. Odio facilisis mauris sit amet massa vitae tortor condimentum. Non nisi est sit amet facilisis. Fermentum dui faucibus in ornare quam viverra orci sagittis. Donec enim diam vulputate ut pharetra sit amet. Nullam ac tortor vitae purus faucibus ornare suspendisse sed. Aliquet enim tortor at auctor urna nunc. Rhoncus urna neque viverra justo nec ultrices dui. Nisl pretium fusce id velit ut. Odio eu feugiat pretium nibh ipsum consequat. Tristique magna sit amet purus gravida quis blandit turpis cursus. Adipiscing bibendum est ultricies integer quis auctor elit sed vulputate. Nulla facilisi nullam vehicula ipsum. Felis imperdiet proin fermentum leo vel orci porta. Id semper risus in hendrerit gravida rutrum. Suspendisse in est ante in nibh mauris cursus. Eu consequat ac felis donec et odio pellentesque. Velit sed ullamcorper morbi tincidunt ornare massa. Donec massa sapien faucibus et molestie ac feugiat. Eget aliquet nibh praesent tristique magna sit amet. Cursus vitae congue mauris rhoncus. Tincidunt ornare massa eget egestas purus. Sed odio morbi quis commodo. Quis vel eros donec ac odio tempor orci dapibus ultrices. Ac tincidunt vitae semper quis lectus. Convallis aenean et tortor at. Cras sed felis eget velit aliquet. Morbi tempus iaculis urna id volutpat lacus laoreet non. Magna fringilla urna porttitor rhoncus dolor purus non enim. Massa massa ultricies mi quis hendrerit dolor magna eget est. Lorem ipsum dolor sit amet consectetur adipiscing elit pellentesque. Nisi est sit amet facilisis magna etiam. Etiam erat velit scelerisque in dictum non. Pulvinar neque laoreet suspendisse interdum consectetur libero id faucibus. Turpis massa sed elementum tempus egestas sed sed. Hendrerit dolor magna eget est lorem ipsum dolor. A diam maecenas sed enim ut sem viverra aliquet. Tortor vitae purus faucibus ornare suspendisse. Pharetra sit amet aliquam id. Est ante in nibh mauris cursus mattis. Scelerisque viverra mauris in aliquam sem fringilla ut. Lacus viverra vitae congue eu consequat ac felis donec et. In pellentesque massa placerat duis ultricies lacus. Id interdum velit laoreet id. Convallis a cras semper auctor neque. Malesuada proin libero nunc consequat interdum varius sit amet mattis. Mattis nunc sed blandit libero volutpat. Id aliquet risus feugiat in ante metus. Lectus proin nibh nisl condimentum id venenatis a. Facilisis leo vel fringilla est. Odio ut enim blandit volutpat maecenas volutpat blandit. Facilisi cras fermentum odio eu feugiat pretium nibh ipsum. Etiam sit amet nisl purus in mollis. Lobortis elementum nibh tellus molestie nunc non. Diam volutpat commodo sed egestas egestas fringilla. Ut tortor pretium viverra suspendisse potenti. Fringilla phasellus faucibus scelerisque eleifend donec pretium vulputate sapien nec. Etiam sit amet nisl purus in mollis nunc sed id. Lorem ipsum dolor sit amet. Ut ornare lectus sit amet est placerat in egestas. Egestas sed tempus urna et pharetra pharetra massa. Quis vel eros donec ac. Morbi tristique senectus et netus et malesuada. Fermentum posuere urna nec tincidunt praesent. Elit duis tristique sollicitudin nibh. Diam donec adipiscing tristique risus nec. Dignissim sodales ut eu sem integer vitae. Malesuada fames ac turpis egestas maecenas pharetra convallis posuere. Ut porttitor leo a diam sollicitudin tempor. Viverra nibh cras pulvinar mattis nunc sed blandit libero. Ut tellus elementum sagittis vitae et leo. Sagittis orci a scelerisque purus semper. Facilisi etiam dignissim diam quis enim lobortis scelerisque fermentum dui. Quam vulputate dignissim suspendisse in est. Integer vitae justo eget magna fermentum iaculis eu non. Mattis rhoncus urna neque viverra justo nec. Quis vel eros donec ac odio tempor. Pellentesque nec nam aliquam sem. Vulputate odio ut enim blandit. Commodo ullamcorper a lacus vestibulum sed arcu non. Non enim praesent elementum facilisis leo. Congue eu consequat ac felis donec et odio. Maecenas accumsan lacus vel facilisis volutpat. Et tortor at risus viverra adipiscing. Vel orci porta non pulvinar neque laoreet suspendisse interdum. Dignissim enim sit amet venenatis urna cursus eget nunc scelerisque. Proin sed libero enim sed faucibus turpis. Orci ac auctor augue mauris augue. Vitae aliquet nec ullamcorper sit amet risus. Mauris in aliquam sem fringilla ut. Aenean vel elit scelerisque mauris pellentesque pulvinar pellentesque. Amet nisl purus in mollis nunc. Porta non pulvinar neque laoreet suspendisse interdum. Tincidunt praesent semper feugiat nibh sed pulvinar proin gravida. Risus commodo viverra maecenas accumsan lacus. Non quam lacus suspendisse faucibus interdum. Mollis nunc sed id semper. Sit amet consectetur adipiscing elit ut. Enim lobortis scelerisque fermentum dui. Quis ipsum suspendisse ultrices gravida dictum fusce. Condimentum vitae sapien pellentesque habitant morbi tristique senectus. Commodo ullamcorper a lacus vestibulum sed arcu. Sem nulla pharetra diam sit amet. Quis hendrerit dolor magna eget est lorem ipsum dolor sit. Mollis aliquam ut porttitor leo. Nunc congue nisi vitae suscipit tellus mauris a. Feugiat nisl pretium fusce id. Nec sagittis aliquam malesuada bibendum. Eu volutpat odio facilisis mauris sit amet massa. Viverra vitae congue eu consequat ac. Dolor magna eget est lorem ipsum dolor sit. Ut venenatis tellus in metus vulputate eu scelerisque. Nibh nisl condimentum id venenatis a condimentum vitae sapien pellentesque. Dui vivamus arcu felis bibendum ut. Id semper risus in hendrerit gravida rutrum quisque non tellus. Scelerisque mauris pellentesque pulvinar pellentesque habitant morbi tristique senectus et. Mattis aliquam faucibus purus in massa tempor nec. Amet nulla facilisi morbi tempus iaculis urna. Semper auctor neque vitae tempus quam pellentesque nec nam aliquam. Interdum varius sit amet mattis vulputate enim nulla aliquet. Elementum tempus egestas sed sed risus pretium quam. Ac ut consequat semper viverra nam. Mattis aliquam faucibus purus in massa. Sit amet commodo nulla facilisi nullam vehicula. Sit amet commodo nulla facilisi nullam vehicula ipsum. Lectus mauris ultrices eros in cursus. Tincidunt dui ut ornare lectus sit amet est. At auctor urna nunc id cursus. Tincidunt id aliquet risus feugiat in ante metus dictum at. Sapien eget mi proin sed libero. Dictum fusce ut placerat orci nulla pellentesque dignissim. Lectus urna duis convallis convallis tellus id interdum. Eget nullam non nisi est sit amet facilisis magna etiam. Vestibulum lorem sed risus ultricies. Vel quam elementum pulvinar etiam. Arcu non odio euismod lacinia at. Phasellus vestibulum lorem sed risus ultricies tristique nulla aliquet. Nullam eget felis eget nunc lobortis mattis aliquam. Venenatis urna cursus eget nunc scelerisque viverra mauris. Vel risus commodo viverra maecenas accumsan lacus. Sed velit dignissim sodales ut eu sem integer vitae justo. Risus viverra adipiscing at in tellus. Id venenatis a condimentum vitae sapien pellentesque. A arcu cursus vitae congue. At tempor commodo ullamcorper a lacus vestibulum sed. Tristique sollicitudin nibh sit amet commodo nulla facilisi. Gravida neque convallis a cras semper auctor neque vitae tempus. Sit amet aliquam id diam maecenas. Vitae et leo duis ut diam quam nulla porttitor. Odio eu feugiat pretium nibh ipsum consequat. Viverra adipiscing at in tellus integer. Volutpat lacus laoreet non curabitur gravida arcu ac tortor. Libero justo laoreet sit amet cursus. Orci dapibus ultrices in iaculis nunc sed augue. Tortor pretium viverra suspendisse potenti. Eleifend donec pretium vulputate sapien nec sagittis aliquam malesuada. Sapien eget mi proin sed libero. Cras pulvinar mattis nunc sed blandit libero volutpat sed cras. Diam phasellus vestibulum lorem sed risus ultricies tristique nulla. Vitae nunc sed velit dignissim sodales ut eu sem. Enim ut tellus elementum sagittis vitae et. Sed vulputate mi sit amet mauris commodo quis imperdiet. Cursus metus aliquam eleifend mi in nulla posuere. Nulla facilisi etiam dignissim diam quis. Lacus laoreet non curabitur gravida arcu ac. In tellus integer feugiat scelerisque varius morbi enim nunc faucibus. Accumsan sit amet nulla facilisi morbi. Quis imperdiet massa tincidunt nunc pulvinar sapien et. Mauris commodo quis imperdiet massa. Eget nullam non nisi est sit. Dignissim sodales ut eu sem integer vitae justo. Nec ultrices dui sapien eget mi proin sed. At auctor urna nunc id cursus. Posuere ac ut consequat semper. Arcu non odio euismod lacinia at. Vel pretium lectus quam id leo.`;
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
 * Returns true/false based on the given percent chance.
 */
function percentChance(percent: number) {
  return Math.random() < percent / 100;
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
