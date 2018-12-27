# html-to-json

html 文本转化为微信小程序 rich-text 所需的 nodes 格式，每个节点增加对应 tag 的 class。

## 使用

```html
<h1>html to json</h1>
<p>html 文本转化为微信小程序 rich-text 所需的 nodes 格式，每个节点增加对应 tag 的 class。</p>
```

转换后

```json
[
  {
    "type": "node",
    "name": "h1",
    "attrs": {
      "class": "h1"
    },
    "children": [
      {
        "type": "text",
        "text": "html to json"
      }
    ]
  },
  {
    "type": "node",
    "name": "p",
    "attrs": {
      "class": "p"
    },
    "children": [
      {
        "type": "text",
        "text": "html 文本转化为微信小程序 rich-text 所需的 nodes 格式，每个节点增加对应 tag 的 class。"
      }
    ]
  }
]
```

## 在微信小程序 `rich-text` 中使用

```js
const nodes = htmlToJson(html);

<rich-text nodes='{{nodes}}' />;
```

修改样式

```css
.img {
  width: 100%;
  display: block;
}

.h1 {
  line-height: 68rpx;
  font-size: 48rpx;
  border-bottom: 1rpx solid #f1f2f6;
  margin: 48rpx 0;
  font-weight: 400;
}
.h2 {
  line-height: 60rpx;
  font-size: 36rpx;
  border-bottom: 1rpx solid #f1f2f6;
  margin: 48rpx 0;
  font-weight: 400;
}

.p,
.ul,
.ol {
  line-height: 48rpx;
  font-size: 28rpx;
  margin: 48rpx 0;
}

.li {
  line-height: 48rpx;
  font-size: 28rpx;
}
```

## Dependencies

- [htmlparser.js](https://github.com/blowsie/Pure-JavaScript-HTML5-Parser)
- [html2json](https://github.com/Jxck/html2json)
