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
                    disableOptions: new Set(["private_key"])
                }, {
                    text: "generate new private key",
                    value: "generate_new_private_key",
                    disableOptions: new Set(["private_key", "public_key"])
                }, {
                    text: "encrypt",
                    value: "encrypt",
                }, {
                    text: "decrypt",
                    value: "decrypt",
                    disableOptions: new Set(["public_key"])
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
            }
        },
        fnc: (str, out, ref) => {
            /**
             * @type {PrivateKey}
             */
            let priv
            /**
             * @type {PublicKey}
             */
            let pub
            if(ref.currentParameter.options.private_key) {
                priv = forge.pki.privateKeyFromPem(ref.currentParameter.options.private_key)
                pub = forge.pki.setRsaPublicKey(priv.n, priv.e)
            } else if(str.startsWith("-----BEGIN RSA PRIVATE KEY-----")) {
                priv = forge.pki.privateKeyFromPem(str)
                pub = forge.pki.setRsaPublicKey(priv.n, priv.e)
            }
            if(ref.currentParameter.options.public_key) {
                pub = forge.pki.publicKeyFromPem(ref.currentParameter.options.public_key)
            }
            const operation = ref.currentParameter.options.operation
            if(operation === "generate_public_key") {
                return forge.pki.publicKeyToPem(pub)
            } else if(operation === "encrypt") {
                const encryptedBytes = pub.encrypt(str, "RSA-OAEP", {
                    md: forge.md.sha256.create(),
                    mgf1: {
                        md: forge.md.sha1.create()
                    }
                })
                return btoa(encryptedBytes)
            } else if(operation === "decrypt") {

                const utf8Str = atob(str)
                const decrypted = priv.decrypt(utf8Str, 'RSA-OAEP', {
                    md: forge.md.sha256.create(),
                    mgf1: {
                        md: forge.md.sha1.create()
                    }
                });
                return decrypted
            } else if(operation === "generate_new_private_key") {
                const keyPair = forge.rsa.generateKeyPair({
                    bits: 2048
                })
                return forge.pki.privateKeyToPem(keyPair.privateKey)
            }

            return str
        },
        matcher(str) {
            return str.startsWith("-----BEGIN RSA PRIVATE KEY-----")
        }
    }

]