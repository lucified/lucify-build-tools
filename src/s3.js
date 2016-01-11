
var gulp = require('gulp');
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



/*
 * Publish the given source files to AWS
 * with the given headers
 */
function publishToS3(src, headers, folder, bucket) {

  if (!folder) {
    folder = "";
  }

  if (options.force) {
     rimraf.sync('./.awspublish-*');
  }

  // Config object is passed to
  // new AWS.S3() as documented here:
  //   http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property

  if (options.bucket != null) {
      bucket = options.bucket;
  }


  var publisher = createPublisher(bucket);

  var publishStream = function(stream, headers) {
    return stream
      .pipe(rename(function(path) {
        path.dirname += "";
      }))
      .pipe(publisher.publish(headers, {force: options.force, simulate: false}))
      .pipe(publisher.cache())
      .pipe(awspublish.reporter());
  };

  return publishStream(gulp.src(src), headers);
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


/*
 * Publish all entry points assets
 * (assets without rev urls)
 */
var epStream;
function publishEntryPoints(bucket, sourceFolder, targetFolder) {

  if (!sourceFolder) {
    sourceFolder = 'dist';
  }

  epStream = mergeStream(
    publishToS3(['./' + sourceFolder + '/**/*.html'], {}, targetFolder, bucket),
    publishToS3(['./' + sourceFolder + '/**/embed.js'], {}, targetFolder, bucket),
    publishToS3(['./' + sourceFolder + '/**/resize.js'], {}, targetFolder, bucket),
    publishToS3(['./' + sourceFolder + '/*.{png,ico}'], {}, targetFolder, bucket)
  );
  return epStream;
}



/*
 * Publish all hashed assets
 * (assets with rev urls)
 *
 * targetFolder -- folder to publish into
 * maxAge -- expiry age for header
 */
var hashedStream;
function publishHashedAssets(bucket, sourceFolder, targetFolder, maxAge) {

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
  hashedStream = publishToS3([
      './' + sourceFolder + '/**',            //
      '!./' + sourceFolder + '/**/*.html',    // note that
      '!./' + sourceFolder + '/**/embed.js',  // these
      '!./' + sourceFolder + '/**/resize.js', // are
      '!./' + sourceFolder + '/*.{png,ico}'], // exclusions
       headers, targetFolder, bucket);
  return hashedStream;
}


/*
 * Write publisher cache to speed up uploads
 */
function writeCache() {
  var publisher = createPublisher();
  return mergeStream(epStream, hashedStream)
    .pipe(publisher.cache());
}


module.exports.publishHashedAssets = publishHashedAssets;
module.exports.publishEntryPoints = publishEntryPoints;
module.exports.writeCache = writeCache;
