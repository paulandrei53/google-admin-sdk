const GoogleAPIAdminSDK = require('lib/auth');
const _ = require('underscore');
const utils = require('lib/utils');
const { Query } = require('lib/query.js');
const qs = require('qs');
const sanitize = require('sanitize-arguments');
const async = require('async');

class OrgUnit extends GoogleAPIAdminSDK {
    constructor(...args) {
        this.patch = this.patch.bind(this);
        this.insert = this.insert.bind(this);
        this.delete = this.delete.bind(this);
        this.list = this.list.bind(this);
        this.get = this.get.bind(this);
        this.get_children = this.get_children.bind(this);
        this.findOrCreate = this.findOrCreate.bind(this);
        super(...args);
    }

    static initClass() {

        // use async.memoize for two reasons:
        // 1. Ensure that the actual find-or-create action is executed at most once.
        //      This avoids a race condition in which the consumer of this library
        //      calls findOrCreate with multiple concurrency
        // 2. Increases performance
        this.prototype.atomic_get_or_create = async.memoize((full_path, customer_id, level, parent, that, cb) => {
            return async.waterfall([
                cb_wf => {
                    // Make a request to find this OU first. Only make an insert request if the OU doesn't
                    // already exist.
                    return that.get(customer_id, full_path.slice(1), function (err, body) {
                        if (err != null) {
                            if (((err.error != null ? err.error.code : undefined) === 404) && ((err.error != null ? err.error.message : undefined) === "Org unit not found")) {
                                // Not found; pass through to create the orgunit
                                return cb_wf(null, null);
                            } else {
                                // A valid error was returned. Return the error and skip the insert.
                                return cb_wf(err);
                            }
                        }

                        // If no error, we found the orgunit. Cache it and skip insert because it already exists.
                        // cache[full_path] = body
                        parent = full_path;
                        return cb_wf(null, { body, parent });
                    });
                },
                (body, cb_wf) => {
                    // No need to insert because the org unit was found
                    if (body != null) { return cb_wf(null, body); }

                    // Google interface: `name` requires no slash, parentOrgUnitPath requires a slash
                    return that.insert(customer_id, { name: level, parentOrgUnitPath: parent }, (err, body) => {
                        if (err != null) { return cb_wf(`Unable to create org unit ${full_path}: ${JSON.stringify(err)}`); }
                        // cache[full_path] = body
                        parent = full_path;
                        return cb_wf(null, { body, parent });
                    });
                }
            ], cb);
        });
    }
    // TODO: possibly make customer_id an option of OrgUnit
    // customer_id, org_unit_path required
    // if no patch_body is provided, update behaves like get
    // fields returns only selected properties of an OrgUnit object
    patch(customer_id, org_unit_path, patch_body, fields, cb) {
        const arglist = sanitize(arguments, OrgUnit.patch, [String, String, Object, String, Function]);
        const args = _.object(['customer_id', 'org_unit_path', 'patch_body', 'fields', 'cb'], arglist);
        const die = utils.die_fn(args.cb);
        if ((args.customer_id == null) || (args.org_unit_path == null)) {
            return die("OrgUnit::patch expected (String customer_id, String org_unit_path, [Object patch_body, String fields, callback])");
        }
        let uri = `https://www.googleapis.com/admin/directory/v1/customer/${args.customer_id}/orgunits/${args.org_unit_path}`;
        if (args.fields != null) { uri += `?${qs.stringify({ fields: args.fields })}`; }
        const opts = { method: 'patch', uri, json: (args.patch_body || true) };
        const q = new Query(this, opts);
        if (args.cb == null) { return q; }
        return q.exec(args.cb);
    }

    insert(customer_id, properties, fields, cb) {
        const arglist = sanitize(arguments, OrgUnit.insert, [String, Object, String, Function]);
        const args = _.object(['customer_id', 'properties', 'fields', 'cb'], arglist);
        const die = utils.die_fn(args.cb);
        if ((args.customer_id == null) || (args.properties == null)) {
            return die("OrgUnit::insert expected (String customer_id, Object properties[, String fields, callback])");
        }
        let uri = `https://www.googleapis.com/admin/directory/v1/customer/${args.customer_id}/orgunits`;
        if (args.fields != null) { uri += `?${qs.stringify({ fields: args.fields })}`; }
        const opts = { method: 'post', uri, json: properties };
        const q = new Query(this, opts);
        if (args.cb == null) { return q; }
        return q.exec(args.cb);
    }


    delete(customer_id, org_unit_path, cb) {
        const arglist = sanitize(arguments, OrgUnit.delete, [String, String, Function]);
        const args = _.object(['customer_id', 'org_unit_path', 'cb'], arglist);
        const die = utils.die_fn(args.cb);
        if ((args.customer_id == null) || (args.org_unit_path == null)) {
            return die("OrgUnit::delete expected (String customer_id, String org_unit_path[, callback])");
        }
        const uri = `https://www.googleapis.com/admin/directory/v1/customer/${args.customer_id}/orgunits/${args.org_unit_path}`;
        const opts = { method: 'delete', uri, json: true };
        const q = new Query(this, opts);
        if (args.cb == null) { return q; }
        return q.exec(args.cb);
    }

    list(customer_id, params, cb) {
        const arglist = sanitize(arguments, OrgUnit.list, [String, Object, Function]);
        const args = _.object(['customer_id', 'params', 'cb'], arglist);
        const die = utils.die_fn(args.cb);
        if ((args.customer_id == null)) { return die("OrgUnit::list expected (String customer_id[, Object params, callback])"); }
        const opts = { json: true };
        opts.uri = `https://www.googleapis.com/admin/directory/v1/customer/${args.customer_id}/orgunits`;
        if (args.params != null) { opts.uri += `?${qs.stringify(args.params)}`; }
        const q = new Query(this, opts);
        if (args.cb == null) { return q; }
        return q.exec(args.cb);
    }

    get(customer_id, org_unit_path, fields, cb) {
        const arglist = sanitize(arguments, OrgUnit.get, [String, String, String, Function]);
        const args = _.object(['customer_id', 'org_unit_path', 'fields', 'cb'], arglist);
        const die = utils.die_fn(args.cb);
        if ((args.customer_id == null) || (args.org_unit_path == null)) {
            return die("OrgUnit::get expected (String customer_id, String org_unit_path, [, String fields, callback])");
        }
        const opts = { json: true };
        opts.uri = `https://www.googleapis.com/admin/directory/v1/customer/${args.customer_id}/orgunits/${args.org_unit_path}`;
        if (args.fields != null) { opts.uri += `?${qs.stringify({ fields: args.fields })}`; }
        const q = new Query(this, opts);
        if (args.cb == null) { return q; }
        return q.exec(args.cb);
    }

    // get_children takes in a customer_id and org_unit_path and returns the children of that org unit, or an
    // error if that org unit cannot be found.
    // Reference: https://developers.google.com/admin-sdk/directory/v1/guides/manage-org-units#get_all_ou
    get_children(customer_id, org_unit_path, cb) {
        const arglist = sanitize(arguments, OrgUnit.get_children, [String, String, Function]);
        const args = _.object(['customer_id', 'org_unit_path', 'cb'], arglist);
        const die = utils.die_fn(args.cb);
        if ((args.customer_id == null) || (args.org_unit_path == null)) {
            return die("OrgUnit::get_children expected (String customer_id, String org_unit_path, [, callback])");
        }
        const opts = {
            json: true,
            uri: `https://www.googleapis.com/admin/directory/v1/customer/${args.customer_id}/orgunits`,
            qs: {
                orgUnitPath: args.org_unit_path,
                type: "children"
            }
        };
        const q = new Query(this, opts);
        if (args.cb == null) { return q; }
        return q.exec(args.cb);
    }

    // takes customer_id, array of orgunit levels eg. ['CleverStudents', 'Schoolname', ...], and optional cache, and callback
    // returns callback w/ args orgunit string '/Students/Schoolname' and cache of orgunits created '/', '/Students', '/Students/Schoolname'
    findOrCreate(customer_id, org_unit, cache, cb) {
        if (_(cache).isFunction()) {
            cb = cache;
            cache = {};
        }
        const arglist = sanitize(arguments, OrgUnit.findOrCreate, [String, Array, Function]);
        const args = _.object(['customer_id', 'org_unit', 'cb'], arglist);
        const die = utils.die_fn(args.cb);
        if ((args.customer_id == null) || (args.org_unit == null)) {
            return die("OrgUnit::findOrCreate expected (String customer_id, Array org_unit, [callback])");
        }
        let parent = '/';

        // for each level in the OU, find that OU or create it and store the response in the cache
        return async.eachSeries(args.org_unit, (level, cb_es) => {
            const full_path = parent === '/' ? `/${level}` : `${parent}/${level}`;
            if (cache[full_path] != null) {
                parent = full_path;
                return cb_es();
            }

            return this.atomic_get_or_create(full_path, args.customer_id, level, parent, this, function (err, results) {
                if (err != null) { return cb_es(err); }
                cache[full_path] = results.body;
                ({
                    parent
                } = results);
                return cb_es(err, results.body);
            });
        }
            , function (err) {
                if (err != null) { return die(err); }
                return cb(null, parent, cache);
            });
    }
}
OrgUnit.initClass();

module.exports = OrgUnit;