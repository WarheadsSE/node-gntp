/*  GNTP
 *  Constants for the library/protocol
 */

// Protocol
var Protocol = Object.freeze({ name : "GNTP", version : "1.0"});
module.exports.Protocol = Protocol;

// Endline constant, in case this ever changes.
var EndLine = "\r\n";
module.exports.EndLine = EndLine;

// Message types, includes both request and response
var MessageTypeEnum = Object.freeze({
   UNKNOWN : "UNKNOWN"
   , REGISTER : "REGISTER"
   , NOTIFY : "NOTIFY"
   , SUBSCRIBE : "SUBSCRIBE"
   , POLL : "POLL"
   , OK : "-OK"
   , CALLBACK : "-CALLBACK"
   , ERROR : "-ERROR"
});
module.exports.MessageTypeEnum = MessageTypeEnum;

// Header strings
var HeaderEnum = Object.freeze({
   applicationIcon : 'Application-Icon'
   , applicationName : 'Application-Name'
   , trueValue : 'True'
   , falseValue : 'False'
   , customHeaderPrefix : 'X-'
   , dataHeaderPrefix : 'Data-'
   , errorCode : 'Error-Code'
   , errorDescription : 'Error-Description'
   , growlResourcePointerPrefix : 'x-growl-resource://'
   , notificationCallbackContext : 'Notification-Callback-Context'
   , notificationCallbackContextType : 'Notification-Callback-Context-Type'
   , notificationCallbackResult : 'Notification-Callback-Result'
   , notificationCallbackTarget : 'Notification-Callback-Target'
   , notificationCoalescingId : 'Notification-Coalescing-ID'
   , notificationDisplayName : 'Notification-Display-Name'
   , notificationEnabled : 'Notification-Enabled'
   , notificationIcon : 'Notification-Icon'
   , notificationId : 'Notification-Id'
   , notificationName : 'Notification-Name'
   , notificationPriority : 'Notification-Priority'
   , notificationSticky : 'Notification-Sticky'
   , notificationText : 'Notification-Text'
   , notificationTitle : 'Notification-Title'
   , notificationsCount : 'Notifications-Count'
   , originMachineName : 'Origin-Machine-Name'
   , originPlatformName : 'Origin-Platform-Version'
   , originPlatformVersion : 'Origin-Platform-Name'
   , originSoftwareName : 'Origin-Software-Name'
   , originSoftwareVersion : 'Origin-Software-Version'
   , recieved : 'Recieved'
   , resourceIdentifier : 'Identifier'
   , resourceLength : 'Length'
   , responseAction : 'Response-Action'
   , subscriberId : 'Subscriber-ID'
   , subscriberName : 'Subscriber-Name'
   , subscriberPort : 'Subscriber-Port'
   , subscriberTtl : 'Subscriber-TTL'
});
module.exports.HeaderEnum = HeaderEnum;

// Errors
var ErrorEnum = Object.freeze({
   RESERVED : {
      code : 100
      , text : '[reserved]'
      , description : 'Reserved for future use'
   }
   , TIMED_OUT : {
      code : 200
      , text : 'TIMED_OUT'
      , description : 'The server timed out waiting for the request to complete'
   }
   , NETWORK_FAILURE : {
      code : 201
      , text : 'NETWORK_FAILURE'
      , description : 'The server was unavailable or the client could not reach the server for any reason'
   }
   , INVALID_REQUEST : {
      code : 300
      , text : 'INVALID_REQUEST'
      , description : 'The request contained and unsupported directive, invalid headers or values, or was otherwise malformed'
   }
   , UNKNOWN_PROTOCOL : {
      code : 301
      , text : 'UNKNOWN_PROTOCOL'
      , description : 'The request was not a GNTP request'
   }
   , UNKNOWN_PROTOCOL_VERSION : {
      code : 302
      , text : 'UNKNOWN_PROTOCOL_VERSION'
      , description : 'The request specified an unknown or unsupported GNTP version'
   }
   , REQUIRED_HEADER_MISSING : {
      code : 303
      , text : 'REQUIRED_HEADER_MISSING'
      , description : 'The request was missing required information'
   }
   , NOT_AUTHORIZED : {
      code : 400
      , text : 'NOT_AUTHORIZED'
      , description : 'The request supplied a missing or wrong password/key or was otherwise not authorized'
   }
   , UNKNOWN_APPLICATION : {
      code : 401
      , text : 'UNKNOWN_APPLICATION'
      , description : 'Application is not registered to send notifications'
   }
   , ALREADY_PROCESSED : {
      code : 403
      , text : 'ALREADY_PROCESSED'
      , description : 'The original request was already processed by this receiver'
      // Normally, a request was forwarded back to a machine that already forwarded it
   }
   , NOTIFICATION_DISABLED : {
      code : 404
      , text : 'NOTIFICATION_DISABLED'
      , description : 'Notification type is registered but disabled'
   }
   , INTERNAL_SERVER_ERROR : {
      code : 500
      , text : 'INTERNAL_SERVER_ERROR'
      , description : 'An internal server error occurred while processing the request'
   }
});
module.exports.ErrorEnum = ErrorEnum;
