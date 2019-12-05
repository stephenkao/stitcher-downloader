const fs = require('fs')
const meow = require('meow');
const request = require('request');
const ProgressBar = require('progress');
const { parseStringPromise } = require('xml2js');

const BASE_FEED_URL = 'https://app.stitcher.com/Service/GetFeedDetailsWithEpisodes.php';
const BASE_DEST = './tmp';


// https://app.stitcher.com/Service/GetFeedDetailsWithEpisodes.php?fid=144988&id_Season=837

function downloadFile(url, title, cb) {
  const file = request(url);
  let bar;

  file.on('response', (res) => {
    const len = parseInt(res.headers['content-length'], 10);
    console.log(title);
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

  file.pipe(fs.createWriteStream(`./downloads/${title}`));
}

function downloadFiles(filesList, onDone) {
  if (filesList.length < 1) {
    onDone();
    return;
  }

  const [url, title] = filesList.shift();
  downloadFile(url, title, () => downloadFiles(filesList, () => console.log('done!')));
}

function getFeedDetails(feedId, seasonId, onDone) {
  feedId = '144988';
  seasonId = '830';

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
  const cli = meow(`
    Usage
      $ node download.js --feed <feed_id> --season <season_id>

    Options
      --feed, -f     feed id
      --season, -s   season id
  `, {
    flags: {
      feed: {
        alias: 'f',
        type: 'number'
      },
      season: {
        alias: 's',
        type: 'number'
      }
    }
  });

  getFeedDetails(cli.flags.feed, cli.flags.season, (feedDetails) => {
    downloadFiles(feedDetails, () => {
      console.log('done');
    });
  });
}

main();
