'use strict';

// generated on 2017-03-17 using generator-chrome-extension 0.6.1
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import del from 'del';
import runSequence from 'run-sequence';
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

gulp.task('styles', () => {
  return gulp.src('app/styles/**/*.scss')
    .pipe($.sourcemaps.init())
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.cleanCss({compatibility: '*'}))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('dist/styles'));
});

gulp.task('version', () => {
  return gulp.src('app/manifest.json')
        .pipe($.jsonEditor((manifest) => {
          // add '-dev' to version_name, if in DEV mode
          manifest.version_name = manifest.version + (DEV ? '-dev' : '');
          return manifest;
        }))
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

gulp.task('clean', (cb) => {
  let pkg = require('./package.json');
  let docPath = `docs/${pkg.name}/${pkg.version}`;
  let latestLink = `docs/${pkg.name}/latest`;
  del(['.tmp', 'dist', 'app/scripts', docPath, latestLink]).then(() => {
    cb();
  });
});

gulp.task('clean-docs', (cb) => {
  let pkg = require('./package.json');
  let docPath = `docs/${pkg.name}/${pkg.version}`;
  let latestLink = `docs/${pkg.name}/latest`;
  del([docPath, latestLink]).then(() => {
    cb();
  });
});

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
  cb();
});

gulp.task('size', () => {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('package', () => {
  var manifest = require('./dist/manifest.json');
  return gulp.src('dist/**')
      .pipe($.if(manifest.version_name.endsWith('-dev'), $.prompt.confirm('Package DEV version?'), gutil.noop()))
      .pipe($.zip('nebenan-' + manifest.version_name + '.zip'))
      .pipe(gulp.dest('package'));
});

gulp.task('requirejs', cb => {
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
  let pkg = require('./package.json');
  let docPath = `./${pkg.version}`;
  let latestPath = `docs/${pkg.name}/latest`;
  gulp.src('app/scripts.babel/**/*.js')
    .pipe($.jsdoc3(config, () => {
      require('fs').symlink(docPath, latestPath, 'dir', cb);
    }));
});

gulp.task('watch-docs', cb => {
  gulp.watch('app/scripts.babel/**/*.js', ['clean-docs', 'docs']);
});

gulp.task('build', cb => {
  runSequence(
    'lint', 'babel', 'version',
    ['scripts', 'html', 'styles', 'images', 'extras'],
    'requirejs', 'size', cb);
});

gulp.task('dev', cb => {
  DEV = true;
  runSequence('clean', 'build', 'watch', cb);
});

gulp.task('default', ['clean'], cb => {
  runSequence('build', cb);
});
