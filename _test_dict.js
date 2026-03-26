const fs = require('fs');
let code = fs.readFileSync('dictionary.js', 'utf8');
code = code.replace('const DICT_COLLECTION', 'global.DICT_COLLECTION');
try {
    eval(code);
    const counts = {};
    for (let k in global.DICT_COLLECTION) {
        counts[k] = global.DICT_COLLECTION[k].length;
    }
    console.log(JSON.stringify(counts));
} catch (e) {
    console.error('PARSE ERROR', e.message);
}
