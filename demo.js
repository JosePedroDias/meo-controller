var meo = require('./index');



/*var invokeTimed = function(arr, fn, ms, endCb) {
    var t;

    var cb = function() {
        var v = arr.shift();

        if (v === undefined) {
            clearInterval(t);
            return endCb();
        }

        console.log(v);
        fn(v);
    };

    t = setInterval(cb, ms);
};*/



meo(function(err, api) {
    if (err) { return console.error(err); }



    //11 menu
    //32 space
    //166 browser_back
    //46 delete

    api.sendKey('v-');

    //api.sendNum(46);

    /*invokeTimed(
        ['left', 'left'],
        api.sendKey,
        200,
        function() {
            console.log('ALL DONE!');
            api.close();
        }
    );*/

    // blue(apps) green(meo_kanal) yellow(promos) red(interactive)

    // http://www.expandinghead.net/keycode.html
    // LACKING: backspace, return, icon_before_guia_tv, tv_stb
    // less_7_secs:117
});
