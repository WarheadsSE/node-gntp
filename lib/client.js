/*--------------------------
    Client object/class
*/
var constants = require('./constants.js')
    , net = require('net')
    , events = require('events')
    , Message = require('./message.js').Message
    , Application = require('./application.js').Application
    , ApplicationRequest = require('./applicationRequest.js').ApplicationRequest
    , Notification = require('./notification.js').Notification
    , NotificationRequest = require('./notificationRequest.js').NotificationRequest

function Client () {
    this.host = '127.0.0.1';
    this.port = 23053;
    this.password = '';
    this.debug = false;
    
    events.EventEmitter.call(this);
}
Client.prototype = new events.EventEmitter();
exports.Client = Client;

Client.prototype.sendMessage = function (request){
    var response;
    var sock = net.createConnection(this.port,this.host);
    var self = this;
    var chunkSize = 1024;
    var eomLength = 6;
    var recvd = 0;
    var msgdata = new Buffer(chunkSize);
    var message = new Message();
    //sock.setTimeout(3000);
    sock.on('connect',function () {
        var protocol = request.protocolString();
        var mime = request.mime();
        var mBuff = new Buffer(protocol.length+mime.length+(constants.EndLine.length));
        mBuff.write(protocol,0,'utf8');
        mime.copy(mBuff,protocol.length,0);
        mBuff.write(constants.EndLine,protocol.length+mime.length,'utf8');
        
        sock.write(mBuff);
        
        self.emit('sent');
    });
    sock.on('data',function (data){
        
        var tmp, eom = false;
        console.log('Recv:\r\n'+data.toString());
        
        eom = message.parse(data);
        if( eom === true ){
            //console.log('emitting response!');
            self.emit('response',message);
        }
    });
    sock.on('error',function (exception) { 
        console.log("socket error:"+exception); 
    });
    sock.on('close',function (had_error) { 
        console.log('socket closed.'+(had_error?' with eror':''));
    });
    sock.on('timeout',function () { 
        console.log('socket timeout'); 
        sock.destroy(); 
    });
    
};