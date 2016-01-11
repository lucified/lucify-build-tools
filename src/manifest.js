
var gulp = require('gulp');
var _ = require('underscore');
var fs = require('fs');

/*
 * Create temporary asset manifest
 * in the temp directory
 */
var manifest = function(buildContext, cb) {

	if (buildContext.dev) {
		cb();
		return;
	}

	var keys = _.keys(buildContext.assetManifest);
	var values = keys.map(function(key) {
		return buildContext.assetManifest[key];
	});

	fs.writeFileSync('temp/asset-manifest.json', JSON.stringify(buildContext.assetManifest, null, 3));

	cb();
};


module.exports = manifest;
