

function images(buildContext) {

  var stream = mergeStream(
    src(j('src', 'www', 'images', '**', '*.{png,jpg,svg,gif}')),
    src(j('temp', 'generated-images', '**', '*.{png,jpg,svg,gif}')));
          
  stream = stream.pipe(imagemin);
    
  if (!buildContext.dev) {
    stream = stream.pipe($.rev());
  }
    
  // write images
  stream = stream.pipe(dest(j(getDest(dev), 'images')));

  if (!buildContext.dev) {
    stream = stream
      .pipe(collectManifest())
      .pipe(through2.obj(function(manifest, enc, cb) {
        _.merge(assetManifest, manifest)
        cb(null, manifest);
      }));
  }
    
  return stream;
}