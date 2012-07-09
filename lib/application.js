/*------------------------------
    Application object/class
    Describes and application in the form of
*/
var constants = require('./constants.js')
    , Headers = require('./headers.js').Headers
    , Header = require('./header.js').Header
    , crypt = require('crypto')
    , Message = require('./message.js').Message
    , ApplicationRequest = require('./applicationRequest').ApplicationRequest

function Application (name) {
    this.name = name || 'node-gntp'; // String
    this.icon = null; // Resource or string
    
}
exports.Application = Application;

Application.prototype.toHeaders = function () {
    var headers = new Headers();
    var header = new Header();
    headers.addHeader(new Header(constants.HeaderEnum.applicationName,this.name));
    if( this.icon !== null ){
        if( this.icon instanceof Buffer ) {
            // make MD5 unique to data...
            var uid = crypt.createHash('md5').update(this.icon).digest('hex');
            // add the header as a resource pointer
            headers.addHeader(new Header(constants.HeaderEnum.applicationIcon,constants.HeaderEnum.growlResourcePointerPrefix + uid));
            // add the icon as a resource
            headers.addHeader(new Header(constants.HeaderEnum.resourceIdentifier,uid,this.icon));
        }
        if( this.icon instanceof String ) headers.addHeader(new Header(constants.HeaderEnum.applicationIcon,this.icon));
    }
    return headers;
};
// why is $this empty in this function!!
Application.prototype.toRequest = function () {
    var req = new ApplicationRequest(this);
    return req;
};