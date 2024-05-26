
declare class Engine { }


interface QRInstance {
    start(): unknown;
    setInversionMode(arg0: string): unknown;

}

declare var QrScanner: {
    scanImage(img: HTMLImageElement | HTMLCanvasElement, options?: { qrEngine: Engine }): Promise<{ data: string }>

    createQrEngine(): Promise<Engine>


    new(img: HTMLImageElement | HTMLCanvasElement,): QRInstance
}