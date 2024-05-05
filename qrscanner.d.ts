
class Engine { }


var QrScanner: {
    scanImage(img: HTMLImageElement | HTMLCanvasElement, options?: { qrEngine: Engine }): Promise<{ data: string }>

    createQrEngine(): Promise<Engine>
}