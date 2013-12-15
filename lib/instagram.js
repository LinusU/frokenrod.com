
var Instagram = require('instagram-node-lib');
var settings = require('../settings').instagram;

Instagram.set('client_id', settings.client_id);
Instagram.set('client_secret', settings.client_secret);

var cacheData = null;
var cacheTime = 0;

module.exports = exports = {
  feed: function (cb) {

    var tenMinutes = 600000;

    if (cacheTime > Date.now() - tenMinutes) {
      cb(null, cacheData);
      return ;
    }

    Instagram.users.recent({
      user_id: settings.user_id,
      error: function (err) { cb(err); },
      complete: function (data) {

        var feed = data.filter(function (e) {
          return (e.type === 'image');
        }).map(function (e) {
          return {
            id: e.id,
            title: (e.caption ? e.caption.text : null),
            image: e.images.standard_resolution.url,
            timestamp: parseInt(e.created_time) * 1000
          }
        });

        cacheData = feed;
        cacheTime = Date.now();

        cb(null, feed);
      }
    });
  }
};
