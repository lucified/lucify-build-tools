
var hbs = require('handlebars');
var through2 = require('through2');


var BuildContext = function(dev, uglify, optimize, destPath) {
	this.dev = dev;
	this.assetManifest = {};
	this.initHandleBars();
	this.uglify = uglify;
	this.optimize = optimize;

	if (!destPath) {
		this.destPath = this.dev ? 'build' : 'dist';
	} else {
		this.destPath = destPath;
	}

	console.log("destPath is" + this.destPath);
}


BuildContext.prototype.initHandleBars = function() {
	hbs.registerHelper("assetFilesScss", revved => {
	  var paths = this.assetManifest;
	  var a = Object.keys(paths).map(function(k) {
	    var v = revved ? paths[k] : k;
	    return "'" + v + "'";
	  })
	  return new hbs.SafeString(a.join(", "));
	})

	hbs.registerHelper("assetPath", key => {
	  var paths = this.assetManifest;
	  return new hbs.SafeString(paths[key] || key);
	})

	hbs.renderSync = function renderSync(str, context) {
	  context = context || {};
	  try {
	    var fn = (typeof str === 'function' ? str : hbs.compile(str, context));
	    return fn(context);
	  } catch (err) {
	    return err;
	  }
	};

	this.hbs = hbs;
}


BuildContext.prototype.collectManifest = function() {
  var firstFile = null;
  
  return through2.obj(function(file, enc, cb) {
    // ignore all non-rev'd files
    if (!file.path) {
      cb();
      return;
    }

    firstFile = firstFile || file;

    if (!file.revOrigPath) {
      this.assetManifest[relPath(firstFile.base, file.path)] = relPath(firstFile.base, file.path);
    } else {
      this.assetManifest[relPath(file.revOrigBase, file.revOrigPath)] = relPath(firstFile.base, file.path);
    }

    cb();
  }.bind(this));
}


module.exports = BuildContext;
