var express = require('express');
var request = require('request');
var app = express();

// SNCF data
app.get(/^(\/gare\/.*)$/, function (req, res) {
  console.log('^(\/gare\/.*)', ' -> ', req.url);

  var headers = {};
  headers['Authorization'] = req.get('Authorization');
  headers['Accept'] = req.get('Accept');
  headers['Cache-Control'] = req.get('Cache-Control');
  request({
    url: 'http://api.transilien.com' + req.params[0],
    headers: headers
  }).pipe(res);
});

// SNCFData.js
app.get(/^\/wimt\/(assets\/SNCFData.min.js)$/, function (req, res) {
  console.log('^\/wimt\/(assets\/SNCFData.min.js)', ' -> ', req.url);
  request.get('http://localhost:8083/' + req.params[0]).pipe(res);
});

// all other requests
app.get(/^\/(.*)$/, function (req, res) {
  console.log('^\/(.*)$', ' -> ', req.url, ' --> ', req.params[0]);
  request.get('http://localhost:8083/' + req.params[0]).pipe(res);
});

app.listen(8082);
