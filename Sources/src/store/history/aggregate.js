
//************** aggregate-root API

export function push(title, url) {
  window.history.pushState({}, title, `#${url}`);
}
