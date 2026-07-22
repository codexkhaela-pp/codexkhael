const https = require('https');
const fs = require('fs');
const path = require('path');

const ttfUrl = 'https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/CormorantGaramond-Regular.ttf';

const file = fs.createWriteStream(path.join(__dirname, 'src', 'fonts', 'CormorantGaramond-Regular.ttf'));
https.get(ttfUrl, (res) => {
  if (res.statusCode !== 200) {
    console.error(`Failed with status code: ${res.statusCode}`);
    res.resume();
    return;
  }
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Font downloaded successfully!');
  });
}).on('error', (err) => {
  console.error('Error downloading TTF:', err);
});
