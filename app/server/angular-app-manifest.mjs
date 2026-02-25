
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 18824, hash: 'f29935a65ae180af700da40583d3ff012a068b7d2ecf1b98abd0fd604d7e9c74', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 990, hash: '32c1af7348bb092a77825c715d8614cf2caa4831a784050b551e7f160a2df725', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 30451, hash: 'd4b6df2bbdb6591189e31621cd9fd296e00b41d043ccc80e1612bafe1ed1da21', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-ZV2JMBAQ.css': {size: 33787, hash: '9McuqTj75PY', text: () => import('./assets-chunks/styles-ZV2JMBAQ_css.mjs').then(m => m.default)}
  },
};
