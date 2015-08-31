// including plugins
var gulp = require('gulp'),
  uglify = require("gulp-uglify");

// task
gulp.task('minify-js', function () {
  gulp.src('./SNCFData/*.js') // path to your files
  .pipe(uglify())
  .pipe(gulp.dest('./dist'));
});