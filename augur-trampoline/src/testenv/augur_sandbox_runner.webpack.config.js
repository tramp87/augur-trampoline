// @flow

// eslint-disable-next-line import/no-nodejs-modules,import/no-commonjs
const path = require('path');

// eslint-disable-next-line import/no-commonjs
module.exports = {
  entry: './src/testenv/augur_sandbox_runner.js',
  output: {
    path: path.resolve(__dirname, '../../dev-artifacts'),
    filename: 'augur_sandbox_runner.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-runtime'],
          },
        },
      },
    ],
  },
  node: {
    fs: 'empty',
  },
};
