export type FileType =
    | 'folder'
    | 'image'
    | 'video'
    | 'audio'
    | 'pdf'
    | 'doc'
    | 'sheet'
    | 'slide'
    | 'archive'
    | 'code'
    | 'file'

export interface FileItem {
    owner: {
        id: string
    }
    parent: {
        id: string | null
    }
    id: string
    name: string
    type: FileType
    size?: string
    sizeBytes?: number
    lastModified: Date | null
    updatedAt: Date
    createdAt: Date
    deletedAt: Date | null
    isFavorite: boolean
    isShared: boolean
    isRecent?: boolean
}
export interface BreadcrumbItem {
    id?: string | null
    name: string
    labelKey?: string
    icon?: string 
    color?: string
    path?: string
}

export interface ColumnDefinition {
    key: keyof FileItem
    label: string
    type: 'text' | 'date' | 'size'
    sortable?: boolean
    class?: string
}

export interface ApiFile {
    owner: {
        id: string
    }
    parent: {
        id: string | null
    }
    id: string
    filename: string
    contentType: string
    size: number
    isDirectory: boolean
    lastModified: string | null
    createdAt: string
    updatedAt: string
    deletedAt: string | null
    isFavorite: boolean
    isShared: boolean
    isRecent?: boolean
}

export interface FileIndexDTO {
    files: ApiFile[]
    parentID: string | null
    breadcrumbs: BreadcrumbItem[]
}
