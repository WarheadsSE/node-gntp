
var net = require('net');
var fs = require('fs');
var gntp = require('GNTP');

var respond = function (request,sock){
    var response = new gntp.Message();

    for(var m=0; m<request.headers.pointerHeaders.length; m++){
        console.log(
            'PH=>'
            + request.headers.pointerHeaders[m].name
            + ':'
            + request.headers.pointerHeaders[m].value
            + ' ['
            + request.headers.pointerHeaders[m].resourceData.length
            + ']');
    }
    response.type = gntp.MessageTypeEnum.OK;
    response.headers.addHeader(new gntp.Header(gntp.HeaderEnum.responseAction,request.type));
    
    // return any Data headers.
    for(var n=0; n<request.headers.dataHeaders.length; n++){
        response.headers.addHeader(request.headers.dataHeaders[n]);
    }
    
    var protocol = response.protocolString();
    var mime = response.mime();
    //console.log('response:'+protocol+mime.toString('utf8'));
    //fs.writeFileSync('encrypt.log',mime);
    var mBuff = new Buffer(protocol.length+mime.length+(gntp.EndLine.length));
    mBuff.write(protocol,0,'utf8');
    mime.copy(mBuff,protocol.length,0);
    mBuff.write(gntp.EndLine,protocol.length+mime.length,'utf8');
    
    sock.write(mBuff);
};
var connections = 0;
var server = net.createServer();
server.on('connection',function (sock){
    var msg = new gntp.Message();
    var recvd = 0,
        parsed = false;
    var id = connections++;
    sock.on('data',function (data){
        if( parsed === true) {
            recvd = 0;
            msg = new gntp.Message();
        }
        console.log('SERVER RECV:'+data.length+' on '+id);
        
        eom = msg.parse(data);
        
        recvd+= data.length;
        /*
        var logFileU = fs.open('recv.log','a',null, function (err,fd){
            fs.writeSync(fd,data,0,data.length,recvd);
        });
        */
        if( eom === true ){
            parsed = true;
            respond(msg,sock);
            sock.end();
        }
    });
    sock.on('close',function (){
        //console.log('socket closed '+id);
        console.log('RCVD:'+recvd+' on '+id);
        console.log('good:'+(parsed?'yes':'no'));
        console.log('===');
    });
    setTimeout( function (){
        sock.end();
    },3000);
});
server.listen(23053);
console.log('Listening on GNTP service port (23053)');

