
var connect = require('gulp-connect');

module.exports = function() {
	connect.server({
      root: './build',
      port: process.env.PORT || 5000, // localhost:5000
      livereload: false
    });
};
