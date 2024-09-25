/// <reference path="../endecoding.d.ts" />
/// <reference path="./opengpg_types.d.ts" />

/**
 * @type {Array<Encoding>}
 */
const gpg = [{
    nameHTML: 'gpg',
    key: 'gpg',
    fnc: async (str, htmlRef, ref,) => {

        str = str.trim();

        if(ref?.currentParameter?.options.operation === "read_key") {

            str = str.trim();

            if(!str.startsWith("-----BEGIN PGP PUBLIC KEY BLOCK-----")) {
                return "invalid pgp key (must start with -----BEGIN PGP PUBLIC KEY BLOCK-----)";
            }
            const publicKey = await openpgp.readKey({ armoredKey: str });


            const expTime = await publicKey.getExpirationTime();

            return JSON.stringify({
                id: publicKey.getKeyID().toHex(),
                fingerprint: publicKey.getFingerprint(),
                created: publicKey.getCreationTime(),
                expiration: isFinite(expTime) ? expTime : "Infinity",
                alghorithm: publicKey.getAlgorithmInfo()
            });
        }
        return "";
    },
    options: {
        operation: {
            type: "select",
            options: [{
                text: "read_key",
                value: "read_key"
            }]
        }
    }
}];
export default gpg;