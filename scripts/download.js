const fs = require('fs')
const path = require('path');
const meow = require('meow');
const request = require('request');
const ProgressBar = require('progress');
const { parseStringPromise } = require('xml2js');
const mkdirp = require('mkdirp');

const BASE_DIR = './downloads';
const BASE_FEED_URL = 'https://app.stitcher.com/Service/GetFeedDetailsWithEpisodes.php';


function downloadFile(url, title, destDir, cb) {
  const file = request(url);
  let bar;

  file.on('response', (res) => {
    const len = parseInt(res.headers['content-length'], 10);
    console.log(`Downloading ${title}`);
    bar = new ProgressBar('  Downloading [:bar] :rate/bps :percent :etas', {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: len
    });

    file.on('data', (chunk) => {
      bar.tick(chunk.length);
    });

    file.on('end', () => {
      console.log('\n');
      cb();
    });

    file.on('error', () => {
      console.error('whatever');
    });
  });

  file.pipe(fs.createWriteStream(path.join(destDir, title)));
}

function downloadFiles(filesList, destDir, onDone) {
  if (filesList.length < 1) {
    onDone();
    return;
  }

  const [url, title] = filesList.shift();
  downloadFile(url, title, destDir, () => {
    downloadFiles(filesList, destDir, () => console.log('done!'));
  });
}

function getFeedDetails(feedId, seasonId, onDone) {
  // THROWING SHADE WHAT WHAT!!!!
  // https://app.stitcher.com/Service/GetFeedDetailsWithEpisodes.php?fid=144988&id_Season=837

  const url = `https://app.stitcher.com/Service/GetFeedDetailsWithEpisodes.php?fid=${feedId}&id_Season=${seasonId}`;
  const req = request(url, (error, res, body) => {
    parseStringPromise(body).then((parsedBody) => {
      const feedDetails = [];
      const { episode: episodes } = parsedBody.feed_details.episodes[0];

      episodes.forEach((episode) => {
        const { '$': { 'episodeURL.original': url } } = episode;
        const tokens = url.split(/\//);
        feedDetails.push([url, tokens[tokens.length - 1]]);
      });

      onDone(feedDetails);
    });
  });
}

function main() {
  const {
    flags: {
      feed: feedId,
      season: seasonId
    },
    input
  } = meow(`
    Usage
      $ node download.js --feed <feed_id> --season <season_id> <destination>

    Options
      --feed, -f     feed id
      --season, -s   season id
  `, {
    flags: {
      feed: {
        alias: 'f',
        type: 'string'
      },
      season: {
        alias: 's',
        type: 'string'
      }
    }
  });

  const destDir = path.join(input[0] || BASE_DIR, feedId, seasonId);
  mkdirp(destDir, () => {
    getFeedDetails(feedId, seasonId, (feedDetails) => {
      downloadFiles(feedDetails, destDir, () => {
        console.log('done');
      });
    });
  });
}

main();
