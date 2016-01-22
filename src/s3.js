
var parseArgs = require('minimist');

var options = parseArgs(process.argv, {default: {
    force: false, bucket: null, profile: null}});

if (options.profile != null) {
    console.log("Using AWS profile " + options.profile);
    process.env['AWS_DEFAULT_PROFILE'] = options.profile;
}

var awspublish = require('gulp-awspublish');
var mergeStream = require('merge-stream');
var rename = require('gulp-rename');
var rimraf = require('rimraf');
var sprintf = require('sprintf');
var vfs = require('vinyl-fs');
var path = require('path')
var through2 = require('through2').obj

var entryPoints = [
  '**/*.html',
  '**/resize.js',
  '**/embed.js',
  '*.{png,ico}'
]


/*
 * Publish the given source files to AWS
 * with the given headers
 */
function publishToS3(bucket, simulate, force) {

  if (bucket === undefined) {
    bucket = options.bucket;
  }

  if(force === undefined) {
    force = options.force
  }

  if(simulate === undefined) {
    simulate = options.simulate
  }

  if (force) {
    rimraf.sync('./.awspublish-*');
  }

  // Config object is passed to
  // new AWS.S3() as documented here:
  //   http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property

  var publisher = createPublisher(bucket);
  var pStream = publisher.publish({}, {force: force, simulate: simulate === true ? true : false })

  if(!force) {
    pStream.pipe(publisher.cache())
  }
  pStream.pipe(awspublish.reporter())
  // Attach the publisher here, since it provides access to the AWS JS client as well
  pStream.publisher = publisher
  return pStream

}


/*
 * Create the AWS publisher
 */
function createPublisher(bucket) {
  // Access keys etc. are not needed in config as they
  // should be defined in the AWS credentials file.
  //
  // See:
  //   http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html
  //   https://www.npmjs.com/package/gulp-awspublish

  var config = {
    params: {
      'Bucket': bucket
    }
  };
  var publisher = awspublish.create(config);
  return publisher;
}

//
// https://github.com/jussi-kalliokoski/gulp-awspublish-router/blob/master/lib/utils/initFile.js
//
function s3Init (file) {
    if ( file.s3 ) { return; }

    file.s3 = {};
    file.s3.headers = {};
    file.s3.path = file.path.replace(file.base, "").replace(new RegExp("\\" + path.sep, "g"), "/");
}

/*
 * Publish all entry points assets
 * (assets without rev urls)
 */
function entryPointStream(sourceFolder) {

  if (!sourceFolder) {
    sourceFolder = 'dist';
  }

  return vfs.src(entryPoints, {cwd: sourceFolder})
}



/*
 * Publish all hashed assets
 * (assets with rev urls)
 *
 * targetFolder -- folder to publish into
 * maxAge -- expiry age for header
 */
function assetStream(sourceFolder, maxAge) {

  if (!isFinite(maxAge)) {
    maxAge = 3600;
  }

  console.log("Using max-age " + maxAge);

  if (!sourceFolder) {
    sourceFolder = 'dist';
  }

  var headers = {
    'Cache-Control': sprintf('max-age=%d, public', maxAge)
  };

  // Select everything BUT the entrypoints
  var src = entryPoints.map(f => "!"+f)
  src.unshift('**/*.*')

  return vfs.src(src, {cwd: sourceFolder})
    .pipe(through2((file, enc, cb) => {
      s3Init(file)
      Object.assign(file.s3.headers, headers)
      cb(null, file)
    }))
}

module.exports = {
  entryPointStream,
  assetStream,
  publishToS3,
  publish: (bucket, folder, simulate, force, entry_, asset_) => {
      var entry = entry_ || entryPointStream(folder)
      var asset = asset_ || assetStream(folder)
      var output  = new require('stream').PassThrough({objectMode: true})

      asset.once('end', () => entry.pipe(output) )
      return asset
        .pipe(output, {end: false})
        .pipe(publishToS3(bucket, simulate, force))


  }
}
