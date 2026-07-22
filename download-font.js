const https = require('https');
const fs = require('fs');
const path = require('path');

const cssUrl = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400&display=swap';

https.get(cssUrl, {
  headers: {
    // Send an old user agent (IE 11) to force Google to return TTF instead of WOFF2
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko'
  }
}, (res) => {
  let css = '';
  res.on('data', chunk => css += chunk);
  res.on('end', () => {
    // Find url(https://fonts.gstatic.com/.../*.ttf)
    const match = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.ttf)\)/);
    if (match) {
      const ttfUrl = match[1];
      console.log('Found TTF URL:', ttfUrl);
      
      const file = fs.createWriteStream(path.join(__dirname, 'src', 'fonts', 'CormorantGaramond-Regular.ttf'));
      https.get(ttfUrl, (ttfRes) => {
        ttfRes.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log('Font downloaded successfully!');
        });
      });
    } else {
      console.log('No TTF URL found in CSS:', css);
    }
  });
}).on('error', (err) => {
  console.error('Error fetching CSS:', err);
});
