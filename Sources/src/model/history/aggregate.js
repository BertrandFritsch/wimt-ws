
//************** aggregate-root API

export function push(title, url, key) {
  window.history.pushState({ key: key }, title, `#${url}`);
}

export function replace(title, url, key) {
  window.history.replaceState({ key: key }, title, `#${url}`);
}
