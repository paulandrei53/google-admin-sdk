const node_url = require('url');
const _ = require('underscore');
_.str = require('underscore.string');
_.mixin(_.str.exports());
const { Readable } = require('stream');

// General auto-pagination of feeds. Assumes feed responses of the form
// { data: [...] link: [ { rel: ..., href: }]}
// or singular resource responses of the form
// { data: {} }
class QueryStream extends Readable {
    constructor(_query) {
        this._read = this._read.bind(this);
        this.run = this.run.bind(this);
        this._query = _query;
        super({ objectMode: true });
        this.running = false;
    }

    _read() { return this.run(); }

    run() {
        if (this.running) { return; }
        this.running = true;
        return this._query.exec((err, obj) => {
            if (err != null) { return this.emit('error', err); }
            if ((obj != null ? obj.kind : undefined) == null) { return this.emit('error', `Cannot stream object ${JSON.stringify(obj, null, 2)}`); }
            const resource = _.strRightBack(obj.kind, '#');
            if (_(obj != null ? obj[resource] : undefined).isArray()) {
                for (let r of Array.from(obj[resource])) { this.push(r); }
            } else if (obj != null) {
                this.push(obj);
            }
            if (!obj.nextPageToken) {
                this.push(null);
                return;
            }
            if (obj.nextPageToken) {
                let new_search;
                const parsed = node_url.parse(this._query._opts.uri);
                if (parsed.search.indexOf('pageToken') !== -1) {
                    new_search = `?pageToken=${obj.nextPageToken}&${_(parsed.search).strRight('&')}`;
                } else {
                    new_search = `?pageToken=${obj.nextPageToken}&${parsed.search.slice(1)}`;
                }
                this._query._opts.uri = `${parsed.protocol}//${parsed.host}${parsed.pathname}${new_search}`;
            }
            this.running = false;
            return process.nextTick(this.run);
        });
    }
}

class Query {
    constructor(_google_api, _opts) {
        this.exec = this.exec.bind(this);
        this.stream = this.stream.bind(this);
        this._google_api = _google_api;
        this._opts = _opts;
    }
    exec(cb) {
        return this._google_api.oauth2_request(this._opts, this._google_api.constructor.response_handler(cb));
    }
    stream() { return new QueryStream(this); }
}

module.exports = {
    Query,
    QueryStream
};