const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const TerserWebpackPlugin = require('terser-webpack-plugin')
const TsConfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const pgkJson = require('./package.json')

const mode = process.env.NODE_ENV || 'development'
const devMode = mode === 'development'
const target = devMode ? 'web' : 'browserslist'
const devtool = devMode ? 'source-map' : undefined

const vendors = Object.keys(pgkJson.dependencies)

const vendorCacheGroups = {}

vendors.forEach((vendor) => {
  vendorCacheGroups[vendor] = {
    test: new RegExp(`[\\\\/]node_modules[\\\\/]${vendor}[\\\\/]`),
    chunks: 'initial',
    name: vendor,
    enforce: true
  }
})

const otherVendors = {
  test: new RegExp(
    `[\\\\/]node_modules[\\\\/](?!(?:${vendors.join('|')})).*[\\\\/]`
  ),
  chunks: 'initial',
  name: 'vendors',
  enforce: true
}

const optimization = () => {
  const config = {
    // minimizer: [
    //   new UglifyJsPlugin(require('./dev/webpack/ugilfyJsPluginOptions')),
    //   new OptimizeCSSAssetsPlugin(require('./dev/webpack/optimizeCssOpts'))
    // ],
    splitChunks: {
      minSize: 5000,
      cacheGroups: Object.assign({}, vendorCacheGroups, { otherVendors }),
      chunks: 'all'
    }
  }

  if (!devMode) {
    config.minimizer = [
      new OptimizeCssAssetsPlugin(),
      new TerserWebpackPlugin()
    ]
  }

  return config
}

const filename = (ext) => {
  return devMode ? `[name].${ext}` : `[name].[contenthash].${ext}`
}

const cssLoaders = (extra) => {
  const loaders = [
    devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
    'css-loader'
  ]

  if (extra) {
    loaders.push(extra)
  }

  return loaders
}

const plugins = () => {
  const base = [
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env)
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public', 'index.html'),
      inject: 'body',
      favicon: './public/favicon.ico',
      minify: {
        collapseWhitespace: !devMode
      }
    }),
    new MiniCssExtractPlugin({
      filename: filename('css')
    })
  ]

  if (!devMode) {
    base.push(new BundleAnalyzerPlugin())
  }

  return base
}

module.exports = {
  mode,
  target,
  devtool,
  entry: path.resolve(__dirname, 'src', 'index.tsx'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: filename('js'),
    clean: true,
    assetModuleFilename: 'assets/[hash][ext]'
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'src')
    },
    compress: true,
    port: 3000,
    open: true,
    hot: true
  },
  module: {
    rules: [
      {
        test: /\.css?$/i,
        use: cssLoaders()
      },
      {
        test: /\.s[ac]ss$/i,
        use: cssLoaders('sass-loader')
      },
      {
        test: /\.(png|jpe?g|svg|webp|gif)$/,
        use: [
          {
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: {
                progressive: true
              },
              optipng: {
                enabled: false
              },
              pngquant: {
                quality: [0.65, 0.9],
                speed: 4
              },
              gifsicle: {
                interlaced: false
              },
              webp: {
                quality: 75
              }
            }
          }
        ]
      },
      {
        test: /\.(woff|woff2)$/,
        type: 'asset/resource'
      },
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      }
    ]
  },
  resolve: {
    plugins: [new TsConfigPathsPlugin()],
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.scss', '.css']
  },
  optimization: optimization(),
  plugins: plugins()
}
