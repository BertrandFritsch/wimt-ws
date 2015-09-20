/**
 * Created by Bertrand on 19/09/2015.
 */

/**
 * @name HTMLElement
 * @class Extension of the standard HTMLElement class.
 */

/**
 * Sets a style attribute.
 * @function
 * @param {string} name The name of the style attribute.
 * @param {string} value The value of the style attribute.
 *
 */
HTMLElement.prototype.setStyle = function(name, value) {

  this.style[name] = value;
}

/**
 * Sets several style attributes at once.
 * @function
 * @param {property bag} styles A property bag containing the style attributes to set.
 *
 */
HTMLElement.prototype.setStyles = function(styles) {

  var style = this.style;
  for (var s in styles) {

    if (s[0] != '_') {

      style[s] = styles[s];
    }
  }
}

/**
 * Resets a style attribute.
 * @function
 * @param {string} name The name of the style attribute.
 *
 */
HTMLElement.prototype.resetStyle = function(name) {

  this.style[name] = '';
}

/**
 * Resets several style attributes at once.
 * @function
 * @param {array} names The list of style attributes to reset.
 *
 */
HTMLElement.prototype.resetStyles = function(names) {

  var style = this.style;
  names.forEach(function(e) {

    style[e] = '';
  });
}

// classList workaround
HTMLElement.prototype.classListAdd = function (cl) {

  if (!this.classListContains(cl))
    this.className += ' ' + cl;
}

HTMLElement.prototype.classListContains = function (cl) {

  return (' ' + this.className + ' ').indexOf(' ' + cl + ' ') != -1;
}

HTMLElement.prototype.classListRemove = function (cl) {

  var eltcl = ' ' + this.className + ' ';
  var tmp = ' ' + cl + ' ';
  var pos = eltcl.lastIndexOf(tmp);
  if (pos != -1)
    this.className = eltcl.substr(0, pos + 1) + eltcl.substr(pos + tmp.length);
}

HTMLElement.prototype.classListToggle = function (cl) {

  if (this.classListContains(cl)) {

    this.classListRemove(cl);

    return false;
  } else {

    this.classListAdd(cl);

    return true;
  }
}

HTMLElement.prototype.classListSet = function (cl, state) {

  if (state) {

    if (!this.classListContains(cl)) {

      this.classListAdd(cl);
    }
  } else {

    if (this.classListContains(cl)) {

      this.classListRemove(cl);
    }
  }
}
