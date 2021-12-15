var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify-es').default;
var gutil = require('gulp-util');
var header = require('gulp-header');

gulp.task('default', function() {
  // set up the browserify instance on a task basis
  var b = browserify({
    entries: 'lib/crypto.js',
    debug: false
  });

  return b
    .bundle()
    .pipe(source('lib/crypto.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(header('/**HAPPN CRYPTO UTILS**/\r\n'))
    .on('error', gutil.log)
    .pipe(gulp.dest('./build'));
});
