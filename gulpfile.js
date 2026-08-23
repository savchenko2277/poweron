const gulp = require('gulp');
const merge2 = require('merge2');
const sass = require('gulp-sass')(require('sass'));
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const $ = require('gulp-load-plugins')({ pattern: ['*', '!sass'] });

const isRemote = process.argv.indexOf('--remote') !== -1;
const isSync = process.argv.indexOf('--sync') !== -1;
const isDev = process.argv.indexOf('--dev') !== -1;
const isNoMin = process.argv.indexOf('--nomin') !== -1;
const isProd = !isDev;
const version = +isProd && Date.now();

let pckg = require('./package.json');

let pth = {
	pbl: {
		root: './docs/',
		html: './docs/',
		js: './docs/js/',
		css: './docs/css',
		img: './docs/img/',
		fnts: './docs/fonts/',
	},
	src: {
		root: './src/',
		html: './src/[^_]*.html',
		js: './src/js/',
		css: './src/scss/style.scss',
		img: ['./src/img/**/*', '!./src/img/svg/**', '!./src/img/static/**'],
		static: './src/img/static/**/*',
		icn: './src/img/svg/**/*.svg',
		fnts: './src/fonts/**/*.*',
		tmpl: './src/templates/',
	},
	wtch: {
		html: './src/**/*.html',
		js: ['./src/js/**/*.js', './src/blocks/**/(*.js|*.json)'],
		css: ['./src/scss/**/*.scss', './src/blocks/**/*.scss'],
		img: ['./src/img/**', '!./src/img/svg/**'],
		icn: './src/img/svg/**/*.svg',
		fnts: './src/fonts/**/*.*',
	},
};

function swallowError(error) {
	console.log(error.toString());
	this.emit('end');
}

function clear() {
	return $.del(pth.pbl.root + '*');
}

function root() {
	return gulp
		.src(['./src/*', '!./src/*.html'], { dot: true, nodir: true })
		.pipe(gulp.dest(pth.pbl.root));
}

function js() {
	const jsDir = path.resolve(__dirname, 'src/js');
	const entries = {};

	fs.readdirSync(jsDir).forEach(file => {
		const filePath = path.join(jsDir, file);
		const isFile = fs.statSync(filePath).isFile();
		const isJs = path.extname(file) === '.js';
		const isExcluded = ['libs', 'polyfills.js', 'blocks.js'].includes(file);

		if (isFile && isJs && !isExcluded) {
			const name = path.basename(file, '.js');
			entries[name] = filePath;
		}
	});

	return gulp.src('./src/js/*.js')
		.pipe($.webpackStream({
			mode: isDev ? 'development' : 'production',
			entry: entries,
			output: {
				filename: '[name].js',
			},
			module: {
				rules: [{
					test: /\.js$/,
					exclude: /(node_modules|bower_components)/,
					use: {
						loader: 'babel-loader',
						options: { presets: ['@babel/preset-env'] },
					},
				}],
			},
			devtool: isDev ? 'eval-source-map' : false,
			optimization: {
				minimize: !isDev && !isNoMin,
			},
		}, webpack))
		.on('error', swallowError)
		.pipe(gulp.dest(pth.pbl.js))
		.pipe($.if(isSync, $.browserSync.stream()));
}

/* ===== 🧩 HTML ===== */
function html() {
	return gulp
		.src(pth.src.html)
		.pipe($.fileInclude({ prefix: '@@', basepath: pth.src.tmpl }))
		.on('error', swallowError)
		.pipe(
			$.if(
				isProd,
				$.typograf({
					locale: ['ru', 'en-US'],
					htmlEntity: { type: 'digit' },
					safeTags: [
						['<\\?php', '\\?>'],
						['<no-typography>', '</no-typography>'],
					],
				})
			)
		)
		.pipe($.replace(/(\.(css|js)\?v=)\d+\b/g, `$1${version}`))
		.pipe(gulp.dest(pth.pbl.html))
		.pipe($.if(isSync, $.browserSync.stream()));
}

/* ===== 🎨 STYLES ===== */
function styles() {
	const scss = gulp
		.src([
			'./src/scss/**/*.scss',
			'!./src/scss/lib/**',
			'!./src/scss/**/_*.scss'
		])
		.pipe($.if(isDev, $.sourcemaps.init()))
		.pipe($.globSass())
		.pipe(sass().on('error', sass.logError))
		.pipe(
			$.autoprefixer({
				overrideBrowserslist: ['last 4 versions'],
				cascade: false,
				grid: true,
			})
		)
		.pipe($.if(isProd, $.groupCssMediaQueries()))
		.pipe(
			$.if(
				isProd && !isNoMin,
				$.cleanCss({
					compatibility: { properties: { zeroUnits: false } },
					level: 2,
				})
			)
		)
		.pipe($.if(isDev, $.sourcemaps.write()))
		.pipe(gulp.dest(pth.pbl.css));

	const css = gulp
		.src([
			'./src/scss/**/*.css',
			'!./src/scss/lib/**'
		])
		.pipe(gulp.dest(pth.pbl.css));

	return merge2(scss, css)
		.pipe($.if(isSync, $.browserSync.stream()))
		.on('end', function () {
			if (isRemote) deploy(true, 'css');
		});
}

function images() {
	const processed = gulp
		.src(pth.src.img)
		.pipe($.newer(pth.pbl.img))
		.pipe($.webp())
		.pipe(gulp.dest(pth.pbl.img));

	const copied = gulp
		.src(pth.src.static)
		.pipe($.newer(pth.src.static))
		.pipe(gulp.dest(pth.pbl.img));

	return merge2(processed, copied).pipe($.if(isSync, $.browserSync.stream()));
}

function icons() {
	return gulp
		.src(pth.src.icn)
		.pipe(
			$.svgSprite({
				svg: { xmlDeclaration: false, rootAttributes: { class: 'sprite' } },
				shape: {
					transform: [
						{
							svgo: {
								plugins: [
									{ name: 'preset-default' },
									{
										name: 'removeAttrs',
										params: {
											attrs: '*:(fill|data-*|id|class|style|stroke)',
										},
									},
								],
							},
						},
					],
				},
				mode: {
					symbol: {
						dest: './',
						sprite: '_sprite.svg',
						example: !isProd,
					},
				},
			})
		)
		.on('error', swallowError)
		.pipe(gulp.dest(pth.src.tmpl));
}

function fonts() {
	return gulp
		.src(pth.src.fnts)
		.pipe($.newer(pth.pbl.fnts))
		.pipe($.fonter({ formats: ['woff', 'ttf'], compound2simple: true }))
		.pipe(gulp.dest(pth.pbl.fnts))
		.pipe($.ttf2woff2())
		.pipe(gulp.dest(pth.pbl.fnts))
		.pipe($.if(isSync, $.browserSync.stream()));
}
function deploy(e, ...args) {
	const conn = $.vinylFtp.create({
		host: pckg.ftp.host,
		user: pckg.ftp.user,
		password: pckg.ftp.password,
		parallel: 5,
		log: $.fancyLog,
	});

	args = args.length ? args : ['js', 'css'];
	args.forEach(function (item, i) {
		this[i] = pth.pbl[item] + '*.' + item;
	}, args);

	if (process.argv.indexOf('--all') !== -1) {
		return gulp
			.src(pth.pbl.root + '**', { base: pth.pbl.root })
			.pipe(conn.newerOrDifferentSize(pckg.ftp.workdir))
			.pipe(conn.dest(pckg.ftp.workdir));
	} else {
		return gulp
			.src(args, { base: pth.pbl.root, buffer: false })
			.pipe(conn.newerOrDifferentSize(pckg.ftp.workdir))
			.pipe(conn.dest(pckg.ftp.workdir));
	}
}

function watch() {
	if (isSync) {
		$.browserSync.init({
			server: { baseDir: pth.pbl.root },
		});
	}
	gulp.watch(pth.wtch.js, js);
	gulp.watch(pth.wtch.html, html);
	gulp.watch(pth.wtch.css, styles);
	gulp.watch(pth.wtch.img, images);
	gulp.watch(pth.wtch.icn, icons);
	gulp.watch(pth.wtch.fnts, fonts);
}

const build = gulp.series(clear, gulp.parallel(root, html, js, styles, images, icons, fonts));

exports.build = build;
exports.watch = gulp.series(build, watch);
exports.deploy = gulp.series(build, deploy);