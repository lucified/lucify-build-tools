
var browserSync = require('browser-sync');


function serve() {
	var opts = {
		server: {
			baseDir: ['build']
		},
		files: ['build/**']
	};
	return browserSync(opts);
}


module.exports = serve;