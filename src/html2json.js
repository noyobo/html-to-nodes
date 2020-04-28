// Regular Expressions for parsing tags and attributes
var startTag = /^<([-A-Za-z0-9_]+)((?:\s+[a-zA-Z_:][-a-zA-Z0-9_:.]*(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/;
var endTag = /^<\/([-A-Za-z0-9_]+)[^>]*>/;
var attr = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;

// Empty Elements - HTML 5
var empty = makeMap(
  'area,base,basefont,br,col,frame,hr,img,input,link,meta,param,embed,command,keygen,source,track,wbr',
);

// Block Elements - HTML 5
var block = makeMap(
  'a,address,article,applet,aside,audio,blockquote,button,canvas,center,dd,del,dir,div,dl,dt,fieldset,figcaption,figure,footer,form,frameset,h1,h2,h3,h4,h5,h6,header,hgroup,hr,iframe,ins,isindex,li,map,menu,noframes,noscript,object,ol,output,p,pre,section,script,table,tbody,td,tfoot,th,thead,tr,ul,video',
);

// Inline Elements - HTML 5
var inline = makeMap(
  'abbr,acronym,applet,b,basefont,bdo,big,br,button,cite,code,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,textarea,tt,u,var',
);

// Elements that you can, intentionally, leave open
// (and which close themselves)
var closeSelf = makeMap('colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr');

// Attributes that have their values filled in disabled="disabled"
var fillAttrs = makeMap(
  'checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected',
);

// Special Elements (can contain anything)
var special = makeMap('script,style');

var HTMLParser = function(html, handler) {
  var index,
    chars,
    match,
    stack = [],
    last = html;
  stack.last = function() {
    return this[this.length - 1];
  };

  while (html) {
    chars = true;

    // Make sure we're not in a script or style element
    if (!stack.last() || !special[stack.last()]) {
      // Comment
      if (html.indexOf('<!--') == 0) {
        index = html.indexOf('-->');

        if (index >= 0) {
          if (handler.comment) handler.comment(html.substring(4, index));
          html = html.substring(index + 3);
          chars = false;
        }

        // end tag
      } else if (html.indexOf('</') == 0) {
        match = html.match(endTag);

        if (match) {
          html = html.substring(match[0].length);
          match[0].replace(endTag, parseEndTag);
          chars = false;
        }

        // start tag
      } else if (html.indexOf('<') == 0) {
        match = html.match(startTag);

        if (match) {
          html = html.substring(match[0].length);
          match[0].replace(startTag, parseStartTag);
          chars = false;
        }
      }

      if (chars) {
        index = html.indexOf('<');

        var text = index < 0 ? html : html.substring(0, index);
        html = index < 0 ? '' : html.substring(index);

        if (handler.chars) handler.chars(text);
      }
    } else {
      html = html.replace(new RegExp('([\\s\\S]*?)</' + stack.last() + '[^>]*>'), function(all, text) {
        text = text.replace(/<!--([\s\S]*?)-->|<!\[CDATA\[([\s\S]*?)]]>/g, '$1$2');
        if (handler.chars) handler.chars(text);

        return '';
      });

      parseEndTag('', stack.last());
    }

    if (html == last) throw 'Parse Error: ' + html;
    last = html;
  }

  // Clean up any remaining tags
  parseEndTag();

  function parseStartTag(tag, tagName, rest, unary) {
    tagName = tagName.toLowerCase();

    if (block[tagName]) {
      while (stack.last() && inline[stack.last()]) {
        parseEndTag('', stack.last());
      }
    }

    if (closeSelf[tagName] && stack.last() == tagName) {
      parseEndTag('', tagName);
    }

    unary = empty[tagName] || !!unary;

    if (!unary) stack.push(tagName);

    if (handler.start) {
      var attrs = [];

      rest.replace(attr, function(match, name) {
        var value = arguments[2]
          ? arguments[2]
          : arguments[3]
          ? arguments[3]
          : arguments[4]
          ? arguments[4]
          : fillAttrs[name]
          ? name
          : '';

        attrs.push({
          name: name,
          value: value,
          escaped: value.replace(/(^|[^\\])"/g, '$1\\"'), //"
        });
      });

      if (handler.start) handler.start(tagName, attrs, unary);
    }
  }

  function parseEndTag(tag, tagName) {
    // If no tag name is provided, clean shop
    if (!tagName) {
      var pos = 0;
    } else {
      // Find the closest opened tag of the same type
      // eslint-disable-next-line no-redeclare
      for (var pos = stack.length - 1; pos >= 0; pos--)
        if (stack[pos] == tagName) {
          break;
        }
    }
    if (pos >= 0) {
      // Close all the open elements, up the stack
      for (var i = stack.length - 1; i >= pos; i--) {
        if (handler.end) handler.end(stack[i]);
      }

      // Remove the open elements from the stack
      stack.length = pos;
    }
  }
};

function makeMap(str) {
  var obj = {},
    items = str.split(',');
  for (var i = 0; i < items.length; i++) obj[items[i]] = true;
  return obj;
}

function removeDOCTYPE(html) {
  return html
    .replace(/<\?xml.*\?>\n/, '')
    .replace(/<!doctype.*>\n/, '')
    .replace(/<!DOCTYPE.*>\n/, '');
}

function attachClassName(node) {
  if (node.name) {
    node.attrs = node.attrs || {};

    const className = node.attrs.class || '';
    const style = node.attrs.style || [];

    if (Array.isArray(style)) {
      node.attrs.style = style.join('');
    }

    if (!new RegExp('\\b' + node.name + '\\b').test(className)) {
      node.attrs.class = (className + ' ' + node.name).trim();
    }
  }

  return node;
}

var html2json = function html2json(html = '') {
  html = removeDOCTYPE(html);
  var bufArray = [];
  var results = [];
  HTMLParser(html, {
    start: function(tag, attrs, unary) {
      // node for this element
      var node = {
        type: 'node',
        name: tag,
      };
      if (attrs.length !== 0) {
        node.attrs = attrs.reduce(function(pre, attr) {
          var name = attr.name;
          var value = attr.value;
          // has multi attibutes
          // make it array of attribute
          if (value.match(/ /)) {
            value = value.split(' ');
          }

          // if attr already exists
          // merge it
          if (pre[name]) {
            if (Array.isArray(pre[name])) {
              // already array, push to last
              pre[name].push(value);
            } else {
              // single value, make it array
              pre[name] = [pre[name], value];
            }
          } else {
            // not exist, put it
            pre[name] = value;
          }

          return pre;
        }, {});
      }

      if (unary) {
        // if this tag dosen't have end tag
        // like <img src="hoge.png"/>
        // add to parents
        var parent = bufArray[0] || results;
        if (parent.children === undefined) {
          parent.children = [];
        }
        parent.children.push(attachClassName(node));
      } else {
        bufArray.unshift(attachClassName(node));
      }
    },
    end: function(tag) {
      // merge into parent tag
      var node = bufArray.shift();
      if (node.name !== tag) console.error('invalid state: mismatch end tag');
      if (bufArray.length === 0) {
        results.push(node);
      } else {
        var parent = bufArray[0];
        if (parent.children === undefined) {
          parent.children = [];
        }
        parent.children.push(attachClassName(node));
      }
    },
    chars: function(text) {
      var node = {
        type: 'text',
        text: text,
      };
      if (bufArray.length === 0) {
        results.push(attachClassName(node));
      } else {
        var parent = bufArray[0];
        if (parent.children === undefined) {
          parent.children = [];
        }
        parent.children.push(attachClassName(node));
      }
    },
    comment: function(text) {
      var node = {
        node: 'comment',
        text: text,
      };
      var parent = bufArray[0];
      if (parent.children === undefined) {
        parent.children = [];
      }
      parent.children.push(attachClassName(node));
    },
  });
  return results;
};

export default html2json;
