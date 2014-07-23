//console.log('PORT:SELECTOR: new', location.href);

var
src = chrome.runtime.getURL('htmlselector.xhtml'),
html = document.documentElement,
iframe = document.createElement('iframe'),
elLoading = document.createElement('div');

iframe.src = src;
iframe.className = 'xbrwsr_ui';
iframe.setAttribute('frameborder', '0');
iframe.setAttribute('style', 'position:fixed;bottom:0;right:0;height:0;border:solid 1px #aaa;box-shadow: -4px -4px 16px 0 rgba(0, 0, 0, 0.4);z-index:100000000000000;');
html.appendChild(iframe);

// Show loading message before we show a prepared frame
elLoading.textContent = 'Loading Visual Selector...'; // TODO i18n
elLoading.setAttribute('style', 'font-size:18px;background-color:#ffd;padding:4px;text-align:center;position:fixed;bottom:0;width:100%;z-index:100000000000000;');
html.appendChild(elLoading);

html.style['overflow-x'] = 'scroll';

addEventListener('message', onMessage, false);

function remove() {
  iframe.parentNode.removeChild(iframe);
  html.style['margin-bottom'] = '0';
  html.style['padding-bottom'] = '0';
  html.style['overflow-x'] = 'auto';

  removeEventListener('message', onMessage, false);
}

function show(height) {
  var heightCss = height + 'px';
  iframe.style.height = heightCss;
  html.style['margin-bottom'] = heightCss;
  html.style['padding-bottom'] = heightCss;

  if(height <= 32) {
    iframe.style.width = '600px';
  } else {
    iframe.style.width = '100%';
  }
  if(elLoading) {
    elLoading.parentNode.removeChild(elLoading);
    elLoading = null;
  }
  // TODO Test visibility of the selector panel. If we are not visible, set
  // higher z-index?
}

var
origin = chrome.runtime.getURL('');
origin = origin.slice(0, origin.length - 1);

function onMessage(event) {
  if(event.origin != origin) {
    return;
  }

  var data = event.data;

  //console.log('PORT:SELECTOR:onMessage:', data.type, data.data);

  switch(data.type) {
    case 'close':
    break;

    case 'load':
    break;

    case 'save':
    break;

    case 'show':
    show(data.data);
    break;
  }
}
