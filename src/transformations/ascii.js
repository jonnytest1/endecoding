
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
        fnc: str => {
            let t = '';

            if(str.split(' ').length > str.length / 5 || str.length < 5) {
                return str.split(' ')
                    .map(char => String.fromCharCode(+char))
                    .join('');
            }

            let ar = str.split('');
            for(let i = 0; i < ar.length; i += 2) {
                if(+ar[i] < 3) {
                    t += String.fromCharCode((+ar[i] * 100) + (+ar[i + 1] * 10) + ((+ar[i + 2]) * 1));
                    i++;
                } else {
                    t += String.fromCharCode(+ar[i] * 10) + (+ar[i + 1] | 0);
                }
            }
            return t;
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
                        return c.toLowerCase()
                    }
                    return c.toUpperCase();
                })
                .join('');
        }
    },
];

export default ascii;