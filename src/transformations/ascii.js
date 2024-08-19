
/// <reference path="../endecoding.d.ts" />

/**@type {Array<Encoding>} */
const ascii = [
    {
        nameHTML: 'string to ascii',
        title: "convert each character to its ascii representation",
        key: "strtoascii",
        fnc: str => str.split('')
            .map(c => c.charCodeAt(0))
            .join(' ')
    },
    {
        nameHTML: 'ascii to string',
        key: "asciitostr",
        title: "convert ascii to string (space seperated or 2 chars each)",
        fnc: (str, c, textO) => {


            let chArray = str.split('');
            if(str.split(' ').length > str.length / 5 || str.length < 5) {
                chArray = str.split(' ');
            }
            let t = '';
            for(let i = 0; i < chArray.length; i += 2) {

                if(textO.currentParameter.options.combineFrom2Hex) {
                    t += String.fromCharCode(parseInt(chArray[i] + chArray[i + 1], 16));
                } else if(+chArray[i] < 3) {
                    t += String.fromCharCode((+chArray[i] * 100) + (+chArray[i + 1] * 10) + ((+chArray[i + 2]) * 1));
                    i++;
                } else {
                    t += String.fromCharCode(+chArray[i] * 10) + (+chArray[i + 1] | 0);
                }
            }
            return t;
        }, options: {
            combineFrom2Hex: {
                type: "checkbox",
                defaultV: "off"
            }
        }
    },
    {
        nameHTML: 'ascii digit to string',
        title: "convert each character into ascii (ends up control chars mostly)",
        fnc: str => {
            return str.split('')
                .map(c => String.fromCharCode(Number(c)))
                .join('');
        }
    },
    {
        nameHTML: 'lowercase',
        title: "convert string to lower case",
        fnc: str => {
            return str.split('')
                .map(c => c.toLowerCase())
                .join('');
        }
    },
    {
        nameHTML: 'UPPERCASE',
        title: "convert string to upper case",
        fnc: str => {
            return str.split('')
                .map(c => c.toUpperCase())
                .join('');
        }
    },
    {
        nameHTML: 'invertCASE',
        title: "every char that was uppercase to lower and lower to upper",
        fnc: str => {
            return str.split('')
                .map(c => {
                    if(c === c.toUpperCase()) {
                        return c.toLowerCase();
                    }
                    return c.toUpperCase();
                })
                .join('');
        }
    },
];

export default ascii;