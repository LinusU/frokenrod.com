var debug = require('debug')('frokenrod:instagram')
var settings = require('../settings').instagram;
var simpleGet = require('simple-get');
var qs = require('querystring');

var cacheData = null;
var cacheTime = 0;

var BATCH_SIZE = 20

function instagramRequest (url, cb) {
  debug('Making request to ' + url)

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

function instagramRecentMedia (opts, cb) {
  var params = Object.assign({}, opts, {
    access_token: settings.access_token
  })

  var path = '/v1/users/self/media/recent?' + qs.stringify(params)

  instagramRequest('https://api.instagram.com' + path, function (err, result) {
    if (err) return cb(err)

    if (result.meta && result.meta.error_type) {
      var error = new Error(result.meta.error_message)
      error.statusCode = result.meta.code
      error.name = result.meta.error_type
      return cb(error)
    }

    cb(null, result)
  })
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

      debug('Got ' + result.data.length + ' media entries')
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

      // if (result.pagination && result.pagination.next_url) {
      //   return instagramRequest(result.pagination.next_url, append);
      // }
      if (result.data.length === BATCH_SIZE) {
        return instagramRecentMedia({ count: BATCH_SIZE, max_id: result.data[BATCH_SIZE - 1].id }, append)
      }

      cacheData = feed;
      cacheTime = Date.now();

      cb(null, feed);
    };

    instagramRecentMedia({ count: BATCH_SIZE }, append);
  },
  endpoint: function (template, regex) {
    return function (req, res, next) {
      exports.feed(function (err, data) {
        if (err) {
          next(err);
        } else {
          var feed = data.filter(function (e) {
            var keep = regex.exec(e.title)
            debug('"' + e.title + '": ' + (keep ? 'keep' : 'discard'))
            return keep
          })

          res.render(template, { feed: feed })
        }
      });
    };
  }
};
