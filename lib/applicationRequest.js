/*------------------------------
    ApplicationRequest object/class
    Defines the content of REGISTER message
*/

var constants = require('./constants.js')
    , Headers = require('./headers.js').Headers
    , Header = require('./header.js').Header
    , Message = require('./message.js').Message

function ApplicationRequest (application) {
    this.type = constants.MessageTypeEnum.REGISTER; // RequestType
    this.application = null; // Application
    this.notifications = [];
    
    if( application !== null ){
        this.application = application;
    }
}
exports.ApplicationRequest = ApplicationRequest;

ApplicationRequest.prototype.notificationsCount = function () {
    return this.notifications.length;
};

ApplicationRequest.prototype.addNotification = function (notification) {
    if( notification !== null ){
        this.notifications.push(notification);
    }
};

ApplicationRequest.prototype.toHeaders = function () {
    var headers = new Headers();
    var header = new Header();
    headers.addHeaders(this.application.toHeaders());
    headers.addHeader(new Header(constants.HeaderEnum.notificationsCount,this.notificationsCount()));
    for( var i in this.notifications ){
        headers.addHeader(new Header());
        headers.addHeaders(this.notifications[i].toHeaders());
    }
    return headers;
};

ApplicationRequest.prototype.toRequest = function () {
    var req = new Message();
    req.type = this.type;
    req.headers.addHeaders(this.toHeaders());
    return req;
};