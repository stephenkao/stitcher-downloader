const wget = require('node-wget-promise');

function sleep(ms) {
  return function(x) {
    return new Promise(resolve => setTimeout(() => resolve(x), ms));
  };
}

const re = /filename=%22(.*).mp3/i;

async function getFile(url) {
  const filename =
    decodeURIComponent(decodeURIComponent(url.match(re)[1])).replace(/ /g, '-') + '.mp3';

  console.log(`---------- getting ${url} ----------`);

  await wget(url, {
    onProgress: () => process.stdout.write('.'),
    output: `./downloads/${filename}`
  });

  console.log('\n\n');
}

(async function () {
  if (process.argv.length !== 3) {
    console.error('\nusage: node index.js xxxx-downloads-xxxx.json\n');
    process.exit(1);
  }

  const episodeUrls = require(process.argv[2]);
  for (let episodeUrl of episodeUrls) {
    await getFile(episodeUrl);
    await sleep(2000);
  }
})();
