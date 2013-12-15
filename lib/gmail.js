
var nodemailer = require('nodemailer');
var settings = require('../settings').gmail;

var smtpTransport = nodemailer.createTransport('SMTP',{
  service: 'Gmail',
  auth: settings
});

module.exports = exports = {
  sendMail: function (fromName, fromMail, message, cb) {

    var mailOptions = {
      from: 'frokenrod.com <noreply@frokenrod.com>',
      to: 'Fröken Röd <info@frokenrod.com>',
      replyTo: fromName + ' <' + fromMail + '>',
      subject: 'Meddelande från frokenrod.com',
      text: message
    };

    smtpTransport.sendMail(mailOptions, function (err, res) {
      cb(err);
    });

  }
};
