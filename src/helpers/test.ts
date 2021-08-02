import render from './render';

const str = `>greentext\n<redtext`;
const { rendered } = render(str);
console.log('rendered:', rendered);
