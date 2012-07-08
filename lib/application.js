/*------------------------------
    Application object/class
    Describes and application in the form of
*/
var HeaderEnum = require('./constants.js').HeaderEnum

function Application (name) {
    this.name = name || 'node-gntp'; // String
    this.icon = null; // Resource or string
    
}
exports.Application = Application;

Application.prototype.toHeaders = function () {
    var headers = new Headers();
    var header = new Header();
    headers.addHeader(new Header(HeaderEnum.applicationName,this.name));
    if( this.icon !== null ){
        if( this.icon instanceof Buffer ) {
            // make MD5 unique to data...
            var uid = crypt.createHash('md5').update(this.icon).digest('hex');
            headers.addHeader(new Header(HeaderEnum.applicationIcon,HeaderEnum.growlResourcePointerPrefix + uid));
            headers.addHeader(new Header(HeaderEnum.resourceIdentifier,uid,this.icon));
        }
        if( this.icon instanceof String ) headers.addHeader(new Header(HeaderEnum.applicationIcon,this.icon));
        // this is where we would associate binary data ... if we supported it
    }
    return headers;
};
// why is $this empty in this function!!
Application.prototype.toRequest = function () {
    var req = new ApplicationRequest(this);
    return req;
};