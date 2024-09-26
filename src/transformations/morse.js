/// <reference path="../endecoding.d.ts" />
/**
 * @type {Record<string,string>}
 */
const letters = {
    '/': ' ',
    '.-': 'a',
    '.-.-': 'ä',
    '-...': 'b',
    '-.-.': 'c',
    '----': 'ch',
    '-..': 'd',
    '.': 'e',
    '..-.': 'f',
    '--.': 'g',
    '....': 'h',
    '..': 'i',
    '.---': 'j',
    '-.-': 'k',
    '.-..': 'l',
    '--': 'm',
    '-.': 'n',
    '---': 'o',
    '---.': 'ö',
    '.--.': 'p',
    '--.-': 'q',
    '.-.': 'r',
    '...': 's',
    '......': 'ß',
    '-': 't',
    '..-': 'u',
    '..--': 'ü',
    '...-': 'v',
    '.--': 'w',
    '-..-': 'x',
    '-.--': 'y',
    '--..': 'z',
    '.----': '1',
    '..---': '2',
    '...--': '3',
    '....-': '4',
    '.....': '5',
    '_....': '6',
    '--...': '7',
    '---..': '8',
    '----.': '9',
    '-----': '0',
    '.-.-.-': '.',
    '--..--': ',',
    '..--..': '?',
    '-....-': '-',
    '.-.-.': '+',
    '-.-.--': '!',
    '-..-.': '/',
    '---...': ':',
    '.-..-.': '"',
    '-...-': '=',
    '.----.': '\''

};
/**
 * @type {Array<Encoding>}
 */
const morse = [{
    nameHTML: 'morse encoding',
    key: 'morseenc',
    fnc: str => {
        return str.toLowerCase()
            .split('')
            .map(c => Object.entries(letters)
                ?.find(entry => entry[1] === c)?.[0])
            .join(' ');
    }
}, {
    nameHTML: 'morse decoding',
    key: 'morsedec',
    matcher: str => !str.match(/[^-. \/]/g),
    fnc: str => {
        return str.split(' ')
            .map(s => {
                return letters[s] || (s === '' ? ' ' : s);
            })
            .join('');
    }
}];
export default morse;