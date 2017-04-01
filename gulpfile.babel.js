'use strict';

// generated on 2017-03-17 using generator-chrome-extension 0.6.1
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import del from 'del';
import runSequence from 'run-sequence';
import {stream as wiredep} from 'wiredep';
import gutil from 'gulp-util';
import preprocess from 'gulp-preprocess';

const $ = gulpLoadPlugins();

let DEV = false;

gulp.task('scripts', () => {
  return gulp.src('app/scripts/**/*.js')
        .pipe($.sourcemaps.init())
        .pipe($.uglify())
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('dist/scripts'));
});

gulp.task('extras', () => {
  return gulp.src([
    'app/*.*',
    'app/_locales/**',
    'app/fonts/*.*',
    '!app/scripts.babel',
    '!app/*.json',
    '!app/*.html'
  ], {
    base: 'app',
    dot: true
  }).pipe(gulp.dest('dist'));
});

function lint(files, options) {
  return () => {
    return gulp.src(files)
      .pipe($.eslint(options))
      .pipe($.eslint.format());
  };
}

gulp.task('lint', lint('app/scripts.babel/**/*.js', {
  env: {
    es6: true
  }
}));

gulp.task('images', () => {
  return gulp.src('app/images/**/*')
    .pipe($.if($.if.isFile, $.cache($.imagemin({
      progressive: true,
      interlaced: true,
      // don't remove IDs from SVGs, they are often used
      // as hooks for embedding and styling
      svgoPlugins: [{cleanupIDs: false}]
    }))
    .on('error', function(err) {
      console.log(err);
      this.end();
    })))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('html', () => {
  return gulp.src('app/*.html')
    .pipe($.useref({searchPath: ['.tmp', 'app', '.']}))
    .pipe($.sourcemaps.init())
    .pipe($.if('*.js', $.uglify()))
    .pipe($.sourcemaps.write())
    .pipe($.if('*.html', $.htmlmin({removeComments: true, collapseWhitespace: true})))
    .pipe(gulp.dest('dist'));
});

gulp.task('css', () => {
  return gulp.src('app/**/*.css')
    .pipe($.cleanCss({compatibility: '*'}))
    .pipe(gulp.dest('dist'));
});

gulp.task('chromeManifest', () => {
  return gulp.src('app/manifest.json')
        .pipe(gulp.dest('dist'));
});

gulp.task('babel', () => {
  return gulp.src('app/scripts.babel/**/*.js')
      .pipe(preprocess({ context: { DEV: DEV } }))
      .pipe($.babel({
        presets: ['es2015']
      }))
      .pipe(gulp.dest('app/scripts'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist', 'app/scripts']));

gulp.task('watch', cb => {

  let building = false;

  $.livereload.listen();

  gulp.watch([ 'app/**/*.*' ], (evt) => {
    if (!building) {
      building = true;
      runSequence('build', () => {
        building = false;
        $.livereload.reload(evt.path);
      });
    }
  });
  gulp.watch('bower.json', ['wiredep']);
  cb();
});

gulp.task('size', () => {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('wiredep', () => {
  gulp.src('app/*.html')
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('app'));
});

gulp.task('package', () => {
  var manifest = require('./dist/manifest.json');
  return gulp.src('dist/**')
      .pipe($.zip('nebenan-' + manifest.version + '.zip'))
      .pipe(gulp.dest('package'));
});

gulp.task('rjs', cb => {
  const spawn = require('child_process').spawn;
  let rjs = spawn('r.js', [ '-o', '.rjs' ]);

  let logRjs = (data) => {
    data.toString()
        .split('\n')
        .forEach((line) => line !== '' ? gutil.log(line) : void 0);
  };

  rjs.stdout.on('data', logRjs);
  rjs.stderr.on('data', logRjs);
  rjs.on('close', cb);
});

gulp.task('docs', cb => {
  let config = require('./.jsdoc.json');
  gulp.src('app/scripts.babel/**/*')
    .pipe($.jsdoc3(config, cb));
});

gulp.task('watch-docs', cb => {
  gulp.watch('app/**/*.js', ['docs']);
});

gulp.task('build', cb => {
  runSequence(
    'lint', 'babel', 'chromeManifest',
    ['scripts', 'html', 'css', 'images', 'extras'],
    'rjs', 'size', cb);
});

gulp.task('dev', cb => {
  DEV = true;
  runSequence('clean', 'build', 'watch', cb);
});

gulp.task('default', ['clean'], cb => {
  runSequence('build', cb);
});
