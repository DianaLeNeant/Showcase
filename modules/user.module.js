const modular = require('../modular');

/**
 *              .:: Module class ::.
 *
 * - Each function will be used as a route action,  -
 * - each one threated as defined method on         -
 * - function name.                                 -
 * - The function has to be named on the structure  -
 * - method_apiRoute_files (_files is optional).    -
 * - If a route requires file upload, add           -
 * - "_files" to the name of the function. Route    -
 * - for this will be the name of the function but  -
 * - without "_files" or "method_".                 -
 */
class Module {

    constructor() {
        // this object always have to contain those attributes...
        this.Metadata = {
            name: 'User handling',
            author: 'Diana Nuño',
            routeRoot: '/user'
        };
    }

    async post_login(req, res, next) {
        var userName = req.body.UserName;
        var password = req.body.Password;

        if (!userName || !password) {
            modular.Response.Send(res, false, {}, 'Es necesario llenar todos los campos.');
        } else {
            try {
                var login = await modular.Services['artemisa'].Login(userName, password);

                if (login.success) {
                    req.session.Token = login.data;

                    try {
                        var id = await modular.Services['artemisa'].GetInfo('_id', login.data);
                        req.session.ID = id.data;
                    } catch (error) {
                        req.session.ID = 'INVALID';
                    }
                    res.send(login);
                } else {
                    res.send(login);
                }
            } catch (lerror) {
                modular.Response.Send(res, false, {}, 'Ocurrió un error al intentar iniciar sesión. Intente más tarde.');
            }
        }
    }

    get_logout(req, res, next) {
        var token = req.session.Token; //req.body.token;

        if (token) {
            modular.Services['artemisa'].Logout(token);
            req.session.destroy();
            modular.Response.Send(res, true, {}, 'Cerraste sesión.');
        } else {
            modular.Response.Send(res, false, {}, 'Sesión inválida.');
        }
    }

    async post_register(req, res, next) {
        var userName = req.body.UserName;
        var password = req.body.Password;
        var spasswrd = req.body.SecondPassword;
        var email = req.body.Email;
        var phone = req.body.Phone;

        var fullName = req.body.FullName;
        var birthdate = req.body.Birthdate;

        if (password != spasswrd) {
            modular.Response.Send(res, false, {}, 'Las contraseñas no coinciden.');
            return;
        }

        if (!email) {
            modular.Response.Send(res, false, {}, 'Es necesario llenar el campo de correo electrónico.');
        } else {
            try {
                var register = await modular.Services['artemisa'].Register({
                    UserName: userName,
                    Password: password,
                    Email: email,
                    Phone: phone
                });
    
                if (register.success) {
                    var login = await modular.Services['artemisa'].Login(userName, password);

                    if (login.success) {
                        await modular.Services['artemisa'].UpdateInfo({
                            FullName: fullName,
                            Birthdate: birthdate
                        }, login.data);

                        var id = await modular.Services['artemisa'].GetInfo('_id', login.data);

                        req.session.Token = login.data;
                        req.session.ID = id.data;
                        
                        modular.Response.Send(res, true, {}, '¡Registro completo! Revisa tu correo, te hemos enviado un código de confirmación.', '/redir/register.html');
                    } else {
                        modular.Response.Send(res, false, {}, data.caption);
                    }
                } else {
                    modular.Response.Send(res, false, {}, data.caption);
                }
            } catch (error) {
                modular.Response.Send(res, false, {}, 'Ocurrió un error al intentar el registro. Intente más tarde.');
            }
        }
    }

    post_validate(req, res, next) {
        console.log(req.body);
        var code = req.body.confirmationCode;

        modular.Services['artemisa'].Validate(req.session.ID, code)
                                    .then(result => {
                                        res.send(result);
                                    })
                                    .catch(e => {
                                        modular.Response.Send(res, false, {}, 'Ocurrió un error al intentar validar tu usuario. Intente más tarde.');
                                    });
    }

    get_users(req, res, next) {
        var userName = req.body.UserName;
        var email = req.body.Email;
        var phone = req.body.Phone;
        var id = req.body.id;

        // TODO...
        modular.Response.Send(res, true, {}, 'En construcción.');
    }

    get_user(req, res, next) {
        modular.Response.Send(res, true, {}, 'En construcción.');
    }
}

module.exports = Module;