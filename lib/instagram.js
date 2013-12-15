
var Instagram = require('instagram-node-lib');
var settings = require('../settings').instagram;

Instagram.set('client_id', settings.client_id);
Instagram.set('client_secret', settings.client_secret);

var cacheData = null;
var cacheTime = 0;

module.exports = exports = {
  feed: function (cb) {

    var oneHour = 3600000;

    if (cacheTime > Date.now() - oneHour) {
      cb(null, cacheData);
      return ;
    }

    var feed = [];

    var append = function (data, pageination) {

      data.forEach(function (e) {
        if (e.type === 'image') {
          feed.push({
            id: e.id,
            title: (e.caption ? e.caption.text : null),
            image: e.images.standard_resolution.url,
            timestamp: parseInt(e.created_time) * 1000
          });
        }
      });

      console.log(pageination);
      if (pageination.next_url) {
        Instagram._request({
          path: pageination.next_url,
          error: done,
          complete: append
        });
      } else {
        done(null);
      }

    };

    var done = function (err) {
      if (err) {
        cb(err);
      } else {

        cacheData = feed;
        cacheTime = Date.now();

        cb(null, feed);
      }
    }

    Instagram.users.recent({
      user_id: settings.user_id,
      error: done,
      complete: append
    });

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
