const GoogleAPIAdminSDK = require(`${__dirname}/google_api_admin_sdk`);
const qs = require('qs');
const _ = require('underscore');
const utils = require(`${__dirname}/utils`);
const sanitize = require('sanitize-arguments');
const { Query } = require(`${__dirname}/query.coffee`);

class GroupProvisioning extends GoogleAPIAdminSDK {
    list(params, cb) {
        const arglist = sanitize(arguments, GroupProvisioning.list, [Object, Function]);
        const args = _.object(['params', 'cb'], arglist);
        const die = utils.die_fn(args.cb);
        if ((args.params == null)) {
            return die("GroupProvisioning::list expected (Object params[, callback])");
        }
        const valid_params = ['customer', 'domain', 'maxResults', 'pageToken', 'userKey', 'fields'];
        for (let param in args.params) {
            const val = args.params[param];
            if (!_(valid_params).contains(param)) { return die(`GroupProvisioning::list invalid param '${param}'`); }
        }
        const uri = "https://www.googleapis.com/admin/directory/v1/groups";
        const opts = { json: true, qs: args.params, uri };
        const q = new Query(this, opts);
        if (args.cb == null) { return q; }
        return q.exec(args.cb);
    }

    get(group_key, cb) {
        const arglist = sanitize(arguments, GroupProvisioning.get, [String, Function]);
        const args = _.object(['group_key', 'cb'], arglist);
        const die = utils.die_fn(args.cb);
        if ((args.group_key == null)) {
            return die('GroupProvisioning::get expected (String group_key[, callback])');
        }
        const uri = `https://www.googleapis.com/admin/directory/v1/groups/${args.group_key}`;
        const opts = { json: true, uri };
        const q = new Query(this, opts);
        if (args.cb == null) { return q; }
        return q.exec(args.cb);
    }

    insert(properties, fields, cb) {
        const arglist = sanitize(arguments, GroupProvisioning.insert, [Object, String, Function]);
        const args = _.object(['properties', 'fields', 'cb'], arglist);
        const die = utils.die_fn(args.cb);
        if ((args.properties == null)) {
            return die('GroupProvisioning::insert expected (Object properties[, String fields, callback])');
        }
        const uri = "https://www.googleapis.com/admin/directory/v1/groups";
        const opts = { method: 'post', json: args.properties, uri };
        if (args.fields != null) { opts.qs = { fields: args.fields }; }
        const q = new Query(this, opts);
        if (args.cb == null) { return q; }
        return q.exec(args.cb);
    }

    delete(group_key, cb) {
        const arglist = sanitize(arguments, GroupProvisioning.delete, [String, Function]);
        const args = _.object(['group_key', 'cb'], arglist);
        const die = utils.die_fn(args.cb);
        if ((args.group_key == null)) {
            return die('GroupProvisioning::delete expected (String group_key[, callback])');
        }
        const uri = `https://www.googleapis.com/admin/directory/v1/groups/${args.group_key}`;
        const opts = { method: 'delete', json: true, uri };
        if (args.fields != null) { opts.qs = { fields: args.fields }; }
        const q = new Query(this, opts);
        if (args.cb == null) { return q; }
        return q.exec(args.cb);
    }

    patch(group_key, body, fields, cb) {
        const arglist = sanitize(arguments, GroupProvisioning.patch, [String, Object, String, Function]);
        const args = _.object(['group_key', 'body', 'fields', 'cb'], arglist);
        const die = utils.die_fn(args.cb);
        if ((args.group_key == null)) {
            return die('GroupProvisioning::delete expected (String group_key[, Object body, String fields, callback])');
        }
        if (utils.is_email(args.group_key)) { return die("group_key cannot be an email address"); }
        let uri = `https://www.googleapis.com/admin/directory/v1/groups/${args.group_key}`;
        if (args.fields != null) { uri += `?${qs.stringify({ fields: args.fields })}`; }
        const opts = { method: 'patch', uri, json: (args.body || true) };
        const q = new Query(this, opts);
        if (args.cb == null) { return q; }
        return q.exec(args.cb);
    }
}

module.exports = GroupProvisioning;