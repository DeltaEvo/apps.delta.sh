const htmlStandards = require('reshape-standard')
const cssStandards = require('spike-css-standards')
const jsStandards = require('spike-js-standards')
const Records = require('spike-records')
const url = require('url')
const Color = require('color')
const env = process.env.SPIKE_ENV


const MANIFESTS = [
  'https://music.delta.sh/manifest.json',
  'https://messages.android.com/_/AndroidMessagesWebUi/manifest.json'
]

// Array-like
const records = {
  length: MANIFESTS.length
}

// https://stackoverflow.com/a/3943023
function getTextColor(color) {
  const rgb = Color(color).rgb().array()
  
  const [r,g,b] = rgb.map(c => {
    c /= 255;

    if (c <= 0.03928) {
      c /= 12.92;
    } else {
      c = ((c+0.055)/1.055) ** 2.4
    }

    return c;
  })

  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b

  if ((L + 0.05) / (0.0 + 0.05) > (1.0 + 0.05) / (L + 0.05)) {
    return '#000000'
  } else {
    return '#ffffff'
  }
}

module.exports = {
  devtool: 'source-map',
  ignore: ['**/layout.html', '**/_*', '**/.*', 'readme.md', 'yarn.lock', 'package-lock.json'],
  reshape: htmlStandards({
    locals: () => {
      const apps = Array.from(records)

      for (const [i, app] of apps.entries()) {
        const manifestUrl = MANIFESTS[i]
        app.start_url = url.resolve(manifestUrl, app.start_url)
        for (const icon of app.icons) {
          icon.src = url.resolve(manifestUrl, icon.src)
        }
        app.text_color = getTextColor(app.background_color)
      }

      return {
        apps
      };
    },
    minify: env === 'production'
  }),
  postcss: cssStandards({
    minify: env === 'production',
    warnForDuplicates: env !== 'production'
  }),
  babel: jsStandards(),
  plugins: [
    new Records({
      addDataTo: records,
      ...(MANIFESTS.reduce(
        (prev, url, i) => (prev[i] = { url }, prev),
        {}
      ))
    })
  ]
}
