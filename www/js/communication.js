function safeParse(json) {
    if (!json) return undefined;
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

function call(action, method, data, callback) {
    var ajax = new XMLHttpRequest();

    ajax.addEventListener('readystatechange', () => {
        if (ajax.readyState == 4) {
            var parsed = safeParse(ajax.response);
            callback(parsed ? parsed : ajax.response, ajax.status);
        }
    });

    ajax.open(method, `${action}`);
    switch (typeof data) {
        case 'object':
        case 'string':
            ajax.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
            break;
    }
    ajax.send(data);
}

function AJAX(method, url, data, callback) {
    var ajax = new XMLHttpRequest();

    ajax.addEventListener('readystatechange', () => {
        if (ajax.readyState == 4) {
            callback(ajax.response, ajax.status);
        }
    });

    ajax.open(method, url);
    ajax.send(data);
}

function loadScripts(nodes) {
    nodes.forEach(script => {
        var src = script.src;
        if (src != '') {
            AJAX('get', src, {}, (source, code) => {
                if (code == 200) {
                    eval(source);
                }
            });
        } else {
            eval(script.innerHTML);
        }
    });
}

function onMain(content) {
    var container = document.querySelector('main').querySelector('.container');

    if (container) {
        $(container).hide();
        container.innerHTML = content;
        $(container).slideDown();
        try {
            loadScripts(container.querySelectorAll('script'));
        } catch (error) {
            console.error(error);
        }
        return true;
    } else {
        return false;
    }
}

async function spaNav(link) {
    var href = link.getAttribute ? link.getAttribute('href') : link;
    if (href.startsWith('#')) href = href.substr(1);

    return new Promise((resolve, reject) => {
        AJAX('GET', href, {},
        (result, code) => {
            if (code != 200) {
                reject();
                return;
            }
            if (onMain(result)) {
                window.location.hash = href;
                resolve();
                loadEverything();
            } else {
                reject();
            }
        });
    });
}

function showLoader() {
    onMain('<div class="spinner-border text-success"></div>');
}

function hideLoader() {
    var loader = document.querySelector('main')
                         .querySelector('.container')
                         .querySelector('.spinner-border');

    if (loader) {
        loader.remove();
    }
}