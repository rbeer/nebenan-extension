'use strict';

// generated on 2017-03-17 using generator-chrome-extension 0.6.1
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import del from 'del';
import runSequence from 'run-sequence';
import gutil from 'gulp-util';
import preprocess from 'gulp-preprocess';

const $ = gulpLoadPlugins();

// Sets build into DEV mode
// - Includes and loads module:bg/dev
//   Exposing `window.bgApp`, `bgApp.dev`, ...
// - Watch out for the preprocess() parts in
//   script files! A search for `// @` over
//   `/app/scripts.babel/` should reveal them all.
let DEV = process.argv.includes('--dev');
// Whether to include docs generation
let DOCS = process.argv.includes('--with-docs');
// Generate (not just copy existing) lodash library, no matter what
let LODASH = process.argv.includes('--with-lodash');

//---------------------------------\
// The Good, The Bad, The Scritps

gulp.task('scripts', () => {
  return gulp.src('app/scripts/**/*.js')
        .pipe($.sourcemaps.init())
        .pipe($.if(!DEV, $.uglify(), gutil.noop()))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('dist/scripts'));
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
//---------------------------/

//---------------------------\
// HTML, Styles, Images, ...
// a/k/a meta data :smirk:

gulp.task('extras', () => {

  let paths = [
    'app/_locales/**',
    'app/fonts/*.woff',
    'app/images/**/*',
    '!app/images/_xcf{,/*.xcf}',
    '!app/*.js',
    '!app/scripts.babel',
    '!app/*.json',
    '!app/*.html'
  ];

  if (DEV) {
    paths.unshift('app/.devdata/**');
  }
  return gulp.src(paths, {
    base: 'app',
    dot: true
  }).pipe(gulp.dest('dist'));
});

gulp.task('html', () => {
  return gulp.src('app/*.html')
    .pipe($.htmlmin({removeComments: true, collapseWhitespace: true}))
    .pipe(gulp.dest('dist'));
});

gulp.task('styles', () => {
  return gulp.src('app/styles/**/*.scss')
    .pipe($.sourcemaps.init())
    .pipe($.sass({ outputStyle: DEV ? 'expanded' : 'compressed'}).on('error', $.sass.logError))
    //.pipe($.cleanCss({compatibility: '*'}))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('dist/styles'));
});

gulp.task('manifest', () => {
  let pkg = require('./package.json');
  return gulp.src('app/manifest.json')
        .pipe($.jsonEditor((manifest) => {
          // add '-dev' to version_name, if in DEV mode
          manifest.version = pkg.version;
          manifest.version_name = pkg.version;
          if (DEV) {
            let d = new Date();
            let dString = [
              (d.getFullYear() + '').slice(2),
              d.getMonth(),
              d.getDay(),
              d.getHours(),
              d.getMinutes()
            ];
            manifest.version_name += '-dev_' + dString.join('');
          }

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

gulp.task('size', () => {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

//---------------------------/

//---------------------------\
// Cleanup Crews

gulp.task('clean', (cb) => {
  let pkg = require('./package.json');
  let docPath = `docs/${pkg.name}/${pkg.version}`;
  let latestLink = `docs/${pkg.name}/latest`;

  let delPaths = ['dist', 'app/scripts', docPath, latestLink];
  if (LODASH) {
    delPaths.push('app/lodash.js');
  }
  del(delPaths).then(() => {
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

//---------------------------/

//---------------------------\
// Bundling

let runProcess = (cmd, args, cb) => {
  let log = (data) => {
    data.toString()
        .split('\n')
        .forEach((line) => line !== '' ? gutil.log(line) : void 0);
  };
  let proc = require('child_process').spawn(cmd, args);
  proc.stdout.on('data', log);
  proc.stderr.on('data', log);
  proc.on('close', cb);
};

// require.js
let requirejsTask = (type, cb) => {
  let rjsConfig = `.rjs/${type}-${DEV ? 'dev' : 'build'}`;
  runProcess('r.js', [ '-o', rjsConfig ], cb);
};

gulp.task('requirejs', cb => runSequence('rjs-background', 'rjs-popup', cb));

gulp.task('rjs-popup', requirejsTask.bind(null, 'popup'));

gulp.task('rjs-background', requirejsTask.bind(null, 'background'));

let copyLodash = (path) => {
  return gulp.src(path)
             .pipe(gulp.dest('dist/scripts'));
};

// lodash
gulp.task('lodash', cb => {

  const fs = require('fs');

  // require lodash-cli arguments
  let argsObj = require('./.lodash.json');

  let generate = () => {
    gutil.log('Generating NEW lodash library');

    // ES strict mode; ftw
    let args = ['strict'];
    // dev = output only non-minified
    // production = output only minified
    args.push(DEV ? '-d' : '-p');

    // add to spawn() args array from required object
    for (let arg in argsObj) {
      // arguments with leading dash(es)
      // aren't concatenated to their values, ...
      if (arg.startsWith('-')) {
        args.push(arg);
        // .. some don't even have a value
        if (argsObj[arg]) {
          args.push(argsObj[arg]);
        }
      } else {
        let argString = arg + '=' + argsObj[arg];
        args.push(argString);
      }
    }

    // run lodash-cli
    runProcess('lodash', args, () => {
      copyLodash(argsObj['-o']);
      cb();
    });
  };

  // try to only copy file in dev mode
  // (generation takes 10s+)
  if (DEV && !LODASH) {
    return fs.access(argsObj['-o'], (err) => {
      // file DOES exist
      if (!err) {
        gutil.log('Using lodash COPY');
        copyLodash(argsObj['-o']);
        return cb();
      }
      // file does not exist
      generate();
    });
  }
  // generate library on normal `build`s
  generate();
});

//---------------------------\
// watchers

gulp.task('watch', cb => {

  let building = false;

  $.livereload.listen();

  gulp.watch([ 'app/**/*.*' ], (evt) => {
    if (!building) {
      let buildTasks = [
        'clean', 'build',
        () => {
          building = false;
          $.livereload.reload(evt.path);
        }
      ];
      if (DOCS) {
        buildTasks.splice(buildTasks.length - 2, 'docs');
      }
      building = true;
      runSequence.apply(null, buildTasks);
    }
  });
  cb();
});

gulp.task('watch-docs', cb => {
  runSequence('clean-docs', 'docs', () => {
    gulp.watch('app/scripts.babel/**/*.js', ['clean-docs', 'docs']);
    cb();
  });
});

//-------------------------------------\
// Main Tasks
// `build`   - Main build chain
//               --with-docs to include
//               building documentation
// `docs`    - Generates jsdoc for
//             current version in /docs/
// `dev`     - Build in developement mode
//             and watch /app/; builds docs
// `package` - Package/Zip /dist/
//             This does **not** create
//             a valid .crx!

gulp.task('build', cb => {
  DOCS = DOCS || process.argv.includes('--with-docs');

  let buildTasks = [
    'lint', 'babel', 'scripts', 'lodash', 'manifest',
    ['html', 'styles', 'extras'],
    'requirejs', 'size', cb
  ];
  // build with docs
  if (DOCS) {
    buildTasks.splice(buildTasks.length - 2, 0, 'docs');
  }

  runSequence.apply(null, buildTasks);
});

gulp.task('docs', cb => {
  let config = require('./.jsdoc.json');
  if (DOCS) {
    config.opts.verbose = false;
  }
  let pkg = require('./package.json');
  let docPath = `./${pkg.version}`;
  let latestPath = `docs/${pkg.name}/latest`;
  gulp.src('app/scripts.babel/**/*.js')
    .pipe($.jsdoc3(config, () => {
      require('fs').symlink(docPath, latestPath, 'dir', cb);
    }));
});

gulp.task('dev', cb => {
  DEV = true;
  DOCS = true;
  runSequence('clean', 'build', 'watch', cb);
});

gulp.task('package', () => {
  var manifest = require('./dist/manifest.json');
  return gulp.src('dist/**')
      .pipe($.if(manifest.version_name.endsWaith('-dev'), $.prompt.confirm('Package DEV version?'), gutil.noop()))
      .pipe($.zip('nebenan-' + manifest.version_name + '.zip'))
      .pipe(gulp.dest('package'));
});

//---------------------------\
// defaults to `build`

gulp.task('default', ['clean'], cb => {
  runSequence('build', cb);
});

//---------------------------/
