
var gulp = require('gulp');
var path = require('path');
var through2   = require("through2");
var $ = require('gulp-load-plugins')();

var src  = gulp.src;
var dest = gulp.dest;
var j = path.join;

var importOnce = require('node-sass-import-once');


var styles = function(buildContext) {

  var stream = src(j('src', 'scss', 'styles.scss')) 
 
    .pipe($.changed('styles', {
      extension: '.scss'
    }))

    // render sass files first through handlebars
    .pipe(through2.obj(function(file, enc, _cb) {
      var rendered = buildContext.hbs.renderSync(file.contents.toString())

      // replaces imagepaths, for example
      file.contents = new Buffer(rendered) 
      file.path = file.path.replace(/\.scss$/,'.css')
      
      // push to the outer stream
      this.push(file) 
      _cb();
    }))

    .pipe($.sass({
      importer: importOnce,
      importOnce: {
        index: false,
        css: false,
        bower: false
      },
      sync: false,
      precision: 10,
      onError: console.error.bind(console, 'Sass error:')
    }));

  if (!buildContext.dev) {
    stream = stream
      //.pipe($.autoprefixer())
      .pipe($.csso())
      .pipe($.rev())
  }

  // write styles
  stream = stream.pipe(dest(buildContext.destPath)); 
    
  if (!buildContext.dev) {
  	 stream = stream.pipe(buildContext.collectManifest());
  }  

  return stream;  
}


module.exports = styles;

