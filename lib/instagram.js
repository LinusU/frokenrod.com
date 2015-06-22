
var settings = require('../settings').instagram;
var simpleGet = require('simple-get');
var qs = require('querystring');

var cacheData = null;
var cacheTime = 0;

function instagramRequest (url, cb) {
  simpleGet.concat(url, function (err, data) {
    if (err) return cb(err)

    var parsed
    try {
      parsed = JSON.parse(data)
    } catch (err) {
      return cb(err)
    }

    cb(null, parsed)
  })
}

function instagramRecentMedia (userId, cb) {
  var params = { user_id: userId, client_id: settings.client_id }
  var path = '/v1/users/352251735/media/recent?' + qs.stringify(params)
  instagramRequest('https://api.instagram.com' + path, cb)
}

module.exports = exports = {
  feed: function (cb) {

    var oneHour = 3600000;

    if (cacheTime > Date.now() - oneHour) {
      cb(null, cacheData);
      return ;
    }

    var feed = [];

    var append = function (err, result) {
      if (err) return cb(err)

      result.data.forEach(function (e) {
        if (e.type === 'image') {
          feed.push({
            id: e.id,
            title: (e.caption ? e.caption.text : null),
            image: e.images.standard_resolution.url,
            timestamp: parseInt(e.created_time) * 1000
          });
        }
      });

      console.log(result.pagination)
      if (result.pagination && result.pagination.next_url) {
        return instagramRequest(result.pagination.next_url, append);
      }

      cacheData = feed;
      cacheTime = Date.now();

      cb(null, feed);
    };

    instagramRecentMedia(settings.user_id, append);
  },
  endpoint: function (template, regex) {
    return function (req, res, next) {
      exports.feed(function (err, data) {
        if (err) {
          next(err);
        } else {
          var feed = data.filter(function (e) {
            return (regex.exec(e.title));
          });
          res.render(template, { feed: feed });
        }
      });
    };
  }
};
