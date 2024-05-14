/// <reference path="../endecoding.d.ts" />
/// <reference path="./node-forge.d.ts" />
// @ts-check
/**
 *
 * @param {string} secret
 * @param {Encoding} encoding
 * @param {import("../textOutput").HTMLConvElement} out
 * @param {import("../textOutput").TextOutput} ref
 */
function addSelect(secret, encoding, out, ref) {
    /**
     * @type {Array<string>}
     */
    let previousSecrets = JSON.parse(localStorage.getItem('aes_secrets')) || [];
    if(!previousSecrets.includes(secret)) {
        previousSecrets.push(secret);
        localStorage.setItem('aes_secrets', JSON.stringify(previousSecrets));
    }
    out.innerHTML = `${encoding.nameHTML}
    <select>
        ${previousSecrets.map(sec => {
        const d = document.createElement('div');
        d.innerText = sec;
        return `<option ${sec === secret ? 'selected' : ''} value="${d.innerHTML}">${d.innerHTML}</option>`;
    })}
    </select>`;
    const selectElement = out.querySelector('select');
    selectElement.onclick = e => {
        e.stopPropagation();
    };

    selectElement.onchange = () => {
        out.val = selectElement.value;
        ref.recalculate();
    };
}
/**@type {Array<Encoding>} */
const aes = [
    {
        nameHTML: 'aes encrypt',
        title: "aes encrypt (iv,salt,data,tag)",
        key: 'aesenc',
        onchoose: queryValue => prompt('aes secret (kept in localStorage)', queryValue || ''),
        fnc: function(str, out, ref) {
            let secret = out.val;
            addSelect(secret, this, out, ref);

            var iv = forge.random.getBytesSync(12);

            var salt = forge.random.getBytesSync(16);
            var key = forge.pkcs5.pbkdf2(secret, salt, 65536, 32, 'sha256');
            const cipher = forge.cipher.createCipher('AES-GCM', key);
            cipher.start({
                iv: iv,
                tagLength: 128 // optional, defaults to 128 bits
            });
            cipher.update(forge.util.createBuffer(str));

            cipher.finish();
            const encrypted = cipher.output;

            const tag = cipher.mode.tag;

            const encryptedBuffer = forge.util.createBuffer("")
            if(ref.currentParameter.options.ivAtStart) {
                encryptedBuffer.putBytes(iv)
            }
            encryptedBuffer.putBytes(salt)
            encryptedBuffer.putBytes(encrypted.data)
            encryptedBuffer.putBytes(tag.data);

            if(!ref.currentParameter.options.ivAtStart) {
                encryptedBuffer.putBytes(iv)
            }
            const encodedB64 = forge.util.encode64(encryptedBuffer.data);

            return encodedB64;
        },
        options: {
            ivAtStart: { type: "checkbox", defaultV: "true" }
        }
    }, {
        nameHTML: 'aes decrypt',
        key: 'aesdec',
        title: "aes decrypt (iv,salt,data,tag)",
        onchoose: queryValue => prompt('aes secret (kept in localStorage)', queryValue || ''),
        fnc: function(str, out, ref) {
            let secret = out.val;
            addSelect(secret, this, out, ref);

            /**
             * 
             * @param {string} base64 
             */
            function base64ToArrayBuffer(base64) {
                var binaryString = window.atob(base64);
                var len = binaryString.length;
                var bytes = new Uint8Array(len);
                for(var i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                return bytes.buffer;
            }

            const byteBuffer = base64ToArrayBuffer(str);

            /**
             * @type {ForgeBuffer}
             */
            let forgeIvBuffer

            let startOffset = 0
            let endOFfset = byteBuffer.byteLength

            const ivLength = 12
            const saltLength = 16
            const tagLength = 16

            if(ref.currentParameter.options.ivAtStart) {
                const ivBuffer = byteBuffer.slice(startOffset, startOffset + ivLength);
                forgeIvBuffer = forge.util.createBuffer(ivBuffer);
                startOffset += ivLength
            }

            const saltBuffer = byteBuffer.slice(startOffset, startOffset + saltLength);
            const forgeSaltBuffer = forge.util.createBuffer(saltBuffer);
            startOffset += saltLength


            //end offsets inverted
            if(!ref.currentParameter.options.ivAtStart) {
                const ivBuffer = byteBuffer.slice(endOFfset - ivLength, endOFfset);
                forgeIvBuffer = forge.util.createBuffer(ivBuffer);
                endOFfset -= ivLength
            }


            const tagBuffer = byteBuffer.slice(endOFfset - tagLength, endOFfset);
            const forgeTagBuffer = forge.util.createBuffer(tagBuffer);
            endOFfset -= tagLength


            const cipherBuffer = byteBuffer.slice(startOffset, endOFfset);
            const forgeCipherBuffer = forge.util.createBuffer(cipherBuffer);


            var key = forge.pkcs5.pbkdf2(secret, forgeSaltBuffer.data, 65536, 32, 'sha256');

            var decipher = forge.cipher.createDecipher('AES-GCM', key);

            decipher.start({
                iv: forgeIvBuffer.data,
                tagLength: 128, // optional, defaults to 128 bits
                tag: forgeTagBuffer.data // authentication tag from encryption
            });
            decipher.update(forgeCipherBuffer);
            var pass = decipher.finish();
            if(pass) {
                return decipher.output.getBytes();
            }
            throw 'couldnt decrypt';
        },
        options: {
            ivAtStart: { type: "checkbox", defaultV: "true" }
        }
    }
];

export default aes;