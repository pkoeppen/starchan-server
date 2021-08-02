const { spawn } = require('child_process');
const gulp = require('gulp');
const log = require('fancy-log');

let node;

function server(done) {
  if (node) {
    node.kill();
  }
  node = spawn('node', ['-r', 'dotenv/config', 'src/index.js'], {
    stdio: 'inherit',
  });
  node.on('close', function(code) {
    if (code && code !== 0) {
      log.error('Error detected, waiting for changes...');
    }
  });
  done();
}

function watch() {
  return gulp.watch(['./config.js', './src/**/*.js'], server);
}

process.on('exit', function() {
  if (node) {
    node.kill();
  }
});

exports.watch = gulp.parallel(server, watch);
