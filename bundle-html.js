const fs = require('fs');
const path = require('path');
const parse5 = require('parse5');
const flow = require('lodash/fp/flow');

const Node = {
  map: transform => node => {
    const transformed = transform(node);
    const {childNodes} = transformed;
    const res = Object.keys(transformed).reduce((s, k) => {
      s[k] = transformed[k];
      return s;
    }, {})
    res.childNodes= childNodes && childNodes.map(Node.map(transform));
    return res;
  },
};

const ENTRY = process.argv[2];

const entryPath = require.resolve(ENTRY);
const entryContent = fs.readFileSync(entryPath, 'utf-8');

const newContent = flow([
  parse5.parse,
  Node.map(node => {
    if (node.nodeName === 'script') {
      const src = node.attrs.find(attr => attr.name === 'src');
      if (src.value) {
        const scriptPath = path.resolve(path.dirname(entryPath), src.value);
        const scriptContent = fs.readFileSync(scriptPath, 'utf-8');
        const [newScript] = parse5.parseFragment(`<script>${scriptContent}</script>`, node.parent).childNodes;
        return newScript;
      }
    }
    return node;
  }),
  parse5.serialize,
])(entryContent);

fs.writeFileSync(`${entryPath}.js`, `export default \`${newContent}\``);

console.log(`${ENTRY} -> ${ENTRY}.js`);
