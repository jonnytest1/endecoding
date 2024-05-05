import MD5 from './md5';
import SHA1 from './sha1';
import SHA256 from './sha256';
/**@type {Array<Encoding>} */
const hashes = [
    {
        nameHTML: '<strike>sha1</strike>',
        key: 'sha1',
        fnc: str => {
            return SHA1(str);
        }
    },
    {
        nameHTML: 'sha256',
        key: 'sha256',
        fnc: str => {
            return SHA256(str);
        }
    },
    {
        nameHTML: 'MD5',
        key: 'md5',
        fnc: str => {
            return MD5(str);
        }
    }
];

export default hashes;