const path = require('path');
const Glob = require('Glob');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const resolve = function(dir) {
    return path.join(__dirname, '..', dir)
}

//-----------------------------------------------------
const getJsEntry = function(globPath) {
    let entries = {};
    Glob.sync(globPath).forEach(function (entry) {
        let basename = path.basename(entry, path.extname(entry)),
            pathname = path.dirname(entry);
        // js/lib/*.js 不作为入口
        if (!entry.match(/\/js\/lib\//)) {
            entries[pathname.split('/').splice(3).join('/') + '' + basename] = pathname + '/' + 'scripts/' + basename + '.js';
        }
    });
    return entries;
}

let entryJs = getJsEntry('./app/*.html');
entryJs.vendor = ['jquery','bootstrap','moment'];
/*
    //entryJs
    {
        index: './app/scripts/index.js',
        test: './app/scripts/test.js',
        vendor: ['jquery','bootstrap','moment']
    }
*/

//-----------------------------------------------------
const plugins = [
    new CleanWebpackPlugin(['build']),
    new webpack.optimize.OccurrenceOrderPlugin(),//为组件分配ID
    new webpack.DefinePlugin({
        'process.env.NODE_ENV': '"production"',
    }),
    new webpack.ProvidePlugin({
        $: "jquery",
        jQuery: "jquery"
    }),
    new webpack.BannerPlugin('版权所有，翻版必究'),
    new webpack.optimize.UglifyJsPlugin({//压缩JS代码
     compress: {
            warnings: false,
            drop_console: false,
        }
    }),
    //---------------提取公告模块
    new webpack.optimize.CommonsChunkPlugin({
        name: ['vendor', 'manifest'],
        minChunks: Infinity,
        filename: 'assets/scripts/[name].[id].[chunkhash:8].js',
    }),
    new ExtractTextPlugin({//分离CSS和JS文件
        filename: 'assets/styles/bundle-[name]-[id]-[contenthash:8].css',
        allChunks: false
    })
];

const getHtmlEntry = function(globPath) {
    let entries = [];
    Glob.sync(globPath).forEach(function (entry) {
        let config = {},
            basename = path.basename(entry, path.extname(entry)),
            pathname = path.dirname(entry);
        config.filename = basename + '.html';
        config.template = 'html-withimg-loader!' + 'app/' + basename + '.html';
        let chunks = ['vendor', 'manifest'];
            chunks.push('' + basename);
        config.chunks = chunks;
        entries.push(config);
    });
    return entries;
}
const htmlEntry = getHtmlEntry('./app/*.html');
htmlEntry.forEach(function(item,index){
    plugins.push(new HtmlWebpackPlugin(item));
});

//-----------------------------------------------------
module.exports = {
	devtool: 'eval-source-map',
	entry: entryJs,
	output: {
		path: path.join(__dirname, "build"),
		filename: 'assets/scripts/bundle.[name].[id].[chunkhash:8].js',
		publicPath: '/'
	},
	// resolve: {
 //        // extensions: ['.js', '.css'],
 //        alias: {
 //            '@': resolve('app')
 //        }
 //    },
	devServer: {
        // contentBase: path.join(__dirname, "build"),
        headers: {
            "X-Custom-Foo": "bar"
        },
        historyApiFallback: true,
        compress: true,//对资源启用 gzip 压缩
        publicPath: '/',
        inline: true,
        host: "192.168.0.12",
        port: 4000,
	},
	module: {
		rules: [
			{
				test: /(\.jsx|\.js)$/,
				use: {
					loader: 'babel-loader'
				},
				exclude: /(node_modules|bower_components)/
			},
			{
				test: /\.css$/,
				use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    publicPath: '/',
                    use: [{
                        loader: "css-loader",
                        options: {
                            // modules: true //css模块功能
                        }
                    }, {
                        loader: "postcss-loader",
                        options: {
                            config: {
                                path: './postcss.config.js'
                            }
                        }
                    }],
                })
			},
		    {
                test: /\.(png|jpe?g|gif|svg)(\?\S*)?$/,
                loader: 'url-loader',
                options: {
                    name: 'assets/images/[name].[hash:8].[ext]',
                    // outputPath: '/assets/',
                    publicPath: '/',
                    limit: 1024 * 5
                }
            },
            {
                test: /\.html$/,
                use: [
                    {
                        loader: "html-withimg-loader",
                        options: {
                            // exclude: /image/,//排除image目录
                            min: false,//默认会去除html中的换行符，配置min=false可不去除
                            deep: false,//将关闭include语法嵌套子页面的功能
                        }
                    },
                    {
                        loader: "html-loader",
                        options: {
                            attrs: ['img:data-src'],
                            interpolate: true,
                        }
                    }
                ]
            },
		    {
                test: /\.(eot|svg|ttf|woff|woff2)(\?\S*)?$/,
                loader: 'file-loader',
                options: {
                	name: 'assets/fonts/[name].[hash:8].[ext]',
                    publicPath: '/',
                }
            }
		]
	},
	plugins: plugins
}