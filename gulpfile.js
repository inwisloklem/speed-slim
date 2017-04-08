"use strict";

var gulp = require("gulp");

var autoprefixer = require("gulp-autoprefixer");
var cssmin = require("gulp-csso");
var del = require("del");
var imagemin = require("gulp-imagemin");
var inject = require("gulp-inject");
var plumber = require("gulp-plumber");
var pug = require("gulp-pug");
var rename = require("gulp-rename");
var replace = require("gulp-replace");
var run = require("run-sequence");
var server = require("browser-sync").create();
var styl = require("gulp-stylus");
var svgmin = require("gulp-svgmin");
var svgstore = require("gulp-svgstore");

gulp.task("serve", ["markup", "styles"], function() {
  server.init({
    server: "app",
    notify: false,
    ui: false
  });

  gulp.watch("app/pages/**/*.pug", ["markup"]);
  gulp.watch("app/styles/**/*.styl", ["styles"]);

  gulp.watch("app/*.html").on("change", server.reload);
});

gulp.task("markup", function() {
  return gulp.src("app/pages/*.pug")
    .pipe(plumber())
    .pipe(pug())
    .pipe(gulp.dest("app"))
    .pipe(server.stream());
});

gulp.task("styles", function() {
  return gulp.src("app/styles/style.styl")
    .pipe(plumber())
    .pipe(styl())
    .pipe(gulp.dest("app/css"))
    .pipe(server.stream());
});

gulp.task("svg-sprite", function() {
  var icons = gulp.src("app/img/icons/*.svg")
    .pipe(svgmin())
    .pipe(svgstore({inlineSvg: true}));

  function fileContents(filePath, file) {
    return file.contents.toString();
  }

  return gulp.src("app/pages/parts/svg-sprite.pug")
    .pipe(inject(icons, {transform: fileContents}))
    .pipe(gulp.dest("app/pages/parts"));
});

gulp.task("dist", function(fn) {
  run(
    "dist-clean",
    "svg-sprite",
    "dist-styles",
    "dist-markup",
    "dist-images",
    "dist-copy",
    "dist-replace",
    fn
  );
});

gulp.task("dist-copy", function() {
  return gulp.src([
    "app/fonts/*.{woff,woff2}",
    "app/img/!icons",
    "app/js/*.js"
  ], {base: "app"})
  .pipe(gulp.dest("dist"));
});

gulp.task("dist-images", function() {
  return gulp.src("app/img/**/*.{png,jpg,gif}")
  .pipe(imagemin([
    imagemin.optipng({optimizationLevel: 3}),
    imagemin.jpegtran({progressive: true})
  ]))
  .pipe(gulp.dest("dist/img"));
});

gulp.task("dist-styles", function() {
  return gulp.src("app/css/style.css")
    .pipe(autoprefixer({
      browsers: ["last 2 versions"]
    }))
    .pipe(cssmin())
    .pipe(rename("style.min.css"))
    .pipe(gulp.dest("dist/css"));
});

gulp.task("dist-markup", function() {
  return gulp.src("app/pages/*.pug")
    .pipe(plumber())
    .pipe(pug())
    .pipe(gulp.dest("dist"))
    .pipe(server.stream());
});

gulp.task("dist-replace", function() {
  return gulp.src("dist/*.html")
  .pipe(replace("style.css", "style.min.css"))
  .pipe(gulp.dest("dist"));
});

gulp.task("dist-clean", function() {
  return del(["dist/**/*", "!dist", "!dist/.gitkeep"]);
});
