
var net = require('net');
var fs = require('fs');
var gntp = require('GNTP');
var rbytes = require('rbytes');

function findMessageEnd (buff){
    if( ( buff instanceof Buffer ) && buff.length >= 6){
        for( var i=0; i < buff.length -6; i++ ){
            if( buff[i+0] == 13 && buff[i+1] == 10 &&
                buff[i+2] == 13 && buff[i+3] == 10 &&
                buff[i+4] == 13 && buff[i+5] == 10){
                //End!
                return i;
            }
        }
    }
     return -1;
}


var server = net.createServer();
server.on('connection',function (sock){
    var recvd = 0,
        chunkSize = 1024,
        eomLength = 6,
        parsed = false;
    var msg = new Buffer(chunkSize);
    
    sock.on('data',function (data){
        var tmp, eol;
        if( data.length + recvd > msg.length){
            tmp = new Buffer(msg.length+chunkSize);
            msg.copy(tmp);
            msg = tmp;
        }
        
        data.copy(msg,recvd);
        console.log('SERVER RECV:'+data.length);
        eom = findMessageEnd(msg.slice((recvd >=eomLength?recvd-eomLength:recvd)));
        
        recvd+= data.length;
        
        var logFileU = fs.open('recv.log','a',null, function (err,fd){
            fs.writeSync(fd,data,0,data.length,recvd);
        });
        if( eom >= 0 ){
            var message = new gntp.Message();
            message.parse(msg);
            parsed = true;
            sock.end();
        }
    });
    sock.on('close',function (){
        console.log('socket closed');
        console.log('RCVD:'+recvd);
        // if the message wasn't parsed, attempt to parse it now.
        if( !parsed ){
            var message = new gntp.Message();
            message.parse(msg);
            parsed = true;
        }
        console.log('good:'+(parsed?'yes':'no'));
    });
    setTimeout( function (){
        sock.end();
    },3000);
});
server.listen(23053);

