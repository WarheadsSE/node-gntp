/*--------------------
    Crypto class/object
    provides password and encryption capabilities.
*/
var crypt = require('crypto')

function Crypto(password,hash,encrypt){
    this.password = password || '';
    this.hashAlg = hash || 'sha256';
    this.encryptAlg = encrypt || 'AES';
    
    this.salt = crypt.randomBytes(16);
    this.iv =  crypt.randomBytes(16);
    
    this.useEncryption = (encrypt?true:false);
}
module.exports = Crypto;

Crypto.prototype.setKeyString = function (keyHash,saltHex){
    this.salt = new Buffer(saltHex.length/2);
    this.salt.write(saltHex,'hex');
    var key = this.getKeyString();
    return (key === keyHash);
};

Crypto.prototype.getKeyString = function (){
    // this will cause WHACKY behavior without a password set.
    var passwordBuffer = new Buffer(this.password);
    var keyBasis = new Buffer(passwordBuffer.length+this.salt.length);
    passwordBuffer.copy(keyBasis,0,0);
    this.salt.copy(keyBasis,passwordBuffer.length,0);
    var key = crypt.createHash(this.hashAlg).update(keyBasis).digest('hex');
    this.key = new Buffer(key.length/2);
    this.key.write(key,'hex');
    var keyHash = crypt.createHash(this.hashAlg).update(crypt.createHash(this.hashAlg).update(keyBasis).digest()).digest('hex').toUpperCase();
    return keyHash;
};

Crypto.prototype.getSecurityString = function (){
    var security = 'NONE';
    if( this.password !== ''){
        if( this.useEncryption ){
            var ivLen = 8;
            if( this.encryptAlg.toUpperCase() === 'AES') { alg = 'aes192'; ivLen = 16; }
            if( this.encryptAlg.toUpperCase() === 'DES') keyLen = 8;
            if( this.encryptAlg.toUpperCase() === '3DES') alg = 'des3';
            security = this.encryptAlg.toUpperCase()+':'+this.iv.toString('hex').toUpperCase().substr(0,ivLen*2);
        }
        security += ' '+this.hashAlg.toUpperCase()+':'+this.getKeyString()+'.'+this.salt.toString('hex').toUpperCase();
    }
    return security;
};

Crypto.prototype.encryptBuffer = function (mime) {
    this.getKeyString();
    var keyB = this.key;
    var alg = this.encryptAlg;
    var keyLen = 24;
    var ivLen = 8;
    if( this.encryptAlg.toUpperCase() === 'AES') { alg = 'aes192'; ivLen = 16; }
    if( this.encryptAlg.toUpperCase() === 'DES') { alg = 'des'; keyLen = 8; }
    if( this.encryptAlg.toUpperCase() === '3DES') { alg = 'des3'; }
    var crypto = new crypt.createCipheriv(alg,keyB.toString('binary').substr(0,keyLen),this.iv.toString('binary').substr(0,ivLen));
    
    var ret = crypto.update(mime,null,'hex');
    var fin = crypto.final('hex');
    ret+=fin;
    
    var retBuff= new Buffer(ret.length/2);
    retBuff.write(ret,'hex');
    
    return retBuff;
};

Crypto.prototype.decryptBuffer = function (mime) {
    this.getKeyString();
    var keyB = this.key;
    var alg = this.encryptAlg;
    var keyLen = 24;
    var ivLen = 8;
    if( this.encryptAlg.toUpperCase() === 'AES') { alg = 'aes192'; ivLen = 16; }
    if( this.encryptAlg.toUpperCase() === 'DES') { alg = 'des'; keyLen = 8; }
    if( this.encryptAlg.toUpperCase() === '3DES') { alg = 'des3'; }
    var crypto = new crypt.createDecipheriv(alg,keyB.toString('binary').substr(0,keyLen),this.iv.toString('binary').substr(0,ivLen));
    
    var ret = crypto.update(mime,null,'binary');
    var fin = crypto.final('binary');
    ret+=fin;
    
    var retBuff= new Buffer(ret,'binary');
    
    return retBuff;
};