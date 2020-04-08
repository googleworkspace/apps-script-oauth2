const gulp = require('gulp');
const concat = require('gulp-concat');
const expose = require('gulp-expose');
const del = require('del');
const rename = require("gulp-rename");
const eslint = require('gulp-eslint');

gulp.task('clean', async function() {
  return del([
    'dist/*'
  ]);
});

gulp.task('dist', gulp.series('clean', async function(){
  return gulp.src('src/*.js')
      .pipe(concat('OAuth2.gs'))
      .pipe(expose('this', 'OAuth2'))
      .pipe(gulp.dest('dist'));
}));

gulp.task('lint', () => {
  return gulp.src(['src/*.js', 'samples/*.gs', 'test/**/*.js', '!node_modules/**'])
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failAfterError());
});
