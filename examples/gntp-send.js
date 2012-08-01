

var fs = require('fs');
var gntp = require('../lib/index.js');

var icon = fs.readFileSync('./nodejs.jpg');
var warn_icon = fs.readFileSync('./warning_icon.jpg');

var gntpResponse = function (response){
        console.log('Response Recieved');
        console.log('Type:', response.type);
        if( response.type === gntp.Constants.MessageTypeEnum.OK || response.type === gntp.Constants.MessageTypeEnum.ERROR ){
            console.log('From:', response.headers.getHeader(gntp.Constants.HeaderEnum.responseAction).value);
        }
        var headers = response.headers.headers;
        for( var i=0; i<headers.length; i++){
            console.log(headers[i].name+':='+headers[i].value);
        }
    };

var client = new gntp.Client();
client.host = '127.0.0.1';

client.on('sent',function handleSend(){
        //console.log('sent')
})
client.on('response',function handleResponse(msg){
        console.log('Response:  '+msg.type)
})
client.on('error', function handleError(msg){
        console.log('Error: [' + msg.parseInfo.error.code + '] ' + msg.parseInfo.error.text)
})

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
msg.headers.addHeader(new gntp.Header(gntp.Constants.HeaderEnum.dataHeaderPrefix+'Blarg','blarg'));

msg.crypto = new gntp.Crypto('nodejs','sha256','aes');


//client.on('response',gntpResponse)

setInterval(function () {
//setTimeout(function () {
    //console.log("sending...");
    client.sendMessage(msg);
    //console.log("sent...?");
},
50 // assanine
);

