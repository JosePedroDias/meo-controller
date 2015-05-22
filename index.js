var m = require('./m.json');



var TelnetClient = require('telnetit');

var tc = new TelnetClient('');



var conf = {
    "host": '192.168.1.64',
    "port": 8082,
    "username": '',
    "password": '',
    "enpassword": ''
};



var noop = function() {};



var read = function(err, recv) {
    if (err) { throw err; }

    if (!recv) { return; }

    recv = recv.join('');
    console.log('received:', recv);
};



var sendNum = function(n) {
    tc.write('key=' + n + '\n', read);
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
}



var publicAPI = {
    sendKey: sendKey,
    sendNum: sendNum,
    close: close
};



module.exports = function(cb) {

    /*var logRead = function logRead(err, data) {
        console.log('"%s"\n', data);
        tc.read(logRead);
    };*/

    tc.connect(conf, function(err) {
        if (err) { return cb(err); }

        //tc.read(logRead);

        cb(null, publicAPI);
    });
};
