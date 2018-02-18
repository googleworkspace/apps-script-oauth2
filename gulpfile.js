const gulp = require('gulp');
const concat = require('gulp-concat');
const expose = require('gulp-expose');
const del = require('del');
const rename = require("gulp-rename");
const jshint = require('gulp-jshint');
const stylish = require('jshint-stylish');
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
