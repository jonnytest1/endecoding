/// <reference path="../endecoding.d.ts" />
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
        matcher: str => {
            // if there is an = not at the end
            if(str.includes('=') && str.match(/=[a-zA-Z0-9]/)) {
                return false;
            }
            return str.length % 4 === 0 && !str.match(/[^a-zA-Z0-9+\/=]/g);
        },
        fnc: str => {
            return atob(str);
        }
    },
];

export default ascii;