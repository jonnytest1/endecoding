///<reference path="index.js"/>
///<reference path="jsyaml.d.ts"/>
import aes from './node-forge/aes';
import hashes from './hashes/hashes';
import ascii from './transformations/ascii';
import base64 from './transformations/base64';
import { imageConversions } from './image/image';
import morse from './transformations/morse';
import { rsa } from './node-forge/rsa';
import { crt } from './node-forge/cert';
import gpg from './transformations/opengpg';

/**
 * @type {Record<number,string>}
 */
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
        ...rsa,
        ...hashes,
        ...crt,
        ...gpg,
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
                    if(ref?.currentParameter?.options?.replaceUtf8 && c.charCodeAt(0) > 128) {
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
                    return String.fromCharCode(parseInt(a, 16));
                });
                return new DOMParser().parseFromString(utf8decodedStr, 'text/html').body.textContent ?? "";
            }
        }, {
            nameHTML: 'jwt',
            key: 'jwt',
            title: "parse jwt data",
            helpHTML: `
                a jwt token is 
                <ul>
                    <li>'header': a base64 encoded json describing the algorithm and token type</li>
                    <li>'payload' a json object with data</li>
                    <li>a signature combining both header and payload</li>
                </ul>
                    
                for more information <a href="https://jwt.io" target="_blank">see jwt.io</a><br>

                it can be identified by <br>
                    1. having exactly 2 '.'<br>
                    2. the first and second parts starting with 'ey' indicating a base64 encoded '{'<br><br>

                the payload data is always readable even without verifying the signature ❗<br>
                <br>example implementation:<br><br>
                <code class="language-javascript">
                    atob(token.split('.')[1])
                </code>
            `,
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
                    str = str.split("?")[1];
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
                    .map(subStr => subStr.split("=", 2)));
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
                    return str.replace(/ at /g, '\nat ');
                }
            }
        }, {
            nameHTML: "letter shift",
            title: "shift letters in the alphabet",
            key: "shift",
            matcher: (str) => {
                const rotMatch = str.match(/ROT(?<count>\d{1,2}) /i);
                if(rotMatch?.groups?.count) {
                    return {
                        amount: rotMatch?.groups?.count
                    };
                }
                return false;

            },
            fnc: (str, out, context, opts) => {

                const aOff = 97;
                const bigAOff = 65;
                if(!opts.parameters?.amount) {
                    return str;
                }
                let shiftVal = +opts.parameters?.amount;
                if(context?.currentParameter?.options.invert) {
                    shiftVal *= -1;
                }
                if(out) {
                    out.textContent = "shift (" + shiftVal + ")";
                }

                if(isNaN(shiftVal)) {
                    return "ERROR: invalid shift";
                }
                const rotMatch = str.match(/(?<start>ROT(?<count>\d{1,2}) )/i);
                if(rotMatch?.groups?.start) {
                    str = str.substring(rotMatch?.groups?.start.length);
                }

                return str.split("")
                    .map(s => {
                        if(s.match(/[a-zA-Z]/)) {
                            const isBig = s == s.toUpperCase();
                            const offsetChar = isBig ? bigAOff : aOff;
                            const char0indx = s.charCodeAt(0) - offsetChar;
                            let newChar = (char0indx + shiftVal) % 26;
                            while(newChar < 0) {
                                newChar += 26;
                            }
                            return String.fromCharCode(newChar + offsetChar);
                        }
                        return s;
                    })
                    .join("");
            },
            options: {
                amount: {
                    type: "range",
                    max: 26,
                    min: -26
                },
                invert: {
                    type: "checkbox",
                    title: "shift in the other direction"
                }
            }
        }, {
            nameHTML: 'custom',
            title: "provide your own function",
            onchoose: function(queryValue) {

                return prompt('write a function that returns a string', queryValue || 'str => ') ?? "";
            },
            fnc: (str, out, context) => {
                if(!context || context?.initialRun) {
                    throw new Error('initial run doenst allow \'custom\' because custom code can be injected in the url - run anyways by temporarily changing the initial text');
                }
                if(!out?.val) {
                    return str;
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
                    ?.replace(/\\n/gm, '\n') ?? "";
            },
            fnc: (str, out) => {
                if(!out?.val) {
                    return str;
                }
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
        ...imageConversions

    ];
    /**
     * @type {Array<string>}
     */
    const radixOpts = [];

    /**
     * @type {Array<Encoding>}
     */
    let convertArray = [];
    for(let indx = 2; indx < 37; indx++) {
        radixOpts.push(`${indx}`);
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
            continue;
        }


        insertFnc({
            nameHTML: name + ' to dec',
            key: `${name}_dec`,
            matcher: indx === 2 ? ((str, additional) => {
                const matches = !str.match(/[^01 ]/g);
                if(matches) {
                    additional(1, 1);

                }
                return matches;
            }) : undefined,
            fnc: (str, el) => {
                let words = str.split(' ');
                if(indx === 2) {
                    if(words.every(w => w.length % 8 === 0)) {
                        /**
                         * @type {Array<string>}
                         */
                        let tWords = [];
                        words.forEach(word => {
                            for(let i = 0; i < word.length; i += 8) {
                                tWords.push(word.substring(i, i + 8));
                            }
                            //tWords.push(`00100000`); // space
                        });
                        if(el) {
                            el.textContent = `${name} to dec            => 8bit char split`;
                        }
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
            key: `dec_${name}`,
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
            const from = +(t?.currentParameter?.options?.from || 2);
            const to = +(t?.currentParameter?.options?.to || 10);
            let name = `radix: ${from}`;
            if(from === 16) {
                name = 'HEX';
            }

            if(to === 16) {
                name += " -> HEX";
            } else {
                name += ` -> ${to}`;
            }
            if(o) {
                o.textContent = `${name}`;
            }
            if(from === 2) {
                if(words.every(w => w.length % 8 === 0)) {
                    /**
                     * @type {Array<string>}
                     */
                    let tWords = [];
                    words.forEach(word => {
                        for(let i = 0; i < word.length; i += 8) {
                            tWords.push(word.substring(i, i + 8));
                        }
                        //tWords.push(`00100000`); // space
                    });
                    if(o) {
                        o.textContent = `${name} => 8bit char split`;
                    }
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
    });

    return encs;
}
const encodings = getEncodings();
export { encodings };