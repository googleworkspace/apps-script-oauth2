var gulp = require('gulp');
var concat = require('gulp-concat');
var expose = require('gulp-expose');
var del = require('del');
var rename = require("gulp-rename");
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
const eslint = require('gulp-eslint');

gulp.task('dist', ['clean'], function() {
  gulp.src('src/*.gs')
      .pipe(concat('OAuth2.gs'))
      .pipe(expose('this', 'OAuth2'))
      .pipe(gulp.dest('dist'));
});

gulp.task('clean', function() {
  del([
    'dist/*'
  ]);
});

gulp.task('lint', () => {
  return gulp.src(['src/*.gs', 'samples/*.gs', 'test/**/*.js', '!node_modules/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});
