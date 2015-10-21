
var gulp = require('gulp');
var path = require('path');
var through2   = require("through2");
var $ = require('gulp-load-plugins')();

var src  = gulp.src;
var dest = gulp.dest;
var j = path.join;

var mergeStream = require('merge-stream');


var imagemin = $.cache($.imagemin({
  progressive: true,
  interlaced: true
}), {
  key: function(file) {
    if (file.isBuffer())
      return [file.path, file.contents.toString('base64')].join('');
    return undefined;
  }
});


function imagesFromSources(buildContext, sources) {

  var stream = mergeStream();
  sources.forEach(function(item) {
    stream.add(src(item));
  })
         
  stream = stream.pipe(imagemin);
    
  if (!buildContext.dev) {
    stream = stream.pipe($.rev());
  }
    
  // write images
  stream = stream.pipe(dest(j(buildContext.destPath, 'images')));

  if (!buildContext.dev) {
     stream = stream.pipe(buildContext.collectManifest());
  }  

  return stream;
}


function getSources(paths) {
  var srcs = [];
  paths.forEach(function(item) {
      srcs.push(j(item, 'src', 'images', '**', '*.{png,jpg,svg,gif}'));
      srcs.push(j(item, 'temp', 'generated-images', '**', '*.{png,jpg,svg,gif}'));
  });

  return srcs;
}


function images(buildContext, paths) {
  var merged = mergeStream();
  if (!paths) {
    paths = [];
  }
  paths.push('');

  return imagesFromSources(buildContext, getSources(paths));
}


module.exports = images;