const path = require('path');
const webpack = require('webpack');
const autoprefixer = require('autoprefixer');

const config = {
	devtool: 'source-map',
	entry: [
		'./src/index'
	],
	output: {
		path: path.join(__dirname, 'dist'),
		filename: 'bundle.js',
		publicPath: '/dist/'
	},
	plugins: [
		new webpack.NoErrorsPlugin()
	],
	module: {
		loaders: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				include: path.join(__dirname, 'src'),
				loader: 'babel',
				query: {
					presets: ['es2015', 'stage-0', 'react'],
					plugins: ['typecheck']
				}
			},
			{
				test: /.css$/,
				exclude: [/node_modules/],
				loader: 'style-loader!css-loader?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]!postcss-loader'
			}
		]
	},
	postcss: [
		autoprefixer({ browsers: ['last 2 versions', 'ie >= 9'] })
	]
};

if (process.env.NODE_ENV !== 'production') {
	config.devtool = 'cheap-module-eval-source-map';
	config.module.loaders[0].query.plugins.push('import-asserts');

	// Set up webpack hot reloading
	config.entry.unshift(
		'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000'
	);

	// Lint everything
	config.module.loaders.push({
		test: /\.js$/,
		loader: 'eslint-loader',
		exclude: /node_modules/,
		include: path.join(__dirname, 'src')
	});

	// Add the hot module replacement javascript transform
	config.plugins.push(
		new webpack.HotModuleReplacementPlugin()
	);

	// Add the React hot reloading babel plugin
	config.module.loaders[0].query.plugins.push([
		'react-transform', {
			transforms: [
				{
					transform: 'react-transform-hmr',
					imports: ['react'],
					locals: ['module']
				},
				{
					transform: 'react-transform-catch-errors',
					imports: ['react', 'redbox-react']
				}
			]
		}
	]);
} else {
	config.output.filename = 'bundle.min.js';

	// https://webpack.github.io/docs/list-of-plugins.html
	config.plugins.push(new webpack.DefinePlugin({ 'process.env': { NODE_ENV: JSON.stringify('production') } }));
	config.plugins.push(new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false }, screw_ie8: true }));
}

module.exports = config;
