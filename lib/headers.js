/*-------------------------------------
    Headers object/class
    Headers is an order collection of Header objects.
    This handles controlling the output in the correct order
    so that the user of the objects doesn't have to.
*/
var Hash = require('./hash.js').Hash;

function Headers() {
    // collections
    this.headers = [];
    this.customHeaders = [];
    this.dataHeaders = [];
    this.pointerHeaders = [];
    // this will be used for by name, only for checking existance.
    this.allHeaders = new Hash();
}
exports.Headers = Headers;

Headers.prototype.addHeader = function (header) {
    if( header !== null ){
        if( header.isValid === true){
            var ht = 0;
            if( header.isResourceIdentifier ){
                this.pointerHeaders.push(header);
                ht = 3;
            /*
            }else if( header.isCustom ){
                this.customHeaders.push(header);
                ht = 2;
            }else if( header.isData ){
                this.dataHeaders.push(header);
                ht = 1;
            */
            }else{
                this.headers.push(header);
            }
            this.allHeaders[header.name] = ht;
        }
    }
};

Headers.prototype.addHeaders = function (headers) {
    var i;
    for( i in headers.headers ) this.addHeader(headers.headers[i]);
    for( i in headers.customHeaders ) this.addHeader(headers.customHeaders[i]);
    for( i in headers.dataHeaders ) this.addHeader(headers.dataHeaders[i]);
    for( i in headers.pointerHeaders ) this.addHeader(headers.pointerHeaders[i]);
};

Headers.prototype.getHeader = function (name) {
    var head = new Header(null,null);
    var ht = this.allHeaders[name];
    if( ht !== null ){
        var hl;
        switch( ht ){
            case 0:
                hl = this.headers;
                break;
            case 1:
                hl = this.customHeaders;
                break;
            case 2:
                hl = this.dataHeaders;
                break;
            case 3:
                hl = this.pointerHeaders;
                break;
        }
        if( typeof hl ==='object'){
            for( var i=0; i<hl.length; i++){
                if( hl[i].name == name ){
                    head = hl[i];
                    break;
                }
            }
        }
    }
    return head;
};