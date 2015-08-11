'use strict';

/**
 * @fileOverview This file implements the Genero layout rules (a.k.a. grid layout).
 * <p>The API is exposed through the {@link GridLayout} module.</p>
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

/**
 * @namespace Exposes the grid layout API.
 * Expects finding in the DOM tree an element with the gGridLayoutRoot id.
 * The layout will be done on the gGridLayoutRoot-rooted subtree.
 * <p>All the API functions, but {@link GridLayout.InvalidLayout}, are mainly called by the CSF module when the DOM tree is updated.
 * The {@link GridLayout.InvalidLayout} function might be called by the component authors when the component layout is updated
 * outside a server-initiated updating phase of the DOM tree.</p>
 * <p>Component authors might subscribe to the onAfterLayout CSF event to be informed when the layout has been updated.</p>
 */
var GridLayout = (function() {

  var validJSONObject = function(elementId, attributeName, jo, expectedProperties) {

    for (var prop in jo) {

      if (prop[0] != '_') {

        if (expectedProperties.indexOf(prop) == -1) {

          gDEV && log('layout: unexpected property: \'' + prop + '\' - element: \'' + elementId + '\' - attribute: \'' + attributeName + '\'');
        }
      }
    }
  }

  var getAncestorByClass  = function(elt, className) {

    for (var parent = elt.parentNode ; parent && !parent.classListContains(className); parent = parent.parentNode)
      ;

    return parent;
  }

  var getAncestorByTagName = function(element, tagName) {

    for (var parent = element.parentNode; parent && parent.tagName.toLowerCase() != tagName; parent = parent.parentNode)
      ;

    return parent;
  }

  var isAncestorOf = function(element, ancestor, rootElement) {

    for (var parent = element.parentNode; parent && parent != ancestor && parent != rootElement; parent = parent.parentNode)
      ;

    return parent == ancestor;
  }

  var hasUncles = function(element, rootElement) {

    for ( ; element && element != rootElement && !element.previousElementSibling && !element.nextElementSibling; element = element.parentNode)
      ;

    return element != rootElement;
  }

  var JSONEvalWithEmpty = function(data) {

    if (!data) return {};

    var o = '{' + data.replace(/,\s*$/, '') + '}';
    try {

      return JSON.parse(o);
    }
    catch (ex) {

      error('data-g-layout-xxx attribute evaluation error:', o, tk.formatException(ex));
    }

    return {};
  }

	/**
	 * @namespace Grid length unit enumeration.
	 */
  var GridLengthUnit = {

  	/**
		 * Auto element.
		 */
  	Auto: 1,

  	/**
		 * Fixed container.
		 */
  	FixedContainer: 2,

  	/**
		 * Stretchable container.
		 */
  	StretchableContainer: 3,

  	/**
		 * Fixed element.
		 */
  	Pixel: 4,

  	/**
		 * Stretchable element.
		 */
  	Star: 5
}

	/**
	 * @namespace Exposes the grid length API.
	 */
  var GridLength = (function() {

  	/**
		 * @class Represents a length of an element in a grid which is composed by a minimal length,
		 * an extent length and a value indicating whether the element accepts extra space.
		 * @param {Number} minLength The minimal length.
		 * @param {Number} extentLength The extent length.
		 * @param {bool} hasSpecifiedMinLength A value indicating whether the minLength has been specified or has been determined dynamically.
		 * @param {GridLengthUnit} unit The {@link GridLayout-GridLengthUnit} value.
		 */
    var GridLength = function (minLength, extentLength, hasSpecifiedMinLength, unit) {

    	/**
			 * The minimal length.
			 * @type Number
			 */
      this.minLength = minLength;

    	/**
			 * The extent length.
			 * @type Number
			 */
      this.extentLength = extentLength || 0;

    	/**
			 * A value indicating whether the minLength has been specified or has been determined dynamically.
			 * @type bool
			 */
      this.hasSpecifiedMinLength = !!hasSpecifiedMinLength;

    	/**
			 * The {@link GridLayout-GridLengthUnit} value.
			 * @type GridLayout-GridLengthUnit
			 */
      this.unit = unit;
    }

  	/**
		 * Compares two {@link GridLayout-GridLength-GridLength} objects.
		 * @memberOf GridLayout-GridLength-GridLength.prototype
		 * @name equals
		 * @function
		 * @param {GridLayout-GridLength-GridLength} other The second {@link GridLayout-GridLength-GridLength} object to compare to.
		 * @returns {bool} A value indicating whether the current object is equal to the second one.
		 */
    GridLength.prototype.equals = function(other) { return this.unit == other.unit && this.minLength == other.minLength && this.extentLength == other.extentLength };

  	/**
		 * Increases the minimal length.
		 * @memberOf GridLayout-GridLength-GridLength.prototype
		 * @name add
		 * @function
		 * @param {Number} length The length to increase the minimal length.
		 */
    GridLength.prototype.add = function(length) { this.minLength += length };

  	/**
		 * Gets a value indicating whether this grid length is for a auto element.
		 * @memberOf GridLayout-GridLength-GridLength.prototype
		 * @name isAuto
		 * @function
		 */
    GridLength.prototype.isAuto = function() { return this.unit == GridLengthUnit.Auto };

  	/**
		 * Gets a value indicating whether this grid length is for a stretchable container.
		 * @memberOf GridLayout-GridLength-GridLength.prototype
		 * @name isStretchableContainer
		 * @function
		 */
    GridLength.prototype.isStretchableContainer = function() { return this.unit == GridLengthUnit.StretchableContainer };

  	/**
		 * Gets a value indicating whether this grid length is for a fixed container.
		 * @memberOf GridLayout-GridLength-GridLength.prototype
		 * @name isFixedContainer
		 * @function
		 */
    GridLength.prototype.isFixedContainer = function() { return this.unit == GridLengthUnit.FixedContainer };

  	/**
		 * Gets a value indicating whether this grid length is for a container.
		 * @memberOf GridLayout-GridLength-GridLength.prototype
		 * @name isContainer
		 * @function
		 */
    GridLength.prototype.isContainer = function() { return this.unit == GridLengthUnit.FixedContainer || this.unit == GridLengthUnit.StretchableContainer };

  	/**
		 * Gets a value indicating whether this grid length is for a fixed element.
		 * @memberOf GridLayout-GridLength-GridLength.prototype
		 * @name isPixel
		 * @function
		 */
    GridLength.prototype.isPixel = function() { return this.unit == GridLengthUnit.Pixel };

  	/**
		 * Gets a value indicating whether this grid length is for a stretchable element.
		 * @memberOf GridLayout-GridLength-GridLength.prototype
		 * @name isStar
		 * @function
		 */
    GridLength.prototype.isStar = function() { return this.unit == GridLengthUnit.Star };

    return {

    	/**
			 * Creates a stretchable grid length.
			 * @param {Number} minLength The minimal length.
			 * @param {Number} extentLength The extent length.
			 * @param {bool} hasSpecifiedMinLength A value indicating whether the minLength has been specified or has been determined dynamically.
			 */
      createStar: function(minLength, extentLength, hasSpecifiedMinLength) { return new GridLength(minLength, extentLength, hasSpecifiedMinLength, GridLengthUnit.Star); },

    	/**
			 * Creates a fixed grid length.
			 * @param {Number} minLength The minimal length.
			 * @param {Number} extentLength The extent length.
			 * @param {bool} hasSpecifiedMinLength A value indicating whether the minLength has been specified or has been determined dynamically.
			 */
      createPixel: function(minLength, extentLength, hasSpecifiedMinLength) { return new GridLength(minLength, extentLength, hasSpecifiedMinLength, GridLengthUnit.Pixel); },

    	/**
			 * Creates a grid length for a fixed container.
			 * @param {Number} minLength The minimal length.
			 * @param {Number} extentLength The extent length.
			 */
      createFixedContainer: function(minLength, extentLength) { return new GridLength(minLength, extentLength, false, GridLengthUnit.FixedContainer); },

    	/**
			 * Creates a grid length for a stretchable container.
			 * @param {Number} minLength The minimal length.
			 * @param {Number} extentLength The extent length.
			 * @param {bool} hasSpecifiedMinLength A value indicating whether the minLength has been specified or has been determined dynamically.
			 */
      createStretchableContainer: function(minLength, extentLength) { return new GridLength(minLength, extentLength, false, GridLengthUnit.StretchableContainer); },

    	/**
			 * Gets a {@link GridLayout-GridLength} instance for a auto element.
			 */
      Auto: new GridLength(0, 0, false, GridLengthUnit.Auto),

    	/**
			 * Gets a {@link GridLayout-GridLength} instance for a stretchable container.
			 */
      StretchableContainer: new GridLength(0, 0, false, GridLengthUnit.StretchableContainer),

    	/**
			 * Gets a {@link GridLayout-GridLength} instance for a fixed container.
			 */
      FixedContainer: new GridLength(0, 0, false, GridLengthUnit.FixedContainer)
    }
  } ());

	/**
	 * @namespace Size policy enumeration.
	 */
  var SizePolicy = {

  	/**
		 * The size of the element depends on its content only.
		 */
    All: 1,

  	/**
		 * The size of the element is the size of its initial content.
		 */
    AllInitial: 1 | 2,

  	/**
		 * According to its content, the size of the element can shrink compared to the size given by the form defintion file.
		 */
    CanShrink: 4,

  	/**
		 * According to its initial content, the size of the element can shrink compared to the size given by the form defintion file.
		 */
    CanShrinkInitial: 4 | 8,

  	/**
		 * According to its content, the size of the element can grow compared to the size given by the form defintion file.
		 */
    CanGrow: 16,

  	/**
		 * According to its initial content, the size of the element can grow compared to the size given by the form defintion file.
		 */
    CanGrowInitial: 16 | 32,

  	/**
		 * The size of the element depends on the size given by the form definition file only.
		 */
    Fixed: 64,

  	/**
		 * The size of the element are merged with the information provided by the container.
		 */
    Container: 128
  }

	/**
	 * @namespace Exposes the layout policy API.
	 */
  var LayoutPolicy = (function() {

  	/**
		 * @class Represents an association of a {@link GridLayout-GridLength-GridLength} instance
		 * and a {@link GridLayout-SizePolicy} instance.
		 * @param {GridLayout-GridLength} value The value of the policy.
		 * @param {GridLayout-SizePolicy} policy The {@link GridLayout-SizePolicy} value.
		 */
  	var LayoutPolicy = function(value, policy) {

  		/**
			 * The {@link GridLayout-GridLength-GridLength} value.
			 */
      this.value = value;

  		/**
			 * The {@link GridLayout-SizePolicy} value.
			 */
      this.policy = policy;
    }

  	/**
		 * Converts the size policy to a fixed one.
		 * @memberOf GridLayout-LayoutPolicy-LayoutPolicy.prototype
		 * @name fix
		 * @function
		 */
  	LayoutPolicy.prototype.fix = function() { this.policy = SizePolicy.Fixed }

  	/**
		 * Gets a value indicating whether the size policy is {@link GridLayout-SizePolicy.All}.
		 * @memberOf GridLayout-LayoutPolicy-LayoutPolicy.prototype
		 * @name isAll
		 * @function
		 */
  	LayoutPolicy.prototype.isAll = function() { return (this.policy & SizePolicy.All) != 0 }

  	/**
		 * Gets a value indicating whether the size policy is {@link GridLayout-SizePolicy.AllInitial}.
		 * @memberOf GridLayout-LayoutPolicy-LayoutPolicy.prototype
		 * @name isAllInitial
		 * @function
		 */
  	LayoutPolicy.prototype.isAllInitial = function() { return (this.policy & SizePolicy.AllInitial) != 0 }

  	/**
		 * Gets a value indicating whether the size policy is {@link GridLayout-SizePolicy.CanShrink}.
		 * @memberOf GridLayout-LayoutPolicy-LayoutPolicy.prototype
		 * @name isCanShrink
		 * @function
		 */
  	LayoutPolicy.prototype.isCanShrink = function() { return (this.policy & SizePolicy.CanShrink) != 0 }

  	/**
		 * Gets a value indicating whether the size policy is {@link GridLayout-SizePolicy.CanShrinkInitial}.
		 * @memberOf GridLayout-LayoutPolicy-LayoutPolicy.prototype
		 * @name isCanShrinkInitial
		 * @function
		 */
  	LayoutPolicy.prototype.isCanShrinkInitial = function() { return (this.policy & SizePolicy.CanShrinkInitial) != 0 }

  	/**
		 * Gets a value indicating whether the size policy is {@link GridLayout-SizePolicy.CanGrow}.
		 * @memberOf GridLayout-LayoutPolicy-LayoutPolicy.prototype
		 * @name isCanGrow
		 * @function
		 */
  	LayoutPolicy.prototype.isCanGrow = function() { return (this.policy & SizePolicy.CanGrow) != 0 }

  	/**
		 * Gets a value indicating whether the size policy is {@link GridLayout-SizePolicy.CanGrowInitial}.
		 * @memberOf GridLayout-LayoutPolicy-LayoutPolicy.prototype
		 * @name isCanGrowInitial
		 * @function
		 */
  	LayoutPolicy.prototype.isCanGrowInitial = function() { return (this.policy & SizePolicy.CanGrowInitial) != 0 }

  	/**
		 * Gets a value indicating whether the size policy is {@link GridLayout-SizePolicy.Fixed}.
		 * @memberOf GridLayout-LayoutPolicy-LayoutPolicy.prototype
		 * @name isFixed
		 * @function
		 */
  	LayoutPolicy.prototype.isFixed = function() { return this.policy == SizePolicy.Fixed }

  	/**
		 * Gets a value indicating whether the size policy is {@link GridLayout-SizePolicy.Container}.
		 * @memberOf GridLayout-LayoutPolicy-LayoutPolicy.prototype
		 * @name isContainer
		 * @function
		 */
  	LayoutPolicy.prototype.isContainer = function() { return this.policy == SizePolicy.Container }

  	/**
		 * Gets a value indicating whether the size policy is one of the initial-based ones.
		 * @memberOf GridLayout-LayoutPolicy-LayoutPolicy.prototype
		 * @name isInitial
		 * @function
		 */
    LayoutPolicy.prototype.isInitial = function() { return this.policy == SizePolicy.AllInitial
                                                                || this.policy == SizePolicy.CanShrinkInitial
                                                                || this.policy == SizePolicy.CanGrowInitial }

    var parseLayoutPolicyHint = function(value) {

      /* syntax: [ <N> ][ px ][ * ]
       *  - N : a number
       *  - * : stretchable
       *  - width px: N is a number of pixels
       *  - w/o px  : N is a number of characters
       */

      if (!value) return { hasStar: false, isPixel: true, size: 0 };

      if (typeof value == 'number') return { hasStar: false, isPixel: false, size: value };

      var hasStar = value[value.length - 1] == '*';
      var l = hasStar ? 1 : 0;
      var isPixel = value.length > 2 + l && value[value.length - l - 2] == 'p' && value[value.length - l - 1] == 'x';
      l += isPixel ? 2 : 0;
      var size = (value.length - l > 0) ? parseInt(value.substring(0 , value.length - l)) : 0;

      return { hasStar: hasStar, isPixel: isPixel, size: size };
    }

    var parseLayoutLength = function(value) {

      /* syntax: <N>[ <U> ]
       *  - N: a number
       *  - U: the unit, defaults to px
       */

      if (typeof value == 'number') return  { value: value, unit: 'px' };

      var m = value.match(/(\d+)(\D+)?/);
      return { value: m[1] ? parseInt(m[1], 10) : 0, unit: m[2] ? m[2] : 'px' };
    }

    var parseLayoutPolicy = function(policy) {

      switch (policy) {

        case 'AllInitial': return SizePolicy.AllInitial;
        case 'CanShrink': return SizePolicy.CanShrink;
        case 'CanShrinkInitial': return SizePolicy.CanShrinkInitial;
        case 'CanGrow': return SizePolicy.CanGrow;
        case 'CanGrowInitial': return SizePolicy.CanGrowInitial;
        case 'Fixed': return SizePolicy.Fixed;
        case 'Container': return SizePolicy.Container;

        default: return SizePolicy.All;
      }
    }

    var _sizes = {};

    var _measureElement = null;

    var sizeOfElement = function(wantWidth, size, fontSize, fontFamily) {

      var axe = wantWidth ? 'widths' : 'heights';
      var aSize = null;
      var aAxe = null;
      var aFontSize = null;
      var aFontFamily = _sizes[fontFamily];
      if (aFontFamily) {

        aFontSize = aFontFamily[fontSize];
        if (aFontSize) {

          aAxe = aFontSize[axe];
          if (aAxe) {

            aSize = aAxe[size];
            if (!aSize) {

              aSize = aAxe[size] = { };
            }
          }
          else {

            aAxe = aFontSize[axe] = { };
            aSize = aAxe[size] = { };
          }
        }
        else {

          aFontSize = aFontFamily[fontSize] = { };
          aAxe = aFontSize[axe] = { };
          aSize = aAxe[size] = { };
        }
      }
      else {

        aFontFamily = _sizes[fontFamily] = { };
        aFontSize  = aFontFamily[fontSize] = { };
        aAxe = aFontSize[axe] = { };
        aSize = aAxe[size] = { };
      }

      var res = aSize[size];
      if (res != undefined) {

        return res;
      }
      else {

        if (!_measureElement) {

          _measureElement = document.createElement('div');
          _measureElement.setStyles({ 'visibility': 'hidden', 'position': 'absolute' });
          document.body.insertBefore(_measureElement, document.body.firstChild);
        }

        _measureElement.setStyles({ fontFamily: fontFamily, fontSize: fontSize });

        if (wantWidth) {

          var str = "";
          for (var i = 0; i < Math.min(6, size); ++i) {

            str += 'M';
          }

          for (var i = 6; i < size; ++i) {

            str += '0';
          }

          _measureElement.textContent = str;

          // add 7 pixels: to match the width needed for an input with just a 'W' character
          return (aSize[size] = _measureElement.getBoundingClientRect().width + 7);
        }
        else {

          _measureElement.textContent = 'X';

          // add 4 pixels: to match the height needed for an input with borders and paddings
          return (aSize[size] = Math.max(20, _measureElement.getBoundingClientRect().height * size + 4));
        }
      }
    }

    return {

    	/**
			 * Resolves policy hints given throught the data-g-layout-policy attribute.
			 * @param {DOM element} element The element to which the policy data is bound to.
			 * @param {object} policyData The data-g-layout-policy attribute value converted into a Javascript property bag.
			 */
    	resolvePolicyHints: function(element, policyData) {

        var fontSize = null;
        var fontFamily = null;

        var widthPolicy = parseLayoutPolicy(policyData && policyData.widthPolicy);
        var widthPixels = 0;
        var widthHintData = parseLayoutPolicyHint(policyData && policyData.widthHint);
        var widthIsStar = widthHintData.hasStar;

        if (widthPolicy != SizePolicy.All && widthPolicy != SizePolicy.AllInitial && policyData) {

          widthHintData.isPixel && (widthPixels = widthHintData.size);

          if (!widthHintData.isPixel && widthHintData.size > 0) {

            fontSize || (fontSize = window.getComputedStyle(element).fontSize);
            fontFamily || (fontFamily = window.getComputedStyle(element).fontFamily);
            widthPixels = sizeOfElement(true, widthHintData.size, fontSize, fontFamily);
            //widthPixels = element.getBoundingClientRect().width;
          }
        }

        var heightPolicy = parseLayoutPolicy(policyData && policyData.heightPolicy);
        var heightPixels = 0;
        var heightHintData = parseLayoutPolicyHint(policyData && policyData.heightHint);
        var heightIsStar = heightHintData.hasStar;
        if (heightPolicy != SizePolicy.All && heightPolicy != SizePolicy.AllInitial && policyData) {

          heightHintData.isPixel && (heightPixels = heightHintData.size);

          if (!heightHintData.isPixel && heightHintData.size > 0) {

            fontSize || (fontSize = window.getComputedStyle(element).fontFamily);
            fontFamily || (fontFamily = window.getComputedStyle(element).fontFamily);
            heightPixels = sizeOfElement(false, heightHintData.size, fontSize, fontFamily);
            //heightPixels = element.getBoundingClientRect().height;
          }
        }

        var minWidth = policyData && policyData.minWidth != undefined
          ? parseLayoutLength(policyData.minWidth)
          : undefined;

        if (minWidth && minWidth.unit != 'px') {

          // TODO: delegate the conversion of the value to the component...
        }

        var minHeight = policyData && policyData.minHeight != undefined
          ? parseLayoutLength(policyData.minHeight)
          : undefined;

        if (minHeight && minHeight.unit != 'px') {

          // TODO: delegate the conversion of the value to the component...
        }

        return {
                  widthPolicy: new LayoutPolicy(widthIsStar ? GridLength.createStar(minWidth ? minWidth.value : widthPixels, minWidth ? Math.max(0, widthPixels - minWidth.value) : 0, minWidth != undefined) : GridLength.createPixel(minWidth ? minWidth.value : widthPixels, minWidth ? Math.max(0, widthPixels - minWidth.value) : 0, minWidth != undefined), widthPolicy),
                  heightPolicy: new LayoutPolicy(heightIsStar ? GridLength.createStar(minHeight ? minHeight.value : heightPixels, minHeight ? Math.max(0, heightPixels - minHeight.value) : 0, minHeight != undefined) : GridLength.createPixel(minHeight ? minHeight.value : heightPixels, minHeight ? Math.max(0, heightPixels - minHeight.value) : 0, minHeight != undefined), heightPolicy)
               };
      },

    	/**
			 * Creates a {@link GridLayout-LayoutPolicy-LayoutPolicy} instance for a container.
			 * @param {GridLayout-GridLength-GridLength} gridLength The {@link GridLayout-GridLength-GridLength} data.
			 */
    	createForContainer: function(gridLength) { return new LayoutPolicy(gridLength, SizePolicy.All) },

    	/**
			 * Creates a {@link GridLayout-LayoutPolicy-LayoutPolicy} instance for a fixed element.
			 * @param {GridLayout-GridLength-GridLength} gridLength The {@link GridLayout-GridLength-GridLength} data.
			 */
    	createFixed: function(gridLength) { return new LayoutPolicy(gridLength, SizePolicy.Fixed) },

    	/**
			 * Gets a {@link GridLayout-LayoutPolicy-LayoutPolicy} instance for a auto element.
			 */
    	Auto: new LayoutPolicy(GridLength.Auto, SizePolicy.All)
    }
  } ());

  var parseLayoutItem = function(element) {

  	var data = JSONEvalWithEmpty(element.getAttribute("data-g-layout-item"));
  	gDEV && validJSONObject(element.id, 'data-g-layout-item', data, ['row', 'column', 'rowSpan', 'columnSpan', 'isEmpty', 'isGhost', 'isXSpacer', 'isYSpacer', 'hasContent']);
  	return data;
  }

  var createLayoutItemDataData = function(data) {

    return {
      minWidth: 0,
      minHeight: 0,
      extentWidth: 0,
      extentHeight: 0,
      widthPolicy: LayoutPolicy.Auto,
      heightPolicy: LayoutPolicy.Auto,
      horizontalStretching: false,
      verticalStretching: false,
      deferSizing: null,
      itemMinWidth: 0,
      itemMinHeight: 0,
      policyElementMinWidth: 0,
      policyElementMinHeight: 0,
      columns: null,
      rows: null,

      row: data.row != undefined ? data.row : 0,
      column: data.column != undefined ? data.column : 0,
      rowSpan: data.rowSpan != undefined ? data.rowSpan : 1,
      columnSpan: data.columnSpan != undefined ? data.columnSpan : 1,
      isEmpty: data.isEmpty != undefined ? data.isEmpty : false,
			isGhost: data.isGhost != undefined ? data.isGhost : false,
      isXSpacer: data.isXSpacer != undefined ? data.isXSpacer : false,
      isYSpacer: data.isYSpacer != undefined ? data.isYSpacer : false,
      isSpaceHolder: data.isSpaceHolder != undefined ? data.isSpaceHolder : false,
      hasContent: data.hasContent != undefined ? !!data.hasContent : false
    }
  }

  var applySizePolicyConstraints =  function(itemData) {

    if (itemData.policyElement) {

      switch (itemData.data.widthPolicy.policy) {

        case SizePolicy.Fixed:
        case SizePolicy.Container:
          itemData.policyElement.style.width = itemData.data.widthPolicy.value.minLength + (itemData.extentMeasured ? itemData.data.widthPolicy.value.extentLength : 0) + 'px';
          break;

        case SizePolicy.CanShrink:
        case SizePolicy.CanShrinkInitial:
          itemData.policyElement.style.maxWidth = itemData.data.widthPolicy.value.minLength + 'px';
          break;

        case SizePolicy.CanGrow:
        case SizePolicy.CanGrowInitial:
          itemData.policyElement.style.minWidth = itemData.data.widthPolicy.value.minLength + 'px';
          break;
      }

      switch (itemData.data.heightPolicy.policy) {

        case SizePolicy.Fixed:
        case SizePolicy.Container:
          itemData.policyElement.style.height = itemData.data.heightPolicy.value.minLength + (itemData.extentMeasured ? itemData.data.heightPolicy.value.extentLength : 0) + 'px';
          break;

        case SizePolicy.CanShrink:
        case SizePolicy.CanShrinkInitial:
          itemData.policyElement.style.maxHeight = itemData.data.heightPolicy.value.minLength + 'px';
          break;

        case SizePolicy.CanGrow:
        case SizePolicy.CanGrowInitial:
          itemData.policyElement.style.minHeight = itemData.data.heightPolicy.value.minLength + 'px';
          break;
      }
    }
  }

  var removeSizePolicyConstraints = function(itemData) {

    if (itemData.policyElement) {

      switch (itemData.data.widthPolicy.policy) {

        case SizePolicy.Fixed:
        case SizePolicy.Container:
          itemData.policyElement.resetStyle("width");
          break;

        case SizePolicy.CanShrink:
        case SizePolicy.CanShrinkInitial:
          itemData.policyElement.resetStyle("maxWidth");
          break;

        case SizePolicy.CanGrow:
        case SizePolicy.CanGrowInitial:
          itemData.policyElement.resetStyle("minWidth");
          break;
      }

      switch (itemData.data.heightPolicy.policy) {

        case SizePolicy.Fixed:
        case SizePolicy.Container:
          itemData.policyElement.resetStyle("height");
          break;

        case SizePolicy.CanShrink:
        case SizePolicy.CanShrinkInitial:
          itemData.policyElement.resetStyle("maxHeight");
          break;

        case SizePolicy.CanGrow:
        case SizePolicy.CanGrowInitial:
          itemData.policyElement.resetStyle("minHeight");
          break;
      }
    }
  }

  var prepareMeasuringMinSizes = function(items, autoLayout) {

    // apply size policy contraints
    items.forEach(function(itemData) {

      autoLayout || clearItemSize(itemData);
      if (itemData.policyElement) {

        if (!itemData.policyElement.layoutData) {

          applySizePolicyConstraints(itemData);
        }
        else if (!itemData.hasSingleContent) {

          var s = itemData.policyElement.layoutData.desiredSize();
          itemData.policyElement.setStyles({
            minWidth: s.width + 'px',
            minHeight: s.height + 'px'
          });
        }
        else if (!itemData.substituteItems) {

          itemData.policyElement.setStyles({
            width: '0px',
            height: '0px'
          });
        }
      }
    });
  }

  var measureMinSizes = function(items) {

    // measure items min sizes
  	items.forEach(function(itemData) {

  		if (itemData.substituteItems) {

  			itemData.substituteItems.measureHandler(itemData);
  		}

  		var size = itemData.item.getBoundingClientRect();
  		size = { width: Math.ceil(size.width), height: Math.ceil(size.height) };
  		var policyElementSize = { width: 0, height: 0 };
  		if (itemData.policyElement) {

  			if (!itemData.policyElement.layoutData || !itemData.hasSingleContent) {

  				var s = itemData.policyElement.getBoundingClientRect();
  				policyElementSize.width = Math.ceil(s.width);
  				policyElementSize.height = Math.ceil(s.height);
  			}
  			else {

  				policyElementSize = itemData.childContainer.layoutData.desiredSize();
  			}
  		}

  		//gDEV && log('layout - item DS, id: ' + itemData.item.id + ', w:' + size.width + ', h:' + size.height);
  		//gDEV && policyElementSize && log('layout - policy DS, id: ' + itemData.policyElement.id + ', w:' + policyElementSize.width + ', h:' + policyElementSize.height);

  		if ((itemData.data.widthPolicy.isAll() || itemData.data.widthPolicy.isCanGrow()) && itemData.data.widthPolicy.value.hasSpecifiedMinLength && !itemData.data.deferSizing && itemData.policyElement) {

  			switch (itemData.data.widthPolicy.policy) {

  				case SizePolicy.All:
  				case SizePolicy.AllInitial:
  					itemData.data.widthPolicy.value.extentLength = size.width - itemData.data.widthPolicy.value.minLength;
  					break;

  				case SizePolicy.CanGrow:
  				case SizePolicy.CanGrowInitial:
  					itemData.data.widthPolicy.value.extentLength = Math.max(itemData.data.widthPolicy.value.extentLength, size.width - itemData.data.widthPolicy.value.minLength);
  					break;
  			}

  			itemData.data.policyElementMinWidth = itemData.data.widthPolicy.value.minLength;
  			itemData.data.itemMinWidth = size.width - policyElementSize.width;
  		}
  		else {

  			itemData.data.policyElementMinWidth = policyElementSize.width;
  			itemData.data.itemMinWidth = itemData.policyElement && itemData.policyElement.layoutData && itemData.hasSingleContent ? size.width : size.width - itemData.data.policyElementMinWidth;
  			!itemData.data.deferSizing && (itemData.data.widthPolicy.value.minLength = policyElementSize.width);
  		}

  		if ((itemData.data.heightPolicy.isAll() || itemData.data.heightPolicy.isCanGrow()) && itemData.data.heightPolicy.value.hasSpecifiedMinLength && !itemData.data.deferSizing && itemData.policyElement) {

  			switch (itemData.data.heightPolicy.policy) {

  				case SizePolicy.All:
  				case SizePolicy.AllInitial:
  					itemData.data.heightPolicy.value.extentLength = size.height - itemData.data.heightPolicy.value.minLength;
  					break;

  				case SizePolicy.CanGrow:
  				case SizePolicy.CanGrowInitial:
  					itemData.data.heightPolicy.value.extentLength = Math.max(itemData.data.heightPolicy.value.extentLength, size.height - itemData.data.heightPolicy.value.minLength);
  					break;
  			}

  			itemData.data.policyElementMinHeight = itemData.data.heightPolicy.value.minLength;
  			itemData.data.itemMinHeight = size.height - policyElementSize.height;
  		}
  		else {

  			itemData.data.policyElementMinHeight = policyElementSize.height;
  			itemData.data.itemMinHeight = itemData.policyElement && itemData.policyElement.layoutData && itemData.hasSingleContent ? size.height : size.height - itemData.data.policyElementMinHeight;
  			!itemData.data.deferSizing && (itemData.data.heightPolicy.value.minLength = policyElementSize.height);
  		}

  		if (!itemData.childContainer && itemData.data.itemMinWidth == 0) {

  			itemData.data.extentWidth = itemData.data.widthPolicy.value.extentLength;
  		}

  		if (!itemData.childContainer && itemData.data.itemMinHeight == 0) {

  			itemData.data.extentHeight = itemData.data.heightPolicy.value.extentLength;
  		}
    });
  }

  var prepareMeasuringDesiredSizes = function(extentItems) {

    extentItems.forEach(function (itemData) {

      if (itemData.policyElement) {

        itemData.extentMeasured = true;

        if (itemData.policyElement.layoutData) {

          itemData.policyElement.setStyles({
            minWidth: itemData.data.widthPolicy.value.minLength + itemData.data.widthPolicy.value.extentLength + 'px',
            minHeight: itemData.data.heightPolicy.value.minLength + itemData.data.heightPolicy.value.extentLength + 'px'
          });
        }
        else {

          applySizePolicyConstraints(itemData);
        }
      }
    });
  }

  var measureDesiredSizes = function(extentItems) {

    // measure items extent sizes
    extentItems.forEach(function(itemData) {

      var size = itemData.item.getBoundingClientRect();
      itemData.data.extentWidth = size.width - (itemData.data.itemMinWidth + itemData.data.policyElementMinWidth);
      itemData.data.extentHeight = size.height - (itemData.data.itemMinHeight + itemData.data.policyElementMinHeight);
    });
  }

  var finishMeasuring = function(items) {

    // remove size policy contraints
    items.forEach(function(itemData) {

      if (itemData.policyElement) {

        if (itemData.policyElement.layoutData) {

          (itemData.extentMeasured || !itemData.hasSingleContent) && itemData.policyElement.resetStyles(['minWidth', 'minHeight']);
        }
        else {

          removeSizePolicyConstraints(itemData);
        }

        if (itemData.hasSingleContent) {

          itemData.data.extentWidth = itemData.data.widthPolicy.value.extentLength;
          itemData.data.extentHeight = itemData.data.heightPolicy.value.extentLength;

          itemData.data.policyElementMinWidth = itemData.data.widthPolicy.value.minLength;
          itemData.data.policyElementMinHeight = itemData.data.heightPolicy.value.minLength;
        }

        itemData.extentMeasured = false;
      }

      if (!itemData.data.deferSizing && itemData.data.widthPolicy.isInitial()) {

        itemData.data.widthPolicy.fix();
      }

      if (!itemData.data.deferSizing && itemData.data.heightPolicy.isInitial()) {

        itemData.data.heightPolicy.fix();
      }

      itemData.data.minWidth = itemData.data.itemMinWidth + itemData.data.policyElementMinWidth;
      itemData.data.minHeight = itemData.data.itemMinHeight + itemData.data.policyElementMinHeight;

      itemData.refreshStatus = 0;
      itemData.isRemoved = false;
    });
  }

  var clearItemSize = function(itemData) {

    itemData.item.resetStyles(['left', 'top', 'width', 'height']);

    if (itemData.policyElement && itemData.policyElement != itemData.item) {

      (itemData.data.horizontalStretching || !itemData.hasSingleContent) && (itemData.policyElement.style.width = '');
      (itemData.data.verticalStretching || !itemData.hasSingleContent) && (itemData.policyElement.style.height = '');
    }
  }

  var applyProportionalDistribution = function(items , extraSpace , getWeight) {

    var factor = extraSpace / items.reduce(function(sum, e) { return sum + getWeight(e) }, 0);
    for (var i = 0 ; i < items.length ; ++i) {

      items[i].length += getWeight(items[i]) * factor;
    }
  }

  var applyEquallyDistribution = function(items , extraSpace , getValue , setValue) {

    var avg = (items.reduce(function(sum, e) { return sum + getValue(e) }, 0) + extraSpace) / items.length;

    for (var items2 = items.filter(function (e) { return getValue(e) < avg }); items2.length < items.length; items2 = items.filter(function (e) { return getValue(e) < avg })) {

      // exclude the ones that are greather than the average length
      items = items2;
      avg = (items.reduce(function(sum, e) { return sum + getValue(e) }, 0) + extraSpace) / items.length;
    }

    for (var i = 0; i < items.length; ++i ) {

      setValue(items[i], avg);
    }
  }

  var getAncestorGridLayoutChild = function(element) {

    // get the closest ancestor that is the immediate child of a [data-g-layout-container] element
    for (var parent = element.parentNode; parent && (parent.nodeType != 1 || !parent.hasAttribute("data-g-layout-container")); element = parent, parent = parent.parentNode)
      ;

    return parent && element;
  }

  var location = function(itemData, ref) {

  	var x = ref.columnData.slice(ref.columnOrigin, itemData.data.column).reduce(function(sum, e) { return sum + e.length }, 0);
  	x += ref.columnData[itemData.data.column].startSpacing;

  	var y = ref.rowData.slice(ref.rowOrigin, itemData.data.row).reduce(function(sum, e) { return sum + e.length }, 0);
  	y += ref.rowData[itemData.data.row].startSpacing;

  	return { x: x - ref.leftOrigin - ref.columnData[ref.columnOrigin].startSpacing, y: y - ref.topOrigin - ref.rowData[ref.rowOrigin].startSpacing };
  }

  var slot = function(itemData, ref) {

  	var w = itemData.data.columns.reduce(function(sum, e) { return sum + e.length }, 0);
  	w -= ref.columnData[itemData.data.column].startSpacing + ref.columnData[itemData.data.column + itemData.data.columnSpan - 1].endSpacing;

  	var h = itemData.data.rows.reduce(function(sum, e) { return sum + e.length }, 0);
  	h -= ref.rowData[itemData.data.row].startSpacing + ref.rowData[itemData.data.row + itemData.data.rowSpan - 1].endSpacing;

  	return { width: w, height: h };
  }

  var applySizes = function(items, ref) {

  	items.forEach(function(itemData) {

  		if (itemData.substituteItems) {

  			itemData.substituteItems.arrangeHandler(itemData, ref.columnData, ref.rowData);
  		}

  		var loc = location(itemData, ref),
					size = slot(itemData, ref);

  		itemData.item.setStyles({
  			left: loc.x + 'px',
  			top: loc.y + 'px',
  			width: size.width + 'px',
  			height: size.height + 'px'
  		});

  		if (itemData.policyElement && itemData.policyElement != itemData.item) {

  			itemData.data.horizontalStretching && (itemData.policyElement.style.width = itemData.data.policyElementMinWidth + (size.width - itemData.data.minWidth) + 'px');
  			itemData.data.verticalStretching && (itemData.policyElement.style.height = itemData.data.policyElementMinHeight + (size.height - itemData.data.minHeight) + 'px');
  		}

  		if (itemData.data.isScrollView && itemData.childContainer && itemData.childContainer == itemData.policyElement.firstElementChild) {

				// by construction, if isScrollView is true, there is a policyElement too
  			// assume the child of the policy element is a container
  			var desiredSize = itemData.childContainer.layoutData.desiredSize();
  			var needHorizontalScrollBar = size.width < desiredSize.width;
  			var needVerticalScrollBar = size.height < desiredSize.height;

  			var computedStyles = window.getComputedStyle(itemData.policyElement);
  			var actualOverflowX = computedStyles.overflowX;
  			var actualOverflowY = computedStyles.overflowY;

  			var expectedOverflowX = '';
  			var expectedOverflowY = '';

  			var applyOverflows = function() {

  				if (actualOverflowX != expectedOverflowX || actualOverflowY != expectedOverflowY) {

  					itemData.policyElement.setStyles({
  						overflowX: expectedOverflowX,
  						overflowY: expectedOverflowY
  					});

  					actualOverflowX = expectedOverflowX;
  					actualOverflowY = expectedOverflowY;
  				}
  			}

  			if (needHorizontalScrollBar && !needVerticalScrollBar) {

  				expectedOverflowX = 'scroll';
  				expectedOverflowY = 'hidden';

  				applyOverflows();
  				if (itemData.policyElement.clientHeight < desiredSize.height) {

  					expectedOverflowY = 'scroll';
  				}
				}
  			else if (!needHorizontalScrollBar && needVerticalScrollBar) {

  				expectedOverflowX = 'hidden';
  				expectedOverflowY = 'scroll';

  				applyOverflows();
  				if (itemData.policyElement.clientWidth < desiredSize.width) {

  					expectedOverflowX = 'scroll';
  				}
				}

  			if (needHorizontalScrollBar && needVerticalScrollBar) {

  				expectedOverflowX = 'scroll';
  				expectedOverflowY = 'scroll';
  			}

  			applyOverflows();
			}
  	});
  }

	/**
	 * @class Data structure bound to a layout container.
	 *<p>Attaches itself to the provided DOM element through the dataLayout property.</p>
	 */
  var LayoutData = function(container, storedSettings) {

  	var createLayoutItemData = function(item, data) {

  		var itemData = {
  			item: item,
  			policyElement: undefined,
  			data: data,
  			hasSingleContent: true,
  			childContainer: null,
  			substituteItems: null,
  			isInParent: false,
  			refreshStatus: data.isEmpty ? 0 : 1, // 0 => Ok, 1 => new, 2 => dirty
  			extentMeasured: false,
  			isRemoved: false
  		}

  		if (itemData.data.isGhost) {

  			item.classListAdd('gLayoutGhostItem');
  		}

  		return itemData;
  	}

    container.layoutData = this;
    var data = JSONEvalWithEmpty(container.getAttribute("data-g-layout-container"));
    gDEV &&  validJSONObject(container.id, 'data-g-layout-container', data, ['showDebugGrid', 'gridChildrenInParent', 'horizontalSpacing', 'verticalSpacing', 'horizontalBubbling', 'verticalBubbling', 'autoLayout']);

    var _showDebugGrid = data.showDebugGrid != undefined ? data.showDebugGrid : false;
    var _gridChildrenInParent = data.gridChildrenInParent != undefined ? data.gridChildrenInParent : false;
    var _horizontalSpacing = data.horizontalSpacing != undefined ? data.horizontalSpacing : 0;
    var _verticalSpacing = data.verticalSpacing != undefined ? data.verticalSpacing : 0;
    var _horizontalBubbling = data.horizontalBubbling != undefined ? data.horizontalBubbling : true;
    var _verticalBubbling = data.verticalBubbling != undefined ? data.verticalBubbling : true;
    var _autoLayout = data.autoLayout != undefined ? data.autoLayout : false;
    var _parentItem = null;
    var _gridWidth = GridLength.Auto;
    var _gridHeight = GridLength.Auto;
    var _deferSizing = false;
    var _desiredSize = {width: 0, height: 0};
    var _extentSize = {width: 0, height: 0};
    var _usedSize = {width: 0, height: 0};
    var _usedExtentSize = {width: 0, height: 0};
    var _columnData = null;
    var _rowData = null;
    var _extentColumns = null;
    var _extentRows = null;
    var _items = Array.prototype.map.call(container.children, function(child) { return createLayoutItemData(child, createLayoutItemDataData(parseLayoutItem(child))) });

    var _filledItems = null;
    var _childContainers = null;
    var _stretchableColumns = null;
    var _hasStaredColumns = false;
    var _stretchableRows = null;
    var _hasStaredRows = false;
    var _areColumnsFrozen = false;
    var _areRowsFrozen = false;
    var _refreshStatus = 1;

    if (_autoLayout) {

      // add the attribute element to enable the ability to apply specific styles to the auto-layout content
      container.setAttribute('data-g-layout-container-auto', '');
    }

    var getChildContainers = function() {

      return _childContainers || (_childContainers = _items.filter(function(itemData) { return itemData.childContainer })
                                                           .map(function(itemData) { return itemData }));
    }

    var setUpRCData = function() {

    	//gDEV && log( 'layout: setUpRCData container - ' + container.id);
    	var columnUpperBound = _items.reduce(function(max, itemData) { return Math.max(max, itemData.data.column + itemData.data.columnSpan) }, 0);
    	var storedColumnLengths = storedSettings && storedSettings.getColumnLengths();
    	if (storedColumnLengths && storedColumnLengths.length != columnUpperBound) {

    		storedSettings.resetColumnLengths();
    		storedColumnLengths = null;
    	}

    	_areColumnsFrozen = _areColumnsFrozen || !!storedColumnLengths;

    	if (!_columnData || _columnData.length != columnUpperBound) {

    		_columnData = new Array(columnUpperBound);
    	}
    	else {

    		for (var c = 0; c < _columnData.length; ++c) {

    			_columnData[c].items.empty();
    			_columnData[c].desiredLength = GridLength.createPixel(0);
    			!_areColumnsFrozen && (_columnData[c].length = 0);
    			_columnData[c].weight = 1;
    			_columnData[c].startSpacing = 0;
    			_columnData[c].endSpacing = 0;
				}
    	}

    	var rowUpperBound = _items.reduce(function(max, itemData) { return Math.max(max, itemData.data.row + itemData.data.rowSpan) }, 0);
    	var storedRowLengths = storedSettings && storedSettings.getRowLengths();
    	if (storedRowLengths && storedRowLengths.length != rowUpperBound) {

    		storedSettings.resetRowLengths();
    		storedRowLengths = null;
    	}

    	_areRowsFrozen = _areRowsFrozen || !!storedRowLengths;

    	if (!_rowData || _rowData.length != rowUpperBound) {

    		_rowData = new Array(rowUpperBound);
    	}
    	else {

    		for (var r = 0; r < _rowData.length; ++r) {

    			_rowData[r].items.empty();
    			_rowData[r].desiredLength = GridLength.createPixel(0);
    			!_areRowsFrozen && (_rowData[r].length = 0);
    			_rowData[r].weight = 1;
    			_rowData[r].startSpacing = 0;
    			_rowData[r].endSpacing = 0;
				}
    	}

      _filledItems = _items.filter(function(itemData) { return !itemData.data.isEmpty });

      _items.forEach(function (item) {

        for (var c = item.data.column; c < item.data.column + item.data.columnSpan; ++c) {

        	var data = _columnData[c];
        	if (!data) {

        		data = _columnData[c] = {
        			items: [],
        			desiredLength: GridLength.createPixel(0),
        			length: _areColumnsFrozen && storedColumnLengths ? storedColumnLengths[c] : 0,
        			weight: 1,
        			startSpacing: 0,
        			endSpacing: 0
        		}
        	}
        	else if (_areColumnsFrozen && storedColumnLengths) {

        		data.length = storedColumnLengths[c];
        	}

        	data.items.push(item);
        }

        item.data.columns = _columnData.slice(item.data.column, item.data.column + item.data.columnSpan);

        for (var r = item.data.row; r < item.data.row + item.data.rowSpan; ++r) {

        	var data = _rowData[r];
        	if (!data) {

        		data = _rowData[r] = {
        			items: [],
        			desiredLength: GridLength.createPixel(0),
        			length: _areRowsFrozen && storedRowLengths ? storedRowLengths[r] : 0,
        			weight: 1,
        			startSpacing: 0,
        			endSpacing: 0
        		}
        	}
        	else if (_areRowsFrozen && storedRowLengths) {

        		data.length = storedRowLengths[r];
        	}

        	data.items.push(item);
        }

        item.data.rows = _rowData.slice(item.data.row, item.data.row + item.data.rowSpan);
      });

      for (var i = 0; i < _columnData.length; ++i) {

      	if (!_columnData[i]) {

      		_columnData[i] = {
      			items: [],
      			desiredLength: GridLength.createPixel(0),
      			length: 0,
      			weight: 1,
      			startSpacing: 0,
      			endSpacing: 0
      		}
      	}
      	else if (_columnData[i].items.length == 0) {

      		_columnData[i].length = 0;
      	}
      }

      for (var i = 0; i < _rowData.length; ++i) {

      	if (!_rowData[i]) {

      		_rowData[i] = {
      			items: [],
      			desiredLength: GridLength.createPixel(0),
      			length: 0,
      			weight: 1,
      			startSpacing: 0,
      			endSpacing: 0
      		}
      	}
      	else if (_rowData[i].items.length == 0) {

      		_rowData[i].length = 0;
      	}
      }

      // identify the stared columns
      // 1. use the columns that contain stared items
      var stretchableColumns = _columnData.filter(function (c) { return c.items && c.items.some(function (i) { return i.data.widthPolicy.value.isStar() }) });
      _hasStaredColumns = stretchableColumns.length > 0;

      if (!_hasStaredColumns) {

        // 2. use the columns that contain x-spacer items
        stretchableColumns = _items.filter(function(e) { return e.data.isXSpacer })
                                    .mapMany(function(e) { return e.data.columns });
        if (!stretchableColumns.length > 0) {

          // 3. use the columns that contain container items
          stretchableColumns = _columnData.filter(function(c) { return c.items.some(function(i) { return i.data.widthPolicy.value.isStretchableContainer() }) });
        }
      }
      
      _stretchableColumns = stretchableColumns;
      _stretchableColumns.forEach(function(c) { c.desiredLength = GridLength.createStar(0) });

      // identify the stared rows
    	// 1. use the rows that contain stared items
    	//    but that contain no no-stared items
    	//    or, if there are none, that contain other stared items
			//    or, if there are none, all the stared item rows
      var stretchableRows = _filledItems
                              .filter(function(i) { return i.data.heightPolicy.value.isStar() })
                              .map(function(i) { return { item: i, srs: i.data.rows.filter(function(r) { return !r.items.some(function(i) { return !i.data.heightPolicy.value.isStar() }) }) } })
				                      .map(function(x) { return { item: x.item, srs: x.srs.length > 0 ? x.srs : x.item.data.rows.filter(function(r) { return r.items.some(function(i) { return i != x.item && i.data.heightPolicy.value.isStar() }) }) } })
                              .mapMany(function(x) { return x.srs.length > 0 ? x.srs : x.item.data.rows })
                              .unique();
      _hasStaredRows = stretchableRows.length > 0;

      if (!_hasStaredRows)
      {
        // 2. use the rows that contain y-spacer items
        stretchableRows = _items
                            .filter(function(e) { return e.data.isYSpacer })
                            .mapMany(function(e) { return e.data.rows });

        if (!stretchableRows.length > 0)
        {
          // 3. use the rows that contain container items
        	//    but that contain no no-container items
        	//    or, if there are none, that contain other container items
        	//    or, if there are none, all the stared item rows
        	stretchableRows = _filledItems
                              .filter(function(i) { return i.data.heightPolicy.value.isStretchableContainer() })
                              .map(function(i) { return { item: i, srs: i.data.rows.filter(function(r) { return !r.items.some(function(i) { return !i.data.heightPolicy.value.isStar() }) }) } })
				                      .map(function(x) { return { item: x.item, srs: x.srs.length > 0 ? x.srs : x.item.data.rows.filter(function(r) { return r.items.some(function(i) { return i != x.item && i.data.heightPolicy.value.isStar() }) }) } })
                              .mapMany(function(x) { return x.srs.length > 0 ? x.srs : x.item.data.rows })
                              .unique();
                              
          // 4. use the rows that has content
		  if (!stretchableRows.length > 0) {

              stretchableRows = _rowData.filter(function(r) { return r.items.some(function(i) { return i.data.hasContent }) });
		  }
        }
      }

      
      _stretchableRows = stretchableRows;
      _stretchableRows.forEach(function(r) { r.desiredLength = GridLength.createStar(0) });
      updateItemContainerData();
    	//gDEV && log( 'layout: setUpRCData container end - ' + container.id);
    }

    var updateItemContainerData = function() {

      if (_parentItem) {

        var layoutData = _parentItem.parentNode.layoutData;

        var gridWidth = !_horizontalBubbling ? GridLength.createFixedContainer(_desiredSize.width, _extentSize.width)
                                              : _hasStaredColumns ? GridLength.createStar(_desiredSize.width, _extentSize.width)
                                                                  : GridLength.createStretchableContainer(_desiredSize.width, _extentSize.width);
        var gridHeight = !_verticalBubbling ? GridLength.createFixedContainer(_desiredSize.height, _extentSize.height)
                                            : _hasStaredRows ? GridLength.createStar(_desiredSize.height, _extentSize.height)
		                                                     : _stretchableRows.length ? GridLength.createStretchableContainer(_desiredSize.height, _extentSize.height)
		                                                                               : GridLength.createFixedContainer(_desiredSize.height, _extentSize.height);

        var deferSizing = _filledItems.some(function(i) { return i.data.deferSizing });

        if (!_gridWidth.equals(gridWidth) || !_gridHeight.equals(gridHeight) || _deferSizing != deferSizing) {

          _gridWidth = gridWidth;
          _gridHeight = gridHeight;
          _deferSizing = deferSizing;
          layoutData.addLayoutContainer(_parentItem, container, LayoutPolicy.createForContainer(_gridWidth), LayoutPolicy.createForContainer(_gridHeight), _deferSizing);
        }
      }
    }

    var moveSpace = function(data, space, moving) {

    	var spaceMoved = false;
    	while (space > 0) {

    		var length = 0;
    		for (; moving.shrunkIndex != moving.shrunkIndexLimit; moving.shrunkIndex += moving.shrunkIndexProgression) {

    			length = Math.min(space, data[moving.shrunkIndex].length - data[moving.shrunkIndex].desiredLength.minLength);
    			if (length > 0) {

    				break;
    			}
    		}

    		if (length == 0) {

    			// no column or row could be found to be shrunk
    			break;
    		}

    		data[moving.shrunkIndex].items.some(function(i) { return !i.data.isEmpty }) && (data[moving.shrunkIndex].desiredLength.extentLength = (data[moving.shrunkIndex].length - data[moving.shrunkIndex].desiredLength.minLength) - length);
    		data[moving.shrunkIndex].length -= length;
    		data[moving.grownIndex].items.some(function(i) { return !i.data.isEmpty }) && (data[moving.grownIndex].desiredLength.extentLength = (data[moving.grownIndex].length - data[moving.grownIndex].desiredLength.minLength) + length);
    		data[moving.grownIndex].length += length;
    		space -= length;
    		moving.shrunkIndex += moving.shrunkIndexProgression;
    		spaceMoved = true;
    	}

    	return spaceMoved;
    }

    var moveItem = function(itemData, delta) {

    	//gDEV && log('layout: move item - ' + container.id);

    	var moving = {
    		shrunkIndex: 0,
    		shrunkIndexProgression: 0,
    		shrunkIndexLimit: 0,
    		grownIndex: 0,
    		grownIndexProgression: 0,
    		grownIndexLimit: 0
    	}

    	if (itemData.data.column == 0 || itemData.data.column + itemData.data.columnSpan == _columnData.length) {

    		delta.x = 0;
    	}

    	if (delta.x < 0) {

    		moving.shrunkIndex = itemData.data.column - 1;
    		moving.shrunkIndexProgression = -1;
    		moving.shrunkIndexLimit = -1;
    		moving.grownIndex = itemData.data.column + itemData.data.columnSpan;
    		moving.grownIndexProgression = 1;
    		moving.grownIndexLimit = _columnData.length;
    	}
    	else if (delta.x > 0) {

    		moving.shrunkIndex = itemData.data.column + itemData.data.columnSpan;
    		moving.shrunkIndexProgression = 1;
    		moving.shrunkIndexLimit = _columnData.length;
    		moving.grownIndex = itemData.data.column - 1;
    		moving.grownIndexProgression = -1;
    		moving.grownIndexLimit = -1;
    	}

    	var spaceMoved = moveSpace(_columnData, Math.abs(delta.x), moving);
    	_areColumnsFrozen || (_areColumnsFrozen = spaceMoved); 

    	if (itemData.data.row == 0 || itemData.data.row + itemData.data.rowSpan == _rowData.length) {

    		delta.y = 0;
    	}

    	if (delta.y < 0) {

    		moving.shrunkIndex = itemData.data.row - 1;
    		moving.shrunkIndexProgression = -1;
    		moving.shrunkIndexLimit = -1;
    		moving.grownIndex = itemData.data.row + itemData.data.rowSpan;
    		moving.grownIndexProgression = 1;
    		moving.grownIndexLimit = _rowData.length;
    	}
    	else if (delta.y > 0) {

    		moving.shrunkIndex = itemData.data.row + itemData.data.rowSpan;
    		moving.shrunkIndexProgression = 1;
    		moving.shrunkIndexLimit = _rowData.length;
    		moving.grownIndex = itemData.data.row - 1;
    		moving.grownIndexProgression = -1;
    		moving.grownIndexLimit = -1;
    	}

    	var b = moveSpace(_rowData, Math.abs(delta.y), moving);
    	_areRowsFrozen || (_areRowsFrozen = b);
    	spaceMoved |= b;

    	if (spaceMoved) {

    		if (delta.x != 0) {

    			_extentColumns = _columnData.filter(function(c) { return c.desiredLength.extentLength > 0 });
    			_usedExtentSize.width = _extentSize.width = _extentColumns.reduce(function(sum, e) { return sum + e.desiredLength.extentLength }, 0);

    			if (storedSettings) {

    				storedSettings.setColumnLengths(_columnData.map(function(e) { return e.length }));
    			}
    		}

    		if (delta.y != 0) {

    			_extentRows = _rowData.filter(function(r) { return r.desiredLength.extentLength > 0 });
    			_usedExtentSize.height = _extentSize.height = _extentRows.reduce(function(sum, e) { return sum + e.desiredLength.extentLength }, 0);

    			if (storedSettings) {

    				storedSettings.setRowLengths(_rowData.map(function(e) { return e.length }));
    			}
				}

    		_refreshStatus = 3;

    		GridLayout.resize();
    	}
    }

    var dispatchDesiredSizes = function() {

      _columnData.forEach(function (c) {
                  	c.desiredLength.minLength = c.items.some(function (i) { return !i.data.isEmpty && !i.data.isGhost }) ? _horizontalSpacing : 0;
                    c.desiredLength.extentLength = 0;
                    c.startSpacing = 0,
                    c.endSpacing = 0
                  });

      if (_horizontalSpacing > 0) {

        // ensure that spacing pixels separate 2 consecutifs elements at least
        var halfSpacing = _horizontalSpacing / 2;
        for (var i = 0; i < _columnData.length - 1; ++i) {

          var column = _columnData[i];

          // filter columns that are the end column of an item
          if (column.items.some(function(item) { return !item.data.isEmpty && !item.data.isGhost && !item.data.isSpaceHolder && item.data.column + item.data.columnSpan - 1 == i })) {

            // locate the next column that is the start column for an item
            for (var j = i; j < _columnData.length; ++j) {

              var column2 = _columnData[j];
              if (column2.items.some(function(item) { return !item.data.isEmpty && !item.data.isGhost && !item.data.isSpaceHolder && item.data.column == j && (j > i || item.data.columnSpan > 1) })) {

                if (column.endSpacing == 0) {

                  column.endSpacing = halfSpacing;
                  column.desiredLength.add(halfSpacing);
                }

                if (column2.startSpacing == 0) {

                  column2.startSpacing = halfSpacing;
                  column2.desiredLength.add(halfSpacing);
                }

                break;
              }
              else if (j > i && column2.length != 0) {

                // there is already _horizontalSpacing pixels between the two items at least
                break;
              }
            }
          }
        }
      }

      var columns = _filledItems.slice(0);
      columns.sort(function (a, b) { return a.data.columnSpan -  b.data.columnSpan});
      for (var c = 0; c < columns.length; ++c) {

        var item = columns[c].data;
        var itemColumns = item.columns;

        // initialize the weights
        var extraSpace = item.minWidth + item.widthPolicy.value.extentLength - itemColumns.reduce(function (sum, e) { return sum + e.weight }, 0);

        if (extraSpace > 0) {

          applyEquallyDistribution(itemColumns , extraSpace , function(e) { return e.weight } , function(e , v) { e.weight = v });
        }

        // remove the spacing values before and after the item to avoid taking them into account
        itemColumns[0].desiredLength.add(-itemColumns[0].startSpacing);
        itemColumns.last().desiredLength.add(-itemColumns.last().endSpacing);

        var itemWidth = itemColumns.reduce(function(sum, e) { return sum + e.desiredLength.minLength }, 0);
        var requiredSpace = item.minWidth - itemWidth;

        if (requiredSpace > 0)
        {
          // if there are stared columns, dispatch the space over those columns only, otherwise, dispatch the space over all columns
          var rs = itemColumns.filter(function(e) { return e.desiredLength.isStar() });
          var spacingColumns = rs.length > 0 ? rs : itemColumns;
          applyEquallyDistribution(spacingColumns , requiredSpace , function(e) { return e.desiredLength.minLength }, function(e , v) { e.desiredLength.minLength = v });
        }

        // restore the spacing values before and after the item
        itemColumns[0].desiredLength.add(itemColumns[0].startSpacing);
        itemColumns.last().desiredLength.add(itemColumns.last().endSpacing);
      }

      // dispatch desired extent lengths
      for (var c = 0; c < columns.length; ++c) {

        var item = columns[c].data;
        var itemColumns = item.columns;

        // remove the spacing values before and after the item to avoid taking them into account
        itemColumns[0].desiredLength.add(-itemColumns[0].startSpacing);
        itemColumns.last().desiredLength.add(-itemColumns.last().endSpacing);

        var itemExtentColumns = itemColumns.filter(function(c) { return c.desiredLength.isStar() });
        itemExtentColumns.length > 0 || (itemExtentColumns = itemColumns);
        var itemExtentWidth = itemColumns.reduce(function(sum, e) { return sum + e.desiredLength.minLength + e.desiredLength.extentLength }, 0);
        var requiredExtentWidth = item.minWidth + item.extentWidth - itemExtentWidth;

        if (requiredExtentWidth > 0)
        {
          applyEquallyDistribution(itemExtentColumns , requiredExtentWidth , function(e) { return e.desiredLength.extentLength } , function(e , v) { e.desiredLength.extentLength = v });
        }

        // restore the spacing values before and after the item
        itemColumns[0].desiredLength.add(itemColumns[0].startSpacing);
        itemColumns.last().desiredLength.add(itemColumns.last().endSpacing);
      }

      _columnData.forEach(function(c) {

      	var minLength = Math.max(c.items.some(function(i) { return !i.data.isEmpty && !i.data.isGhost }) ? _horizontalSpacing : 0, c.desiredLength.minLength);
      	if (!_areColumnsFrozen || c.length < minLength) {

      		c.length = minLength;
      	}
      	else {

      		c.desiredLength.extentLength = c.length - c.desiredLength.minLength;
      	}
      });

      _rowData.forEach(function(r) {
                  	r.desiredLength.minLength = r.items.some(function(i) { return !i.data.isEmpty && !i.data.isGhost }) ? _verticalSpacing : 0;
                  	r.desiredLength.extentLength = 0;
                  	r.startSpacing = 0,
                    r.endSpacing = 0
                  });

      if (_verticalSpacing > 0) {

        // ensure that spacing pixels separate 2 consecutifs elements at least
        var halfSpacing = _verticalSpacing / 2;
        for (var i = 0; i < _rowData.length - 1; ++i) {

          var row = _rowData[i];

          // filter rows that are the end row of an item
          if (row.items.some(function(item) { return !item.data.isEmpty && !item.data.isGhost && !item.data.isSpaceHolder && item.data.row + item.data.rowSpan - 1 == i })) {

            // locate the next row that is the start row for an item
            for (var j = i; j < _rowData.length; ++j) {

              var row2 = _rowData[j];
              if (row2.items.some(function(item) { return !item.data.isEmpty && !item.data.isGhost && !item.data.isSpaceHolder && item.data.row == j && (j > i || item.data.rowSpan > 1) })) {

                if (row.endSpacing == 0) {

                  row.endSpacing = halfSpacing;
                  row.desiredLength.add(halfSpacing);
                }

                if (row2.startSpacing == 0) {

                  row2.startSpacing = halfSpacing;
                  row2.desiredLength.add(halfSpacing);
                }

                break;
              }
              else if (j > i && row2.length != 0) {

                // there is already _verticalSpacing pixels between the two items at least
                break;
              }
            }
          }
        }
      }

      var rows = _filledItems.slice(0);
      rows.sort(function (a, b) { return a.data.rowSpan -  b.data.rowSpan});
      for (var r = 0; r < rows.length; ++r) {

        var item = rows[r].data;
        var itemRows = item.rows;

        // initialize the weights
        var extraSpace = item.minHeight + item.heightPolicy.value.extentLength - itemRows.reduce(function (sum, e) { return sum + e.weight }, 0);

        if (extraSpace > 0) {

          applyEquallyDistribution(itemRows , extraSpace , function(e) { return e.weight } , function(e , v) { e.weight = v });
        }

        // remove the spacing values before and after the item to avoid taking them into account
        itemRows[0].desiredLength.add(-itemRows[0].startSpacing);
        itemRows.last().desiredLength.add(-itemRows.last().endSpacing);

        var itemHeight = itemRows.reduce(function(sum, e) { return sum + e.desiredLength.minLength }, 0);
        var requiredSpace = item.minHeight - itemHeight;

        if (requiredSpace > 0)
        {
          // if there are stared rows, dispatch the space over those rows only, otherwise, dispatch the space over all rows
          var rs = itemRows.filter(function(e) { return e.desiredLength.isStar() });
          var spacingRows = rs.length > 0 ? rs : itemRows;
          applyEquallyDistribution(spacingRows , requiredSpace , function(e) { return e.desiredLength.minLength }, function(e , v) { e.desiredLength.minLength = v });
        }

        // restore the spacing values before and after the item
        itemRows[0].desiredLength.add(itemRows[0].startSpacing);
        itemRows.last().desiredLength.add(itemRows.last().endSpacing);
      }

      // dispatch desired extent lengths
      for (var r = 0; r < rows.length; ++r) {

        var item = rows[r].data;
        var itemRows = item.rows;

        // remove the spacing values before and after the item to avoid taking them into account
        itemRows[0].desiredLength.add(-itemRows[0].startSpacing);
        itemRows.last().desiredLength.add(-itemRows.last().endSpacing);

        var itemExtentRows = itemRows.filter(function(r) { return r.desiredLength.isStar() });
        itemExtentRows.length > 0 || (itemExtentRows = itemRows);
        var itemExtentHeight = itemRows.reduce(function(sum, e) { return sum + e.desiredLength.minLength + e.desiredLength.extentLength }, 0);
        var requiredExtentHeight = item.minHeight + item.extentHeight - itemExtentHeight;

        if (requiredExtentHeight > 0)
        {
          applyEquallyDistribution(itemExtentRows , requiredExtentHeight , function(e) { return e.desiredLength.extentLength } , function(e , v) { e.desiredLength.extentLength = v });
        }

        // restore the spacing values before and after the item
        itemRows[0].desiredLength.add(itemRows[0].startSpacing);
        itemRows.last().desiredLength.add(itemRows.last().endSpacing);
      }

      _rowData.forEach(function(r) {

      	var minLength = Math.max(r.items.some(function(i) { return !i.data.isEmpty && !i.data.isGhost }) ? _verticalSpacing : 0, r.desiredLength.minLength);
      	if (!_areRowsFrozen || r.length < minLength) {

      		r.length = minLength;
      	}
      	else {

      		r.desiredLength.extentLength = r.length - r.desiredLength.minLength;
      	}
      });

      _desiredSize.width = _columnData.reduce(function(sum, e) { return sum + e.desiredLength.minLength }, 0);
      _desiredSize.height = _rowData.reduce(function(sum, e) { return sum + e.desiredLength.minLength }, 0);

      _usedSize.width = _columnData.reduce(function(sum, e) { return sum + e.length }, 0);
      _usedSize.height = _rowData.reduce(function(sum, e) { return sum + e.length }, 0);

      _extentColumns = _columnData.filter(function(c) { return c.desiredLength.extentLength > 0 });
      _extentRows = _rowData.filter(function(r) { return r.desiredLength.extentLength > 0 });

      _extentSize.width = _extentColumns.reduce(function(sum, e) { return sum + e.desiredLength.extentLength }, 0);
      _extentSize.height = _extentRows.reduce(function(sum, e) { return sum + e.desiredLength.extentLength }, 0);

      _usedExtentSize.width = _usedSize.width - _desiredSize.width;
      _usedExtentSize.height = _usedSize.height - _desiredSize.height;
    }

    var dispatchAvailableSpace = function(width, height) {

      width -= _usedSize.width;
      if (width > 0 && _usedExtentSize.width < _extentSize.width) {

        var w = Math.min(width, _extentSize.width - _usedExtentSize.width);
        if (w > 0) {

          applyProportionalDistribution(_extentColumns , w, function(e) { return e.desiredLength.extentLength });
        }

        width -= w;
        _usedExtentSize.width += w;
        _usedSize.width += w;
      }

      if (width > 0 && _stretchableColumns.length > 0) {

      	applyProportionalDistribution(_stretchableColumns, width, _hasStaredColumns ? function(e) { return e.weight } : _areColumnsFrozen && _stretchableColumns.some(function(e) { return e.length != 0 }) ? function(e) { return e.length } : function(e) { return 1 });
        _usedSize.width += width;
        width -= width;
      }

      if (width < 0 && _stretchableColumns.length > 0 && _usedExtentSize.width == _extentSize.width) {

        var w = -Math.min(-width, _usedSize.width - (_desiredSize.width + _usedExtentSize.width));
        applyProportionalDistribution(_stretchableColumns , w, _hasStaredColumns ? function(e) { return e.weight } : _areColumnsFrozen ? function(e) { return e.length } : function(e) { return 1 });

        width -= w;
        _usedSize.width += w;
      }

      if (width < 0 && _usedExtentSize.width > 0) {

        var w = Math.min(-width, _usedExtentSize.width);
        applyProportionalDistribution(_extentColumns , -w, function(e) { return e.desiredLength.extentLength });

        width += w;
        _usedExtentSize.width -= w;
        _usedSize.width -= w;
      }

      height -= _usedSize.height;
      if (height > 0 && _usedExtentSize.height < _extentSize.height) {

        var h = Math.min(height, _extentSize.height - _usedExtentSize.height);
        if (h > 0) {

          applyProportionalDistribution(_extentRows , h, function(e) { return e.desiredLength.extentLength });
        }

        height -= h;
        _usedExtentSize.height += h;
        _usedSize.height += h;
      }

      if (height > 0 && _stretchableRows.length > 0) {

      	applyProportionalDistribution(_stretchableRows, height, _hasStaredRows ? function(e) { return e.weight } : _areRowsFrozen && _stretchableRows.some(function(e) { return e.length != 0 }) ? function(e) { return e.length } : function(e) { return 1 });
        _usedSize.height += height;
        height -= height;
      }

      if (height < 0 && _stretchableRows.length > 0 && _usedExtentSize.height == _extentSize.height) {

        var h = -Math.min(-height, _usedSize.height - (_desiredSize.height + _usedExtentSize.height));
        applyProportionalDistribution(_stretchableRows, h, _hasStaredRows ? function(e) { return e.weight } : _areRowsFrozen ? function(e) { return e.length } : function(e) { return 1 });

        height -= h;
        _usedSize.height += h;
      }

      if (height < 0 && _usedExtentSize.height > 0) {

        var h = Math.min(-height, _usedExtentSize.height);
        applyProportionalDistribution(_extentRows , -h, function(e) { return e.desiredLength.extentLength });

        height += h;
        _usedExtentSize.height -= h;
        _usedSize.height -= h;
      }
    }

    var showDebugGrid = function() {

    	var debugNode = (function () {

    		if (container.lastElementChild && container.lastElementChild.classListContains('gLayoutDebugGrid')) {

    			return container.lastElementChild;
    		}

    		for (var n = container.firstElementChild; n && !n.classListContains('gLayoutDebugGrid') ; n = n.nextElementSibling)
    			;

    		if (n) {

    			container.removeChild(n);
    		}
    		else {

    			return undefined;
    		}
    	}())
    	var debugColumns = null;
    	var debugRows = null;
    	var addDebugNode = false;

    	if (!debugNode) {

    		addDebugNode = true;
    		debugNode = document.createElement('DIV');
    		debugNode.classListAdd('gLayoutDebugGrid');

    		debugColumns = document.createElement('DIV');
    		debugNode.appendChild(debugColumns);
    		debugColumns.classListAdd('gLayoutDebugColumns');

    		debugRows = document.createElement('DIV');
    		debugNode.appendChild(debugRows);
    		debugRows.classListAdd('gLayoutDebugRows');
			}

    	debugColumns || (debugColumns = debugNode.querySelector('.gLayoutDebugColumns'));
    	debugColumns.innerHTML = '';
    	var left = 0;
    	for (var i = 0; i < _columnData.length; ++i) {

    		var e = document.createElement('DIV');
    		debugColumns.appendChild(e);
    		e.classListAdd('gLayoutDebugColumn');
    		e.setStyles({
					left: left + 'px',
    			width: _columnData[i].length + 'px'
    		});

    		left += _columnData[i].length;
    	}

    	debugRows || (debugRows = debugNode.querySelector('.gLayoutDebugRows'));
    	debugRows.innerHTML = '';
    	var top = 0;
    	for (var i = 0; i < _rowData.length; ++i) {

    		var e = document.createElement('DIV');
    		debugRows.appendChild(e);
    		e.classListAdd('gLayoutDebugRow');
    		e.setStyles({
    			top: top + 'px',
    			height: _rowData[i].length + 'px'
    		});

    		top += _rowData[i].length;
    	}

    	addDebugNode && container.appendChild(debugNode);
    }

    var createSubtituteItemsForGridChildrenInParent = function(itemData) {

    	// create an array of 4 elements to represent the 4 edges arround a gridChildrenInParent container
    	return [
					createLayoutItemData(null, createLayoutItemDataData({ column: itemData.data.column, row: itemData.data.row, isSpaceHolder: true})), // top-left
					createLayoutItemData(null, createLayoutItemDataData({ column: itemData.data.column + itemData.data.columnSpan - 1, row: itemData.data.row + itemData.data.rowSpan - 1, isSpaceHolder: true})) // bottom-right
    	];
    }

    var arrangeItemsForGridChildrenInParent = function(itemData, columnData, rowData) {

    	itemData.childContainer.layoutData.arrangeGridChildrenInParentItems({
    		columnData: columnData,
    		rowData: rowData,
    		columnOrigin: itemData.data.column,
    		rowOrigin: itemData.data.row,
    		leftOrigin: itemData.substituteItems.items[0].data.minWidth,
    		topOrigin: itemData.substituteItems.items[0].data.minHeight
    	});
    }

    var measureSubtituteItemsForGridChildrenInParent = function(itemData) {

    	var itemRect = itemData.item.getBoundingClientRect();
    	var childContainerRect = itemData.childContainer.getBoundingClientRect();

    	itemData.substituteItems.items[0].data.minWidth = childContainerRect.left - itemRect.left;
    	itemData.substituteItems.items[0].data.minHeight = childContainerRect.top - itemRect.top;
    	itemData.substituteItems.items[1].data.minWidth = itemRect.right - childContainerRect.right;
    	itemData.substituteItems.items[1].data.minHeight = itemRect.bottom - childContainerRect.bottom;

    	itemData.data.itemMinWidth = itemRect.width - childContainerRect.width;
    	itemData.data.itemMinHeight = itemRect.height - childContainerRect.height;
    }

    this.attachToParent = function() {

    	if (_parentItem = getAncestorGridLayoutChild(container)) {

        _parentItem.parentNode.layoutData.attachChildContainer(_parentItem, container, _gridChildrenInParent || !hasUncles(container, _parentItem));

				if (!_autoLayout && _gridChildrenInParent) {

					_parentItem.parentNode.layoutData.attachGridChildrenInParentContainer(_parentItem, _items);

					// measuring and sizing is delegated to the parent container
					_refreshStatus = 0;
				}
      }
    }

    this.detach = function() {

    	if (!_autoLayout && _gridChildrenInParent) {

    		_parentItem.parentNode.layoutData.detachGridChildrenInParentContainer(_parentItem, _items);
    	}

    	_parentItem = null;
    }

    this.attachChildContainer = function(item, childContainer, hasSingleContent) {

      if (!_autoLayout) {

        var itemData = _items.firstOrDefault(function(e) { return e.item == item });
        if (itemData) {

          itemData.hasSingleContent = hasSingleContent;
          itemData.childContainer = childContainer;

          _childContainers = null;
        }
      }
    }

    this.attachGridChildrenInParentContainer = function(item, childItems) {

    	var itemData = _items.firstOrDefault(function(e) { return e.item == item });
    	if (itemData) {

    		childItems.forEach(function(i) {

					i.data.column += itemData.data.column;
					i.data.row += itemData.data.row;
					i.isInParent = true;
    		});

    		_items = _items.concat(childItems);

    		// substitute the itemData with space holder items
    		itemData.substituteItems = {
    			items: createSubtituteItemsForGridChildrenInParent(itemData),
    			measureHandler: measureSubtituteItemsForGridChildrenInParent,
    			arrangeHandler: arrangeItemsForGridChildrenInParent
    		}

    		_items = _items.concat(itemData.substituteItems.items);
    	}
    }

    this.detachGridChildrenInParentContainer = function(item, childItems) {

    	var itemData = _items.firstOrDefault(function(e) { return e.item == item });
    	if (itemData) {

    		childItems.forEach(function(itemData) {

    			_items.erase(itemData);
    			itemData.isInParent = false;
    		});

    		itemData.substituteItems.items.forEach(function(itemData) {

    			_items.erase(itemData);
    		});

    		itemData.substituteItems = null;
    	}
    }

    this.updateRefreshStatusForGridChildrenInParent = function(refreshStatus) {

    	_refreshStatus == 1 || (_refreshStatus = refreshStatus);
    }

    this.removeItemsForGridChildrenInParent = function(removedItems) {

    	removedItems.forEach(function(itemData) { _items.erase(itemData) });
    }

    this.addItemForGridChildrenInParent = function(item, childItem) {

    	var itemData = _items.firstOrDefault(function(e) { return e.item == item });
    	if (itemData) {

    		childItem.data.column += itemData.data.column;
    		childItem.data.row += itemData.data.row;
    		childItem.isInParent = true;
    		_items.push(childItem);
    	}
    }

    this.addLayoutItem = function (item, policyElement) {

      if (!_autoLayout) {

        var itemData = _items.firstOrDefault(function(e) { return e.item == item });
        if (itemData) {

          var policyAttr = policyElement.getAttribute("data-g-layout-policy");

          if (policyAttr) {

            if (itemData.policyElement != policyElement || !itemData.data.widthPolicy.isFixed() || !itemData.data.heightPolicy.isFixed()) {

              itemData.policyElement = policyElement;

              var jo = JSONEvalWithEmpty(policyAttr);
              gDEV &&  validJSONObject(policyElement.id, 'data-g-layout-policy', jo, ['widthHint', 'widthPolicy', 'minWidth', 'heightHint', 'heightPolicy', 'minHeight', 'verticalStretching', 'horizontalStretching', 'deferSizing', 'isScrollView']);
              var policy = LayoutPolicy.resolvePolicyHints(policyElement, jo);

              !itemData.data.widthPolicy.isFixed() && (itemData.data.widthPolicy = policy.widthPolicy);
              !itemData.data.heightPolicy.isFixed() && (itemData.data.heightPolicy = policy.heightPolicy);
              itemData.data.horizontalStretching = jo.horizontalStretching != undefined ? jo.horizontalStretching : false;
              itemData.data.verticalStretching = jo.verticalStretching != undefined ? jo.verticalStretching : false;
              itemData.data.deferSizing = itemData.data.deferSizing == null ? (jo.deferSizing != undefined ? jo.deferSizing : false) : itemData.data.deferSizing; // deferSizing may already have been initialized by an the loaded event of an image
              itemData.data.isScrollView = jo.isScrollView != undefined ? jo.isScrollView : false;
              itemData.hasSingleContent = !hasUncles(policyElement, item);
              itemData.refreshStatus = _refreshStatus = 1;
            }
          }
        }
      }
    }

    this.addLayoutContainer = function (item, policyElement, widthPolicy, heightPolicy, deferSizing) {

      if (!_autoLayout) {

        var itemData = _items.firstOrDefault(function(e) { return e.item == item });
        if (itemData) {
        
          var resetRCData = false;

          itemData.policyElement || (itemData.policyElement = policyElement);
          switch (itemData.data.widthPolicy.policy) {

            case SizePolicy.All:
            case SizePolicy.AllInitial:
              resetRCData || (resetRCData = itemData.data.widthPolicy.value.unit != widthPolicy.value.unit);
              itemData.data.widthPolicy = widthPolicy;
              break;

            case SizePolicy.Container:
              resetRCData || (resetRCData = itemData.data.widthPolicy.value.unit != widthPolicy.value.unit);
              itemData.data.widthPolicy.value.unit = widthPolicy.value.unit;
              itemData.data.widthPolicy.value.extentLength = Math.max(itemData.data.widthPolicy.value.extentLength, widthPolicy.value.minLength - itemData.data.widthPolicy.value.minLength + widthPolicy.value.extentLength);
              break;

            case SizePolicy.CanShrink:
            case SizePolicy.CanShrinkInitial:
              if (itemData.data.widthPolicy.value.minLength > widthPolicy.value.minLength || !itemData.data.widthPolicy.value.isStar() && widthPolicy.value.isStar()) {

                itemData.data.widthPolicy.value = itemData.data.widthPolicy.value.isStar() || widthPolicy.value.isStar()
                                                    ? GridLength.createStar(Math.min(itemData.data.widthPolicy.value.minLength, widthPolicy.value.minLength))
                                                    : GridLength.createPixel(Math.min(itemData.data.widthPolicy.value.minLength, widthPolicy.value.minLength));
              }

              itemData.data.widthPolicy.value.extentLength <= widthPolicy.value.extentLength || (itemData.data.widthPolicy.value.extentLength = widthPolicy.value.extentLength);
              break;

            case SizePolicy.CanGrow:
            case SizePolicy.CanGrowInitial:
              if (itemData.data.widthPolicy.value.minLength < widthPolicy.value.minLength || !itemData.data.widthPolicy.value.isStar() && widthPolicy.value.isStar()) {

                itemData.data.widthPolicy.value = itemData.data.widthPolicy.value.isStar() || widthPolicy.value.isStar()
                                                    ? GridLength.createStar(Math.max(itemData.data.widthPolicy.value.minLength, widthPolicy.value.minLength))
                                                    : GridLength.createPixel(Math.max(itemData.data.widthPolicy.value.minLength, widthPolicy.value.minLength));
              }

              (itemData.data.widthPolicy.value.minLength + itemData.data.widthPolicy.value.extentLength) >= (widthPolicy.value.minLength + widthPolicy.value.extentLength) || (itemData.data.widthPolicy.value.extentLength = (widthPolicy.value.minLength + widthPolicy.value.extentLength) - (itemData.data.widthPolicy.value.minLength + itemData.data.widthPolicy.value.extentLength));
              break;
          }

          switch (itemData.data.heightPolicy.policy) {

            case SizePolicy.All:
            case SizePolicy.AllInitial:
              resetRCData || (resetRCData = itemData.data.heightPolicy.value.unit != heightPolicy.value.unit);
              itemData.data.heightPolicy = heightPolicy;
              break;

            case SizePolicy.Container:
              itemData.data.heightPolicy.value.unit = heightPolicy.value.unit;
              itemData.data.heightPolicy.value.extentLength = Math.max(itemData.data.heightPolicy.value.extentLength, heightPolicy.value.minLength - itemData.data.heightPolicy.value.minLength + heightPolicy.value.extentLength);
              resetRCData || (resetRCData = itemData.data.heightPolicy.value.unit != heightPolicy.value.unit);
              break;

            case SizePolicy.CanShrink:
            case SizePolicy.CanShrinkInitial:
              if (itemData.data.heightPolicy.value.minLength > heightPolicy.value.minLength || !itemData.data.heightPolicy.value.isStar() && heightPolicy.value.isStar()) {

                itemData.data.heightPolicy.value = itemData.data.heightPolicy.value.isStar() || heightPolicy.value.isStar()
                                                    ? GridLength.createStar(Math.min(itemData.data.heightPolicy.value.minLength, heightPolicy.value.minLength))
                                                    : GridLength.createPixel(Math.min(itemData.data.heightPolicy.value.minLength, heightPolicy.value.minLength));
              }

              itemData.data.widthPolicy.value.extentLength <= heightPolicy.value.extentLength || (itemData.data.widthPolicy.value.extentLength = heightPolicy.value.extentLength);
              break;

            case SizePolicy.CanGrow:
            case SizePolicy.CanGrowInitial:
              if (itemData.data.heightPolicy.value.minLength < heightPolicy.value.minLength || !itemData.data.heightPolicy.value.isStar() && heightPolicy.value.isStar()) {

                itemData.data.heightPolicy.value = itemData.data.heightPolicy.value.isStar() || heightPolicy.value.isStar()
                                                    ? GridLength.createStar(Math.max(itemData.data.heightPolicy.value.minLength, heightPolicy.value.minLength))
                                                    : GridLength.createPixel(Math.max(itemData.data.heightPolicy.value.minLength, heightPolicy.value.minLength));
              }

              (itemData.data.heightPolicy.value.minLength + itemData.data.heightPolicy.value.extentLength) >= (heightPolicy.value.minLength + heightPolicy.value.extentLength) || (itemData.data.heightPolicy.value.extentLength = (heightPolicy.value.minLength + heightPolicy.value.extentLength) - (itemData.data.heightPolicy.value.minLength + itemData.data.heightPolicy.value.extentLength));
              break;
          }

          itemData.data.deferSizing = deferSizing;

          itemData.refreshStatus == 1 || (itemData.refreshStatus = resetRCData ? 1 : 2);
          if (_gridChildrenInParent) {

          	_parentItem.parentNode.layoutData.updateRefreshStatusForGridChildrenInParent(resetRCData ? 1 : 2);
          }
          else {

          	_refreshStatus == 1 || (_refreshStatus = resetRCData ? 1 : 2);
          }
        }
      }
    }

    this.insertChild = function (item, element) {

      var itemData = _items.firstOrDefault(function(e) { return e.item == item });
      if (itemData) {

        // a layout item descendant is inserted
        if (!itemData.data.widthPolicy.isFixed() || !itemData.data.heightPolicy.isFixed()) {

          itemData.isRemoved = false;

          if (itemData.refreshStatus == 0) {

            _autoLayout || clearItemSize(itemData);
            itemData.refreshStatus = _refreshStatus = 1;
          }
        }
      }
      else {

        var i = Array.prototype.indexOf.call(item.parentNode.children, item);
        if (item == element) {

          // insertion of a layout item
          // try an incremental update

          if (_items.slice(0, Math.min(i, _items.length)).some(function(e) { return e.isRemoved })) {

            // at least one item has been removed without having been replaced!
            // remove the removed items and mark the container as having to be refreshed
          	var removedItems = _items.slice(0, i).filter(function(e) { return e.isRemoved });
          	removedItems.forEach(function(item) { _items.erase(item) });
          	_gridChildrenInParent && _parentItem.parentNode.layoutData.removeItemsForGridChildrenInParent(removedItems);
          }

          if (i < _items.length && _items[i].isRemoved) {

            // replaces a previous layout item
            var itemData = _items[i];
            itemData.isRemoved = false;
            itemData.item = item;
            itemData.policyElement = undefined;
            itemData.data = createLayoutItemDataData(parseLayoutItem(item));
            itemData.refreshStatus = 1;
          }
          else {

            // new layout item => the whole container has to be refreshed
          	_items.splice(i, 0, createLayoutItemData(item, createLayoutItemDataData(parseLayoutItem(item))));
          	_gridChildrenInParent && _parentItem.parentNode.layoutData.addItemForGridChildrenInParent(_parentItem, _items[i]);
          }

          _refreshStatus = 1;
        }
      }
    }

    this.removeChild = function (item, element) {

      var itemData = _items.firstOrDefault(function(e) { return e.item == item });
      if (itemData) {

        if (item == element) {

          // removing an item
        	_autoLayout || clearItemSize(itemData);
          itemData.isRemoved = true;
          itemData.childContainer && itemData.childContainer.layoutData.detach();
					itemData.childContainer && (_childContainers = null);
					itemData.childContainer = null;
					itemData.item = undefined;
					itemData.policyElement = undefined;
					itemData.hasSingleContent = true;
					itemData.substituteItems = null;
          itemData.data = undefined;
          itemData.refreshStatus = _refreshStatus = 1;
        }

        else if ((itemData.childContainer == element || (itemData.childContainer && isAncestorOf(itemData.childContainer, element, element)))
        	    || (itemData.policyElement == element || (itemData.policyElement && isAncestorOf(itemData.policyElement, element, element)))) {

          // removing the policy element
          _autoLayout || clearItemSize(itemData);
          itemData.isRemoved = false;
          itemData.childContainer && itemData.childContainer.layoutData.detach();
          itemData.childContainer && (_childContainers = null);
          itemData.childContainer = null;
          itemData.policyElement = undefined;
          itemData.hasSingleContent = true;
          itemData.substituteItems = null;

          itemData.data.widthPolicy = LayoutPolicy.Auto;
          itemData.data.heightPolicy = LayoutPolicy.Auto;
          itemData.data.minWidth = 0;
          itemData.data.minHeight = 0;
          itemData.data.extentWidth = 0;
          itemData.data.extentHeight = 0;
          itemData.data.horizontalStretching = false;
          itemData.data.verticalStretching = false;
          itemData.data.deferSizing = false;
          itemData.data.policyElementMinWidth = 0;
          itemData.data.policyElementMinHeight = 0;
          itemData.refreshStatus = _refreshStatus = 1;
        }
        else if (!itemData.data.widthPolicy.isFixed() || !itemData.data.heightPolicy.isFixed()) {

          itemData.refreshStatus = 2;
          _refreshStatus == 1 || (_refreshStatus = 2);
        }
      }
    }

    this.updateLayoutItem = function (item) {

      if (!_autoLayout) {

        var itemData = _items.firstOrDefault(function(e) { return e.item == item });
        if (itemData) {

        	var data = createLayoutItemDataData(parseLayoutItem(item));
          itemData.data.row = data.row;
          itemData.data.column = data.column;
          itemData.data.rowSpan = data.rowSpan;
          itemData.data.columnSpan = data.columnSpan;
          itemData.data.isEmpty = data.isEmpty;
          itemData.data.isGhost = data.isGhost;
          itemData.data.isXSpacer = data.isXSpacer;
          itemData.data.isYSpacer = data.isYSpacer;
          itemData.data.hasContent = data.hasContent;

          _refreshStatus = 1;
          itemData.refreshStatus == 1 || (itemData.refreshStatus = !itemData.data.isEmpty ? 1 : 0);
        }
      }
    }

    this.invalidLayoutItem = function(item, loaded) {

    	if (!_autoLayout) {

    		var itemData = _items.firstOrDefault(function(e) { return e.item == item });

    		if (itemData && (!itemData.data.widthPolicy.isFixed() || !itemData.data.heightPolicy.isFixed())) {

    			itemData.refreshStatus == 1 || (itemData.refreshStatus = 2);
    			loaded && (itemData.data.deferSizing = false);

    			if (_gridChildrenInParent) {

    				_parentItem && _parentItem.parentNode.layoutData && _parentItem.parentNode.layoutData.invalidLayoutItem(item, false);
    			}
    			else {

    				_refreshStatus == 1 || (_refreshStatus = 2);
    			}
    		}
    	}
    }

    this.moveLayoutItem = function(item, delta) {

    	var itemData = _items.firstOrDefault(function(e) { return e.item == item });
    	itemData && moveItem(itemData, delta);
    }

    this.freezeContainer = function(orientation, freeze) {

    	if (orientation != 'vertical') {

    		_areColumnsFrozen = !!freeze;
    	}

    	if (orientation != 'horizontal') {

    		_areRowsFrozen = !!freeze;
    	}
    }

    var _dirtyItems = null;
    var _dirtyExtentItems = null;

    this.prepareMeasuringMinSizes = function(incremental) {

      if (_refreshStatus) {

      	if (_refreshStatus == 1) {

					// reset the frozen columns and rows when items are removed
        	(_areColumnsFrozen || _areRowsFrozen) && _items.some(function(e) { return e.isRemoved }) && (_areColumnsFrozen = false, _areRowsFrozen = false);
          // ensure that none of the items has been removed without having been replaced
        	incremental && (_items = _items.filter(function(e) { return !e.isRemoved }));
          !_gridChildrenInParent && setUpRCData();
				}

        if (_gridChildrenInParent) {

        	_dirtyItems = null;
        	_parentItem.parentNode.layoutData.updateRefreshStatusForGridChildrenInParent(_refreshStatus);
        	_refreshStatus = 0;
        }
        else {

        	// filter the items that don't need be measured
        	_dirtyItems = _filledItems.filter(function(itemData) { return itemData.refreshStatus && !itemData.data.isSpaceHolder });
        	prepareMeasuringMinSizes(_dirtyItems, _autoLayout);
        }
      }
    }

    this.measureMinSizes = function() {

      if (_dirtyItems) {

        measureMinSizes(_dirtyItems);
      }
    }

    this.prepareMeasuringDesiredSizes = function() {

      if (_dirtyItems) {

        _dirtyExtentItems = _dirtyItems.filter(function (itemData) { return !itemData.hasSingleContent });

        if (_dirtyExtentItems.length > 0) {

          prepareMeasuringDesiredSizes(_dirtyExtentItems);
        }
      }
    }

    this.measureDesiredSizes = function() {

      if (_dirtyExtentItems && _dirtyExtentItems.length > 0) {

        measureDesiredSizes(_dirtyExtentItems);
        _dirtyExtentItems = null;
      }
    }

    this.finishMeasuring = function() {

      if (_refreshStatus) {

      	_dirtyItems = _filledItems.filter(function(itemData) { return itemData.refreshStatus && !itemData.data.isSpaceHolder });
        finishMeasuring(_dirtyItems);
        dispatchDesiredSizes();
        updateItemContainerData();
        _refreshStatus = 3;
        _dirtyItems = null;
      }
    }

    this.arrangeGridChildrenInParentItems = function(ref) {

    	applySizes(_items.filter(function(itemData) { return !itemData.data.isEmpty }), ref);
    }

    this.resize = function(availableSize) {

			//gDEV && log( 'layout: resize container - ' + container.id);

    	if (!_autoLayout) {

    		var ref = {
    			columnData: _columnData,
    			rowData: _rowData,
    			columnOrigin: 0,
    			rowOrigin: 0,
    			leftOrigin: 0,
    			topOrigin: 0
    		}

    		if (_gridChildrenInParent) {

    			_usedSize.width = availableSize.width;
    			_usedSize.height = availableSize.height;
    		}

      	else if (_refreshStatus == 3 || availableSize.width != _usedSize.width || availableSize.height != _usedSize.height) {

      		dispatchAvailableSpace(Math.max(availableSize.width, _desiredSize.width), Math.max(availableSize.height, _desiredSize.height));
      		applySizes(_filledItems.filter(function(itemData) { return !itemData.data.isSpaceHolder && !itemData.isInParent }), ref);

      		_refreshStatus = 0;
				}

    		if (!_gridChildrenInParent) {

    			getChildContainers().forEach(function(itemData) {

    				var size = slot(itemData, ref);

    				if (itemData.data.isScrollView) {

    					size.width = Math.min(size.width, itemData.policyElement.clientWidth);
    					size.height = Math.min(size.height, itemData.policyElement.clientHeight);
    				}

    				size.width -= itemData.data.itemMinWidth;
    				size.height -= itemData.data.itemMinHeight;
    				itemData.childContainer.layoutData.resize(size);

    				var usedSize = itemData.childContainer.layoutData.usedSize();
    				itemData.childContainer.setStyles({
    					width: usedSize.width + 'px',
    					height: usedSize.height + 'px'
    				});
    			});
    		}
    	}

    	_showDebugGrid && !_gridChildrenInParent && showDebugGrid();

      //gDEV && log( 'layout: resize container end - ' + container.id);
    }

    this.invalidLayout = function() {

      _refreshStatus == 1 || (_refreshStatus = 2);
      _filledItems.forEach(function(itemData) {

        itemData.refreshStatus == 1 || (itemData.refreshStatus = 2);
      });
    }

  	// expose read-only variables

  	/**
		 * Gets the data representing the grid columns.
		 */
    this.columnData = function() { return _columnData }

  	/**
		 * Gets the data representing the grid rows.
		 */
    this.rowData = function() { return _rowData }

  	/**
		 * Gets the layout item collection.
		 */
    this.items = function() { return _items }

  	/**
		 * Gets the desired size of the grid.
		 */
    this.desiredSize = function() { return _desiredSize }

  	/**
		 * Gets the used size of the grid.
		 */
    this.usedSize = function() { return _usedSize }

  	/**
		 * Gets the extent size of the grid.
		 */
    this.extentSize = function() { return _extentSize }

  	/**
		 * Gets the immediate child container collection.
		 */
    this.childContainers = function() { return getChildContainers() }

  	/**
		 * Gets the parent container.
		 */
    this.parentContainer = function() { return _parentItem && _parentItem.parentNode.layoutData }
  }

  var createLayoutData = function(element, storedSettings) { return new LayoutData(element, storedSettings) }

  var collectionsBuilder = function(container, lists, iList) {

    lists[iList].push(container);
    container.childContainers().forEach(function(itemData) {

        if (!itemData.hasSingleContent) {

          if (lists.length == iList + 1) {

            lists.push([]);
          }

          collectionsBuilder(itemData.childContainer.layoutData, lists, iList + 1);
        }
        else {

          collectionsBuilder(itemData.childContainer.layoutData, lists, iList);
        }
      });
  }

  var doMeasure = function(list, incremental) {

    for (var i = list.length - 1; i >= 0; --i) {

      list[i].prepareMeasuringMinSizes(incremental);
    }

    for (var i = list.length - 1; i >= 0; --i) {

      list[i].measureMinSizes(incremental);
    }

    for (var i = list.length - 1; i >= 0; --i) {

      list[i].prepareMeasuringDesiredSizes(incremental);
    }

    for (var i = list.length - 1; i >= 0; --i) {

      list[i].measureDesiredSizes(incremental);
    }

    for (var i = list.length - 1; i >= 0; --i) {

      list[i].finishMeasuring(incremental);
    }
  }

  var measure = function(container, incremental) {

    var lists = [[]];
    collectionsBuilder(container.layoutData, lists, 0);

    for (var i = lists.length - 1; i >= 0; --i) {

      doMeasure(lists[i], incremental);
    }
  }

  var resizeHelper = function(container) {

    container.layoutData.resize(container.getBoundingClientRect());
    //gwc.api.callForEachComponent('onAfterLayout');
  }

  var hideSiblings = function(element) {

    Array.prototype.forEach.call(element.parentNode.children, function(child) {

      if (child != element) {

        child.style.visibility = 'hidden';
      }
    });
  }

  var hightlightElement = function(element) {

    for (var e = element; e && !e.classListContains('gUIFrame'); e = e.parentNode) {

      this.hideSiblings(e);
      e.layoutData && e.layoutData.invalidLayout();
      e.style.overflow = 'visible';
    }
  }

  var _refreshDeferred = 0;
  var _resizeDeferred = 0;
  var _rootContainer = null;

  return {

  	/**
		 * Performs the initial layout of the page. Should be called only once when the page is loaded.
		 * <p>Use the {@link GridLayout.isInitialized} method to check if the module has been initialized.</p>
		 */
    initialize: function() {

      _rootContainer = document.getElementById('gGridLayoutRoot');

      if (!_rootContainer) {

        log("layout: the root layout container, an element identified by 'gGridLayoutRoot', has not been found!");
        return;
      }

      //gDEV && log( 'layout: initial call');
      GridLayout.updateLayoutOnInsertedElement(document.documentElement);
      GridLayout.updateLayoutOnDocumentUpdated(false);

      window.addEventListener('resize', GridLayout.resize, false);
    },

  	/**
		 * A value indicating whether the GridLayout module is initialized.
		 */
    isInitialized: function() { return _rootContainer != null; },

  	/**
		 * Resizes the gGridLayoutRoot-rooted subtree based on the current size of the gGridLayoutRoot element.
		 */
    resize: function() {

    	if (!_resizeDeferred) {

    		_resizeDeferred = window.requestAnimationFrame(function() {

    			_resizeDeferred = 0;
    			resizeHelper(_rootContainer);
    		});
			}
    },

  	/**
		 * Initializes the layout data on the inserted element-rooted subtree.
		 * @param {node} element The root element of the inserted subtree.
		 */
    updateLayoutOnInsertedElement: function(element) {

      //gDEV && log( 'layout: insert element - ' + element.id);
      if (_rootContainer) {

        var layoutItem = getAncestorGridLayoutChild(element);
        if (layoutItem) {

          _rootContainer.classListAdd('gLayoutMeasuring');
          var container = layoutItem.parentNode;
          container.layoutData.insertChild(layoutItem, element);
        }

        if (element.nodeType == 1) {

          var containers = element.querySelectorAll("[data-g-layout-container]");
          if (element.hasAttribute('data-g-layout-container')) {

            containers = [element].concat(Array.prototype.slice.call(containers));
          }

          // initialize the containers
          Array.prototype.forEach.call(containers, function (c) {

            if (!c.layoutData) {

              createLayoutData(c);
            }
          });

          var layoutItems = element.querySelectorAll("[data-g-layout-policy]");
          if (element.hasAttribute('data-g-layout-policy')) {

            layoutItems = [element].concat(Array.prototype.slice.call(layoutItems));
          }

          // bubble up layout data to the closest layout parent
          Array.prototype.forEach.call(layoutItems, function (i) {

            var layoutItem = getAncestorGridLayoutChild(i);
            if (layoutItem) {

              layoutItem.parentNode.layoutData.addLayoutItem(layoutItem, i);
            }
          });

          // attach containers to their parent container
          Array.prototype.forEach.call(containers, function (c) {

            c.layoutData.attachToParent();
          });
        }
      }
      //gDEV && log( 'layout: insert element end - ' + element.id);
    },

  	/**
		 * Updates the layout data when one of the layout attributes change.
		 * @param {node} element The DOM node.
		 * @param {string} name The attribute name.
		 */
    updateLayoutOnUpdatedAttribute: function(element, name) {

      //gDEV && log( 'layout: updated attribute - ' + element.id + ' - ' + name);
      if (_rootContainer) {

        if (name == "data-g-layout-item") {

          var container = element.parentNode;
          if (container) {

            container.layoutData.updateLayoutItem(element);
          }
        }
        else if (name == "data-g-layout-policy") {

          var layoutItem = getAncestorGridLayoutChild(element);
          if (layoutItem) {

            layoutItem.parentNode.layoutData.addLayoutItem(layoutItem, element);
          }
        }
        else if (name == "data-g-layout-invalid") {

          GridLayout.invalidLayout(element);
        }
      }
      //gDEV && log( 'layout: updated attribute end - ' + element.id + ' - ' + name);
    },

  	/**
		 * Removes the layout data from the removed element-rooted subtree.
		 * @param {node} element The root element of the removed subtree.
		 */
    updateLayoutOnRemovedElement: function(element) {

      /*
       * 3 cases have to be distinguished here:
       *   - if the removed element is a descendant of a grid-layout-policy one, no data structure has to be updated
       *   - if the removed element is a grid-layout-item, the corresponding layout-data entry of the container has to be cleaned
       *   - otherwise, the removed element is an element of the string formed by ]grid-layout-item, the grid-layout-policy],
       *     in which case the layout-data entry of the container for this child has to be updated by cleaning the reference to the child
       *     and by resetting the desired sizes.
       *
       *  All 3 cases mark the layout structure as beeing dirty
       */

      //gDEV && log( 'layout: remove element - ' + element.id);
      if (_rootContainer) {

        var layoutItem = getAncestorGridLayoutChild(element);
        if (layoutItem) {

          _rootContainer.classListAdd('gLayoutMeasuring');
          layoutItem.parentNode.layoutData.removeChild(layoutItem, element);
        }
      }
      //gDEV && log( 'layout: remove element end - ' + element.id);
    },

  	/**
		 * Refreshes the layout after insertion of new elements, removing, updating or invalidation of existing elements.
		 * @param {bool} incrementalUpdate A value indicating whether its an initial or an incremental layout application.
		 * @param {bool} avoidSizing Experimental feature. Should always be false.
		 * @param {bool} defer A value indicating whether the layout should be refreshed synchronously or asynchronously.
		 */
    updateLayoutOnDocumentUpdated: function(incrementalUpdate, avoidSizing, defer) {

      if (_rootContainer) {
        //gDEV && log( 'layout: update document');

        if (defer) {

          if (!_refreshDeferred) {

            _refreshDeferred = window.requestAnimationFrame(function() {

              _refreshDeferred = 0;
              _rootContainer.classListAdd('gLayoutMeasuring');
              GridLayout.updateLayoutOnDocumentUpdated(incrementalUpdate);
            });
          }

          return;
        }

        measure(_rootContainer, incrementalUpdate);

        // make the elements fill their container
        _rootContainer.classListRemove('gLayoutMeasuring');

        !avoidSizing && resizeHelper(_rootContainer);
        //gDEV && log( 'layout: update document end');
      }
    },

  	/**
		 * Invalidates the layout of the element-rooted subtree.
		 * <p>This function might me called by component authors when the component layout is updated
     * outside a server-initiated updating phase of the DOM tree.</p>
		 * <p>Calling the function from inside a component, where _this is a private auto-reference to the component:</p>
		 * @example GridLayout.invalidLayout(_this.elt)
		 *
		 * @param {node} element The root element of the subtree to invalidate.
		 * @param {bool} sync A value indicating whether the layout should be refreshed synchronously or asynchronously.
		 * @param {bool} loaded A value indicating whether the deferred-loading element has been loaded.
		 */
    invalidLayout: function(element, sync, loaded) {

      // this function may be called before the initialization, for example by images
      var layoutItem = getAncestorGridLayoutChild(element);
      if (layoutItem) {

        var layoutParent = layoutItem.parentNode;
        var layoutData = layoutParent.layoutData || (layoutParent.layoutData = createLayoutData(layoutParent));
        layoutData.invalidLayoutItem(layoutItem, loaded);
        GridLayout.updateLayoutOnDocumentUpdated(true, false, !sync);
      }
    },

  	/**
		 * Moves an element.
		 * <p>Moves the enclosing layout item of the provided element.
		 *   The move is done if the context of the item allows it. 
		 *   The space is taken in the sibling items placed at the side of the direction of the move, 
		 *   and gained by the sibling item at the other side. If there is no space left, i.e. if all the sibling items reached their desired size, no move is made.</p>
		 *
		 * @param {node} element The root element of the subtree to move.
		 * @param {object} delta An object with two properties, x and y, containing the relative distance to move the element in each axes.
		 */
    moveElement: function(element, delta) {

    	var layoutItem = getAncestorGridLayoutChild(element);
    	if (layoutItem) {

    		var layoutParent = layoutItem.parentNode;
    		var layoutData = layoutParent.layoutData;
    		if (layoutData) {

    			layoutData.moveLayoutItem(layoutItem, delta);
    		}
    	}
    },

  	/**
		 * Freeze a container.
		 * <p>Freeze the parent container of the element.
		 *
		 * @param {node} element The root element of the subtree who's parent container has to be frozen.
		 * @param {object} orientation Axes against what to freeze the container. It can contain either 'vertical', 'horizontal' or another value
		 *                 to indicate both axes.
		 * @param {bool} freeze A value indicating whether the parent container has to be frozen.
		 */
    freezeContainer: function(element, orientation, freeze) {

    	var layoutItem = getAncestorGridLayoutChild(element);
    	if (layoutItem) {

    		var layoutParent = layoutItem.parentNode;
    		var layoutData = layoutParent.layoutData;
    		if (layoutData) {

    			layoutData.freezeContainer(orientation, freeze);
    		}
    	}
    },

  	/**
		 * Binds a store settings provider to a layout container.
		 * <p>Bounds a store settings provider to a layout container. The container must not have been initialized yet.
		 *
		 * @param {node} container The element bound to a layout container.
		 * @param {object} settings A store settings provider.
		 */
    storeSettings: function(container, settings) {

    	createLayoutData(container, settings);
    },

  	/**
		 *
		 * @private
		 */
    hightlightElement: function() {

      if (_rootContainer) {

        var ve = document.getElementById('gDev_layoutFocusedElement');
        if (ve && ve.value) {

          var element = document.getElementById(ve.value);
          if (element) {

            hightlightElement(element);
            GridLayout.updateLayoutOnDocumentUpdated(true, true);
          }
        }
      }
    }
  }
} ());
