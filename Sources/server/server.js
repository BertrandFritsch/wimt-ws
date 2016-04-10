'use strict';

var express = require('express');
var request = require('request');
var path = require('path');
var app = express();

console.log('NODE_ENV: ', process.env.NODE_ENV);

var isProduction = process.env.NODE_ENV === 'production';

// SNCF data
app.get(/^(\/gare\/.*)$/, function (req, res) {
  console.log('^(\/gare\/.*)$', ' -> ', req.url);

  var headers = {};
  headers['Authorization'] = req.get('Authorization');
  headers['Accept'] = req.get('Accept');
  headers['Cache-Control'] = req.get('Cache-Control');
  request({
    url: 'http://api.transilien.com' + req.params[0],
    headers: headers
  }).pipe(res);
});

// all other requests
if (!isProduction) {
  app.get(/^\/(.*)$/, function (req, res) {
    console.log('^\/(.*)$', ' -> ', req.url, ' --> ', req.params[0]);
    request.get('http://localhost:8083/' + req.params[0]).pipe(res);
  });
}
else {
  app.use('/', express.static(path.join(__dirname, '../dist')));
}

app.listen(8082);
