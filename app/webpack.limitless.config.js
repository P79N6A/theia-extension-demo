const merge = require('webpack-merge')
const baseWebpackConfig = require('./webpack.config')
const StyleFallbackPlugin = require('./style-falllback-plugin')

module.exports = merge(baseWebpackConfig, {
  plugins: [
    new StyleFallbackPlugin(),
  ],
})
