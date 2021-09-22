const path = require('path');

module.exports = {
    entry: './src/simufast.js',
    mode: 'production',
    optimization: {
        minimize: false
    },
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
        library: 'simufast'
    },
};