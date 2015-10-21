
var gulp = require('gulp');
var path = require('path');
var through2   = require("through2");
var $ = require('gulp-load-plugins')();
var insert = require('gulp-insert');
var sprintf = require('sprintf');
var _ = require('underscore');

var src  = gulp.src;
var dest = gulp.dest;
var j = path.join;

var importOnce = require('node-sass-import-once');



var getVariablesInsert = function(manifest, assetPath) {

  var keys = _.keys(manifest);
  var values = keys.map(function(key) {
    return manifest[key];
  });


  var addHyphens = function(arr) {
    return arr.map(function(item) {
      return "'" + item + "'";
    })
  }

  var keysString = "";

  //if (keys.length > 0) {
    return sprintf("\n\n\n$asset-files: %s;\n$asset-files-rev: %s;\n$asset-path: '%s';\n\n", 
      addHyphens(keys).join(','), 
      addHyphens(values).join(','),
      assetPath);  
  //}
  return "";
};


var styles = function(buildContext) {

  var stream = src(j('src', 'scss', 'styles.scss')) 
 
    .pipe($.changed('styles', {
      extension: '.scss'
    }))

    .pipe(insert.prepend(getVariablesInsert(buildContext.assetManifest, 
      buildContext.dev ? "" : buildContext.assetPath)))

    //.pipe(dest('temp/scss'))

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
      //.pipe($.csso())
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

