

/**
 * @type {Array<Cert>}
 */
const keyCache = [];



/**@type {Array<Encoding>} */
export const crt = [
    {
        nameHTML: "crt",
        fnc: (str, out, ref) => {
            const trimmedStr = str.trim();
            let crt;
            if(trimmedStr.startsWith("-----BEGIN CERTIFICATE-----")) {
                crt = forge.pki.certificateFromPem(trimmedStr);
                if(crt) {
                    keyCache[ref.index] = crt;
                }
                let hash = forge.md.sha256.create();
                hash.update(forge.pki.pemToDer(str).getBytes());
                const certHash = hash.digest().toHex();

                const m = forge.md.sha256.create();
                m.update(forge.asn1.toDer(forge.pki.publicKeyToAsn1(crt.publicKey)).getBytes());
                const publicKeyHash = m.digest().toHex();

                return JSON.stringify({
                    extensions: crt.extensions,
                    validity: crt.validity,
                    issuer: Object.fromEntries(crt.issuer.attributes.map(attr => [attr.name, attr.shortName])),
                    subject: Object.fromEntries(crt.subject.attributes.map(attr => [attr.name, attr.shortName])),
                    sha256: {
                        certificate: certHash,
                        publicKey: publicKeyHash,
                        //maybe hash this(and other modulus) for easier compare 🤔
                        publicKey_modulus: crt.publicKey.n.toString()

                    }
                }, undefined, "  ");
            } else if(trimmedStr.startsWith("-----BEGIN CERTIFICATE REQUEST-----")) {
                const crtReq = forge.pki.certificationRequestFromPem(trimmedStr);

                let hash = forge.md.sha256.create();
                hash.update(forge.pki.pemToDer(trimmedStr).getBytes());
                const certRequestHash = hash.digest().toHex();

                const m = forge.md.sha256.create();
                m.update(forge.asn1.toDer(forge.pki.publicKeyToAsn1(crtReq.publicKey)).getBytes());
                const publicKeyHash = m.digest().toHex();

                return JSON.stringify({
                    subject: Object.fromEntries(crtReq.subject.attributes.map(attr => [attr.name, attr.shortName])),
                    sha256: {
                        certificate: certRequestHash,
                        publicKey: publicKeyHash,
                        //maybe hash this(and other modulus) for easier compare 🤔
                        publicKey_modulus: crtReq.publicKey.n.toString()
                    }
                }, undefined, "  ");
            } else if(trimmedStr.startsWith("-----BEGIN PRIVATE KEY-----")) {
                const privateKey = forge.pki.privateKeyFromPem(trimmedStr);

                let hash = forge.md.sha256.create();
                hash.update(forge.pki.pemToDer(trimmedStr).getBytes());
                const certRequestHash = hash.digest().toHex();

                return JSON.stringify({
                    sha256: certRequestHash,
                    // maybe hash this(and other modulus) for easier compare 🤔
                    modulus: privateKey.n.toString()
                }, undefined, "  ");
            }
        },
        matcher: (str) => {
            str = str.trim();
            return str.startsWith("-----BEGIN PRIVATE KEY-----")
                || str.startsWith("-----BEGIN CERTIFICATE-----")
                || str.startsWith("-----BEGIN CERTIFICATE REQUEST-----");
        }

    }

];
