var gulp = require('gulp');
var concat = require('gulp-concat');
var expose = require('gulp-expose');
var stripLine  = require('gulp-strip-line');
var gulpif = require('gulp-if');
var del = require('del');
var bump = require('gulp-bump');
var rename = require("gulp-rename");
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');

gulp.task('release', ['clean', 'dist'], function() {
  gulp.src('./package.json')
      .pipe(bump({type:'minor'}))
      .pipe(gulp.dest('./'));
})

gulp.task('dist', function() {
  gulp.src('src/*.gs')
      .pipe(gulpif(/OAuth2\.gs$/,
          stripLine('var _ =')))
      .pipe(concat('OAuth2.gs'))
      .pipe(expose('this', 'OAuth2'))
      .pipe(gulp.dest('dist'));
  gulp.src('node_modules/underscore/underscore.js')
      .pipe(rename('Underscore.gs'))
      .pipe(gulp.dest('dist'));
});

gulp.task('clean', function() {
  del([
    'dist/*'
  ]);
});

gulp.task('lint', function() {
  return gulp.src('src/*.gs')
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});
