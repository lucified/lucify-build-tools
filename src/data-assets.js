
function dataAssets(buildContext) {

  var stream = src(j('temp', 'data-assets', '*.json'));

  // cannot be done with gulpif
  // as jsonminify() is not "well-behaved"
  if (!buildContext.dev && buildContext.optimize) {
    stream = stream.pipe(jsonminify());
  }

  // write images
  stream = stream
    .pipe(gulpif(!buildContext.dev, $.rev()))
    .pipe(dest(j(getDest(dev), 'data-assets')));

  if (!buildContext.dev) {
    stream = stream
      .pipe(buildContext.collectManifest())
  }

  return stream;
}

