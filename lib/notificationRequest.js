/*----------------------------
    NotificationRequest object/class
*/
var MessageTypeEnum = require('./constants.js').MessageTypeEnum
    , HeaderEnum = require('./constants.js').HeaderEnum
    , Headers = require('./headers.js').Headers
    , Header = require('./header.js').Header
    , Message = require('./message.js').Message
    , crypt = require('crypto')

var NotificationRequestCount = 0;
function NotificationRequest () {
    this.number = NotificationRequestCount++;
    // required, pragmatic
    this.type = MessageTypeEnum.NOTIFY;
    this.applicationName = null;
    this.name = 'Node.js';
    // not all required, variously non-pragmatic
    this.id = null;
    this.title = '';
    this.text = '';
    this.sticky = false; // bool
    this.priority = 0; // ranged -2 <=> 2
    this.icon = null;
    this.callbackContext = ''; // mutually exclusive of Target
    this.callbackContextType = ''; // Required with Context
    this.callbackTarget = ''; // mutually exclusive of Context
}
exports.NotificationRequest = NotificationRequest;

NotificationRequest.prototype.setPriority = function (priority) {
    if( priority >= -2 && priority <= 2){
        this.priority = priority;
    }
    return this.priority;
};

NotificationRequest.prototype.toHeaders = function () {
    var headers = new Headers();
    var header = new Header();
    headers.addHeader(new Header(HeaderEnum.applicationName,this.applicationName));
    headers.addHeader(new Header(HeaderEnum.notificationName,this.name));
    if( this.id !== null ) headers.addHeader(new Header(HeaderEnum.notificationId,this.id));
    headers.addHeader(new Header(HeaderEnum.notificationTitle,this.title));
    if( this.text !== null ) headers.addHeader(new Header(HeaderEnum.notificationText,this.text));
    headers.addHeader(new Header(HeaderEnum.notificationSticky,this.sticky));
    headers.addHeader(new Header(HeaderEnum.notificationPriority,this.priority));
    if( this.icon !== null ){
        if( this.icon instanceof Buffer ) {
            // make MD5 unique to data...
            var uid = crypt.createHash('md5').update(this.icon).digest('hex');
            headers.addHeader(new Header(HeaderEnum.notificationIcon,HeaderEnum.growlResourcePointerPrefix + uid));
            headers.addHeader(new Header(HeaderEnum.resourceIdentifier,uid,this.icon));
        }
        if( this.icon instanceof String ) headers.addHeader(new Header(HeaderEnum.applicationIcon,this.icon));
        // this is where we would associate binary data ... if we supported it
    }
    if( this.callbackContext.length > 0 && this.callbackContextType.length > 0 ){
        headers.addHeader(new Header(HeaderEnum.notificationCallbackContext,this.callbackContext));
        headers.addHeader(new Header(HeaderEnum.notificationCallbackContextType,this.callbackContextType));
    }
    if( this.callbackTarget.length > 0 && this.callbackContext.length === 0 ){
        headers.addHeader(new Header(HeaderEnum.notificationCallbackTarget,this.callbackTarget));
    }
    return headers;
};

NotificationRequest.prototype.toRequest = function () {
    var req = new Message();
    req.type = this.type;
    req.headers.addHeaders(this.toHeaders());
    // crypto?
    return req;
};