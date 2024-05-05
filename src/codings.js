///<reference path="index.js"/>
///<reference path="jsyaml.d.ts"/>
import aes from './aes/aes';
import hashes from './hashes/hashes';
import ascii from './transformations/ascii';
import base64 from './transformations/base64';
import { imageTransformList } from './transformations/image';
import morse from './transformations/morse';
const htmlEncodeTable = {
    171: 'laquo',
    176: 'deg',
    187: 'raquo',
    8216: 'lsquo',
    8220: 'ldquo',
    8249: 'lsaquo',
    8250: 'rsaquo',
    8722: 'minus',
};
/**
 * @returns {Array<Encoding>}
 */
function getEncodings() {
    /**@type {Array<Encoding>} */
    let encs = [
        ...ascii,
        ...base64,
        ...aes,
        ...hashes,
        {
            nameHTML: 'urlencode',
            key: 'urlenc',
            title: "urlencode",
            fnc: encodeURIComponent
        }, {
            nameHTML: 'urldecode',
            key: 'urldec',
            matcher: str => !!str.match(/%[0-7][0-9A-F]/),
            fnc: decodeURIComponent
        }, {
            nameHTML: 'htmlEncode',
            key: 'htmlenc',
            fnc: (str, out, ref) => {
                const t = document.createElement('div');
                t.innerText = str;
                return t.innerHTML.replace(/./g, (c) => {
                    if(htmlEncodeTable[c.charCodeAt(0)]) {
                        return `&${htmlEncodeTable[c.charCodeAt(0)]};`;
                    }
                    if(ref.currentParameter.options.replaceUtf8 && c.charCodeAt(0) > 128) {
                        return '\\u' + c.charCodeAt(0)
                            .toString(16)
                            .toUpperCase()
                            .padStart(4, '0');
                    }
                    return c;
                });
            },
            options: {
                replaceUtf8: {
                    type: "checkbox",
                    title: "replace all non ascii chars with the escaped unicode sequence"
                }
            }
        }, {
            nameHTML: 'htmlDecode',
            key: 'htmldec',
            matcher: str => !!str.match(/&.{1,4};/),
            fnc: (str) => {
                const utf8decodedStr = str.replace(/\\u([0-9A-Fa-f]{4})/g, (e, a) => {
                    return String.fromCharCode(parseInt(a, 16))
                })
                return new DOMParser().parseFromString(utf8decodedStr, 'text/html').body.textContent;
            }
        }, {
            nameHTML: 'jwt',
            key: 'jwt',
            title: "parse jwt data",
            fnc: str => {
                const nStr = str.split('.')[1];
                const base64Str = nStr.replace(/-/g, '+')
                    .replace(/_/g, '/');
                return decodeURIComponent(atob(base64Str)
                    .split('')
                    .map(c => {
                        return '%' + ('00' + c.charCodeAt(0)
                            .toString(16))
                            .slice(-2);
                    })
                    .join(''));
            },
            matcher: str => str.startsWith('ey') && str.split('.').length === 3
        }, {
            nameHTML: 'json parse',
            fnc: str => JSON.parse(str)
        }, {
            nameHTML: 'query object',
            title: "parse query data from (partial)url as object",
            fnc: str => {
                if(str.includes("?")) {
                    str = str.split("?")[1]
                }
                let urlParams = new URLSearchParams(str);
                return JSON.stringify(Object.fromEntries(urlParams.entries()));
            }
        }, {
            nameHTML: 'cookie parse',
            title: "parse cookie string as object",
            matcher: str => str.includes("; ") && str.split("; ")
                .every(substr => substr.includes("=")),
            fnc: str => {
                let obj = Object.fromEntries(str.split("; ")
                    .map(subStr => subStr.split("=", 2)))
                return obj;
            }
        }, {
            nameHTML: 'json yaml',
            title: "convert between json and yaml",
            fnc: str => {
                //jsyaml can do both
                const obj = jsyaml.load(str);
                try {
                    //if json parse works converto to yaml
                    const json = JSON.parse(str);
                    return jsyaml.dump(obj);
                } catch(e) {
                    return JSON.stringify(obj, undefined, '   ');
                }
            }
        }, {
            nameHTML: 'json structured',
            title: "pretty print json",
            fnc: str => {
                if(typeof str === 'object') {
                    return JSON.stringify(str, undefined, '. ');
                } else {
                    return JSON.stringify(JSON.parse(str), undefined, '. ');
                }
            }
        }, {
            nameHTML: 'stack format',
            title: "format java stacktraces",
            fnc: str => {
                try {
                    const obj = JSON.parse(str);
                    obj.stack_trace = obj.stack_trace.replace(/\r\n/g, '<line--break>')
                        .replace(/\n/g, '<line--break>')
                        .replace(/\t/g, '<line--tab>');
                    const jsonStr = JSON.stringify(obj, undefined, '. ');
                    return jsonStr
                        .replace(/<line--break>/g, '\n')
                        .replace(/<line--tab>/g, '\t');
                } catch(e) {
                    return str.replace(/ at /g, '\nat ')
                }
            }
        }, {
            nameHTML: "letter shift",
            title: "shift letters in the alphabet",
            key: "shift",
            onchoose: function(queryValue) {
                const amount = prompt("shift how many");
                let numAmt;
                if(!isNaN(+amount)) {
                    numAmt = +amount;
                } else {
                    const [first, second] = amount.split("-").map(s => s.trim());

                    numAmt = (second.charCodeAt(0) - first.charCodeAt(0))
                }
                return numAmt;
            },
            fnc: (str, out, context) => {
                out.textContent = "shift (" + out.val + ")";
                const aOff = 97;

                let shiftVal = out.val;
                if(context.currentParameter.options.invert) {
                    shiftVal *= -1
                }

                return str.split("")
                    .map(s => {
                        const char0indx = s.charCodeAt(0) - aOff;
                        let newChar = (char0indx + shiftVal) % 26
                        while(newChar < 0) {
                            newChar += 26
                        }
                        return String.fromCharCode(newChar + aOff);
                    })
                    .join("")
            },
            options: {
                invert: {
                    type: "checkbox",
                    title: "shift in the other direction"
                }
            }
        }, {
            nameHTML: 'custom',
            title: "provide your own function",
            onchoose: function(queryValue) {

                return prompt('write a function that returns a string', queryValue || 'str => ');
            },
            fnc: (str, out, context) => {
                if(context.initialRun) {
                    throw new Error('initial run doenst allow \'custom\' because custom code can be injected in the url - run anyways by temporarily changing the initial text');
                }
                let evl = out.val;
                out.textContent = 'custom :' + evl;
                let newStr = eval(evl)(str);
                return newStr;
            }
        }, {
            nameHTML: 'regex',
            onchoose: queryValue => {
                return prompt('write a matcher string', queryValue || '')
                    .replace(/\\n/gm, '\n');
            },
            fnc: (str, out) => {
                let stringMatch = out.val;
                out.textContent = 'regex :' + stringMatch;

                const regexp = new RegExp(stringMatch, 'gm');
                let match;
                const matches = [];
                while((match = regexp.exec(str)) !== null) {
                    matches.push({
                        index: match.index,
                        matches: [...match],
                        groups: match.groups
                    });
                }

                return JSON.stringify(matches);
            }
        }, {
            nameHTML: 'lin-win-path',
            key: 'linwinpath',
            title: "switch file paths between windows ,linux and escaped windows",
            fnc: str => {
                if(str.includes('\\\\')) {
                    return str.replace(/\\\\/g, '\\');
                } else if(str.includes('\\')) {
                    return str.replace(/\\/g, '/');
                }
                return str.replace(/\//g, '\\\\');
            }
        },
        ...morse,
        ...imageTransformList

    ];
    /**
     * @type {Array<string>}
     */
    const radixOpts = []

    /**
     * @type {Array<Encoding>}
     */
    let convertArray = [];
    for(let indx = 2; indx < 37; indx++) {
        radixOpts.push(`${indx}`)
        if(indx === 10) {
            continue;
        }

        let name = `${indx}`;
        /**
        * @type {(el:Encoding)=>void}
        */
        let insertFnc = convertArray.push.bind(convertArray);
        if(indx === 16) {
            name = 'HEX';
            insertFnc = convertArray.unshift.bind(convertArray);
        } else if(indx !== 2) {
            continue
        }


        insertFnc({
            nameHTML: name + ' to dec',
            matcher: indx === 2 ? ((str, additional) => {
                const matches = !str.match(/[^01 ]/g)
                if(matches) {
                    additional(1, 1)

                }
                return matches
            }) : undefined,
            fnc: (str, el) => {
                let words = str.split(' ');
                if(indx === 2) {
                    if(words.every(w => w.length % 8 === 0)) {
                        let tWords = [];
                        words.forEach(word => {
                            for(let i = 0; i < word.length; i += 8) {
                                tWords.push(word.substring(i, i + 8));
                            }
                            //tWords.push(`00100000`); // space
                        });
                        el.textContent = `${name} to dec            => 8bit char split`;
                        words = tWords;
                    }
                }
                return words
                    .map(sstr => '' + parseInt(sstr, indx)
                    )
                    .join(' ');
            }
        });
        insertFnc({
            nameHTML: 'dec to ' + name,
            fnc: str => {
                // @ts-ignore
                return str.split(' ')
                    .map(sstr => parseInt(sstr, 10)
                        .toString(indx)
                        .toUpperCase())
                    .join(' ');

            }
        });
    }

    encs.push(...convertArray);

    encs.push({
        nameHTML: "radix",
        fnc: (str, o, t) => {
            let words = str.split(' ');
            const from = +t.currentParameter.options.from || 2
            const to = +t.currentParameter.options.to || 10
            let name = `radix: ${from}`;
            if(from === 16) {
                name = 'HEX';
            }

            if(to === 16) {
                name += " -> HEX"
            } else {
                name += ` -> ${to}`
            }

            o.textContent = `${name}`;
            if(from === 2) {
                if(words.every(w => w.length % 8 === 0)) {
                    let tWords = [];
                    words.forEach(word => {
                        for(let i = 0; i < word.length; i += 8) {
                            tWords.push(word.substring(i, i + 8));
                        }
                        //tWords.push(`00100000`); // space
                    });
                    o.textContent = `${name} => 8bit char split`;
                    words = tWords;
                }
            }
            const decString = words
                .map(sstr => '' + parseInt(sstr, from)
                )
                .join(' ');

            return decString.split(' ')
                .map(sstr => parseInt(sstr, 10)
                    .toString(to)
                    .toUpperCase())
                .join(' ');

        },
        options: {
            from: {
                type: "select",
                options: radixOpts.map(o => ({
                    text: o,
                    value: o
                })),
                defaultV: "2"
            },
            to: {
                type: "select",
                options: radixOpts.map(o => ({
                    text: o,
                    value: o
                })),
                defaultV: "10"
            }
        }
    })

    return encs;
}
const encodings = getEncodings();
export { encodings };