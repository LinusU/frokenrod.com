
var fs = require('fs');
var nib = require('nib');
var path = require('path');
var stylus = require('stylus');
var express = require('express');

var gmail = require('./lib/gmail');
var instagram = require('./lib/instagram');

var app = express();

app.set('views', path.join(__dirname, 'pages'));
app.set('view engine', 'jade');

app.use('/img', express.static(path.join(__dirname, 'assets')));
app.use(express.urlencoded());

app.get('/', function (req, res, next) {
  instagram.feed(function (err, feed) {
    if (err) {
      next(err);
    } else {
      res.render('landing', { feed: feed });
    }
  });
});

app.get('/contact', function (req, res) {
  res.render('contact-get');
});

app.post('/contact', function (req, res) {
  gmail.sendMail(req.body.name, req.body.mail, req.body.body, function (err) {
    res.render('contact-post', { success: (err === null) });
  });
});

app.get('/gallery', function (req, res) {
  res.render('gallery-index');
});

app.get('/gallery/:album', function (req, res) {
  fs.readdir(path.join(__dirname, 'gallery', req.params.album), function (err, files) {
    var imgs = files.filter(function (e) {
      return (path.extname(e) === '.png');
    }).map(function (e) {
      var abspath = path.join(__dirname, 'gallery', req.params.album, e);
      var b64 = new Buffer(e).toString('base64');
      return {
        title: path.basename(abspath, '.png'),
        url: '/gallery/' + req.params.album + '/' + encodeURIComponent(b64) + '.png'
      };
    });
    res.render('gallery-album', { album: req.params.album, imgs: imgs });
  });
});

app.get('/gallery/:album/:b64.png', function (req, res) {
  var fileName = new Buffer(req.params.b64, 'base64').toString();
  res.sendfile(path.join(__dirname, 'gallery', req.params.album, fileName));
});

app.get('/style', function (req, res, next) {
  var mainPath = path.join(__dirname, 'assets', 'main.styl');
  fs.readFile(mainPath, function (err, buf) {
    if (err) {
      next(err);
    } else {
      stylus(buf.toString())
        .set('filename', mainPath)
        .set('compress', true)
        .use(nib())
        .render(function (err, css) {
          if (err) {
            next(err);
          } else {
            res.set('Content-Type', 'text/css');
            res.send(css);
          }
        });
    }
  });
});

app.listen(3150);
console.log('http://localhost:3150/');
