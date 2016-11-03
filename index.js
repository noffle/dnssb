#!/bin/sh
':' //; exec "$(command -v nodejs || command -v node)" "$0" "$@"
// http://unix.stackexchange.com/questions/65235/universal-node-js-shebang

var SsbRef = require("ssb-ref");
var Lib = require("./lib/");

(function () {
if (require.main !== module) { return module.exports = Lib; }

var publishHelp = "\tssb-dns publish (previous record key...) name type value (class)";
var updateHelp = "\tssb-dns update name type value (class)";
var serverHelp = "\tssb-dns server port host";
var dumpHelp = "\tssb-dns dump";


var CLI_Help = function () {
    [
        "try one of:",
        serverHelp,
        publishHelp,
        updateHelp,
        dumpHelp,
    ].forEach(function (m) {
        console.log(m);
    });
};

var argv = process.argv.slice(2);

switch (argv[0]) {
    case undefined:
        CLI_Help();
        break;
    case 'dump':
    (function () {
        var count = 0;
        Lib.dump.records(function (record) { // each
            console.log(JSON.stringify(record, null, 2));
            count++;
        }, function (sbot) { // done
            console.log("Found a total of %s valid ssb-dns records", count);
            sbot.close();
        });
    }());
        break;
    case 'server':
    (function () {
        var port = argv[1] || 53053;
        var host = argv[2] || '127.0.0.1';
        var Client = require("ssb-client");

        Client(function (err, sbot) {
            if (err) throw err;

            Lib.server.listen(sbot, port, host, function () {
                console.log("server listening on %s:%s", host, port);
            });
        });
    }());
        break;
    case 'publish':
    (function () {
        var branches = [];
        while (argv[1] && SsbRef.isMsgId(argv[1])) {
            branches.push(argv.splice(1));
        }

        if (argv.length < 4) {
            console.log("Try:");
            console.error(publishHelp);
            return;
        }

        var name = argv[1];
        var type = argv[2];
        var value = argv[3];
        var _class = argv[4];

        Lib.publish.record(branches, name, type, value, _class, function (err, msg) {
            if (err) {
                console.error(err);
                process.exit(1);
            }
            console.log(JSON.stringify(msg, null, 2));
            process.exit(0);
        });
    }());
        break;
    case 'update':
    (function () {
        if (argv.length < 4) {
            console.log("Try:");
            console.error(updateHelp);
            return;
        }

        var name = argv[1];
        var type = argv[2];
        var value = argv[3];
        var _class = argv[4];

        Lib.query.branches(name, type, _class, function (err, branches) {
            if (err) throw err;
            Lib.publish.record(branches, name, type, value, _class, function (err, msg) {
                if (err) throw err;
                console.log(msg);
                process.exit(0);
            });
        })
    }());
        break;
    default:
        CLI_Help();
        break;
}

}());
