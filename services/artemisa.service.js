const modular = require('../modular');
const config = require('../config/site.json');
const https = require('https');

var sessions = {};

/**
 * Parses, safely, a json string.
 * @param {String} json JSON string.
 */
function safeParse(json) {
    if (json.constructor === String) {
        try {
            var parsed = JSON.parse(json);
            return parsed;
        } catch (e) {
            return undefined;
        }
    } else {
        return undefined;
    }
}

function configure(action, method, length, token = null) {
    var ret = {
        hostname: config.artemisa.host,
        path: action,
        method: method,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': length,
            'Authorization': `Basic ${Buffer.from(`${config.artemisa.user}:${token}`).toString('base64')}`
        }
    };

    return ret;
}

function post(action, data, callback, token) {
    var strData = JSON.stringify(data);
    let req = https.request(configure(action, 'POST', Buffer.byteLength(strData), token), (res) => {
        var buffer = [];
        res.setEncoding('utf8');
        res.on("data", d => buffer.push(d));
        res.on("end", () => {
            var d = buffer.join('');
            modular.Log.debug(d);
            callback(d);
        });
    });

    req.on('error', (e) => {
        modular.Log.error(e);
        callback(e);
    });

    req.write(strData);
    req.end();
}

/**
 *              .:: Service Class ::.
 *
 * - Services contains code not related to the      -
 * - server post/get functionality and this methods -
 * - will not be exposed to the client.             -
 */
class Service {

    constructor () {
        // this object always have to contain those attributes...
        this.Metadata = {
            name: 'Artemisa Service',
            author: 'Diana Nuño',
            alias: 'artemisa'
        }
    }

    async Login(user, password) {
        return new Promise((resolve, reject) => {
            post('/login', {
                UserName: user,
                Password: password
            }, (result) => {
                var obj = safeParse(result);
                if (obj.Data) {
                    if (obj.Data.Token) {
                        sessions[obj.Data.Token] = {
                            UserName: user
                        };
                    }
                }

                if (!obj) {
                    reject();
                } else {
                    resolve(modular.Response.Responserify(obj.Code == 200,
                                                          obj.Data ? obj.Data.Token : null,
                                                          obj.Caption,
                                                          obj.Data ? (obj.Data.Token ? '/redir/login.html' : null) : null));
                }
            });
        });
    }

    async Logout(token) {
        return new Promise((resolve, reject) => {
            post('/logout', {}, (res) => {
                var obj = safeParse(res);

                if (!obj) {
                    reject();
                } else {
                    resolve(modular.Response.Responserify(obj.Code == 200, obj.Data, obj.Caption));
                }
            }, token);
        });
    }

    async Register(data) {
        return new Promise((resolve, reject) => {
            post('/userHandler/register', data, (res) => {
                var obj = safeParse(res);

                if (!obj) {
                    reject();
                } else {
                    resolve(modular.Response.Responserify(obj.Code == 200, obj.Data, obj.Caption));
                }
            });
        });
    }

    async Validate(user, code) {
        return new Promise((resolve, reject) => {
            post('/userHandler/validate', {
                UserID: user,
                Code: code
            }, (res) => {
                var obj = safeParse(res);

                if (!obj) {
                    reject();
                } else {
                    resolve(modular.Response.Responserify(obj.Code == 200, obj.Data, obj.Caption, obj.Code == 200 ? '/redir/validation.html' : null));
                }
            });
        });
    }

    async UpdateInfo(data, token) {
        return new Promise((resolve, reject) => {
            post('/userHandler/updateInfo', data, (res) => {
                var obj = safeParse(res);

                if (!obj) {
                    reject();
                } else {
                    resolve(modular.Response.Responserify(obj.Code == 200, obj.Data, obj.Caption));
                }
            }, token);
        });
    }

    async GetInfo(search, token) {
        return new Promise((resolve, reject) => {
            post('/userHandler/info', {key: search}, (res) => {
                var obj = safeParse(res);

                if (!obj) {
                    reject();
                } else {
                    resolve(modular.Response.Responserify(obj.Code == 200, obj.Data, obj.Caption));
                }
            }, token);
        })
    }

    async SearchUser(data, token) {
        return new Promise((resolve, reject) => {
            post('/socialHandler/searchUser', data, (res) => {
                var obj = safeParse(res);

                if (!obj) {
                    reject();
                } else {
                    resolve(modular.Response.Responserify(obj.Code == 200, obj.Data, obj.Caption));
                }
            }, token);
        });
    }
}

module.exports = Service;