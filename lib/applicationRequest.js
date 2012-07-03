/*------------------------------
    ApplicationRequest object/class
    Defines the content of REGISTER message
*/

var MessageTypeEnum = require('./constants.js').MessageTypeEnum
    , HeaderEnum = require('./constants.js').HeaderEnum

function ApplicationRequest (application) {
    this.type = MessageTypeEnum.REGISTER; // RequestType
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
    headers.addHeader(new Header(HeaderEnum.notificationsCount,this.notificationsCount()));
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