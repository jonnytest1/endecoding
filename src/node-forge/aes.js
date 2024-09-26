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
    let previousSecrets = JSON.parse(localStorage.getItem('aes_secrets') ?? "[]") || [];
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
    if(!selectElement) {
        throw new Error("failed adding select");
    }
    selectElement.onclick = e => {
        e.stopPropagation();
    };

    selectElement.onchange = async () => {
        out.val = selectElement.value;
        await ref.recalculate();
    };
}

/**
* 
* @param {string} base64 
*/
function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for(let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * @param {ArrayBufferLike} byteBuffer;
 * @param {string} secret;
 * @param {boolean} [ivAtStart];
 */
function decrypt(byteBuffer, secret, ivAtStart = false) {
    /**
     * @type {ForgeBuffer|undefined}
     */
    let forgeIvBuffer;

    let startOffset = 0;
    let endOFfset = byteBuffer.byteLength;

    const ivLength = 12;
    const saltLength = 16;
    const tagLength = 16;

    if(ivAtStart) {
        const ivBuffer = byteBuffer.slice(startOffset, startOffset + ivLength);
        forgeIvBuffer = forge.util.createBuffer(ivBuffer);
        startOffset += ivLength;
    }

    const saltBuffer = byteBuffer.slice(startOffset, startOffset + saltLength);
    const forgeSaltBuffer = forge.util.createBuffer(saltBuffer);
    startOffset += saltLength;


    //end offsets inverted
    if(!ivAtStart) {
        const ivBuffer = byteBuffer.slice(endOFfset - ivLength, endOFfset);
        forgeIvBuffer = forge.util.createBuffer(ivBuffer);
        endOFfset -= ivLength;
    }
    if(!forgeIvBuffer) {
        throw new Error("no iv buffer 🤷🏻‍♂️");
    }

    const tagBuffer = byteBuffer.slice(endOFfset - tagLength, endOFfset);
    const forgeTagBuffer = forge.util.createBuffer(tagBuffer);
    endOFfset -= tagLength;


    const cipherBuffer = byteBuffer.slice(startOffset, endOFfset);
    const forgeCipherBuffer = forge.util.createBuffer(cipherBuffer);


    const key = forge.pkcs5.pbkdf2(secret, forgeSaltBuffer.data, 65536, 32, 'sha256');

    const decipher = forge.cipher.createDecipher('AES-GCM', key);

    decipher.start({
        iv: forgeIvBuffer?.data,
        tagLength: 128, // optional, defaults to 128 bits
        tag: forgeTagBuffer.data // authentication tag from encryption
    });
    decipher.update(forgeCipherBuffer);

    return decipher;
}
/**
 * @type {string|undefined}
 */
let matchedSecret;

/**@type {Array<Encoding>} */
const aes = [
    {
        nameHTML: 'aes encrypt',
        title: "aes encrypt (iv,salt,data,tag)",
        key: 'aesenc',
        onchoose: queryValue => prompt('aes secret (kept in localStorage)', queryValue || '') ?? "",
        fnc: function(str, out, ref, opts) {
            let secret = out?.val;

            if(secret && typeof secret === "string" && out && ref) {
                addSelect(secret, this, out, ref);
            }
            if(typeof secret !== "string") {
                return str;
            }

            const iv = forge.random.getBytesSync(12);

            const salt = forge.random.getBytesSync(16);
            const key = forge.pkcs5.pbkdf2(secret, salt, 65536, 32, 'sha256');
            const cipher = forge.cipher.createCipher('AES-GCM', key);
            cipher.start({
                iv: iv,
                tagLength: 128 // optional, defaults to 128 bits
            });
            cipher.update(forge.util.createBuffer(str));

            cipher.finish();
            const encrypted = cipher.output;

            const tag = cipher.mode.tag;

            const encryptedBuffer = forge.util.createBuffer("");
            if(opts.parameters.ivAtStart) {
                encryptedBuffer.putBytes(iv);
            }
            encryptedBuffer.putBytes(salt);
            encryptedBuffer.putBytes(encrypted.data);
            encryptedBuffer.putBytes(tag.data);

            if(!opts.parameters.ivAtStart) {
                encryptedBuffer.putBytes(iv);
            }
            const encodedB64 = forge.util.encode64(encryptedBuffer.data);

            return encodedB64;
        },
        options: {
            ivAtStart: { type: "checkbox", defaultV: "on" }
        }
    }, {
        nameHTML: 'aes decrypt',
        key: 'aesdec',
        title: "aes decrypt (iv,salt,data,tag)",
        matcherPrio: 10,
        matcher: (str) => {
            /**
             * @type {Array<string>}
             */
            let previousSecrets = JSON.parse(localStorage.getItem('aes_secrets') ?? "[]") || [];

            for(const secret of previousSecrets) {
                const byteBuffer = base64ToArrayBuffer(str);

                const decipherSIv = decrypt(byteBuffer, secret, true);
                const passSIv = decipherSIv.finish();
                if(passSIv) {
                    matchedSecret = secret;
                    setTimeout(() => {
                        matchedSecret = undefined;
                    }, 2000);
                    return {
                        ivAtStart: "on"
                    };
                }
                const decipher = decrypt(byteBuffer, secret, false);
                const pass = decipher.finish();
                if(pass) {
                    matchedSecret = secret;
                    setTimeout(() => {
                        matchedSecret = undefined;
                    }, 2000);
                    return {
                        ivAtStart: ""
                    };
                }
            }
            return false;
        },

        onchoose: queryValue => prompt('aes secret (kept in localStorage)', queryValue || '') ?? "",
        fnc: function(str, out, ref, opts) {
            if(matchedSecret && out) {
                out.val = matchedSecret;
                matchedSecret = undefined;
            }
            let secret = out?.val;

            if(secret && typeof secret === "string" && out && ref) {
                addSelect(secret, this, out, ref);
            }

            const byteBuffer = base64ToArrayBuffer(str);
            if(!secret || typeof secret !== "string") {
                return str;
            }
            const decipher = decrypt(byteBuffer, secret, !!opts.parameters.ivAtStart);

            const pass = decipher.finish();
            if(pass) {
                return decipher.output.getBytes();
            }
            throw new Error('couldnt decrypt');
        },
        options: {
            ivAtStart: { type: "checkbox", defaultV: "on" }
        }
    }
];

export default aes;