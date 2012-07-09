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
var MessageTypeEnum = Object.freeze({ UNKNOWN : "UNKNOWN", REGISTER : "REGISTER", NOTIFY : "NOTIFY", SUBSCRIBE : "SUBSCRIBE", POLL : "POLL", OK : "-OK", CALLBACK : "-CALLBACK", ERROR : "-ERROR" });
module.exports.MessageTypeEnum = MessageTypeEnum;

// Header strings
var HeaderEnum = Object.freeze({
   applicationIcon : 'Application-Icon',
   applicationName : 'Application-Name',
   trueValue : 'True',
   falseValue : 'False',
   customHeaderPrefix : 'X-',
   dataHeaderPrefix : 'Data-',
   errorCode : 'Error-Code',
   errorDescription : 'Error-Description',
   growlResourcePointerPrefix : 'x-growl-resource://',
   notificationCallbackContext : 'Notification-Callback-Context',
   notificationCallbackContextType : 'Notification-Callback-Context-Type',
   notificationCallbackResult : 'Notification-Callback-Result',
   notificationCallbackTarget : 'Notification-Callback-Target',
   notificationCoalescingId : 'Notification-Coalescing-ID',
   notificationDisplayName : 'Notification-Display-Name',
   notificationEnabled : 'Notification-Enabled',
   notificationIcon : 'Notification-Icon',
   notificationId : 'Notification-Id',
   notificationName : 'Notification-Name',
   notificationPriority : 'Notification-Priority',
   notificationSticky : 'Notification-Sticky',
   notificationText : 'Notification-Text',
   notificationTitle : 'Notification-Title',
   notificationsCount : 'Notifications-Count',
   originMachineName : 'Origin-Machine-Name',
   originPlatformName : 'Origin-Platform-Version',
   originPlatformVersion : 'Origin-Platform-Name',
   originSoftwareName : 'Origin-Software-Name',
   originSoftwareVersion : 'Origin-Software-Version',
   recieved : 'Recieved',
   resourceIdentifier : 'Identifier',
   resourceLength : 'Length',
   responseAction : 'Response-Action',
   subscriberId : 'Subscriber-ID',
   subscriberName : 'Subscriber-Name',
   subscriberPort : 'Subscriber-Port',
   subscriberTtl : 'Subscriber-TTL'
});
module.exports.HeaderEnum = HeaderEnum;