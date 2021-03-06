var expect = require("chai").expect

var es = require('event-stream')
var gutil = require('gulp-util')
var s3 = require('../src/s3')
var vfs = require('vinyl-fs');
var fs = require('fs')
var debug = require('gulp-debug');
var through2 = require('through2').obj
var AWS = require('aws-sdk')
var _ = require('lodash')
AWS.config.update({region: process.env.AWS_REGION || 'eu-west-1'});


var inspect = (obj) => console.log(require("util").inspect(obj,{ depth: null }))



describe("entrypoint-stream", () => {

  it("contains the entrypoints", done => {
    s3.entryPointStream('test/dist')
      .pipe(debug())
      .pipe(es.writeArray((err, files) => {
          expect(err).not.to.exist;
          expect(files).to.have.length(7);
          done();
      }))
  })

})

describe("asset-stream", () => {

  it("contains everything else", done => {
    s3.assetStream('test/dist')
      .pipe(debug())
      .pipe(es.writeArray((err, files) => {
          expect(err).not.to.exist;
          expect(files).to.have.length(4);
          done();
      }))
  })

})

describe("publish-stream", () => {

  it("contains everything in correct order", done => {

    var entries = []
    var eStream = s3.entryPointStream('test/dist')
      .pipe(through2((f,e,cb) => {
        entries.push(f)
        cb(null, f)
      }))
    var assets = []
    var aStream = s3.assetStream('test/dist')
      .pipe(through2((f,e,cb) => {
        assets.push(f)
        cb(null, f)

      }))

    s3.publish(eStream, aStream, 'test', true, true)
      .pipe(debug())
      .pipe(es.writeArray((err, files) => {
          expect(err).not.to.exist;
          inspect(files.map(f => f.s3))
          expect(files).to.have.length(11);
          expect(files).to.have.length(entries.length+assets.length);
          for (var i = assets.length - 1; i >= 0; i--) { // first assets
            expect(assets[i].path).to.equal(files[i].path)
          }
          for (var i = entries.length - 1; i >= 0; i--) { // then entrypoints
            expect(entries[i].path).to.equal(files[i+assets.length].path)
          }
          done();
      }))
  })

})


describe("cache", () => {

  it("gets written correctly", done => {

    var bucket = 'lucify-test-bucket'
    var cacheFile = `.awspublish-${bucket}`
    try {
      fs.unlinkSync(cacheFile, 'utf8');
    } catch(err) {
    }

    function uploadAndTest(state, done) {

        var entry = s3.entryPointStream('test/dist')
        var asset = s3.assetStream('test/dist')

        var combinedStream = s3.publish(entry, asset, bucket)

        var files = []
        return combinedStream
          .pipe(through2((f, enc, cb) => {
            expect(f.s3).to.exist
            expect(f.s3.state).to.equal(state)
            files.push(f)
            cb(null, f)
          }, cb => {
            try {
              var cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
              //inspect(cache)
              expect(_.keys(cache)).to.have.length(files.length)
              done()
            } catch(err) {
              done(err)
            }
          }))
    }
    cleanBucket(bucket, err => {
      if(err) return done(err)
      uploadAndTest('create', err => {
        if(err) return done(err)
        uploadAndTest('cache', done)
      })
    })
  })
})

function cleanBucket(bucket, cb) {
    var awsS3 = new AWS.S3()
    awsS3.listObjects({Bucket: bucket}, (err, data) => {
      if(err) {
         return cb(err)
      }
      //inspect(data.Contents.map(f => f.Key))
      var keys = data.Contents.map(f => _.pick(f, 'Key'))
      //inspect(keys)
      if(keys.length > 0) {
        del(keys, cb)
      } else {
        cb()
      }

      function del(keys, cb) {
        awsS3.deleteObjects({Bucket: bucket, Delete: {Objects: keys}}, (err, data) => {
          if(err) {
             return cb(err)
          }
          //inspect(data.Deleted.map(f => f.Key))
          console.log(`Deleted ${data.Deleted.length} files from ${bucket}`)
          cb()
        })
      }
    })
}










