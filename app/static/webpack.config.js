const path = require('path');

module.exports = {
  entry: {
    'chat': path.resolve(__dirname, 'js/chat.js'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
};
