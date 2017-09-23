var gulp = require('gulp');
var postcss = require('gulp-postcss');
var spritesmith = require('gulp.spritesmith');
var merge = require('merge-stream');
var clean = require("gulp-clean");
var browserSync = require("browser-sync").create();
var runSequence = require("run-sequence");
var useref = require('gulp-useref');
var minimist = require('minimist');
var gulpif = require('gulp-if');
var buffer = require('vinyl-buffer');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant'); //png图片压缩插件
var uglify = require("gulp-uglify");
var htmlmin = require('gulp-htmlmin');
var minifyCss = require('gulp-clean-css');
var rename = require('gulp-rename');
var gulpIgnore = require('gulp-ignore');
var cssnano = require('cssnano');
var rev = require('gulp-rev');
var revReplace = require('gulp-rev-replace');
var fileinclude = require('gulp-file-include');

var knownOptions = {
	string: 'env',
	default: { env: process.env.NODE_ENV || 'development' }
};
var options = minimist(process.argv.slice(2), knownOptions);


var processors = [
	require('precss'),
	// require('postcss-px-to-viewport')({
	// 	viewportWidth: 320,
	// 	viewportHeight: 568,
	// 	unitPrecision: 5,
	// 	viewportUnit: 'vw',
	// 	selectorBlackList: [],
	// 	minPixelValue: 1,
	// 	mediaQuery: false
	// }),//px转vw
	require('postcss-assets')({
		loadPaths: ['src/images/'],
		relative: true
    }),
	require('postcss-will-change'),//给不支持will-change属性的浏览器触发GPU处理器
	// require('postcss-color-rgba-fallback'),//给不支持rgba的ie8作降级处理
	// require('postcss-opacity'),//给不支持opacity的ie8作降级处理
	// require('postcss-pseudoelements'),//给不支持::伪元素的ie8作降级处理
	// require('postcss-vmin'),//给不支持vmin的ie9作降级处理
	require('postcss-calc'),//尽可能让calc输出静态的值
	require('postcss-at2x'),//retina 2倍图片
	require('postcss-write-svg'),//在样式表的写svg // TODO 可能要废弃,与cssnano不兼容
	require('postcss-aspect-ratio-mini'),//长宽比效果
	// require('postcss-px2rem')({remUnit: 32}),//px转rem
	require('postcss-functions')({
		functions: {
	        px2rem: function (int) {
	        	return parseFloat(int / 32) + 'rem';
	        }
	    }
	}),//自定义函数 px2rem
	require('postcss-responsive-type'),//响应式文本
	require('autoprefixer')({ browsers: ['> 1%'] }),
	require('postcss-mq-keyframes'),//将所有关键帧从现有媒体查询中移动到样式表的底部
	require('css-mqpacker'),//相同的媒体查询样式合并到一个媒体查询中
];

var htmlMinOptions = {
	removeComments: true,//清除HTML注释
	collapseWhitespace: true,//压缩HTML
	collapseBooleanAttributes: true,//省略布尔属性的值 <input checked="true"/> ==> <input />
	removeEmptyAttributes: true,//删除所有空格作属性值 <input id="" /> ==> <input />
	removeScriptTypeAttributes: true,//删除<script>的type="text/javascript"
	removeStyleLinkTypeAttributes: true,//删除<style>和<link>的type="text/css"
	minifyJS: true,//压缩页面JS
	minifyCSS: true//压缩页面CSS
};

gulp.task('sprite', function () {
	var spriteData = gulp.src(['src/icons/*.png','!src/icons/*@3x.png'])
	.pipe(spritesmith({
		imgName: 'sprite.png',
    	imgPath: "../images/sprite.png",
		cssName: 'sprite.css',
		cssFormat: 'css',
    	padding: 20,
    	cssTemplate: 'handlebarsStr.css.handlebars'
	}));
	var imgStream = spriteData.img
	// DEV: We must buffer our stream into a Buffer for `imagemin`
	.pipe(buffer())
	.pipe(gulpif(options.env === 'production', imagemin({
            progressive: true,
            use: [pngquant()] //使用pngquant来压缩png图片
        }))) // TODO
	.pipe(gulp.dest('dest/images/'));
	var cssStream = spriteData.css
	.pipe(postcss([require('postcss-calc')]))
	.pipe(gulpif(options.env === 'production', postcss([cssnano]))) // TODO
	.pipe(gulp.dest('dest/styles/'));
	return merge(imgStream, cssStream);
});

gulp.task('html', function () {
	return gulp.src('src/*.html')
	.pipe(gulpif(options.env === 'production', htmlmin(htmlMinOptions))) // TODO
	.pipe(fileinclude({
		prefix: '@@',
		basepath: '@file',
		context: {
			hasFooter: true,
			arr: ['test1', 'test2']
		}
	}))
	.pipe(gulp.dest('dest/'))
})

gulp.task('style',function(){
	return gulp.src('src/styles/*.css')
	.pipe(postcss(processors))
	.pipe(gulpif(options.env === 'production', minifyCss())) // TODO
	.pipe(gulp.dest('dest/styles/'));
});

gulp.task('script',function(){
	return gulp.src('src/scripts/*.js')
	.pipe(gulpif(options.env === 'production', uglify().on('error', function(e){
		console.log(e);
	}))) // TODO
	.pipe(gulp.dest('dest/scripts/'));
});

gulp.task('image',function(){
	return gulp.src('src/images/*.*')
	.pipe(gulpif(options.env === 'production', imagemin({
            progressive: true,
            use: [pngquant()] //使用pngquant来压缩png图片
        })))
	.pipe(gulp.dest('dest/images/'));
});

gulp.task('vendor',function(){
	return gulp.src('src/vendor/**/*')
	.pipe(gulp.dest('dest/vendor/'));
});

gulp.task("clean", function() {
    return gulp.src(['dest/', 'build/'], {read: false})
    .pipe(clean());
});

gulp.task("server",function(){
    browserSync.init({
         server: "dest/",
        // proxy: "http://192.168.0.200:3000/dest/", //代理
        files: ["dest/styles/*.css"]
    });
});

gulp.task('default', ['clean'], function () {
	runSequence('html', 'sprite', 'image', 'style', 'script', 'vendor','server');
});

gulp.task('dev', ['default']);

gulp.watch('src/**/*.html', ['html']).on('change', function(event) {
	browserSync.reload();
	console.log('File ' + event.path + ' was ' + event.type + ',running tasks...[html]');
});

gulp.watch('src/styles/*.css', ['style']).on('change', function(event) {
	console.log('File ' + event.path + ' was ' + event.type + ',running tasks...[style]');
});

gulp.watch('src/scripts/*.js', ['script']).on('change', function(event) {
	browserSync.reload();
	console.log('File ' + event.path + ' was ' + event.type + ',running tasks...[script]');
});

gulp.watch('src/images/*.*', ['image']).on('change', function(event) {
	browserSync.reload();
	console.log('File ' + event.path + ' was ' + event.type + ',running tasks...[image]');
});

gulp.watch('src/icons/*.*', ['sprite']).on('change', function(event) {
	browserSync.reload();
	console.log('File ' + event.path + ' was ' + event.type + ',running tasks...[sprite]');
});

gulp.watch('src/vendor/**/*', ['vendor']).on('change', function(event) {
	browserSync.reload();
	console.log('File ' + event.path + ' was ' + event.type + ',running tasks...[vendor]');
});
	
// ----------------------------------------------------- 备用

gulp.task('concat', function () {
    gulp.src('src/scripts/*.js')
    .pipe(concat('all.js'))
    .pipe(gulp.dest('dest/scripts/'));
});

// ----------------------------------------------------- build

gulp.task("clean:build", function() {
    return gulp.src("build/", {read: false})
    .pipe(clean());
});

gulp.task('htmlmin', function () {
	return gulp.src('dest/*.html')
	.pipe(htmlmin(htmlMinOptions))
	.pipe(gulp.dest('build/'))
})

gulp.task('imagemin',function(){
	return gulp.src('dest/images/*.*')
	.pipe(imagemin({
            progressive: true,
            use: [pngquant()]
        }))
	.pipe(gulp.dest('build/images/'));
});

gulp.task('minifyCss',function(){
	return gulp.src('dest/styles/*.css')
	.pipe(minifyCss())
	.pipe(gulp.dest('build/styles/'));
});

gulp.task('uglify',function(){
	return gulp.src('dest/scripts/*.js')
	.pipe(uglify().on('error', function(e){
		console.log(e);
	}))
	.pipe(gulp.dest('build/scripts/'));
});

gulp.task("vendor:build",function(){
    return gulp.src('dest/vendor/**/*.*')
    .pipe(gulpif('*.js', uglify()))
    .pipe(gulpif('*.css', minifyCss()))
    .pipe(gulp.dest('build/vendor/'));
});

gulp.task("server:build",function(){
    browserSync.init({
         server: "build/",
        // proxy: "http://192.168.0.200:3000/dest/", //代理
    });
});

gulp.task('useref',['minifyCss', 'uglify', 'vendor:build'], function() {
    return gulp.src('dest/*.html')
    .pipe(useref())
    .pipe(gulpif('*.js', uglify()))
    .pipe(gulpif('*.css', minifyCss()))
    .pipe(gulpif('*.html', htmlmin(htmlMinOptions)))
    // .pipe(rename({suffix: ".min"}))
    // .pipe(gulpIgnore.exclude('*.html'))
    .pipe(gulp.dest('build/'));
});

gulp.task('rev', ['useref'], function() {
    return gulp.src([
    	'build/styles/*.css', 
    	'build/scripts/*.js', 
    	'build/images/*.*',
    	'build/common/*.*',
    	'build/vendor/**/*.*'
    ], {base: 'build'})
    .pipe(rev())
    .pipe(gulp.dest('build/'))
    .pipe(rev.manifest({
        merge: true
    }))
    .pipe(gulp.dest('build/'));
});

gulp.task('replacerev', ['rev'], function(){
  var manifest = gulp.src('build/rev-manifest.json');
  return gulp.src([
  		'build/*.html', 
  		'build/styles/*.css', 
  		'build/scripts/*.js', 
  		'build/common/*.*',
  		'build/vendor/**/*.*'
  	], {base: 'build'})
    .pipe(revReplace({manifest: manifest}))
    .pipe(gulp.dest('build/'));
});

gulp.task('build', ['clean:build'], function () {
	runSequence('imagemin', 'replacerev', 'server:build');
	//'htmlmin', 'minifyCss', 'uglify', 'vendor:build'
});







