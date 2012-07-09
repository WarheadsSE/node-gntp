/*----------------------------
    Notification object/class
*/

var constants = require('./constants.js')
    , Headers = require('./headers.js')
    , Header = require('./header.js')
    , Message = require('./message.js')
    , NotificationRequest = require('./notificationRequest.js')
    
function Notification () {
    this.name = 'Node.js';
    this.displayName = this.name;
    this.enabled = true;
    this.icon = null;
}
module.exports = Notification;

Notification.prototype.toHeaders = function () {
    var headers = new Headers();
    var header = new Header();
    headers.addHeader(new Header(constants.HeaderEnum.notificationName,this.name));
    headers.addHeader(new Header(constants.HeaderEnum.notificationDisplayName,this.displayName));
    headers.addHeader(new Header(constants.HeaderEnum.notificationEnabled,this.enabled));
    if( this.icon !== null ){
        if( this.icon instanceof Buffer ) {
            // make MD5 unique to data...
            var uid = crypt.createHash('md5').update(this.icon).digest('hex');
            headers.addHeader(new Header(constants.HeaderEnum.notificationIcon,constants.HeaderEnum.growlResourcePointerPrefix + uid));
            headers.addHeader(new Header(constants.HeaderEnum.resourceIdentifier,uid,this.icon));
        }
        if( this.icon instanceof String ) headers.addHeader(new Header(constants.HeaderEnum.applicationIcon,this.icon));
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