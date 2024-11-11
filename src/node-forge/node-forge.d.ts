
interface ForgeBuffer {
    data: BytesStr

    getBytes(): string

    putBytes(bytes: string): this
}
interface Cipher {
    start(optsions: {
        iv: BytesStr
        /**
         * defaults to 128
         */
        tagLength?: number
    }): void

    update(cipherText: ForgeBuffer): void

    finish(): boolean
    output: ForgeBuffer

    mode: {
        tag: ForgeBuffer
    }
}

interface Decipher extends Cipher {
    start(optsions: {
        iv: BytesStr
        tagLength: number
        tag: string
    }): void
}
type Encodings = "utf8"

interface HashDigest {
    toHex(): string
}

interface MessageDigest<version extends keyof MessageDigestRoot> {

    __typebreak: version
    update(data: string, encoding?: Encodings): void

    digest(): HashDigest
}

interface DecryptOptions {
    md: MessageDigest<"sha256">,

    mgf1: {
        md: MessageDigest<"sha1">
    }

    label?: string,
    seed?: number

}
type N = { ___break?: "n", toString(): string }
type E = { ___break?: "e" }
type encryptonSchemes = "RSA-OAEP"
type PrivateKey = {
    n: N,
    e: E
    decrypt(data: string, scheme: encryptonSchemes, schemeOptinos: DecryptOptions): string
    sign(md: string, scheme: encryptonSchemes): unknown
}
interface PublicKey {
    encrypt(bytes: string, scheme: encryptonSchemes, schemeOptinos: DecryptOptions): string,
    verify(): boolean

    n: N
}


type MessageDigestRoot = {
    sha256: {
        create(): MessageDigest<"sha256">
    }
    sha1: {
        create(): MessageDigest<"sha1">
    }
}

interface Cert {
    sign(priv: PrivateKey): unknown
    setExtensions(arg0: { name: string; altNames: ({ type: number; value: string } | { type: number; ip: string })[] }[]): unknown
    setIssuer(attrs: { name: string; value: string }[]): unknown
    setSubject(attrs: { name: string; value: string }[]): unknown
    serialNumber: string
    publicKey: PublicKey
    extensions: Array<{
        name: string
        altNames?: Array<{
            ip: string
        }>
    }>

    issuer: {
        attributes: Array<{ name: string, shortName: string }>
    },
    subject: {
        attributes: Array<{ name: string, shortName: string }>,
    }
    validity: {
        notAfter: Date
        notBefore: Date
    }
}
interface CertReq {
    publicKey: PublicKey

    subject: {
        attributes: Array<{ name: string, shortName: string }>,
    }
}

interface ASN {

}


declare const bytesSymbol: unique symbol;
type BytesStr = string & { [bytesSymbol]: true }

declare const forgeObj: {
    asn1: {
        toDer(asn: ASN): ForgeBuffer
    }
    rsa: {
        generateKeyPair(opts: { bits?: number }): {
            publicKey: PublicKey

            privateKey: PrivateKey
        }
    }
    md: MessageDigestRoot
    pki: {
        certificateToPem(cert: Cert): string
        createCertificate(): Cert
        publicKeyToAsn1(publicKey: PublicKey): ASN
        pemToDer(pem: string): ForgeBuffer
        certificateFromPem(pem: string): Cert
        certificationRequestFromPem(pem: string): CertReq
        publicKeyToPem(pub: PublicKey): string
        privateKeyToPem(pub: PrivateKey): string
        privateKeyFromPem: (key: string) => PrivateKey
        publicKeyFromPem: (key: string) => PublicKey
        setRsaPublicKey(n: N, e: E): PublicKey
    }
    util: {
        bytesToHex(arg0: BytesStr): string
        createBuffer(data: ArrayBuffer | string): ForgeBuffer
        encode64(data: string): string
    }

    random: {
        getBytesSync(length: number): BytesStr
    }
    pkcs5: {
        pbkdf2(secret: string, salt: BytesStr, hashIteration: number, length: number, hashMethod: "sha256"): string
    }
    cipher: {
        createCipher(cipher: "AES-GCM", key: string): Cipher
        createDecipher(cipher: "AES-GCM", key: string): Decipher
    }
}


declare interface Window {
    forge: typeof forgeObj
}
declare var forge: typeof forgeObj;