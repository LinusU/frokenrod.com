
var fs = require('fs');
var path = require('path');

var galleryRoot = path.join(__dirname, '..', 'gallery');

module.exports = exports = {
  index: function (req, res) {
    res.render('gallery-index');
  },
  album: function (req, res) {
    fs.readdir(path.join(galleryRoot, req.params.album), function (err, files) {
      var imgs = files.filter(function (e) {
        return (path.extname(e) === '.png');
      }).map(function (e) {
        var abspath = path.join(galleryRoot, req.params.album, e);
        var b64 = new Buffer(e).toString('base64');
        return {
          title: path.basename(abspath, '.png'),
          url: '/card/' + req.params.album + '/' + encodeURIComponent(b64) + '.png'
        };
      });
      res.render('gallery-album', { album: req.params.album, imgs: imgs });
    });
  },
  file: function (req, res) {
    var fileName = new Buffer(req.params.b64, 'base64').toString();
    res.sendfile(path.join(galleryRoot, req.params.album, fileName));
  }
};
