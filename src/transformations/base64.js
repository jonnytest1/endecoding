/// <reference path="../endecoding.d.ts" />


/**
 * @type {Record<string,string>}
 */
const table = {
};
for(let i = 0; i < 26; i++) {
    table[String.fromCharCode(i + 65)] = i.toString(2).padStart(6, "0");
    table[String.fromCharCode(i + 97)] = (i + 26).toString(2).padStart(6, "0");
}
for(let i = 0; i < 10; i++) {
    table[i + ""] = (i + 52).toString(2).padStart(6, "0");
}

table["+"] = (62).toString(2).padStart(6, "0");
table["/"] = (63).toString(2).padStart(6, "0");

/**
 * @param {string} line
 */
function manualDecodeHiddenBits(line) {
    let strs = [];

    for(let i = line.length - 4; i < line.length; i++) {
        if(line[i] === "=") {
            break;
        }
        const binary = table[line[i]];

        strs.push(binary);
    }
    let str = strs.join("");
    for(let i = 0; i < str.length; i += 8) {
        const substr = str.substring(i, i + 8);
        if(substr.length !== 8) {
            return substr;
        }
    }
}
/**
 * @param {string} line
 */
function decodeInvalidChars(line) {
    let invalidChars = [];
    let chars = [];

    let ct = 0;
    for(const element of line) {
        if(element === "=") {
            break;
        }
        const binary = table[element];
        if(binary) {
            ct++;
            chars.push(element);
        } else {
            invalidChars.push({
                ct: ct,
                char: element
            });
            ct = 0;
        }
    }
    return { base64: atob(chars.join("")), invalidChars };
}


/**@type {Array<Encoding>} */
const ascii = [
    {
        nameHTML: 'base 64 encode',
        key: '64enc',
        fnc: str => {
            return btoa(str);
        }
    },
    {
        nameHTML: 'base 64 decode',
        key: '64dec',
        helpHTML: `
        standard base 64 decoding 
        <a href="https://en.wikipedia.org/wiki/Base64">https://en.wikipedia.org/wiki/Base64</a>
        <br>
        
        hiddenBits mode is explained here <a href="https://hexarcana.ch/b/2024-08-16-base64-beyond-encoding/">
            https://hexarcana.ch/b/2024-08-16-base64-beyond-encoding/
        </a>
        `,
        matcher: (str) => {
            // if there is an = not at the end
            if(str.includes('=') && str.match(/=[a-zA-Z0-9]/)) {
                return false;
            }
            const lines = str.split(/\r?\n/);
            const isBase64 = lines.every(line => {
                if(line.trim().length === 0) {
                    return true;
                }
                return line.length % 4 === 0 && !line.match(/[^a-zA-Z0-9+\/=]/g);
            });

            if(isBase64) {
                let hasBitsCt = 0;
                str.split(/\r?\n/).forEach(line => {
                    const bits = manualDecodeHiddenBits(line);
                    if(bits) {
                        hasBitsCt++;
                    }
                });


                if(hasBitsCt > (lines.length / 4)) {
                    return {
                        hiddenBits: "on"
                    };
                }

            }

            return isBase64;
        },
        fnc: (str, c, t, opts) => {
            if(t?.currentParameter?.options?.hiddenBits) {
                /**
                 * @type {Array<string>}
                 */
                let hiddenBits = [];

                str.split(/\r?\n/).forEach(line => {
                    const bits = manualDecodeHiddenBits(line);
                    if(bits) {
                        hiddenBits.push(bits);
                    }
                });

                const hiddenBitsStr = hiddenBits.join("");
                let chars = "";
                for(let i = 0; i < hiddenBitsStr.length; i += 8) {
                    const substr = hiddenBitsStr.substring(i, i + 8);
                    if(substr.length < 8) {
                        break;
                    }
                    chars += String.fromCharCode(parseInt(substr, 2));
                }
                return chars;
            } else if(t?.currentParameter?.options?.invalidCharCounts) {
                /**
                 * @type {Array<string>}
                 */
                const invalidChars = [];



                str.split(/\r?\n/).forEach(line => {
                    const bits = decodeInvalidChars(line);
                    if(bits) {
                        invalidChars.push(bits.invalidChars.map(c => {
                            return c.ct;
                        }).join(" "));
                    }
                });

                return invalidChars.join("\n");

            }
            return str.split(/\r?\n/).map(line => {
                const decoded = atob(line);

                if(opts.parameters.unescape !== "") {
                    return decodeURIComponent(escape(decoded));
                }
                return decoded;
            }).join("\n");

        },
        options: {
            hiddenBits: {
                type: "checkbox",
                defaultV: "off"
            },
            invalidCharCounts: {
                type: "checkbox",
                defaultV: "off"
            },
            "unescape": {
                type: "checkbox",
                defaultV: "on"
            }
        }
    },
];

export default ascii;