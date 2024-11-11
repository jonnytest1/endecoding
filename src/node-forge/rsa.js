

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
                }, {
                    text: "create cert",
                    value: "crt",
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
        fnc: (str, out, ref, opts) => {
            /**
             * @type {PrivateKey|undefined}
             */
            let priv;
            /**
             * @type {PublicKey|undefined}
             */
            let pub;

            let contentData = str;

            if(opts.parameters.data) {
                contentData = opts.parameters.data;
            }

            if(opts.parameters.private_key && !opts.parameters.private_key.includes("<inherited from")) {
                priv = forge.pki.privateKeyFromPem(opts.parameters.private_key);
                pub = forge.pki.setRsaPublicKey(priv.n, priv.e);
            } else if(str.startsWith("-----BEGIN RSA PRIVATE KEY-----")) {
                priv = forge.pki.privateKeyFromPem(str);
                pub = forge.pki.setRsaPublicKey(priv.n, priv.e);
            } else if(str.startsWith("-----BEGIN PUBLIC KEY----")) {
                pub = forge.pki.publicKeyFromPem(str);
            }
            if(opts.parameters.public_key) {
                pub = forge.pki.publicKeyFromPem(opts.parameters.public_key);
            }
            if(ref) {
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
            }
            const operation = opts.parameters.operation;
            if(operation === "generate_public_key") {
                if(!pub && priv) {
                    pub = forge.pki.setRsaPublicKey(priv.n, priv.e);
                }
                if(!pub) {
                    throw new Error("no public key");
                }
                return forge.pki.publicKeyToPem(pub);
            } else if(operation === "encrypt") {
                if(!pub) {
                    throw new Error("no public key");
                }
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
                if(!priv) {
                    throw new Error("no private key");
                }
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

            } else if(operation == "crt") {
                if(!pub && priv) {
                    pub = forge.pki.setRsaPublicKey(priv.n, priv.e);
                }

                if(!pub) {
                    throw new Error("missing public/private key");
                }

                const crt = forge.pki.createCertificate();
                crt.publicKey = pub;
                crt.serialNumber = '01' + forge.util.bytesToHex(forge.random.getBytesSync(19));

                crt.validity.notBefore = new Date();
                const validityDays = 356 * 10;
                crt.validity.notAfter = new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * (validityDays ?? 1));
                const attrs = [{
                    name: 'commonName',
                    value: 'CN'
                }];
                crt.setSubject(attrs);
                crt.setIssuer(attrs);
                /**
                 * @type {Array<string>}
                 */
                const altNameDNS = [];
                /**
                 * @type {Array<string>}
                 */
                const altNameIPs = [];

                // add alt names so that the browser won't complain
                crt.setExtensions([{
                    name: 'subjectAltName',
                    altNames: [
                        ...(altNameDNS !== undefined ?
                            altNameDNS.map((uri) => ({ type: 6, value: uri })) :
                            []
                        ),
                        ...(altNameIPs !== undefined ?
                            altNameIPs.map((uri) => ({ type: 7, ip: uri })) :
                            []
                        )
                    ]
                }]);

                if(!priv) {
                    throw new Error("missing private key");
                }
                // self-sign certificate
                crt.sign(priv);
                const pem = forge.pki.certificateToPem(crt);


                return pem;
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