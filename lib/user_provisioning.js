'use strict';

/**
 * Google Admin SDK - User Resource
 */

const qs = require('qs');
const crypto = require('crypto');
const _ = require('underscore');
const dotty = require('dotty');
const utils = require(`${__dirname}/utils`);
const sanitize = require('sanitize-arguments');
const { Query } = require(`${__dirname}/query.js`);
const GoogleAPIAdminSDK = require(`${__dirname}/auth`);

class UserProvisioning extends GoogleAPIAdminSDK {

    /**
     * @inheritDoc
     */
    constructor(...args) {
        super(...args);
        this.delete = this.delete.bind(this);
        this.get = this.get.bind(this);
        this.insert = this.insert.bind(this);
        this.list = this.list.bind(this);
    }

    delete(userkey, cb) {
        const arglist = sanitize(arguments, UserProvisioning.delete, [String, Function]);
        const args = _.object(['userkey', 'cb'], arglist);
        const die = utils.die_fn(args.cb);
        if ((args.userkey == null)) { return die("UserProvisioning::delete expected (String userkey, [callback])"); }
        const uri = `https://www.googleapis.com/admin/directory/v1/users/${args.userkey}`;
        const opts = { method: 'delete', uri, json: true };
        const q = new Query(this, opts);
        if (args.cb == null) { return q; }
        return q.exec(args.cb);
    }

    get(userkey, cb) {
        // when requesting partial responses with the 'fields' param, you must request the nextPageToken field to enable pagination
        const arglist = sanitize(arguments, UserProvisioning.get, [String, Function]);
        const args = _.object(['userkey', 'cb'], arglist);
        const die = utils.die_fn(args.cb);
        if ((args.userkey == null)) { return die("UserProvisioning::get requires (String userkey, [callback])"); }
        const uri = `https://www.googleapis.com/admin/directory/v1/users/${args.userkey}`;
        const opts = { json: true, uri };
        const q = new Query(this, opts);
        if (args.cb == null) { return q; }
        return q.exec(args.cb);
    }

    insert(body, fields, cb) {
        const arglist = sanitize(arguments, UserProvisioning.insert, [Object, String, Function]);
        const args = _.object(['body', 'fields', 'cb'], arglist);
        const die = utils.die_fn(args.cb);
        if ((args.body == null)) { return die("UserProvisioning::insert expected (Object body, [callback])"); }
        const required = ['name.familyName', 'name.givenName', 'password', 'primaryEmail'];
        for (let r of Array.from(required)) {
            if (!dotty.exists(body, r)) {
                return die(`UserProvisioning::insert requires '${r}'`);
            }
        }
        const uri = "https://www.googleapis.com/admin/directory/v1/users";
        const shasum = crypto.createHash('sha1');
        shasum.update(body.password);
        body.password = shasum.digest('hex');
        body.hashFunction = 'SHA-1';
        const opts = {
            method: 'post',
            uri,
            json: args.body
        };
        const q = new Query(this, opts);
        if (args.cb == null) { return q; }
        return q.exec(args.cb);
    }

    list(params, cb) {
        if ((params.fields != null) && !(_.str.include(params.fields, 'nextPageToken'))) {
            params.fields = 'nextPageToken,' + params.fields;
        }
        const arglist = sanitize(arguments, UserProvisioning.list, [Object, Function]);
        const args = _.object(['params', 'cb'], arglist);
        const die = utils.die_fn(args.cb);
        if ((args.params == null)) { return die("UserProvisioning::list requires (Object params, [callback])"); }
        let uri = "https://www.googleapis.com/admin/directory/v1/users";
        if (args.params) { uri += `?${qs.stringify(args.params)}`; }
        const opts = { json: true, uri };
        const q = new Query(this, opts);
        if (args.cb == null) { return q; }
        return q.exec(args.cb);
    }

    patch(userkey, body, fields, cb) {
        const arglist = sanitize(arguments, UserProvisioning.patch, [String, Object, String, Function]);
        const args = _.object(['userkey', 'body', 'fields', 'cb'], arglist);
        const die = utils.die_fn(args.cb);
        if ((args.userkey == null)) {
            return die("UserProvisioning::patch expected (String userkey, [Object body, String fields, callback])");
        }
        let uri = `https://www.googleapis.com/admin/directory/v1/users/${args.userkey}`;
        if (args.fields != null) { uri += `?${qs.stringify({ fields: args.fields })}`; }
        const opts = { method: 'patch', uri, json: (args.body || true) };
        const q = new Query(this, opts);
        if (args.cb == null) { return q; }
        return q.exec(args.cb);
    }

    update(userkey, body, fields, cb) {
        const arglist = sanitize(arguments, UserProvisioning.patch, [String, Object, String, Function]);
        const args = _.object(['userkey', 'body', 'fields', 'cb'], arglist);
        const die = utils.die_fn(args.cb);
        if ((args.userkey == null)) {
            return die("UserProvisioning::update expected (String userkey, [Object body, String fields, callback])");
        }
        let uri = `https://www.googleapis.com/admin/directory/v1/users/${args.userkey}`;
        if (args.fields != null) { uri += `?${qs.stringify({ fields: args.fields })}`; }
        const opts = { method: 'put', uri, json: (args.body || true) };
        const q = new Query(this, opts);
        if (args.cb == null) { return q; }
        return q.exec(args.cb);
    }
}

module.exports = UserProvisioning;