'use strict';

/**
 * Google Admin SDK - Domain Resource
 */

const GoogleAPIAdminSDK = require(`${__dirname}/auth`);
const _ = require('underscore');
const utils = require(`${ __dirname }/utils`);
const { Query } = require(`${__dirname}/query.js`);
const qs = require('qs');
const sanitize = require('sanitize-arguments');

class DomainProvisioning extends GoogleAPIAdminSDK {

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

    delete(customer, domain_name, cb) {
        const arglist = sanitize(arguments, DomainProvisioning.delete, [String, String, Function]);
        const args = _.object(['customer', 'domain_name', 'cb'], arglist);
        const die = utils.die_fn(args.cb);
        if ((args.customer == null) || (args.domain_name == null)) {
            return die("DomainProvisioning::delete expected (String customer, String domain_name[, callback])");
        }
        const uri = `https://www.googleapis.com/admin/directory/v1/customer/${args.customer}/domains/${args.domain_name}`;
        const opts = { method: 'delete', uri, json: true };
        const q = new Query(this, opts);
        if (args.cb == null) { return q; }
        return q.exec(args.cb);
    }

    get(customer, domain_name, fields, cb) {
        const arglist = sanitize(arguments, DomainProvisioning.get, [String, String, String, Function]);
        const args = _.object(['customer', 'domain_name', 'fields', 'cb'], arglist);
        const die = utils.die_fn(args.cb);
        if ((args.customer == null) || (args.domain_name == null)) {
            return die("DomainProvisioning::get expected (String customer, String domain_name, [, String fields, callback])");
        }
        const opts = { json: true };
        opts.uri = `https://www.googleapis.com/admin/directory/v1/customer/${args.customer}/domains/${args.domain_name}`;
        if (args.fields != null) { opts.uri += `?${qs.stringify({ fields: args.fields })}`; }
        const q = new Query(this, opts);
        if (args.cb == null) { return q; }
        return q.exec(args.cb);
    }

    insert(customer, properties, fields, cb) {
        const arglist = sanitize(arguments, DomainProvisioning.insert, [String, Object, String, Function]);
        const args = _.object(['customer', 'properties', 'fields', 'cb'], arglist);
        const die = utils.die_fn(args.cb);
        if ((args.customer == null) || (args.properties == null)) {
            return die("DomainProvisioning::insert expected (String customer, Object properties[, String fields, callback])");
        }
        let uri = `https://www.googleapis.com/admin/directory/v1/customer/${args.customer}/domains`;
        if (args.fields != null) { uri += `?${qs.stringify({ fields: args.fields })}`; }
        const opts = { method: 'post', uri, json: properties };
        const q = new Query(this, opts);
        if (args.cb == null) { return q; }
        return q.exec(args.cb);
    }

    list(customer, params, cb) {
        const arglist = sanitize(arguments, DomainProvisioning.list, [String, Object, Function]);
        const args = _.object(['customer', 'params', 'cb'], arglist);
        const die = utils.die_fn(args.cb);
        if ((args.customer == null)) { return die("DomainProvisioning::list expected (String customer[, Object params, callback])"); }
        const opts = { json: true };
        opts.uri = `https://www.googleapis.com/admin/directory/v1/customer/${args.customer}/domains`;
        if (args.params != null) { opts.uri += `?${qs.stringify(args.params)}`; }
        const q = new Query(this, opts);
        if (args.cb == null) { return q; }
        return q.exec(args.cb);
    }
}

DomainProvisioning.initClass();

module.exports = DomainProvisioning;