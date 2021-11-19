const async = require('async');
const GoogleAPIAdminSDK = require(`${__dirname}/google_api_admin_sdk`);
const url = require('url');
const quest = require('quest');
const {
    MailParser
} = require('mailparser');
const http_parser = require('http-string-parser');
const _ = require('underscore');
const retry = require('retry');

class Batch {
    constructor(google_opts) {
        this.queries = [];
        this.google_api = new GoogleAPIAdminSDK(google_opts);
    }

    go(queries, cb) {
        if (queries.length === 0) { return cb(null, []); }

        return async.waterfall([
            cb_wf => {
                return this.google_api.tokeninfo((err, result) => {
                    if (err != null) {
                        return this.google_api.request_refresh_token(cb_wf);
                    } else {
                        return cb_wf(null, null);
                    }
                });
            },
            (dontcare, cb_wf) => {
                const boundary = '===============7330845974216740156==';
                const request_body = _.map(queries, function (query) {
                    let left;
                    const {
                        pathname
                    } = url.parse(query._opts.uri);
                    const method = (left = (query._opts.method != null ? query._opts.method.toUpperCase() : undefined)) != null ? left : "GET";
                    let body = `\n--${boundary}\nContent-Type: application/http\n\n${method} ${pathname} HTTP/1.1`;
                    if ((query._opts.json != null) && (query._opts.json !== true)) {
                        const content_body = JSON.stringify(query._opts.json);
                        body += "\nContent-Type: application/json";
                        body += `\ncontent-length: ${content_body.length}`;
                        body += `\n\n${content_body}`;
                    }
                    return body;
                }).join('') + `\n--${boundary}--`;

                const options = {
                    method: 'post',
                    uri: "https://www.googleapis.com/batch/admin/directory_v1",
                    body: request_body,
                    headers: {
                        Authorization: `Bearer ${this.google_api.options.token.access}`,
                        'content-type': `multipart/mixed; boundary=\"${boundary}\"`
                    }
                };

                const operation = retry.operation({ maxTimeout: 3 * 60 * 1000, retries: 15 });
                return operation.attempt(() => quest(options, function (err, res, body) {
                    if ((res.statusCode === 503) && operation.retry(new Error(""))) { return null; }
                    return cb_wf(err, res, body);
                }));
            },
            (res, body, cb_wf) => {
                if (res.statusCode !== 200) {
                    return cb_wf(new Error(`Batch API responded with code ${res.statusCode}`));
                }

                // It is unlikely the above retry logic will work since it would mean the entire batch
                // request failed to go through.
                // What is more likely to happen is that individual requests within the batch could fail.
                // And so what is returned to the cb of Batch.go is an array of responses.
                const mail_parser = new MailParser();
                mail_parser.end(`Content-type: ${res.headers['content-type']}\r\n\r\n${body}`);
                return mail_parser.on('end', mail => cb_wf(null, _(mail.attachments).map(function (result) {
                    const parsed_response = http_parser.parseResponse(result.content.toString());
                    if (parsed_response.body) { parsed_response.body = JSON.parse(parsed_response.body); }
                    parsed_response.statusCode = +parsed_response.statusCode;
                    return parsed_response;
                })
                ));
            }
        ], cb);
    }
}

module.exports = Batch;