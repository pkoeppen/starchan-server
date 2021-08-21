"use strict";
exports.__esModule = true;
var globals_1 = require("../globals");
exports["default"] = loggerMiddleware;
/*
 * Formats and logs request data.
 */
function loggerMiddleware(req, res, next) {
    var timer = new Nanotimer();
    res.on('finish', function () {
        var method = req.method;
        var url = req.originalUrl;
        var status = res.statusCode;
        var time = timer.end().milleseconds().round(2);
        var size = res.getHeader('Content-Length') || '-';
        var message = method + " " + url + " " + status + " " + time + " ms - " + size;
        var isError = res.statusCode >= 400 && res.statusCode < 600;
        if (isError) {
            globals_1.logger.error(message);
        }
        else {
            globals_1.logger.info(message);
        }
    });
    next();
}
/*
 * A little class to time things in nanoseconds.
 */
var Nanotimer = /** @class */ (function () {
    function Nanotimer() {
        this.start = process.hrtime();
        this.elapsed = 0;
    }
    Nanotimer.prototype.startTimer = function () {
        this.start = process.hrtime();
        return this;
    };
    Nanotimer.prototype.end = function () {
        var NS_PER_SEC = 1e9;
        var difference = process.hrtime(this.start);
        var nanoseconds = difference[0] * NS_PER_SEC + difference[1];
        this.elapsed = nanoseconds;
        return this;
    };
    Nanotimer.prototype.milleseconds = function () {
        this.elapsed *= 0.000001;
        return this;
    };
    Nanotimer.prototype.round = function (places) {
        return places
            ? +(Math.round((this.elapsed + ("e+" + places))) +
                ("e-" + places))
            : this.elapsed;
    };
    return Nanotimer;
}());
//# sourceMappingURL=logger.js.map