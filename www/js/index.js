function makeid(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    if (i == 0) {
      result += characters.charAt(Math.floor(Math.random() * (charactersLength - 10)));
    } else {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
  }
  return result;
}

function loadEverything() {

  var navigation = document.querySelectorAll('a');
  navigation.forEach((link) => {
    var spa = link.getAttribute('fullpage') == null || link.getAttribute('fullpage') == undefined;
    var valid = link.getAttribute('href') != null && !link.getAttribute('href').startsWith('#');

    if (spa && valid) {
      link.onclick = (event) => {
        event.preventDefault();
        showLoader();
        window.spaData = safeParse(event.currentTarget.getAttribute('data-transfer'));

        spaNav(link).catch(() => {
          onMain(`<div class="card bg-light text-dark">
                    <div class="card-body">No encontramos la página que buscas.</div>
                  </div>`);
        });
      };
    }
  });

  var forms = document.querySelectorAll('form');
  forms.forEach((form) => {
    var target = form.target;

    if (target == 'api') {
      form.target = '_self';
      form.onsubmit = (event) => {
        event.preventDefault();
        tinyMCE.triggerSave();

        let form = event.currentTarget;
        let action = event.currentTarget.action;
        let method = event.currentTarget.method;

        var data;
        if (form.enctype == 'multipart/form-data') {
          data = new FormData(form);
        } else {
          data = {};
          let tempFData = new FormData(form);
          for (let element of tempFData.entries()) {
            let name = element[0];
            let value = element[1];

            data[name] = value;
          }
          data = JSON.stringify(data);
        }

        call(action, method, data, (result, code) => {
          if (code == 200) {
            if (result.success) {
              showModal('Showcase', result.caption);
              if (result.next) {
                spaNav(result.next);
              }
            } else {
              showModal('Showcase', result.caption);
            }
          } else {
            showModal('Showcase', 'Ocurrió un error al enviar tu información. Intente más tarde.');
          }
        });
      };
    }
  });

  var imgs = document.querySelectorAll('cardo');
  imgs.forEach((img) => {
    var src = img.getAttribute('img');
    var footer = img.getAttribute('footer');
    var header = img.getAttribute('header');

    var foot = '';
    var head = '';

    if (footer) {
      foot = `<span class="card-text" style="
                font-size: small;
                max-width: 320px;
                display: block;
            "><i>${footer}</i></span>`
    }
    if (header) {
      head = `<h4 style="text-align:center">${header}</h4>`;
    }


    var code = `<div class="float-lg-right mx-auto" style="width:fit-content;padding:1.5em">
                <div class="card" style="width:fit-content">
                  ${head}
                  <img class="card-img-top align-self-center rounded-lg" src="${src}" alt="Card image">
                  <div class="card-body" style="padding: 0">
                  ${foot}
                  </span>
                  </div>
                </div></div>`
    
    img.outerHTML = code;
  });

  var ajaxed = document.querySelectorAll('ajax');
  ajaxed.forEach(element => {
    var action = element.getAttribute('href');
    var onload = element.getAttribute('onload');
    var onerror = element.getAttribute('onerror');
    var data = {};

    for (let x = 0; x < element.attributes.length; x++) {
        var attribute = element.attributes.item(x);

        if (attribute.name == name) continue;

        data[attribute.name] = attribute.value;
    }

    showLoader(element);
    $.get(`/${action}`, data, (content, xhr) => {
        if (xhr != 'success') {
            if (onerror) {
                eval(onerror);
            }
        } else {
            element.outerHTML = content;
            if (onload) eval(onload);
        }
        hideLoader(element);
    });
  });

  tinymce.init({
    selector: 'textarea.editor',
    language: 'es_MX',
    plugins: [
      'table',
      'searchreplace',
      'save',
      'preview',
      'paste',
      'media',
      'lists',
      'link',
      'image',
      'imagetools',
      'hr',
      'help',
      'emoticons',
      'autosave'
    ],
    images_upload_url: '/image',
    height: 480
  });

  M.AutoInit();
}

/**
 * Element object example:
 * {
 *  type: 'divider' / 'menu',
 *  caption: 'Menu text',
 *  children: [
 *    ... element object
 *  ]
 * }
 * @param {Array} elements Array of element objects.
 */
function showMenu(elements, x, y) {
  window.menuEvents = {};
  var lis = [];
  elements.forEach((element) => {
    var elementId = makeid(8);
    switch (element.type) {
      case 'divider':
        lis.push(`<li class="divider"></li>`);
        break;
      case 'menu':
        if (element.children) {
          if (element.children.length > 0) {
            var sublis = [];
            element.children.forEach((child) => {
              var subElementId = makeid(8);
              sublis.push(`<li><a tabindex="-1" href="#" class="dropdown-item" id="${subElementId}">${child.caption}</a></li>`);
              menuEvents[subElementId] = child.event;
            });
            lis.push(`<li class="dropdown-submenu">
                      <a tabindex="-1" href="#" class="dropdown-item" id="${elementId}">${element.caption}</a>
                      <ul class="dropdown-menu">
                        ${sublis}
                      </ul>
                    </li>`);
            break;
          }
        }
        lis.push(`<li><a tabindex="-1" href="#" class="dropdown-item" id="${elementId}">${element.caption}</a></li>`);
        break;
    }
    menuEvents[elementId] = element.event;
  });

  var contextId = makeid(8);
  var code = `<div id="${contextId}" class="dropdown clearfix" style="position:absolute; z-index:10;">
                <ul class="dropdown-menu" role="menu" aria-labelledby="dropdownMenu" style="display:block;position:static;margin-bottom:5px;">
                  ${lis.join('\n')}
                </ul>
              </div>`;

  var context = $(code).appendTo(document.body);
  context[0].style.left = x + 'px';
  context[0].style.top = y + 'px';

  menuEvents['menu'] = context;
  menuEvents['hash'] = window.location.hash;

  var buttons = document.querySelector(`#${contextId}`).querySelectorAll('a');
  buttons.forEach(button => {
    button.onclick = (event) => {
      var ev = menuEvents[event.currentTarget.id];
      if (ev) ev(event);
      menuEvents.menu.remove();
      delete menuEvents;
      event.preventDefault();
    };
  });

  return contextId;
}


function showModal(header, content, options = []) {
  var modalId = makeid(8);

  var oCode = '<button type="button" class="btn btn-default" data-dismiss="modal">Cerrar</button>';
  if (options.length > 0) {
    window.modalOptions = {};
    oCode = '';

    options.forEach(option => {
      //[{ caption: 'Cerrar', event: true}]
      option.id = makeid(8);
      oCode += `<button id="${option.id}" type="button" class="btn btn-default">${option.caption}</button>`
      window.modalOptions[option.id] = option;
    });
  }

  var code = `<div id="${modalId}" class="modal fade" role="dialog">
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" style="float: right;">&times;</button>
                    <h5 class="modal-title" style="float: left;">${header}</h5>
                  </div>
                  <div class="modal-body">
                    <p>${content}</p>
                  </div>
                  <div class="modal-footer">
                    ${oCode}
                  </div>
                </div>
              </div>
            </div>`;
  var modal = $(code).appendTo(document.body);
  modal[0].querySelectorAll('button')
          .forEach((btn) => {
            btn.onclick = (event) => {
              if (window.modalOptions) {
                var md = document.querySelector(`#${modalId}`);
                var ev = window.modalOptions[event.currentTarget.id].event;

                if (ev) ev(md);
                $(md).modal('hide');
                md.remove();
              }
            };
          });
  modal.modal();
}

window.onload = () => {
  loadEverything();

  if (window.location.hash != '') {
    spaNav(window.location.hash);
  } else {
    spaNav('content/loading.html');
  }
}

window.onhashchange = () => {
  if (window.location.hash != '') {
    spaNav(window.location.hash);
  } else {
    window.location.href = '/';
  }
}