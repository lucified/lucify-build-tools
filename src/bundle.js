
var browserify = require('browserify');
var watchify = require('watchify');
var through = require("through");
var babelify = require('babelify');
var CombinedStream = require('combined-stream');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gulpif = require('gulp-if');
var $ = require('gulp-load-plugins')();
var hbs = require('handlebars');
var sprintf = require('sprintf');

var handleErrors = require('./handle-errors.js');

var gulp = require('gulp');
var src  = gulp.src;
var dest = gulp.dest;


/**
 * Create a browserify bundle according
 * to the given configuration
 *
 *  entryPoint          - the entry point for the bundle
 *  buildContext        - lucify build context
 *  opts.outputFileName - file name for produced bundle
 *  opts.destPath       - destinatino path for produced bundle
 */
function bundle(entryPoint, buildContext, opts) {

  if (!opts) {
    opts = {};
  }

  if (!opts.outputFileName) {
  	opts.outputFileName = 'index.js';
  }

  if (!opts.destPath) {
  	opts.destPath = buildContext.destPath;
  }

  if (opts.rev !== false) {
    opts.rev = true;
  }

  var shouldUglify = false;
  var config = {
      // these are needed for watchify
      cache: {}, packageCache: {}, fullPaths: false,
      // Specify the entry point of the bundle
      entries: entryPoint,
      // Enable source maps
      debug: buildContext.dev
  };

  var bundler = browserify(config)
    .transform(babelify.configure({stage: 1}));

  if (buildContext.watch) {
      // Wrap with watchify and rebundle on changes
      bundler = watchify(bundler);
      // Rebundle on update
      bundler.on('update', doBundle.bind(null, bundler, buildContext, opts));
  }

  return doBundle(bundler, buildContext, opts);
}


var doBundle = function(bundler, buildContext, opts) {

    var ap = !buildContext.assetPath ? null : buildContext.assetPath;

    var assets = "";

    if (!buildContext.dev) {
      assets = sprintf(
        "window.lucifyAssetManifest = %s;\n window.lucifyAssetPath = %s;\n",
        JSON.stringify(buildContext.assetManifest),
        JSON.stringify(ap));
    }

    var combined = CombinedStream.create();
	    combined.append(through().pause().queue(assets).end());
	    combined.append(bundler.bundle().on('error', handleErrors));

    var stream = combined
      .on('error', handleErrors)
      .on('error', function() {
        if (!buildContext.dev) {
          process.exit(1);
        }
      })
      .pipe(source(opts.outputFileName))
      .pipe(buffer())
      .pipe(gulpif(!buildContext.dev && buildContext.uglify, $.uglify()));

    if (!buildContext.dev && opts.rev) {
      stream = stream.pipe($.rev());
    }

    // write scripts
    stream = stream.pipe(dest(opts.destPath));

    if (!buildContext.dev) {
    	stream = stream.pipe(buildContext.collectManifest());
    }

    return stream;
};


module.exports = bundle;
