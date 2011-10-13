
var net = require('net');
var fs = require('fs');
var gntp = require('GNTP');
var rbytes = require('rbytes');

var server = net.createServer(
    function (c) {
        
    }
);
server.on('connection',function (sock){
    var recvd = 0;
    var msg = new Buffer(600);
    sock.on('data',function (data){
        recvd+= data.length;
        var logFileU = fs.open('recv.log','a',null, function (err,fd){
                fs.writeSync(fd,data,0,data.length,recvd);
            });
        data.copy(msg,recvd-data.length);
        console.log('SERVER RECV:'+data.length);
        sock.end();
    });
    sock.on('close',function (){
        console.log('socket closed');
        console.log('RCV:'+recvd);
        console.log('MSG:'+msg.toHex());
        var message = new gntp.Message();
        message.parse(msg);
    });
});
server.listen(23053);