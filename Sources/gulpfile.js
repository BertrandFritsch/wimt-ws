"use strict";

var path = require("path");
var gulp = require("gulp");
var gutil = require("gulp-util");
var webpack = require("webpack");
var del = require('del');
var vinylPaths = require('vinyl-paths');

var filesToMove = [
  './src/index.html',
  './src/gridlayout/gridlayout.css',
  //'./src/SNCFData/*',
  './src/assets/*'
];

function buildJs(options, callback) {
  var plugins = options.minify ? [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },

      output: {
        comments: false,
        semicolons: true,
      },
    }),
  ] : [];
  var devtool = options.sourceMaps ? "source-map" : null;

  webpack({
    entry: {
      jsx: path.join(__dirname, "src", "app.jsx")
    },
    bail: !options.watch,
    watch: options.watch,
    devtool: devtool,
    plugins: plugins,
    resolve: {
      extensions: ['', '.js', '.jsx']
    },
    output: {
      path: path.join(__dirname, "dist"),
      filename: "index.js"
    },
    module: {
      loaders: [
        {
          test: /\.jsx?$/,
          exclude: /(node_modules)/,
          loader: 'babel',
          query: {
//            "presets": ["es2015", "react", "stage-0"]
            compact: false,
            stage: 0
          }
        },
        {test: /\.css$/, loader: "style-loader!css-loader"},
        {test: /\.png$/, loader: "url-loader?limit=100000"},
        {test: /\.jpg$/, loader: "file-loader"}
      ]
    }
  }, function (error, stats) {
    if (error) {
      var pluginError = new gutil.PluginError("webpack", error);

      if (callback) {
        callback(pluginError);
      } else {
        gutil.log("[webpack]", pluginError);
      }

      return;
    }

    gutil.log("[webpack]", stats.toString());
    if (callback) {
      callback();
    }
  });
}

gulp.task("build", ["move"], function (callback) {
  buildJs({watch: false, minify: false, sourceMaps: true}, callback);
});

gulp.task("production", ['clean'], function () {
  gulp.start('build:minify');
});

gulp.task("build:minify", ["move"], function (callback) {
  buildJs({watch: false, minify: true, sourceMaps: false}, callback);
});

gulp.task("watch", function () {
  buildJs({watch: true, minify: false});
});

gulp.task('move', function () {
  gulp.src(filesToMove, {base: './src'})
    .pipe(gulp.dest('dist'));
});

gulp.task('clean', function () {
  return gulp.src('dist/*')
    .pipe(vinylPaths(del));
});
