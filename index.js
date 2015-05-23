var m = {
    "back":8,

    "ok":13,

    "p+":33,
    "p-":34,

    "menu":36,

    "up":38,
    "down":40,
    "left":37,
    "right":39,

    "0":48,
    "1":49,
    "2":50,
    "3":51,
    "4":52,
    "5":53,
    "6":54,
    "7":55,
    "8":56,
    "9":57,

    "options":111,
    "guia tv":112,
    "videoclube":114,
    "gravacoes":115,
    "teletext":116,

    "prev":117,
    "rewind":118,

    "play/pause":119,

    "forward":121,
    "next":122,

    "stop":123,

    "red":140,
    "green":141,
    "yellow":142,
    "blue":143,

    "switchscreen":156,

    "i":159,

    "mute":173,
    "v-":174,
    "v+":175,

    "record":225,

    "power":233
};




var TelnetClient = require('./telnet');

var tc = new TelnetClient();



var conf = {
    "host": '192.168.1.64',
    "port": 8082,
    "username": '',
    "password": '',
    "enpassword": ''
};



var read = function() {
    return tc.read();
};



var sendNum = function(n) {
    tc.write('key=' + n + '\n');
};



var sendKey = function(l) {
    var n = m[l];
    if (n === undefined) {
        return console.log('NOT MAPPED: "' + l + '"!');
    }
    sendNum(n);
};



var close = function() {
    tc.close();
};



var publicAPI = {
    read: read,
    sendKey: sendKey,
    sendNum: sendNum,
    close: close
};



module.exports = function(host, cb) {
    if (!cb) {
        cb = host;
    }
    else {
        conf.host = host;
    }

    tc.connect(conf, function(err) {
        if (err) { return cb(err); }

        cb(null, publicAPI);
    });
};
