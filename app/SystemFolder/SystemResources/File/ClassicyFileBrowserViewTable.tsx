'use client'

import { capitalizeFirst, iconImageByType } from '@/app/SystemFolder/SystemResources/File/ClassicyFileBrowserUtils'
import classicyFileBrowserViewTableStyles from '@/app/SystemFolder/SystemResources/File/ClassicyFileBrowserViewTable.module.scss'
import { ClassicyFileSystem } from '@/app/SystemFolder/SystemResources/File/ClassicyFileSystem'
import {
    ClassicyFileSystemEntry,
    ClassicyFileSystemEntryFileType,
    ClassicyFileSystemEntryMetadata,
} from '@/app/SystemFolder/SystemResources/File/ClassicyFileSystemModel'
import {
    ColumnDef,
    SortingState,
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table'
import classNames from 'classnames'
import React, { useMemo, useState } from 'react'

interface ClassicyFileBrowserViewTableProps {
    fs: ClassicyFileSystem
    path: string
    appId: string
    iconSize?: number
    dirOnClickFunc?: (path: string) => void
    fileOnClickFunc?: (path: string) => void
}

const columnHelper = createColumnHelper<ClassicyFileSystemEntryMetadata>()

const ClassicyFileBrowserViewTable: React.FC<ClassicyFileBrowserViewTableProps> = ({
    fs,
    path,
    iconSize = 64,
    appId,
    dirOnClickFunc = () => undefined,
    fileOnClickFunc = () => undefined,
}) => {
    const [selectedRow, setSelectedRow] = useState<string>()
    const [sorting, setSorting] = useState<SortingState>([{ id: '_name', desc: false }])

    const openFileOrFolder = (
        properties: ClassicyFileSystemEntryMetadata,
        basePath: string,
        filename: string
    ) => {
        const targetPath = `${basePath}:${filename}`
        if (properties._type === ClassicyFileSystemEntryFileType.Directory || properties._type === 'directory') {
            dirOnClickFunc(targetPath)
        } else {
            fileOnClickFunc(targetPath)
        }
    }

    const fileList = useMemo<ClassicyFileSystemEntryMetadata[]>(() => {
        const directoryListing = fs.filterByType(path, ['file', 'directory'])

        return Object.entries(directoryListing).map(([entryName, entryValue]) => {
            const entry = entryValue as ClassicyFileSystemEntry

            const sizeValue = fs.size(entry)
            return {
                ...entry,
                _name: entryName,
                _path: `${path}:${entryName}`,
                _size: typeof sizeValue === 'number' ? fs.formatSize(sizeValue) : undefined,
            }
        })
    }, [fs, path])

    const columns = useMemo<ColumnDef<ClassicyFileSystemEntryMetadata, unknown>[]>(
        () => [
            columnHelper.accessor((row) => row._name, {
                id: '_name',
                cell: (info) => (
                    <div className={classicyFileBrowserViewTableStyles.classicyFileBrowserViewTableRowContainer}>
                        <img
                            src={info.row.original._icon || iconImageByType(String(info.row.original._type))}
                            width={iconSize}
                            alt={info.row.original._path}
                            className={classicyFileBrowserViewTableStyles.classicyFileBrowserViewTableRowIcon}
                        />
                        <span className={classicyFileBrowserViewTableStyles.classicyFileBrowserViewTableRowIconLabel}>
                            {info.getValue()}
                        </span>
                    </div>
                ),
                header: () => <span>Filename</span>,
                enableResizing: true,
            }),
            columnHelper.accessor((row) => row._type, {
                id: '_type',
                cell: (info) => <span>{capitalizeFirst(String(info.getValue()))}</span>,
                header: () => <span>File Type</span>,
                enableResizing: true,
            }),
            columnHelper.accessor((row) => row._size, {
                id: '_size',
                cell: (info) => <span>{info.getValue()}</span>,
                header: () => <span>Size</span>,
                enableResizing: true,
            }),
        ],
        [iconSize]
    )

    const table = useReactTable({
        data: fileList,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: { sorting },
        onSortingChange: setSorting,
        columnResizeMode: 'onChange',
    })

    return (
        <div
            key={`${appId}_filebrowser_${path}`}
            className={classicyFileBrowserViewTableStyles.classicyFileBrowserViewTableContainer}
        >
            <table className={classicyFileBrowserViewTableStyles.classicyFileBrowserViewTable}>
                <thead className={classNames(classicyFileBrowserViewTableStyles.classicyFileBrowserViewTableHeader)}>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr
                            key={headerGroup.id}
                            className={classicyFileBrowserViewTableStyles.classicyFileBrowserViewTableColumnHeaderGroup}
                        >
                            {headerGroup.headers.map((header) => (
                                <th
                                    key={header.id}
                                    align="left"
                                    className={classNames(
                                        classicyFileBrowserViewTableStyles.classicyFileBrowserViewTableColumnHeader,
                                        header.column.getIsResizing() ? 'isResizing' : '',
                                        header.id === sorting[0]?.id
                                            ? classicyFileBrowserViewTableStyles.classicyFileBrowserViewTableColumnHeaderSelected
                                            : ''
                                    )}
                                    style={{ width: header.id === '_icon' ? iconSize : 'auto' }}
                                    onClick={() => {
                                        if (
                                            header.column.getIsSorted() === false ||
                                            header.column.getIsSorted() === 'desc'
                                        ) {
                                            header.column.toggleSorting(false, false)
                                        } else {
                                            header.column.toggleSorting(true, false)
                                        }
                                    }}
                                >
                                    {!header.isPlaceholder &&
                                        flexRender(header.column.columnDef.header, header.getContext())}
                                    {header.id === sorting[0]?.id && (
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/img/ui/menu-dropdown-arrow-up.svg`}
                                            height="50%"
                                            style={{
                                                margin: '0 var(--window-padding-size)',
                                                transform: `rotate(${sorting[0]?.desc === true ? '0deg' : '180deg'})`,
                                            }}
                                            alt="Sort order"
                                        />
                                    )}
                                    {header.column.getCanResize() && (
                                        <div
                                            onMouseDown={header.getResizeHandler()}
                                            onTouchStart={header.getResizeHandler()}
                                            className={classNames(
                                                classicyFileBrowserViewTableStyles.resizer,
                                                header.column.getIsResizing()
                                                    ? classicyFileBrowserViewTableStyles.isResizing
                                                    : ''
                                            )}
                                        ></div>
                                    )}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody className={classicyFileBrowserViewTableStyles.classicyFileBrowserViewTableContent}>
                    {table.getRowModel().rows.map((row) => (
                        <tr
                            key={row.id}
                            className={classNames(
                                classicyFileBrowserViewTableStyles.classicyFileBrowserViewTableRow,
                                selectedRow === row.id
                                    ? classicyFileBrowserViewTableStyles.classicyFileBrowserViewTableRowSelected
                                    : null
                            )}
                            onDoubleClick={() => openFileOrFolder(row.original, path, row.original._name ?? '')}
                            onClick={() => setSelectedRow(row.id)}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id} style={{ width: cell.column.getSize(), margin: 0, padding: 0 }}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    {table.getFooterGroups().map((footerGroup) => (
                        <tr key={footerGroup.id}>
                            {footerGroup.headers.map((header) => (
                                <th key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(header.column.columnDef.footer, header.getContext())}
                                </th>
                            ))}
                        </tr>
                    ))}
                </tfoot>
            </table>
            <div className="h-4" />
        </div>
    )
}

export default ClassicyFileBrowserViewTable
