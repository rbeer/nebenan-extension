'use strict';

// generated on 2017-03-17 using generator-chrome-extension 0.6.1
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import del from 'del';
import runSequence from 'run-sequence';
import gutil from 'gulp-util';
import preprocess from 'gulp-preprocess';

const $ = gulpLoadPlugins();

let hasParam = (param) => process.argv.includes(param);

const FLAGS = {
  // Sets build into DEV mode
  // - Includes and loads module:bg/dev
  //   Exposing `window.bgApp`, `bgApp.dev`, ...
  // - Watch out for the preprocess() parts in
  //   script files! A search for `// @` over
  //   `/app/scripts.babel/` should reveal them all.
  DEV: hasParam('--dev'),
  // Whether to include docs generation
  DOCS: hasParam('--with-docs'),
  // Generate (not just copy existing) lodash library, no matter what
  LODASH: !hasParam('--omit-lodash'),
  // test port or not for livereload
  TEST: false,
  VERBOSE: hasParam('--verbose')
};

//---------------------------------\
// The Good, The Bad, The Scritps

gulp.task('scripts', () => {
  return gulp.src('app/scripts/**/*.js')
        .pipe($.sourcemaps.init())
        .pipe($.if(!FLAGS.DEV, $.uglify(), gutil.noop()))
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

let getPreProcessContext = () => {
  let ctxObj = {};
  Object.keys(FLAGS).forEach((FLAG) => {
    if (FLAGS[FLAG]) {
      ctxObj[FLAG] = FLAGS[FLAG];
    }
  });
  return { context: ctxObj };
};

gulp.task('babel', () => {
  return gulp.src('app/scripts.babel/**/*.js')
      .pipe(preprocess(getPreProcessContext()))
      .pipe($.babel({
        presets: ['es2015']
      }))
      .pipe(gulp.dest('app/scripts'));
});
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

  if (FLAGS.DEV) {
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
    .pipe($.sass({ outputStyle: FLAGS.DEV ? 'expanded' : 'compressed'}).on('error', $.sass.logError))
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
          if (FLAGS.DEV) {
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
  if (FLAGS.LODASH) {
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
  let log = FLAGS.VERBOSE ? (data) => {
    data.toString()
        .split('\n')
        .forEach((line) => line !== '' ? gutil.log(line) : void 0);
  } : () => void 0;
  let proc = require('child_process').spawn(cmd, args);
  proc.stdout.on('data', log);
  proc.stderr.on('data', log);
  proc.on('close', cb);
};

// require.js
gulp.task('requirejs', cb => runSequence('rjs-background', 'rjs-popup', cb));

let getRequireJsConfig = (type) => `.rjs/${type}-${FLAGS.DEV ? 'dev' : 'build'}`;
let requirejsTask = (type, cb) => runProcess('r.js', [
  '-o',
  getRequireJsConfig(type)
], cb);

gulp.task('rjs-background', requirejsTask.bind(null, 'background'));
gulp.task('rjs-popup', requirejsTask.bind(null, 'popup'));
gulp.task('rjs-tests', requirejsTask.bind(null, 'tests'));

// lodash
let copyLodash = (path) => {
  return gulp.src(path)
             .pipe(gulp.dest('dist/scripts'));
};

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
    args.push(FLAGS.DEV ? '-d' : '-p');

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

  // try to only copy file
  // (generation takes 10s+)
  if (!FLAGS.LODASH) {
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
  FLAGS.LODASH = false;
  FLAGS.DEV = true;
  runSequence('build', () => {
    $.livereload.listen();
    gulp.watch('app/scripts.babel/**/*.*', () => {
      runSequence('clean', 'build', 'reload');
    });
    cb();
  });
});

gulp.task('reload', () => {
  $.livereload.reload('app');
});

gulp.task('watch-docs', cb => {
  runSequence('clean-docs', 'docs', () => {
    gulp.watch('app/scripts.babel/**/*.js', ['clean-docs', 'docs']);
    cb();
  });
});

gulp.task('watch-tests', ['watch'], () => {
  FLAGS.LODASH = false;
  FLAGS.DEV = true;
  runSequence('test', () => {
    $.livereload.listen();
    gulp.watch([
      'dist/scripts/builds/background.js',
      'test/**/*.spec.js',
      'test/setup.js'
    ], () => {
      runSequence('test', 'reload-tests');
    });
  });
});

gulp.task('reload-tests', () => {
  if ($.livereload.server) {
    $.livereload.reload('tests');
  }
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

gulp.task('build', ['clean'], cb => {

  let buildTasks = [
    'lint', 'babel', 'scripts', 'lodash', 'manifest',
    ['html', 'styles', 'extras'],
    'requirejs', 'size', cb
  ];
  // build with docs
  if (FLAGS.DOCS) {
    buildTasks.splice(buildTasks.length - 3, 0, 'docs');
  }

  runSequence.apply(null, buildTasks);
});

gulp.task('docs', cb => {
  let config = require('./.jsdoc.json');
  if (FLAGS.DOCS) {
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
  FLAGS.DEV = true;
  FLAGS.DOCS = true;
  FLAGS.LODASH = false;
  runSequence('clean', 'build', 'watch', cb);
});

gulp.task('package', () => {
  var manifest = require('./dist/manifest.json');
  return gulp.src('dist/**')
      .pipe($.if(manifest.version_name.endsWaith('-dev'), $.prompt.confirm('Package DEV version?'), gutil.noop()))
      .pipe($.zip('nebenan-' + manifest.version_name + '.zip'))
      .pipe(gulp.dest('package'));
});

gulp.task('test', cb => {
  FLAGS.DEV = true;
  FLAGS.TEST = true;
  FLAGS.LODASH = false;
  runSequence('rjs-tests', cb);
});

//---------------------------\
// defaults to `build`

gulp.task('default', ['clean'], cb => {
  runSequence('build', cb);
});

//---------------------------/
