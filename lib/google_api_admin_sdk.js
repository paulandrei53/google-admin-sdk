const quest = require('quest');
const dotty = require('dotty');
const _ = require('underscore');
_.str = require('underscore.string');
const retry = require('retry');

// base google api class. provides functions for:
// static methods for:
// 1. Generating an initial oauth redirect with scopes you want
// 2. Trading in authorization codes for tokens
// class object is instantiated with oauth token info

class GoogleAPIAdminSDK {
    static initClass() {

        this.prototype.retry_options = { maxTimeout: 3 * 60 * 1000, retries: 5, randomize: true };

        this.request_token = (options, cb) => {
            // need code, client.id, client.secret
            for (let required of ['code', 'redirect_uri', 'client.id', 'client.secret']) {
                if (!dotty.exists(options, required)) {
                    return cb(new Error(`Error: '${required}' is necessary to request a token`));
                }
            }
            options = {
                method: 'post',
                uri: 'https://accounts.google.com/o/oauth2/token',
                json: true,
                form: {
                    code: options.code,
                    redirect_uri: options.redirect_uri,
                    client_id: options.client.id,
                    client_secret: options.client.secret,
                    grant_type: 'authorization_code'
                }
            };
            const operation = retry.operation(this.retry_options);
            return operation.attempt(() => {
                return quest(options, (err, resp, body) => {
                    if (!operation.retry(GoogleAPIAdminSDK.retry_err(err, resp))) {
                        return (this.response_handler(cb))(err, resp, body);
                    }
                });
            });
        };
    }
    constructor(options) {
        this.request_refresh_token = this.request_refresh_token.bind(this);
        this.oauth2_request = this.oauth2_request.bind(this);
        this.tokeninfo = this.tokeninfo.bind(this);
        this.options = options;
        if (!this.options.token) { throw new Error('Must initialize GoogleAPI with token info'); }
        if (!this.options.token.refresh && !this.options.token.access) { throw new Error('Must provide either a refresh token or an access token'); }
        // client secret needed for auto-refresh
        if (!!this.options.token.refresh && (!(this.options.client != null ? this.options.client.id : undefined) || !(this.options.client != null ? this.options.client.secret : undefined))) { throw new Error('If providing a refresh token, must provide client id and secret'); }
    }
    static retry_err(err, resp) {
        if (err != null) { return err; }
        // 500/502 = "backend error"
        // 403/503 = rate limiting errors
        // 404
        // 412
        if ([403, 404, 412, 500, 502, 503].includes(resp.statusCode)) {
            return new Error(`Status code ${resp.statusCode} from Google`);
        }
        return null;
    }

    // default response interpreters--APIs should most likely specialize these
    // error_handler returns true if it found/handled an error
    static error_handler(cb) {
        return function (err, resp, body) {
            if (err) { return cb(err) || true; }
            if (!(200 <= resp.statusCode && resp.statusCode < 299)) {
                return cb({
                    code: resp.statusCode,
                    body,
                    req: _((resp != null ? resp.req : undefined) || {}).chain().pick('method', 'path', '_headers').extend({ body: `${__guard__(__guard__(__guard__(resp != null ? resp.req : undefined, x2 => x2.res), x1 => x1.request), x => x.body)}` }).value()
                }) || true;
            }
            return false;
        };
    }
    static response_handler(cb) {
        return function (err, resp, body) {
            if (err != null) { return cb(err, body); }
            if (resp.statusCode === 204) { return cb(null, { '204': 'Operation success' }); }
            if (resp.statusCode >= 400) { return cb(body, null); }
            const handle_entry = function (entry) {
                const obj = { id: entry.id.$t, updated: entry.updated.$t, link: entry.link, title: (entry.title != null ? entry.title.$t : undefined), feedLink: entry.gd$feedLink, who: entry.gd$who };
                _(entry).chain().keys().filter(k => k.match(/^apps\$/)).each(function (apps_key) {
                    const key = apps_key.match(/^apps\$(.*)$/)[1];
                    if (key === 'property') {
                        return Array.from(entry[apps_key]).map((prop) => (obj[prop.name] = prop.value));
                    } else {
                        return obj[key] = entry[apps_key];
                    }
                });
                return obj;
            };
            if ((body != null ? body.feed : undefined) != null) {
                return cb(null, { id: body.feed.id, link: body.feed.link, data: _(body.feed.entry || []).map(handle_entry) });
            } else if (body != null ? body.entry : undefined) {
                return cb(null, handle_entry(body.entry));
            } else if (_.str.include(body != null ? body.kind : undefined, 'admin#directory')) {
                return cb(null, body);
            } else if (resp.statusCode === 200) { // catch all for success

                return cb(null, body);
            } else {
                console.warn('WARNING: unhandled body', resp.statusCode, body);
                return cb(null, body);
            }
        };
    }

    request_refresh_token(cb) {
        const options = {
            method: 'post',
            uri: 'https://accounts.google.com/o/oauth2/token',
            json: true,
            form: {
                refresh_token: this.options.token.refresh,
                client_id: this.options.client.id,
                client_secret: this.options.client.secret,
                grant_type: 'refresh_token'
            }
        };
        const operation = retry.operation(this.retry_options);
        return operation.attempt(() => {
            return quest(options, (err, resp, body) => {
                if (operation.retry(GoogleAPIAdminSDK.retry_err(err, resp))) { return; }
                if (body.access_token != null) { this.options.token.access = body.access_token; }
                if (body.id_token != null) { this.options.token.id = body.id_token; }
                if (resp.statusCode !== 200) { console.warn('Failed to refresh Google token!'); }
                return (GoogleAPIAdminSDK.response_handler(cb))(err, resp, body);
            });
        });
    }

    oauth2_request(options, refreshed_already, cb) {
        if (_(refreshed_already).isFunction()) {
            cb = refreshed_already;
            refreshed_already = false;
        }

        const refresh = () => {
            return this.request_refresh_token((err, body) => {
                if (err) { return cb(err, null, body); }
                return this.oauth2_request(options, true, cb);
            });
        };
        if (!this.options.token.access) { return refresh(); }
        if (!options.headers) { options.headers = {}; }
        _(options.headers).extend({ Authorization: `Bearer ${this.options.token.access}` });
        const operation = retry.operation(this.retry_options);
        return operation.attempt(() => {
            return quest(options, (err, resp, body) => {
                // 401 means invalid credentials so we should refresh our token.
                // But, if we refreshed_already, then we genuinely have invalid credential problems.
                if (!refreshed_already && ((resp != null ? resp.statusCode : undefined) === 401) && this.options.token.refresh) {
                    return refresh();
                }
                // keep retrying until there is no err and resp.statusCode is not an error code
                if (!operation.retry(GoogleAPIAdminSDK.retry_err(err, resp))) {
                    return cb(err, resp, body);
                }
            });
        });
    }

    tokeninfo(cb) {
        const operation = retry.operation(this.retry_options);
        return operation.attempt(() => {
            return quest({
                uri: 'https://www.googleapis.com/oauth2/v1/tokeninfo',
                qs: { access_token: this.options.token.access }
            }
                , (err, resp, body) => {
                    if (!operation.retry(GoogleAPIAdminSDK.retry_err(err, resp))) {
                        return (GoogleAPIAdminSDK.response_handler(cb))(err, resp, body);
                    }
                });
        });
    }
}

GoogleAPIAdminSDK.initClass();

module.exports = GoogleAPIAdminSDK;

function __guard__(value, transform) {
    return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}