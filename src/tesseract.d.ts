



type Language = "eng"
interface Result {
    data: {
        text: string
        words: Array<{
            text: string,
            confidence: number
        }>
    }
}

interface ProgressEvent {
    progress: number

    status?: string
}

interface RecognizeOptinos {
    logger?: (e: ProgressEvent) => void
}
interface TesseractWorker {
    recognize(src: string): Promise<Result>;

}
declare var Tesseract: {
    createWorker(language: Language, oemMode: number, opts?: RecognizeOptinos): Promise<TesseractWorker>
    recognize(data: string, language: Language, opts?: RecognizeOptinos): Promise<Result>
    //TesseractWorker: new () => TesseractWorker
}