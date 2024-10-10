declare var ZXingBrowser: {
    BrowserMultiFormatReader: new () => {
        decodeFromImageElement(img: HTMLImageElement): Promise<{ text: string }>
        decodeFromCanvas(img: HTMLCanvasElement): Promise<string>
        decodeFromImageUrl: (url: string) => Promise<string>
    }
}
