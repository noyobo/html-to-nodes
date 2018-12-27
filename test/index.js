const html2json = require('../src/html2json');

var html =
  '<h1>html to json</h1><p>html 文本转化为微信小程序 rich-text 所需的 nodes 格式，每个节点增加对应 tag 的 class。</p>';

var nodes = html2json(html);

console.log(JSON.stringify(nodes, null, 2));
