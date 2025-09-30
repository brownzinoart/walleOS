import { sha512 } from 'sha512-crypt-ts'
import { DefaultFSContent } from '@/app/SystemFolder/SystemResources/File/DefaultClassicyFileSystem'
import {
    ClassicyFileSystemEntry,
    ClassicyFileSystemEntryFileType,
    ClassicyFileSystemEntryMetadata,
} from '@/app/SystemFolder/SystemResources/File/ClassicyFileSystemModel'

export type ClassicyPathOrFileSystemEntry = string | ClassicyFileSystemEntry

const isFileSystemEntry = (value: unknown): value is ClassicyFileSystemEntry => {
    return typeof value === 'object' && value !== null
}

export class ClassicyFileSystem {
    basePath: string
    fs: ClassicyFileSystemEntry
    separator: string

    constructor(
        basePath: string = '',
        defaultFS: ClassicyFileSystemEntry = DefaultFSContent as ClassicyFileSystemEntry,
        separator: string = ':'
    ) {
        this.basePath = basePath
        const storedValue = typeof window !== 'undefined' ? localStorage.getItem(this.basePath) : null
        this.fs = storedValue ? (JSON.parse(storedValue) as ClassicyFileSystemEntry) : defaultFS
        this.separator = separator
    }

    load(data: string) {
        this.fs = JSON.parse(data) as ClassicyFileSystemEntry
    }

    snapshot(): string {
        return JSON.stringify(this.fs, null, 2)
    }

    pathArray = (path: string): string[] => {
        return [this.basePath, ...path.split(this.separator)].filter((value) => value !== '')
    }

    resolve(path: string): ClassicyFileSystemEntry | undefined {
        return this.pathArray(path).reduce<ClassicyFileSystemEntry | undefined>((prev, curr) => {
            if (!prev || typeof prev !== 'object') {
                return undefined
            }
            return prev[curr] as ClassicyFileSystemEntry
        }, this.fs)
    }

    formatSize(bytes: number, measure: 'bits' | 'bytes' = 'bytes', decimals: number = 2): string {
        if (!Number(bytes)) {
            return `0 ${measure}`
        }

        const sizeLabels =
            measure === 'bits'
                ? ['Bits', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb', 'Eb', 'Zb', 'Yb']
                : ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

        const index = Math.floor(Math.log(bytes) / Math.log(1024))
        const normalized = measure === 'bits' ? bytes * 8 : bytes
        const formatted = (normalized / Math.pow(1024, index)).toFixed(Math.max(0, decimals))
        return `${parseFloat(formatted)} ${sizeLabels[index]}`
    }

    filterMetadata(content: ClassicyFileSystemEntry = {}, mode: 'only' | 'remove' = 'remove'): ClassicyFileSystemEntry {
        const items: ClassicyFileSystemEntry = {}

        Object.entries(content).forEach(([key, value]) => {
            if (mode === 'only' && key.startsWith('_')) {
                items[key] = value
            }

            if (mode === 'remove' && !key.startsWith('_')) {
                items[key] = value
            }
        })

        return items
    }

    filterByType(
        path: string,
        byType: string | string[] = ['file', 'directory'],
        showInvisible: boolean = true
    ): ClassicyFileSystemEntry {
        const requestedTypes = Array.isArray(byType) ? byType : [byType]
        const resolved = this.resolve(path)
        const filteredItems: ClassicyFileSystemEntry = {}

        if (!resolved) {
            return filteredItems
        }

        Object.entries(resolved).forEach(([key, value]) => {
            const entry = value as ClassicyFileSystemEntry
            if (!showInvisible && entry._invisible) {
                return
            }
            if (entry._type && requestedTypes.includes(String(entry._type))) {
                filteredItems[key] = entry
            }
        })

        return filteredItems
    }

    statFile(path: string): ClassicyFileSystemEntry {
        const item = this.resolve(path) ?? {}
        item._size = this.size(path)
        return item
    }

    size(path: ClassicyPathOrFileSystemEntry): number {
        if (typeof path === 'string') {
            const fileContents = this.readFile(path)
            return new Blob([fileContents]).size
        }

        if (isFileSystemEntry(path) && typeof path._data === 'string') {
            return new Blob([path._data]).size
        }

        return 0
    }

    hash(path: ClassicyPathOrFileSystemEntry) {
        if (typeof path === 'string') {
            return sha512.crypt(this.readFile(path), '')
        }
        if (isFileSystemEntry(path) && typeof path._data === 'string') {
            return sha512.crypt(path._data, '')
        }
        return ''
    }

    readFile(path: ClassicyPathOrFileSystemEntry): string {
        if (isFileSystemEntry(path) && typeof path._data === 'string') {
            return path._data
        }
        if (typeof path === 'string') {
            const item = this.resolve(path)
            return this.readFile(item)
        }
        return ''
    }

    writeFile(path: string, data: string, metaData?: ClassicyFileSystemEntryMetadata) {
        const updateObjProp = (obj: ClassicyFileSystemEntry, value: unknown, propPath: string) => {
            const [head, ...rest] = propPath.split(':')
            if (rest.length) {
                if (!isFileSystemEntry(obj[head])) {
                    obj[head] = {}
                }
                updateObjProp(obj[head] as ClassicyFileSystemEntry, value, rest.join(':'))
            } else {
                obj[head] = {
                    ...(metaData ?? obj[head] ?? {}),
                    _data: value,
                }
            }
        }

        const directoryPath = path.split(':')
        if (!this.resolve(directoryPath.join(':'))) {
            this.mkDir(directoryPath.join(':'))
        }

        updateObjProp(this.fs, data, path)
    }

    rmDir(path: string) {
        return this.deletePropertyPath(this.fs, path)
    }

    mkDir(path: string) {
        const parts = this.pathArray(path)

        const newDirectoryObject = (): ClassicyFileSystemEntry => ({
            _type: ClassicyFileSystemEntryFileType.Directory,
            _icon: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/img/icons/system/folders/directory.png`,
        })

        let current: ClassicyFileSystemEntry | undefined
        let reference: ClassicyFileSystemEntry | undefined = current

        for (let i = parts.length - 1; i >= 0; i--) {
            reference = current
            current = i === 0 ? ({} as ClassicyFileSystemEntry) : newDirectoryObject()
            current[parts[i]] = i === parts.length - 1 ? newDirectoryObject() : reference
        }

        if (current) {
            this.fs = this.deepMerge(current, this.fs)
        }
    }

    calculateSizeDir(path: ClassicyPathOrFileSystemEntry): number {
        const entry = (typeof path === 'string' ? this.resolve(path) : path) ?? {}

        const gatherSizes = (node: ClassicyFileSystemEntry): number => {
            return Object.values(node).reduce((accumulator, value) => {
                if (isFileSystemEntry(value)) {
                    if (value._type === ClassicyFileSystemEntryFileType.File || value._type === 'file') {
                        return accumulator + this.size(value)
                    }
                    return accumulator + gatherSizes(value)
                }

                return accumulator
            }, 0)
        }

        return gatherSizes(entry)
    }

    countVisibleFiles(path: string): number {
        const visibleFiles = Object.values(this.filterMetadata(this.resolve(path))).filter((entry) => {
            return isFileSystemEntry(entry) && entry._invisible !== true
        })
        return visibleFiles.length
    }

    countInvisibleFilesInDir(path: string): number {
        const invisibleFiles = Object.values(this.filterMetadata(this.resolve(path))).filter((entry) => {
            return isFileSystemEntry(entry) && entry._invisible === true
        })
        return invisibleFiles.length
    }

    statDir(path: string): ClassicyFileSystemEntry {
        const current = this.resolve(path)
        if (!current) {
            return {}
        }
        const metaData = this.filterMetadata(current, 'only')
        const [name] = path.split(this.separator).slice(-1)

        const directoryStats: ClassicyFileSystemEntry = {
            _count: this.countVisibleFiles(path),
            _countHidden: this.countInvisibleFilesInDir(path),
            _name: name,
            _path: path,
            _size: this.calculateSizeDir(current),
            _type: ClassicyFileSystemEntryFileType.Directory,
        }

        Object.entries(metaData).forEach(([key, value]) => {
            directoryStats[key] = value
        })
        return directoryStats
    }

    private deepMerge(source: ClassicyFileSystemEntry, target: ClassicyFileSystemEntry): ClassicyFileSystemEntry {
        Object.keys(target).forEach((key) => {
            const sourceValue = source[key]
            const targetValue = target[key]

            if (isFileSystemEntry(sourceValue) && isFileSystemEntry(targetValue)) {
                const sourceIsArray = Array.isArray(sourceValue)
                const targetIsArray = Array.isArray(targetValue)

                if (sourceIsArray && targetIsArray) {
                    source[key] = Array.from(new Set([...(sourceValue as unknown[]), ...(targetValue as unknown[])]))
                } else if (!sourceIsArray && !targetIsArray) {
                    this.deepMerge(sourceValue as ClassicyFileSystemEntry, targetValue as ClassicyFileSystemEntry)
                } else {
                    source[key] = targetValue
                }
            } else {
                source[key] = targetValue
            }
        })
        return source
    }

    private deletePropertyPath(fileSystem: ClassicyFileSystemEntry, path: string): ClassicyFileSystemEntry | undefined {
        const pathToArray = path.split(':')
        let current: ClassicyFileSystemEntry | undefined = fileSystem

        for (let i = 0; i < pathToArray.length - 1; i++) {
            current = current?.[pathToArray[i]] as ClassicyFileSystemEntry
            if (typeof current === 'undefined') {
                return undefined
            }
        }

        if (current) {
            delete current[pathToArray.pop() as string]
        }
        return fileSystem
    }
}
