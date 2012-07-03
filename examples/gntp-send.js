

var fs = require('fs');
var gntp = require('GNTP');

var icon = fs.readFileSync('./nodejs.jpg');
var warn_icon = fs.readFileSync('./warning_icon.jpg');

var gntpResponse = function (response){
        console.log('Response Recieved');
        console.log('Type:', response.type);
        if( response.type === gntp.MessageTypeEnum.OK || response.type === gntp.MessageTypeEnum.ERROR ){
            console.log('From:', response.headers.getHeader(gntp.HeaderEnum.responseAction).value);
        }
        var headers = response.headers.headers;
        for( var i=0; i<headers.length; i++){
            console.log(headers[i].name+':='+headers[i].value);
        }
    };

var client = new gntp.Client();
client.host = '192.168.11.7';

client.on('sent',function () { console.log('sent');} );
client.on('response',function (msg) { console.log('Response:  '+msg.type);});

var app = new gntp.Application('Node.js');
app.icon = icon;

var notify = new gntp.Notification();
notify.name = 'Test';
notify.displayName = 'Node.js Test';
notify.enabled = true;

var appReq = app.toRequest();
appReq.addNotification(notify);
var aRmime = appReq.toRequest();
client.sendMessage(aRmime);

var notReq = notify.toRequest();
notReq.applicationName = app.name;
notReq.text = 'testing Node.js';
notReq.icon = warn_icon;

var msg = notReq.toRequest();
msg.headers.addHeader(new gntp.Header(gntp.HeaderEnum.dataHeaderPrefix+'Blarg','blarg'));

msg.crypto = new gntp.Crypto('nodejs','sha1','des');


client.on('response',gntpResponse)

setInterval(function () {
//setTimeout(function () {
    console.log("sending...");
    client.sendMessage(msg);
    console.log("sent...?");
},1000);

