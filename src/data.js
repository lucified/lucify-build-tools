
var gulp = require('gulp');
var path = require('path');
var through2   = require("through2");
var $ = require('gulp-load-plugins')();

var src  = gulp.src;
var dest = gulp.dest;
var j = path.join;

var mergeStream = require('merge-stream');



function dataFromSources(buildContext, sources) {

  var stream = mergeStream();
  sources.forEach(function(item) {
    stream.add(src(item));
  })
         
  if (!buildContext.dev && buildContext.optimize) {
    stream = stream.pipe(jsonminify());
  }
    
  if (!buildContext.dev) {
    stream = stream.pipe($.rev());
  }
    
  // write files
  stream = stream.pipe(dest(j(buildContext.destPath, 'data')));

  // if (!buildContext.dev) {
  //   stream = stream
  //     .pipe(collectManifest())
  //     .pipe(through2.obj(function(manifest, enc, cb) {
  //       _.merge(assetManifest, manifest)
  //       cb(null, manifest);
  //     }));
  // }
  return stream;
}


function getSources(paths) {
  var srcs = [];
  paths.forEach(function(item) {
  	  // verbatim-data corresponds to data that is used as a static web asset
  	  // without any preprocessing
      srcs.push(j(item, 'data', 'verbatim-data-assets', '*.json'));
      
      // prepared data is created by preprocessing scripts
      srcs.push(j(item, 'temp', 'data-assets', '*.json'));

      //srcs.push(j(item, 'temp', 'data-assets', '**', '*.{json}'));
  });

  return srcs;
}


function data(buildContext, paths) {
  var merged = mergeStream();
  if (!paths) {
    paths = [];
  }
  paths.push('');

  return dataFromSources(buildContext, getSources(paths));
}


module.exports = data;