import { ReactNode } from 'react'

export enum ClassicyFileSystemEntryFileType {
    File = 'file',
    Shortcut = 'shortcut',
    AppShortcut = 'app_shortcut',
    Drive = 'drive',
    Directory = 'directory',
}

export type ClassicyFileSystemEntryMetadata = {
    _type?: ClassicyFileSystemEntryFileType | string
    _mimeType?: string
    _creator?: string
    _format?: string
    _label?: string
    _comments?: string
    _url?: string
    _icon?: string
    _badge?: ReactNode
    _createdOn?: Date
    _modifiedOn?: Date
    _versions?: ClassicyFileSystemEntry[]
    _readOnly?: boolean
    _nameLocked?: boolean
    _trashed?: boolean
    _system?: boolean
    _invisible?: boolean
    _count?: number
    _countHidden?: number
    _path?: string
    _data?: unknown
    _size?: number | string
    _name?: string
}

export type ClassicyFileSystemEntry = ClassicyFileSystemEntryMetadata & Record<string, unknown>
