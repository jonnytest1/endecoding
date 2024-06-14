

interface FileHandle {
    getFile(): File;

}

interface DataTransferItem {
    getAsFileSystemHandle?: () => Promise<FileHandle>
}