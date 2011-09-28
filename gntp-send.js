

var gntp = require('GNTP');

var client = new gntp.Client();
client.host = '192.168.11.6';

var app = new gntp.Application('Node.js');

var notify = new gntp.Notification();
notify.name = 'Test';
notify.displayName = 'Node.js Test';
notify.enabled = true;

var appReq = app.toRequest();
appReq.addNotification(notify);

client.sendMessage(appReq.toRequest());

var notReq = notify.toRequest();
notReq.applicationName = app.name;
notReq.text = 'testing Node.js';

setInterval(function () {
    client.sendMessage(notReq.toRequest());
},1000);
