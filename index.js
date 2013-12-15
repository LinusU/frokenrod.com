
var fs = require('fs');
var nib = require('nib');
var path = require('path');
var stylus = require('stylus');
var express = require('express');

var gmail = require('./lib/gmail');
var gallery = require('./lib/gallery');
var instagram = require('./lib/instagram');

var app = express();

app.set('views', path.join(__dirname, 'pages'));
app.set('view engine', 'jade');

app.use('/img', express.static(path.join(__dirname, 'assets')));
app.use(express.urlencoded());

app.get('/', instagram.endpoint('landing', /^(?!(Brick(a|or)|Grytunderlägg))/));
app.get('/tray', instagram.endpoint('tray', /^Brick(a|or)/));
app.get('/coaster', instagram.endpoint('coaster', /^Grytunderlägg/));

app.get('/card', gallery.index);
app.get('/card/:album', gallery.album);
app.get('/card/:album/:b64.png', gallery.file);

app.get('/contact', function (req, res) {
  res.render('contact-get');
});

app.post('/contact', function (req, res) {
  gmail.sendMail(req.body.name, req.body.mail, req.body.body, function (err) {
    res.render('contact-post', { success: (err === null) });
  });
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
