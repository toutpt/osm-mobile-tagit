var path = require('path');

module.exports = {
    entry: './src/app.js',
    output: {
        path: __dirname,
        filename: "gh-pages/app.js"
    },
    resolve: ['', '.js', '.html'],
    module: {
        loaders: [
            { test: /\.css$/, loader: "style!css" },
            { test: /\.html$/, loader: 'raw' },
            { test: path.join(__dirname, 'src'), loader: 'babel-loader'}
        ]
    },
    externals: {
        L: 'leaflet',
        angular: 'angular'
    },
    devServer: {
        contentBase: __dirname,
        //hot: true,
        inline: true,
        progress: true,
        color: true
    },
};