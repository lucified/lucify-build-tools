
module.exports = {
	s3: require('./src/s3.js'),
	data: require('./src/data.js'),
	bundle: require('./src/bundle.js'),
	styles: require('./src/styles.js'),
	images: require('./src/images.js'),
	BuildContext: require('./src/build-context.js'),
	serve: require('./src/serve-browser-sync.js'),
	serveProd: require('./src/serve-prod.js'),
	manifest: require('./src/manifest.js')
}

