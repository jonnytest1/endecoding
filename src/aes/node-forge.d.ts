
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

declare const forgeObj: {
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