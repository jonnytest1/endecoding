

/**
 * @type {Array<PrivateKey>}
 */
const keyCache = [];


/**@type {Array<Encoding>} */
export const rsa = [
    {
        nameHTML: "rsa",
        options: {
            operation: {
                type: "select",
                options: [{
                    text: "generate_public_key",
                    value: "generate_public_key",
                    disableOptions: new Set(["public_key", "data"])
                }, {
                    text: "generate new private key",
                    value: "generate_new_private_key",
                    disableOptions: new Set(["private_key", "public_key", "data"])
                }, {
                    text: "encrypt",
                    value: "encrypt",
                }, {
                    text: "decrypt",
                    value: "decrypt",
                    disableOptions: new Set(["public_key"])
                }, {
                    text: "hash",
                    value: "hash",
                    disableOptions: new Set(["private_key", "public_key", "data"])
                }]
            },
            private_key: {
                type: "text",
                displayText: "private key",
                title: "will be used for deriving a public key"
            },
            public_key: {
                type: "text",
                displayText: "public key?",
                title: "will overwrite the public key derived from private if specified"
            },
            data: {
                type: "text",
                displayText: "data?",
                title: "will use this text in case key is used for input"
            }
        },
        fnc: (str, out, ref) => {
            /**
             * @type {PrivateKey}
             */
            let priv;
            /**
             * @type {PublicKey}
             */
            let pub;

            let contentData = str;

            if(ref.currentParameter.options.data) {
                contentData = ref.currentParameter.options.data;
            }

            if(ref.currentParameter.options.private_key && !ref.currentParameter.options.private_key.includes("<inherited from")) {
                priv = forge.pki.privateKeyFromPem(ref.currentParameter.options.private_key);
                pub = forge.pki.setRsaPublicKey(priv.n, priv.e);
            } else if(str.startsWith("-----BEGIN RSA PRIVATE KEY-----")) {
                priv = forge.pki.privateKeyFromPem(str);
                pub = forge.pki.setRsaPublicKey(priv.n, priv.e);
            } else if(str.startsWith("-----BEGIN PUBLIC KEY----")) {
                pub = forge.pki.publicKeyFromPem(str);
            }
            if(ref.currentParameter.options.public_key) {
                pub = forge.pki.publicKeyFromPem(ref.currentParameter.options.public_key);
            }
            if(priv) {
                keyCache[ref.index] = priv;
            } else {
                for(let i = ref.index; i >= 0; i--) {
                    if(keyCache[i]) {
                        priv = keyCache[i];

                        const inputEl = ref.optionsElement?.querySelector("#option_private_key")?.querySelector("input");
                        if(inputEl) {
                            inputEl.value = `<inherited from #${i}>`;
                        }

                        break;
                    }
                }
            }
            const operation = ref.currentParameter.options.operation;
            if(operation === "generate_public_key") {
                if(!pub) {
                    pub = forge.pki.setRsaPublicKey(priv.n, priv.e);
                }
                return forge.pki.publicKeyToPem(pub);
            } else if(operation === "encrypt") {
                try {
                    const encryptedBytes = pub.encrypt(contentData, "RSA-OAEP", {
                        md: forge.md.sha256.create(),
                        mgf1: {
                            md: forge.md.sha1.create()
                        }
                    });
                    return btoa(encryptedBytes);
                } catch(e) {
                    if(e.message === "RSAES-OAEP input message length is too long.") {
                        e.message = `${e.message}\n\n ==> usually the idea for long messages is to use aes for the message and encrypt only the secret with rsa`;
                    }
                    throw e;
                }
            } else if(operation === "decrypt") {

                const utf8Str = atob(contentData);
                const decrypted = priv.decrypt(utf8Str, 'RSA-OAEP', {
                    md: forge.md.sha256.create(),
                    mgf1: {
                        md: forge.md.sha1.create()
                    }
                });
                return decrypted;
            } else if(operation === "generate_new_private_key") {
                const keyPair = forge.rsa.generateKeyPair({
                    bits: 2048
                });
                return forge.pki.privateKeyToPem(keyPair.privateKey);
            } else if(operation == "hash") {
                let privHash;
                let pubHash;

                if(priv) {
                    let hash = forge.md.sha256.create();
                    hash.update(forge.pki.pemToDer(forge.pki.privateKeyToPem(priv)).getBytes());
                    privHash = hash.digest().toHex();
                }

                if(pub) {
                    let hash = forge.md.sha256.create();
                    hash.update(forge.pki.pemToDer(forge.pki.publicKeyToPem(pub)).getBytes());
                    pubHash = hash.digest().toHex();
                }

                if(privHash && pubHash) {
                    return JSON.stringify({
                        privateKey: privHash,
                        publicKey: pubHash
                    }, null, "  ");
                } else if(privHash) {
                    return privHash;
                } else if(pubHash) {
                    return pubHash;
                }

            }

            return str;
        },
        matcher(str, add) {
            if(str.startsWith("-----BEGIN PUBLIC KEY----")) {
                return {
                    operation: "encrypt"
                };
            }

            return str.startsWith("-----BEGIN RSA PRIVATE KEY-----");
        }
    }

];