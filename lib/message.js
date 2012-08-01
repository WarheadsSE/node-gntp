/*-------------------------
    Message object
*/
var constants = require('./constants.js')
    , Headers = require('./headers.js')
    , Header = require('./header.js')
    , Crypto = require('./crypto.js')
    

function Message (mimeString) {
    this.type = constants.MessageTypeEnum.UNKNOWN;
    this.sections = [];
    this.headers = new Headers();
    this.crypto = null;
    
    this.chunkSize = 1024;
    this.raw = new Buffer(this.chunkSize);
    this.parseInfo = {
        lastPosition : 0
        , received : 0
        , sections : {
            current : 0
            , expected : 1
            , lines: 0
        }
        , resource : {
            header : undefined
            , length : -1
            , identifier: undefined
            , section : 0
        }
        , error : undefined
        , complete : false
    };
    if( typeof mimeString === 'string' ){
        this.parse(mimeString);
    }
}
module.exports = Message;

Message.prototype.parse = function (mime){
    if ( !(mime instanceof Buffer) ){
        return undefined;
    }
    if( mime.length + this.parseInfo.received > this.raw.length ){
        var upSize = mime.length+this.parseInfo.received;
        var tmp = new Buffer(upSize);
        this.raw.copy(tmp);
        this.raw = tmp;
    }
    mime.copy(this.raw,this.parseInfo.received);
    this.parseInfo.received += mime.length;
    
    var self = this,
        len = this.parseInfo.received,
        hdr,
        resourceLength = 0,
        prev = this.parseInfo.lastPosition, 
        curr = 0, 
        lines = [], 
        work,
        line,
        lineEnd,
        gap,
        protocol,
        security,
        resource = false,
        parts,
        block,
        //expectedSections = this.parseInfo.sections.expected,
        header =  new Header(); // i need to fix this object...
        
    var findEndSection = function (buff,start){
        if( buff instanceof Buffer){
            if( buff.length >= 4 &&
                start < buff.length){
                for( var i=start; i < buff.length -3; i++ ){
                    if( buff[i+0] == 13 && buff[i+1] == 10 &&
                        buff[i+2] == 13 && buff[i+3] == 10 ){
                        //End!
                        return i;
                    }
                }
            }
        }
        return -1;
    };
    
    var findEndLine = function (buff){
        if( ( buff instanceof Buffer ) && buff.length >= 2){
            for( var i=0; i < buff.length -1; i++ ){
                if( buff[i+0] == 13 && buff[i+1] == 10 ){
                    //End!
                    return i;
                }
            }
        }
        return -1;
    };
    
    var processBlock = function(block){
        var lines = block.toString('utf8').split('\r\n');
        for( var i=0; i < lines.length; i++){
            line = lines[i];
            parts = [ line.substring(0,line.indexOf(':')), line.substring(line.indexOf(':')+2)];
            hdr = new Header(parts[0],parts[1]);
            // NotificationsCount will increase expected sections by x.
            if( hdr.name === constants.HeaderEnum.notificationsCount ) {
                self.parseInfo.sections.expected += Number(hdr.value);
                //console.log('notificationsCount: '+ hdr.value);
            }
            // Resource Pointers will increase expected sections by 2
            if( hdr.isGrowlResourcePointer ) {
                //console.log('resourceIdentifier found:'+hdr.value);
                self.parseInfo.sections.expected += 2;
            }
            
            // add it to the message headers.
            self.headers.addHeader(hdr);
        }
        //console.log('sections (have/expecting): '+self.parseInfo.sections.current +'/'+self.parseInfo.sections.expected);
        
    };
    
    while(curr < len && curr > -1){
        curr = findEndSection(this.raw,prev);
        if( curr > -1 ){
            this.parseInfo.sections.current++;
            work = this.raw.slice(prev,curr);
            
            if( this.parseInfo.sections.current == 1 ){
                // always in section 1:
                // GNTP protocol header
                // & headers (which may be an encrypted block)
                
                // parse protocol string, and setup crypto as required.
                lineEnd = findEndLine(work,0);
                if( lineEnd === -1 ){
                    console.log('EOL failure: '+work.length);
                    return undefined;
                }
                line = work.slice(0,lineEnd).toString('utf8');
                gap = line.indexOf(' ');
                protocol = line.substring(0,gap).split('/');
                if( protocol[0] != constants.Protocol.name || protocol[1] != constants.Protocol.version ){
                    console.log('bad protocol/version');
                    throw 'GNTP protocol mismatch';
                }
                
                this.type = line.substring(gap+1,line.indexOf(' ',gap+1));
                //console.log('message type: ' + this.type + ' => ' + (this.type.substr(0,1) === '-'?'response':'request'));
                
                // check for the password & encryption
                gap = line.indexOf(' ',gap+1);
                //console.log('pwd & sec: '+gap);
                security = line.substring(line.indexOf(' ',gap)+1);
                //console.log('sec string: "'+security+'"');
                gap = security.indexOf(' ');
                //console.log('sec str gap:'+gap);
                //TODO: dont hardset the password..
                this.crypto = new Crypto('nodejs','sha1');
                if( gap > -1 ){
                    security = security.split(' ');
                    if( security[0] !== 'NONE' ){
                        security[0] = security[0].split(':');
                        this.crypto.useEncryption = true;
                        this.crypto.encryptAlg = security[0][0].toLowerCase();
                        this.crypto.iv = new Buffer(security[0][1].length/2);
                        this.crypto.iv.write(security[0][1],'hex');
                    }
                    security[1] = security[1].split(':');
                    this.crypto.hashAlg = security[1][0].toLowerCase();
                    security[1][1] = security[1][1].split('.');
                    if( !this.crypto.setKeyString(security[1][1][0],security[1][1][1]) ){
                        throw 'bad authentication';
                    }
                }else{
                    this.crypto.password = '';
                }
                block = new Buffer(work.slice(lineEnd+2).length);
                work.slice(lineEnd+2).copy(block,0,0);
                
                if( this.crypto.useEncryption ){
                    // decrypt the block first.
                    block = this.crypto.decryptBuffer(block);
                }
                
                // process the headers
                processBlock(block);
                
            }else{
                // is this is the data part of a resource, handle accordingly.
                if( this.parseInfo.resource.length > 0){
                    //console.log('reading RP: rl['+ this.parseInfo.resource.length + '] wl['+ work.length + ']');
                    if( this.parseInfo.resource.length === work.length ){
                        // find the associated header
                        for( var h=0; h<this.headers.pointerHeaders.length; h++){
                            if( this.headers.pointerHeaders[h].value === this.parseInfo.resource.identifier ){
                                hdr = this.headers.pointerHeaders[h]
                            }
                        }
                        // this goes directly to a buffer
                        if( this.crypto.useEncryption ){
                            hdr.resourceData = this.crypto.decryptBuffer(work);
                        }else{
                            hdr.resourceData = new Buffer(work.length);
                            work.copy(hdr.resourceData,0,0);
                        }
                        // add it to the messages
                        //this.headers.addHeader(hdr);
                        // reset resource information.
                        this.parseInfo.resource.length = 0;
                        this.parseInfo.resource.current = 0;
                        this.parseInfo.resource.identifier = undefined;
                    }else{
                        // we're in the middle of a resource, but haven't received it all.
                        console.log('partial resource');
                        // don't count it complete yet (decrement sections)
                        this.parseInfo.sections.current--;
                        // we should do something to bypass this break, but record it so we include it.
                        this.parseInfo.resource.current = curr+4;
                    }
                }else{
                    // check encryption, and remember that Identifier headers are NOT encryped.
                    line = work.slice(0,constants.HeaderEnum.resourceIdentifier.length).toString('utf8');
                    //console.log('line: ['+line+'] header:'+constants.HeaderEnum.resourceIdentifier);
                    // check if it is a identifier 
                    if( line.substr(0,constants.HeaderEnum.resourceIdentifier.length) === constants.HeaderEnum.resourceIdentifier){
                        //console.log(':: RESOURCE IDENTIFIER');
                        // Get ID
                        lineEnd = findEndLine(work,0);
                        line = work.toString('utf8').split(constants.EndLine);
                        //console.log(parts);
                        //console.log('I:'+line[0]);
                        parts = [ line[0].substring(0,line[0].indexOf(':')), line[0].substring(line[0].indexOf(':')+2)];
                        //console.log(parts);
                        hdr = new Header(parts[0],parts[1]);
                        this.headers.addHeader(hdr);
                        this.parseInfo.resource.identifier = parts[1];
                        // Get length
                        //console.log('L:'+line[1]);
                        parts = [ line[1].substring(0,line[1].indexOf(':')), line[1].substring(line[1].indexOf(':')+2)];
                        //console.log(parts);
                        this.parseInfo.resource.length = Number(parts[1]);
                        this.parseInfo.resource.current = 0;
                        //console.log(this.parseInfo.resource);
                    }else{
                        // Not an identifier, or identifier data
                        //console.log(':: NOT resource');
                        block = new Buffer(work.length);
                        work.copy(block,0,0);
                        
                        if( this.crypto.useEncryption ){
                            // decrypt the block first.
                            block = this.crypto.decryptBuffer(block);
                        }
                        
                        processBlock(block);
                    }
                }
            }
            // skip past the section end marker.
            prev = curr+4;
        }else{
            this.parseInfo.lastPosition = prev;
            // No section end found.. is this the end of the message?
            // If it is not, throw the rest of the message.
            // What if we still expected more?
            if( this.parseInfo.sections.current < this.parseInfo.sections.expected ){
                // wth, why are there spares?
                //console.log('EOP:false');
                //console.log(this.parseInfo);
                return false;
            }else{
                // we seem to be done...
                //console.log('EOP:true');
                return true;
            }
        }
    }
    // WTF making it here... This function should never reach this line.
    //console.log('EOP:end!');
    //console.log(this.parseInfo);
    return undefined;
};

// parse_stream:
// Re-implementation of the parsing routines to work with data as a stream, not blocks.
// This should be much faster than looping block parser..
Message.prototype.parse_stream = function (mime){
    // We're working on raw buffer input only
    // We have to handle encryption and binary after all
    if ( !(mime instanceof Buffer) ){
        return undefined;
    }
    
    // expand the storage buffer if input + existing > storage
    if( mime.length + this.parseInfo.received > this.raw.length ){
        var upSize = mime.length+this.parseInfo.received;
        var tmp = new Buffer(upSize);
        this.raw.copy(tmp);
        this.raw = tmp;
    }
    
    // copy the new data into storage, starting @ the previous end
    mime.copy(this.raw,this.parseInfo.received);
    // update out length expectations
    this.parseInfo.received += mime.length;
    
    // utility function finding EOL on the protocol
    // This should probably be using the constants for the protocol EndLine
    var findEndLine = function (buff, start){
        if( ( buff instanceof Buffer ) && buff.length >= 2){
            for( var i=start; i < buff.length -1; i++ ){
                if( buff[i+0] == 13 && buff[i+1] == 10 ){
                    //End!
                    return i;
                }
            }
        }
        return -1;
    };
    
    // setup our variables
    var self = this
        , hdr
        , currentPosition = 0
        , work
        , line
        , lineEnd
        , gap
        , protocol
        , security
        , resource = false
        , parts
        , block
        , header = new Header()
    
    // processHeader
    // process a header mime into header object
    var processHeader = function(line){
        parts = [ line.substring(0,line.indexOf(':')), line.substring(line.indexOf(':')+2)]
        // handle resource length 'speshul'
        if( self.parseInfo.resource.identifier ){
            self.parseInfo.resource.length = Number(parts[1])
        }else{
            hdr = new Header(parts[0],parts[1])
            // NotificationsCount will increase expected sections by x.
            if( hdr.name === constants.HeaderEnum.notificationsCount ) {
                self.parseInfo.sections.expected += Number(hdr.value)
            }
            // Resource Pointers will increase expected sections by 2
            if( hdr.isGrowlResourcePointer ) {
                self.parseInfo.sections.expected += 2
            }
            
            // add it to the message headers object
            self.headers.addHeader(hdr);
        }
    }
    
    // this.raw.length !== this.parseInfo.received
    while( this.parseInfo.received - this.parseInfo.lastPosition >= constants.EndLine.length
          && currentPosition >= 0
          && !this.parseInfo.error
          && !this.parseInfo.complete){
        // check for being in a resource (binary data!)
        if( this.parseInfo.resource.identifier
            && this.parseInfo.resource.length > -1
            && this.parseInfo.sections.current === this.parseInfo.resource.section){
            //console.log('checking resource...[len:'+this.parseInfo.resource.length+']')
            // if resource.identifier & resource.length are set, we're in binary.
            if( this.parseInfo.received - this.parseInfo.lastPosition >= this.parseInfo.resource.length + constants.EndLine.length ){
                // we've got the whole resource.
                
                // load the up a copy of the buffer
                work = this.raw.slice(this.parseInfo.lastPosition, this.parseInfo.lastPosition+this.parseInfo.resource.length)
                // decrypt if necessary
                if( this.crypto.useEncryption ){
                    work = this.crypto.decryptBuffer(work)
                }
                // associate the data to the header
                this.headers.pointerHeaders[this.headers.pointerHeaders.length-1].resourceData = new Buffer(work.length)
                work.copy(this.headers.pointerHeaders[this.headers.pointerHeaders.length-1].resourceData,0,0)
                // set the lastPosition to +resouce.length +EndLine.length
                this.parseInfo.lastPosition += this.parseInfo.resource.length + constants.EndLine.length
                // reset resource object
                this.parseInfo.resource = {
                    header : undefined
                    , length : -1
                    , identifier: undefined
                    , section : 0
                }
            }else{
                // we dont have it all, drop out!
                currentPosition = -1;
            }
        }else{
            // try to find an EOL
            currentPosition = findEndLine(this.raw, this.parseInfo.lastPosition)
            // if we've found an EOL
            //console.log('currentPosition: ['+this.parseInfo.lastPosition+':'+currentPosition+'='
            //            + (currentPosition - this.parseInfo.lastPosition) + '] '
            //            + this.raw.slice(this.parseInfo.lastPosition,currentPosition).toString('utf8'))
            if( currentPosition >= 0 ){
                if( currentPosition == this.parseInfo.lastPosition ){
                    // check for a blank aka, section end.
                    if( this.parseInfo.sections.current == 0 && this.parseInfo.sections.lines == 0 ){
                        // ERROR - no protocl header, malformed.
                        this.parseInfo.error = constants.ErrorEnum.INVALID_REQUEST
                    }else{
                        //console.log('end section')
                        this.parseInfo.sections.current++
                        this.parseInfo.sections.lines = 0
                        if( this.parseInfo.sections.current === this.parseInfo.sections.expected ){
                            this.parseInfo.complete = true
                            return undefined;
                        }
                    }
                }else if( this.parseInfo.sections.current == 0 && this.parseInfo.sections.lines == 0 ){
                    // the very first line -should- always be the protocol header.
                    // 0 sections & 0 lines -- beginning of message -- protocol header/encryption
                    line = this.raw.slice(this.parseInfo.lastPosition,currentPosition).toString('utf8')
                    gap = line.indexOf(' ')
                    part = line.substr(0,gap)
                    // check the protocol
                    //console.log( 'checking protocol: '+part.substr(0,part.indexOf('/')) )
                    if( part.substr(0,part.indexOf('/')) != constants.Protocol.name ){
                        // ERROR - unknown protocol
                        this.parseInfo.error = constants.ErrorEnum.UNKNOWN_PROTOCOL
                    }
                    
                    // check the protocol version
                    if( !this.parseInfo.error ){
                        //console.log( 'checking version: '+part.substr(part.indexOf('/')+1) )
                        if( part.substr(part.indexOf('/')+1) != constants.Protocol.version ){
                            // ERROR - unknown protocol version
                            this.parseInfo.error = constants.ErrorEnum.UNKNOWN_PROTOCOL_VERSION
                        }
                    }
                    
                    // get the message type
                    if( !this.parseInfo.error ){
                        part = line.substring(gap+1,line.indexOf(' ',gap+1))
                        //console.log( 'checking type: '+part )
                        // ensure it is known
                        switch (part){
                            case constants.MessageTypeEnum.REGISTER:
                            case constants.MessageTypeEnum.NOTIFY:
                            case constants.MessageTypeEnum.SUBSCRIBE:
                            case constants.MessageTypeEnum.POLL:
                            case constants.MessageTypeEnum.OK:
                            case constants.MessageTypeEnum.CALLBACK:
                            case constants.MessageTypeEnum.ERROR:
                                this.type = part
                                break;
                            default:
                                // ERROR - invalid directive
                                this.parseInfo.error = constants.ErrorEnum.INVALID_REQUEST
                                break;
                        }
                    }
                    
                    // handle the authentication/security
                    if( !this.parseInfo.error ){
                        gap = line.indexOf(' ',gap+1);
                        part = line.substring(line.indexOf(' ',gap)+1)
                        //console.log( 'checking security: '+part)
                        this.crypto = new Crypto()
                        if( part.indexOf(' ') > -1 ){
                            security = part.split(' ');
                            // handle encryption
                            if( security[0] !== 'NONE' ){
                                // XX - do not hard code password
                                this.crypto.password = 'nodejs'
                                security[0] = security[0].split(':')
                                // check/handle the encryption algorithm
                                if( this.crypto.isValidCryptoAlgorithm(security[0][0]) ){
                                    this.crypto.useEncryption = true
                                    this.crypto.encryptAlg = security[0][0].toUpperCase()
                                    this.crypto.iv = new Buffer(security[0][1].length/2)
                                    this.crypto.iv.write(security[0][1],'hex')
                                }else{
                                    // ERROR - invalid crypto algorithm
                                    this.parseInfo.error = constants.ErrorEnum.INVALID_REQUEST
                                }
                            }
                            
                            // handle the password
                            if( !this.parseInfo.error ){
                                security[1] = security[1].split(':');
                                this.crypto.hashAlg = security[1][0].toLowerCase();
                                if( this.crypto.isValidHashAlgorithm(this.crypto.hashAlg) ){
                                    security[1][1] = security[1][1].split('.');
                                    // XX try all valid passwords.
                                    if( !this.crypto.setKeyString(security[1][1][0],security[1][1][1]) ){
                                        // ERROR - not authorized
                                        this.parseInfo.error = constants.ErrorEnum.NOT_AUTHORIZED
                                    }
                                }else{
                                    // ERROR - invalid hash algorithm
                                    this.parseInfo.error = constants.ErrorEnum.INVALID_REQUEST
                                }
                            }
                        }else{
                            this.crypto.password = ''
                        }
                        this.parseInfo.sections.lines++
                    } // EOI - handle authentication/security
                }else{
                    // 'regular' headers
                    // could be an encrypted block
                    // - never encrypted if:
                    // -- error :
                    // --- none of the message should be encrypted.
                    // -- resource header :
                    // ---- the headers are not encrypted, but the data is
                    // - NOTE:
                    // -- Should not reach this point without TYPE being defined.
                    if( this.type == constants.MessageTypeEnum.ERROR ){
                        // never encrypted - take it straight from the buffer.
                        processHeader(this.raw.slice(this.parseInfo.lastPosition,currentPosition).toString('utf8'))
                        this.parseInfo.sections.lines++
                    }else{
                        // might be encrypted, if it isn't a resource
                        if( this.raw.slice(this.parseInfo.lastPosition,this.parseInfo.lastPosition+constants.HeaderEnum.resourceIdentifier.length).toString('utf8')
                           === constants.HeaderEnum.resourceIdentifier ){
                            // looks like this is the beginning of a resource header!
                            processHeader(this.raw.slice(this.parseInfo.lastPosition,currentPosition).toString('utf8'))
                            // store the identifier in the parseInfo.resource.identifier
                            this.parseInfo.resource.identifier = this.headers.pointerHeaders[this.headers.pointerHeaders.length -1].value
                        }else if( this.parseInfo.resource.identifier ){
                            // length is expected from the pointer
                            if( this.raw.slice(this.parseInfo.lastPosition,this.parseInfo.lastPosition+constants.HeaderEnum.resourceLength.length).toString('utf8')
                           === constants.HeaderEnum.resourceLength ){
                                // this is a resource length, it is 'speshul'
                                processHeader(this.raw.slice(this.parseInfo.lastPosition,currentPosition).toString('utf8'))
                                this.parseInfo.resource.section = this.parseInfo.sections.current+1
                                this.parseInfo.sections.lines++
                            }else{
                                // Gah, wtf? bad behavior!
                                this.parseInfo.error = constants.ErrorEnum.INVALID_REQUEST
                            }
                        }else{
                            // not an ERROR type, and not a resource bit, check for encrypted
                            if( this.crypto.useEncryption ){
                                // grab the block & decrypt it
                                work = this.crypto.decryptBuffer(this.raw.slice(this.parseInfo.lastPosition,currentPosition)).toString('utf8')
                                // replace it in the raw and cycle back around?
                                // - nope, just loop on split(constants.EndLine)
                                work = work.split(constants.EndLine)
                                for( var i=0; i < work.length; i++){
                                    processHeader(work[i])
                                    this.parseInfo.sections.lines++
                                }
                            }else{
                                processHeader(this.raw.slice(this.parseInfo.lastPosition,currentPosition).toString('utf8'))
                                this.parseInfo.sections.lines++
                            }
                        }
                    }
                }
                this.parseInfo.lastPosition = currentPosition + constants.EndLine.length
            }
        } // EOI - resource check
    }
    
    return this.parseInfo.error
};

Message.prototype.protocolString = function (){
    var buffer = '';
    // replace NONE with the value of the crypto type.
    var securityString = 'NONE';
    if( this.crypto instanceof Crypto){
        securityString = this.crypto.getSecurityString();
    }
    buffer = buffer.concat(constants.Protocol.name,'/',constants.Protocol.version,' ',this.type,' ',securityString,constants.EndLine);
    return buffer;
};

Message.prototype.mime = function () {
    /*
        Some notes on headers:
        First is all the actual text headers, then any identifiers & their data.
        There is one exception here, and that is in the Register message
        wherein there are the Application headers, then the Notifictions headers
        for setting Notifications up, and *then* there are the identifiers.
        Identifiers are formatted as such to create 2 sections per identifier:
        --
        Identifier: xxxxx\r\n
        Length: \r\n
        \r\n
        data\r\n
        \r\n
        --
        This library handles things in the register method by allowing you to 
        create 'blank' headers, that are strictly used by the Register method.
        This needs refactored to say the least.
    */
    // go through headers, section by section and type by type.
    var headerBuffer = ''
        , resourceBuffer=''
        , h
        , hBuff = ''
        , rBuff = ''
        , bBuff = ''
        , tBuff = ''
    // headers
    for( h in this.headers.headers ){
        if( !this.headers.headers[h].isBlank ){
            headerBuffer = headerBuffer.concat(this.headers.headers[h].name,': ',this.headers.headers[h].value,constants.EndLine);
        }else{
            headerBuffer = headerBuffer.concat(constants.EndLine);
        }
    }
    // customHeaders - for passing one-way information to some custom display, etc
    for( h in this.headers.customHeaders ){
        if( !this.headers.customHeaders[h].isBlank ){
            headerBuffer = headerBuffer.concat(this.headers.customHeaders[h].name,': ',this.headers.customHeaders[h].value,constants.EndLine);
        } // Blank not allowed in custom headers
    }
    
    // dataHeaders - for passing data that WILL be returned in the response
    for( h in this.headers.dataHeaders ){
        // erm.. yes. they just show up in the normals?
    }
    // this line breaks resources?
    //headerBuffer = headerBuffer.concat(constants.EndLine);
    
    // convert the utf8 text into a Buffer
    hBuff = new Buffer(headerBuffer);
    
    //  If this message is supposed to be encrypted, encrypt the buffer
    //  - the response is a buffer object of the appropriate size, a replacement
    if( this.crypto instanceof Crypto && this.crypto.useEncryption){
        hBuff = this.crypto.encryptBuffer(hBuff);
        bBuff = new Buffer(hBuff.length+constants.EndLine.length);
        hBuff.copy(bBuff,0,0);
        bBuff.write(constants.EndLine,bBuff.length-constants.EndLine.length,0);
        hBuff = bBuff;
    }
    
    bBuff = new Buffer(hBuff.length+constants.EndLine.length);
    hBuff.copy(bBuff,0,0);
    bBuff.write(constants.EndLine,bBuff.length-2,0);
    hBuff = bBuff; 
    
    // generates a section
    // resourceHeaders - will generate sections
    for( h in this.headers.pointerHeaders ){
        if( this.headers.pointerHeaders[h].resourceData instanceof Buffer){
            resourceBuffer = '';
            resourceBuffer += constants.HeaderEnum.resourceIdentifier + ': ' + this.headers.pointerHeaders[h].value + constants.EndLine;
            
            bBuff = this.headers.pointerHeaders[h].resourceData;
            //  If this message is supposed to be encrypted, encrypt the buffer
            //  - the response is a buffer object of the appropriate size, a replacement
            if( this.crypto instanceof Crypto && this.crypto.useEncryption){
                bBuff = this.crypto.encryptBuffer(bBuff);
                //console.log('rData-enc: '+bBuff.length);
            }
            
            resourceBuffer += 'Length: ' + bBuff.length + constants.EndLine + constants.EndLine;
            
            tBuff = new Buffer(bBuff.length+resourceBuffer.length+(constants.EndLine.length*2));
            tBuff.write(resourceBuffer,0,'utf8');
            bBuff.copy(tBuff,resourceBuffer.length,0,bBuff.length);
            tBuff.write(constants.EndLine+constants.EndLine,resourceBuffer.length+bBuff.length,'utf8');
            // we've copied out to tBuff, so bBuff can be resused
            if( rBuff instanceof Buffer ) {
                bBuff = rBuff;
            }else{
                bBuff = '';
            }
            
            rBuff = new Buffer(rBuff.length+tBuff.length);
            if( bBuff instanceof Buffer) bBuff.copy(rBuff,0,0);
            tBuff.copy(rBuff,bBuff.length,0);
        }
    }
    
    // convert the utf8 text into a Buffer
    bBuff = new Buffer(hBuff.length+rBuff.length);
    hBuff.copy(bBuff,0,0);
    if( rBuff instanceof Buffer ){
        rBuff.copy(bBuff,hBuff.length,0);
    }
    
    return bBuff;
};