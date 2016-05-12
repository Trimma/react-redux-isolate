const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');

const webpackConfig = require('./webpack.config.js');

const app = express();

const compiler = webpack(webpackConfig);
app.use(webpackDevMiddleware(compiler, {
	publicPath: webpackConfig.output.publicPath,
	stats: {
		colors: true,
		timings: true,
		chunkModules: false
	}
}));
app.use(webpackHotMiddleware(compiler, {
	log: console.log,
	path: '/__webpack_hmr',
	heartbeat: 10 * 1000
}));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.listen(8080, 'localhost', function(err) {
	if (err) throw err;
	console.log('Listening on http://localhost:8080');
	console.log('Builing initial bundle...');
});
