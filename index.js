const config = require('./config/site.json');

const util = require('util');
const http = require('http');
const https = require('https');
const express = require('express');
const session = require('express-session');
const memoryStore = require('memorystore')(session);
const parser = require('body-parser');
const io = require('fs');
const modular = require('./modular');

const site = express();
const httpServer = http.createServer(site);

if (!io.existsSync('uploads')) io.mkdirSync('uploads');

// site configuration
switch (config.protocol) {
    case 'http':
        httpServer.listen(config.port);
        break;
    case 'https':
        if (config.SSL) {
            if (!io.existsSync(config.SSL.key) || !io.existsSync(config.SSL.key)) {
                modular.Log.error('SSL key or cert not found.');
                config.protocol = 'http';
                httpServer.listen(config.port);
            } else {
                config.SSL.key = io.readFileSync(config.SSL.key);
                config.SSL.cert = io.readFileSync(config.SSL.cert);

                httpsServer = https.createServer(config.SSL, server);

                httpsServer.listen(config.port);
            }
        } else {
            modular.Log.error('SSL key and cert not set on configuration.');
            config.protocol = 'http';
            httpServer.listen(config.port);
        }
        break;
    default:
        config.protocol = 'http';
        httpServer.listen(config.port);
        break;
}
modular.Log.debug(`Listening on port ${config.port}. Using ${config.protocol} protocol`);

site.set('trust proxy', 1);
site.use(parser.urlencoded({ extended: true }));
site.use(parser.json());

site.use(session({
    store: new memoryStore({
        checkPeriod: 60000
    }),
    secret: 'showcase',
    resave: true,
    saveUninitialized: true,
    cookie: {
        secure: config.protocol == 'https'
    }
}));

site.use((req, res, next) => {
    res.header('Set-Cookie', 'SameSite=Secure')
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});

site.use((req, res, next) => {
    req.session.save(() => {
        next();
    });
});
// site configuration


// site definitions
site.use(express.static('www', config.site));
site.use('/uploads', express.static('uploads', config.site));
// site definitions

site.post('/tester', (req, res, next) => {
    modular.Log.notice(util.inspect(req.body));

    modular.Response.Send(res, true, {}, req.body);
});

site.post('/image', modular.Upload.any(), (req, res, next) => {
    modular.Log.info(util.inspect(req.files));
    res.send({
        location: req.files[0].destination + req.files[0].filename
    });
});

// modular
modular.LoadServices();
modular.LoadModules(site);
//modular