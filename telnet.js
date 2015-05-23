/**
 * This is a refactored and simplified version of:
 * https://github.com/sxyizhiren/telnetit commit 31ca7336850379703e099620a49b34390479a59b
 */

var Socket = require('net').Socket;
var EventEmitter = require('events').EventEmitter;
var util = require('util');


// libs/util-telnet.js


var Telnet = function () {
    this.operation = [];
    this.operation[255] = "IAC";
    this.operation[254] = "DONT";
    this.operation[253] = "DO";
    this.operation[252] = "WONT";
    this.operation[251] = "WILL";
    this.operation[250] = "SB";
    this.operation[249] = "GA";
    this.operation[248] = "EL";
    this.operation[247] = "EC";
    this.operation[246] = "AYT";
    this.operation[245] = "AO";
    this.operation[244] = "IP";
    this.operation[243] = "BRK";
    this.operation[242] = "DM";
    this.operation[241] = "NOP";
    this.operation[240] = "SE";
    this.option = [];
    this.option[0] = "transmitBinary";
    this.option[1] = "echo";
    this.option[2] = "reconnection";
    this.option[3] = "suppressGoAhead";
    this.option[4] = "approxMessageSizeNegotiation";
    this.option[5] = "status";
    this.option[6] = "timingMark";
    this.option[7] = "remoteControlledTransandEcho";
    this.option[8] = "outputLineWidth";
    this.option[9] = "outputPageSize";
    this.option[10] = "outputCarriageReturnDisposition";
    this.option[23] = "sendLocation";
    this.option[24] = "terminalType";
    this.option[31] = "windowSize";
    this.option[32] = "terminalSpeed";
    this.option[33] = "remoteFlowControl";
    this.option[34] = "linemode";
    this.option[35] = "displayLocation";
    this.option[36] = "environmentVariables";
    this.option[39] = "environmentOption";
};

util.inherits(Telnet, EventEmitter);

Telnet.prototype.connect = function (opts) {
    this._host = opts.host || 'localhost';
    this._port = opts.port || 23;
    this._log = opts.log || false;
    this._username = opts.username;
    this._password = opts.password;
    this._enpassword = opts.enpassword;
    this._en = false;
    this._authenticated = false;
    this._sock = (opts.sock ? opts.sock : new Socket());
    var _self = this;
    this._sock.connect(this._port, this._host);
    this._sock.on('connect', function () {
        _self.emit('connect');
    });
    this._sock.on('data', function (data) {
        _self.processBuffer(data);
    });
    this._sock.on('timeout', function () {
        _self.emit('timeout');
    });
    this._sock.on('error', function (Error) {
        _self.emit('error', Error);
    });
    this._sock.on('end', function () {
        _self.emit('end');

    });
    this._sock.on('close', function (had_error) {
        _self.emit('close', had_error);

    });
};

Telnet.prototype.processBuffer = function (buffer) {
    var _self = this;
    var result = {}
    result.cmd = [];
    result.data = [];
    var negotiation = { IAC: false, operation: "", option: "" };
    for (var i = 0; i < buffer.length; i++) {

        if (this.operation[buffer[i]] == "IAC") {
            negotiation.IAC = true;
            i++;
            negotiation.operation = this.operation[buffer[i]];
            i++;
            if (negotiation.operation == "SB") {
                while (this.operation[buffer[i]] != "IAC") {
                    negotiation.option += this.option[buffer[i]] + " ";
                    i++;
                }
                negotiation.option += this.operation[buffer[i]] + "." + this.operation[buffer[i + 1]]
                i++;
            } else {
                negotiation.option = this.option[buffer[i]];
            }
            result.cmd.push(negotiation);
            negotiation = { IAC: false, operation: "", option: "" };
        }
        else {
            result.data.push(buffer[i]);
        }

    }
    result.data = new Buffer(result.data);


    Object.keys(result.cmd).forEach(function (key) {
        var req_CMD =  "IAC." + result.cmd[key].operation + "." + result.cmd[key].option;
        var res_CMD = "IAC.WONT.";
        switch (result.cmd[key].operation) {
            case "DO":
                switch (result.cmd[key].option) {
                    case "terminalType":
                        res_CMD = "IAC.WILL." + result.cmd[key].option;
                        res_CMD += ".IAC.WILL.windowSize";
                        break;
                    case "windowSize":
                        res_CMD = "IAC.SB.windowSize.transmitBinary.200.transmitBinary.64.IAC.SE";
                        break;
                    default:
                        res_CMD += result.cmd[key].option;
                        break;
                }
                break;
            case "WILL":
                switch (result.cmd[key].option) {
                    case "suppressGoAhead":
                        res_CMD = "IAC.DO." + result.cmd[key].option;
                        break;
                    default:
                        res_CMD = "IAC.DO." + result.cmd[key].option;
                        break;
                }
                break;
            case "SB":
                switch (result.cmd[key].option) {
                    case "terminalType echo IAC.SE":
                        res_CMD = "IAC.SB.terminalType.transmitBinary.ANSI.IAC.SE";
                        break;
                    default:
                        break;
                }
                break;
            case "DONT":
                switch (result.cmd[key].option) {
                    default:
                        res_CMD += result.cmd[key].option;
                        break;
                }
                break;
            case "WONT":
                switch (result.cmd[key].option) {
                    default:
                        res_CMD = "IAC.DONT." + result.cmd[key].option;
                        break;
                }
            default:
                break;
        }
        if (_self._log) {
            console.log("rx:", req_CMD);
            console.log("tx:", res_CMD);
        }

        _self.write(_self.cmdtoBuffer(res_CMD));
    });

    if (result.data.length > 0) {
        _self.emit("data", result.data);
        if (!_self._authenticated && _self._password.length > 0) {
            _self.login(result.data);
        }

    }
};

Telnet.prototype.login = function (data) {
    var _self = this;
    if (data.toString().indexOf("Username:") > -1 || data.toString().indexOf("login:") == data.toString().length - 7) {
        _self.write(_self._username + "\r\n");
    }
    else if ((data.toString().indexOf("Password:") > -1)) {
        if (_self._en) {
            _self.write(_self._enpassword + "\r\n");
        } else {
            _self.write(_self._password + "\r\n");
        }
    }
    else if ((data.toString().indexOf(">") > -1) && !_self._en && _self._enpassword.length > 0) {
        _self._en = true;
        _self.write("en\r\n");
    }
    else if ((data.toString().indexOf("#") > -1 )) {
        _self._authenticated = true;
    }
};

Telnet.prototype.write = function (data) {
    this._sock.write(data);
};

Telnet.prototype.cmdtoBuffer = function (cmd) {
    var _self = this;
    var CMD = cmd.split(".");
    var buffer = [];

    Object.keys(CMD).forEach(function (key) {

        if (_self.operation.indexOf(CMD[key]) != -1) {

            buffer.push(_self.operation.indexOf(CMD[key]));
        }
        else if (_self.option.indexOf(CMD[key]) != -1) {

            buffer.push(_self.option.indexOf(CMD[key]))
        }
        else if (parseInt(CMD[key]) >= 0) {
            buffer.push(parseInt(CMD[key]));
        }
        else  {
            for (var i = 0; i < CMD[key].length; i++) {
                buffer.push(CMD[key].charCodeAt(i));
            }
        }
    });
    return new Buffer(buffer);
};

Telnet.prototype.destroy = function (cmd) {
    this._sock.destroy();
    this._sock = null;
};



// libs/telnetcli.js


function noop(){}

function TelnetInst(){
    var c = new Telnet();
    var connectState = false;	// is connected?
    var connecting = false;		// is connecting?
    var svrReplyList = [];		// contain the income message which haven't been read.
    var connectCallback = null;	// the message to call if err or if connect succ.
    var _this = this;			// this
    var reportErrorHandler = null; //report error to conn manager

    c.on('connect', function () {
    });

    this.setReportErrorHandler = function(fnFromConnManage){
        reportErrorHandler = fnFromConnManage;
    };

    this.onerrorHandler = function(error){
        //1. close connect 2. call callback  3.call onTelnetConnError to reconnect
        _this.clearWatcher(error);
        _this.close();
        connectCallback(error);
        connectCallback = noop;
    };

    c.on('error', function (error) {
        //1. close connect 2. call callback  3.call onTelnetConnError to reconnect
        _this.onerrorHandler(error);
        if(reportErrorHandler){reportErrorHandler(_this,error);}
    });

    c.on('close', function (had_error) {
        _this.close();
    });

    c.on('end', function () {
    });

    c.on('data', function(data) {
        if (!connectState) {
            // the only place to mean connect succ.
            // 1. set states  2. call callback to notify succ.
            connectState = true;
            connecting = false;
            connectCallback(null);
            connectCallback = noop;
        }
        else {
            svrReplyList.push( data.toString() );
        }
    });

    this.read = function() {
        if (!connectState) {
            throw 'not connected to server';
        }

        return svrReplyList.splice(0);
    };

    this.write = function(data){
        if (!connectState) {
            throw 'not connected to server';
        }

        c.write(data);
    };

    this.connect = function(config,cb){
        if(connectState){
            cb(new Error('already connected.'));
        }
        else if(connecting){
            cb(new Error('already connecting.'));
        }
        else{
            connectCallback = cb;
            connecting = true;
            c.connect(config);
        }

    };

    this.clear = function(){
        return svrReplyList.splice(0);
    };

    this.close = function(){
        // no interface to close telnet, just reset the state.
        // is the only place to reset the connectState and connecting
        if(connectState || connecting){
            connectState = false;
            connecting = false;
            c.destroy();
        }
    };

    this.getState=function(){
        return connectState;
    };
}

module.exports = TelnetInst;
