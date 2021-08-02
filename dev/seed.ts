(async function() {
  const start = Date.now();

  console.log('Elapsed:', (Date.now() - start) / 1000);
})()
  .catch(console.error)
  .finally(process.exit);
