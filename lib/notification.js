/*----------------------------
    Notification object/class
*/

var MessageTypeEnum = require('./constants.js').MessageTypeEnum
    , HeaderEnum = require('./constants.js').HeaderEnum
    , Headers = require('./headers.js').Headers
    , Header = require('./header.js').Header
    , Message = require('./message.js').Message
    , NotificationRequest = require('./notificationRequest.js').NotificationRequest
    
function Notification () {
    this.name = 'Node.js';
    this.displayName = this.name;
    this.enabled = true;
    this.icon = null;
}
exports.Notification = Notification;

Notification.prototype.toHeaders = function () {
    var headers = new Headers();
    var header = new Header();
    headers.addHeader(new Header(HeaderEnum.notificationName,this.name));
    headers.addHeader(new Header(HeaderEnum.notificationDisplayName,this.displayName));
    headers.addHeader(new Header(HeaderEnum.notificationEnabled,this.enabled));
    if( this.icon !== null ){
        if( this.icon instanceof Buffer ) {
            // make MD5 unique to data...
            var uid = crypt.createHash('md5').update(this.icon).digest('hex');
            headers.addHeader(new Header(HeaderEnum.notificationIcon,HeaderEnum.growlResourcePointerPrefix + uid));
            headers.addHeader(new Header(HeaderEnum.resourceIdentifier,uid,this.icon));
        }
        if( this.icon instanceof String ) headers.addHeader(new Header(HeaderEnum.applicationIcon,this.icon));
    }
    return headers;
};

Notification.prototype.toRequest = function (){
    var req = new NotificationRequest();
    req.name = this.name;
    req.title = this.displayName;
    req.icon = this.icon;
    return req;
};