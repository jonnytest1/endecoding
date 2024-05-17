
interface ForgeBuffer {
    data: string

    getBytes(): string

    putBytes(bytes: string): this
}
interface Cipher {
    start(optsions: {
        iv: string
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
        iv: string
        tagLength: number
        tag: string
    }): void
}
type Encodings = "utf8"
interface MessageDigest<version extends keyof MessageDigestRoot> {

    __typebreak: version
    update(data: string, encoding: Encodings): void

    digest(): string
}

interface DecryptOptions {
    md: MessageDigest<"sha256">,

    mgf1: {
        md: MessageDigest<"sha1">
    }

    label?: string,
    seed?: number

}
type N = { ___break?: "n" }
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
}


type MessageDigestRoot = {
    sha256: {
        create(): MessageDigest<"sha256">
    }
    sha1: {
        create(): MessageDigest<"sha1">
    }
}

declare const forgeObj: {
    md: MessageDigestRoot
    pki: {
        publicKeyToPem(pub: PublicKey): string
        privateKeyFromPem: (key: string) => PrivateKey
        publicKeyFromPem: (key: string) => PublicKey
        setRsaPublicKey(n: N, e: E): PublicKey
    }
    util: {
        createBuffer(data: ArrayBuffer | string): ForgeBuffer
        encode64(data: string): string
    }

    random: {
        getBytesSync(length: number): string
    }
    pkcs5: {
        pbkdf2(secret: string, salt: string, hashIteration: number, length: number, hashMethod: "sha256"): string
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