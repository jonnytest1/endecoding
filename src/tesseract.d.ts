



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
}

interface RecognizeOptinos {
    logger?: (e: ProgressEvent) => void
}

declare var Tesseract: {
    recognize(data: string, language: Language, opts?: RecognizeOptinos): Result
    //TesseractWorker: new () => TesseractWorker
}