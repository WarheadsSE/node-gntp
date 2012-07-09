/*-------------------------------
    Header object/class
    Implementation of all the valid headers for the GNTP protocol
    as of 1.0
*/

var constants = require('./constants.js');

var HeaderBlankCount=0;

function Header(name,value,data){
    this.name = null; //string
    this.value = null; // string
    this.growlResource = null; // string - con
    this.growlResourcePointerID = null; // string
    
    this.isBlank = false; // bool
    this.isCustom = false; // bool
    this.isData = false; // bool
    this.isGrowlResourcePointer = false; // bool
    this.isResourceIdentifier = false; // bool
    this.isValid = false; // bool
    this.resourceData = undefined; // will be a Buffer object
    
    this.init(name,value,data);
}
exports.Header = Header;

Header.prototype.init = function (name,value,data) {
    this.name = name;
    this.value = value;
    this.resourceData = data;
    this.isValid = true;
    
    this.isBlank = ((name === null || name === undefined) && (value === null || value === undefined));
    if( !this.isBlank ){
        if( value !== null || value !== undefined ){ 
            if( value.toString().indexOf(constants.HeaderEnum.growlResourcePointerPrefix) === 0) this.isGrowlResourcePointer = true;
            if( typeof value === 'bool') this.value = (value?constants.HeaderEnum.trueValue:constants.HeaderEnum.falseValue);
        }
        if( ( value !== null || value !== undefined ) && name === constants.HeaderEnum.resourceIdentifier ) this.isResourceIdentifier = true;
        if( ( value !== null || value !== undefined ) && name.indexOf(constants.HeaderEnum.customHeaderPrefix) === 0 ) this.isCustomHeader = true;
        if( ( value !== null || value !== undefined ) && name.indexOf(constants.HeaderEnum.dataHeaderPrefix) === 0 ) this.isDataHeader = true;
    }else{
        this.name = "blank-header-" + HeaderBlankCount;
        HeaderBlankCount++;
    }
};