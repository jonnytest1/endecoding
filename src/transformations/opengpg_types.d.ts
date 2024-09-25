

interface PGPPublicKey {
    getCreationTime(): Date
    getFingerprint(): string
    getAlgorithmInfo(): {
        algorithm: string,
        bits: number
    }
    getKeyID(): HashDigest
    keyPacket: {
        created: Date
    }

    getExpirationTime(): Promise<number>
}



interface OpenGpgRoot {
    readKey: (opts: { armoredKey: string }) => Promise<PGPPublicKey>
}



declare interface Window {
    openpgp: OpenGpgRoot
}

declare var openpgp: OpenGpgRoot;