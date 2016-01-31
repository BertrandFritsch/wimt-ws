
//************** aggregate-root API

export function push(title, url, key) {
  window.history.pushState({ key: key }, title, `#${url}`);
}
