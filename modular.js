/**
 * Module singleton. Here you have all the
 * objects and utilities to your modules to
 * work!
 * 
 * Require it when neccessary (in every
 * module or service, for example).
 */

const config = require('./config/site.json');
const util = require('util');
const nautilus = require('glob');
const io = require('fs');
const multer = require('multer');
const log = require('noogger').init(config.logging);

var upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/');
        },
        filename: function (req, file, cb) {
            cb(null, file.fieldname + '-' + Date.now() + '-' + file.originalname.toLowerCase());
        }
    }),
    fileFilter: (req, file, cb) => {
        console.log(util.inspect(file));
        if (config.uploads.accepts.includes(file.mimetype.toLowerCase())) {
            console.log('saved');
            cb(null, true);
        } else {
            console.log('not saved');
            cb(null, false);
        }
    },
    limits: {
        fileSize: config.uploads.maxSize
    }
});

var Services = {};
var Modules = {};

var Routes = [];

function doService(instance, name) {
    if (!Services[name]) {
        Services[name] = instance;
    }
}

function doModule(instance, moduleClass, server) {
    let root = instance.Metadata.routeRoot;
    let routes = Object.getOwnPropertyNames(moduleClass.prototype)
                       .filter(f => typeof moduleClass.prototype[f] == 'function' &&
                                    f != 'constructor');
    
    if (!Routes.includes(root)) {
        routes.forEach(route => {
            try {
                let parts = String(route).split('_');

                let multipart = parts[2] == 'files';
                let pure = parts[1];
                
                server[parts[0]](`${root}/${pure}`, multipart ? upload.any() : upload.none(), instance[route]);
                log.info(`Added '${pure}' as '${parts[0]}' ${multipart ? 'with' : 'without'} file handling.`);
            } catch (error) {
                log.error(`Error adding route '${route}' from module '${instance.Metadata.name}'.`);
            }
        });

        Routes.push(root);
        Modules[root] = instance;

        log.notice(`[Module] ${instance.Metadata.name} by ${instance.Metadata.author} loaded.\n${routes.join(', ')} to '${root}'.`);
    } else {
        log.error(`[Module] Overlapping routes for ${instance.Metadata.name}. Module not loaded.`);
    }
}

function services() {
    nautilus('./services/**/*.service.js', null, (error, files) => {
        files.forEach(file => {
            if (io.existsSync(file)) {
                try {
                    log.info(`Loading service ${file}...`);
    
                    let currentService = require(file);
                    var instance = new currentService();
                    doService(instance, instance.Metadata.alias);
    
                    log.notice(`[Service] ${instance.Metadata.name} by ${instance.Metadata.author} loaded as ${instance.Metadata.alias}.`);
                } catch (error) {
                    log.error(error);
                }
            }
        });
    });
}

function modules(server) {
    nautilus('./modules/**/*.module.js', null, (error, files) => {
        files.forEach(file => {
            if (io.existsSync(file)) {
                try {
                    log.info(`Loading module ${file}...`);
                    
                    var currentModule = require(file);
                    var instance = new currentModule();

                    doModule(instance, currentModule, server);
                } catch (e) {
                    log.error(`Error loading module '${file}'.\n${e}.`);
                }
            }
        });
    });
}

function responserify(success, data, caption, next) {
    return {
        success: success,
        data: data ? data : null,
        caption: caption ? caption : null,
        next: next ? next : null
    };
}

module.exports = {
    /**
     * Logging utility.
     */
    Log: log,
    /**
     * Adds a new service.
     */
    NewService: doService,
    /**
     * Adds a new module.
     */
    NewModule: doModule,
    /**
     * Loads all available services.
     */
    LoadServices: services,
    /**
     * Loads all available modules.
     */
    LoadModules: modules,
    /**
     * Multer thing for multipart/form-data.
     */
    Upload: upload,

    Response: {
        Responserify: responserify,
        Send: (res, success, data, caption, next) => {
            res.send(responserify(success, data, caption, next));
        }
    },

    Services: Services,
    Modules: Modules
};