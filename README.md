# node-gntp : GNTP implementation in pure Nodejs javascript
This library aims to provide the ability to send Growl notifications to capable computers over [GNTP][1], with support for resources and encryption. 

Eventually, this will also provide the capability of being a forwarder source.

## Receiving notifications
* [Growl for Windows](http://www.growlforwindows.com)
* [Growl for Mac](http://growl.info)

This library is currently intended for use with node stable v0.6.0+

At the moment this library is mostly functional as a sender, but is not exactly user friendly.

## Known todos
* Generate appropriate errors, and handling.
* Complete parsing routines
* Make this puppy a lot more user friendly.

# General Usage
See the contained gntp-send.js for a complete example.



[1]: http://www.growlforwindows.com/gfw/help/gntp.aspx "GNTP Specification"
