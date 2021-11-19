const _ = require('underscore');

module.exports = {
    die_fn(cb) {
        return function (err_txt) {
            if (_(cb).isFunction()) { return cb(new Error(err_txt)); }
            throw Error(err_txt);
        };
    }, // only option if no cb

    is_email(str) {
        if ((str == null)) { return false; }
        return str.match(/^([\w.-]+)@([\w.-]+)\.([a-zA-Z.]{2,6})$/i);
    }
};