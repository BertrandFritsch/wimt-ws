
if (!Array.prototype.last) {

  Array.prototype.last = function (arg1) {

    return this[this.length - 1];
  }
}

/// returns the first item satisfying the predicat
/// return the provided default value if no such item exists
Array.prototype.firstOrDefault = function (predicat, defaultValue) {

  var len = this.length;
  for (var i = 0; i < len; ++i) {

    var item = this[i];
    if (predicat(item)) return item;
  }

  return defaultValue;
}

Array.prototype.mapMany = function (collectionSelector, resultSelector) {

  resultSelector || (resultSelector = function (a, b) { return b });
  var result = [];
  var len = this.length;
  for (var i = 0; i < len; ++i) {

    var item = this[i];
    collectionSelector(item).forEach(function (e) { result.push(resultSelector(item, e)) });
  }

  return result;
}

/// removes the duplicated items
Array.prototype.unique = function () {

  var result = [];
  for (var i = 0; i < this.length; ++i) {

    var item = this[i];
    for (var j = 0; j < result.length && item != result[j]; ++j)
      ;

    if (j == result.length) {

      result.push(item);
    }
  }

  return result;
}

/// empties the array
Array.prototype.empty = function () {

  this.splice(0, this.length);
}

/// removes the specified item
Array.prototype.erase = function (item) {

  var i = this.indexOf(item);
  if (i > -1) {

    this.splice(i, 1);
  }
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
