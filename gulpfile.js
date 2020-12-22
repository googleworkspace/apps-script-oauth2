const concat = require('gulp-concat');
const contains = require('gulp-contains');
const del = require('del');
const eslint = require('gulp-eslint');
const expose = require('gulp-expose');
const gulp = require('gulp');
const rename = require("gulp-rename");

// Regex that looks for a populated client ID in the code. This is used to
// catch cases where the client ID is accidentally committed in a sample.
const CLIENT_ID_REGEX = /CLIENT_ID\s*=\s*'[^.']/;

// String which if it appears in the source code bypasses the client ID check.
// This is to allow samples that use a publicly-available demo client ID to
// not trigger the error.
const CLIENT_ID_BYPASS = '@credentialsOK';

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
      .pipe(eslint.failAfterError())
      .pipe(contains({
        search: CLIENT_ID_REGEX,
        onFound: (string, file, cb) => {
          if (file.contents.toString().includes(CLIENT_ID_BYPASS)) {
            return false;
          }
          return cb(`Client ID found in file: "${file.relative}"`);
        }
      }));
});
