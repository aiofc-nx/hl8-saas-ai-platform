import { useMemo, useState } from 'react'
import type {
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
} from '@tanstack/react-table'

type SearchRecord = Record<string, unknown>

/**
 * 导航函数类型
 * 用于更新 URL 搜索参数
 */
export type NavigateFn = (opts: {
  search:
    | true
    | SearchRecord
    | ((prev: SearchRecord) => Partial<SearchRecord> | SearchRecord)
  replace?: boolean
}) => void

/**
 * useTableUrlState Hook 的参数类型
 */
type UseTableUrlStateParams = {
  /** 当前 URL 搜索参数 */
  search: SearchRecord
  /** 导航函数，用于更新 URL */
  navigate: NavigateFn
  /** 分页配置 */
  pagination?: {
    /** 页码在 URL 中的键名，默认为 'page' */
    pageKey?: string
    /** 每页数量在 URL 中的键名，默认为 'pageSize' */
    pageSizeKey?: string
    /** 默认页码，默认为 1 */
    defaultPage?: number
    /** 默认每页数量，默认为 10 */
    defaultPageSize?: number
  }
  /** 全局过滤器配置 */
  globalFilter?: {
    /** 是否启用全局过滤器，默认为 true */
    enabled?: boolean
    /** 全局过滤器在 URL 中的键名，默认为 'filter' */
    key?: string
    /** 是否自动去除首尾空格，默认为 true */
    trim?: boolean
  }
  /** 列过滤器配置数组 */
  columnFilters?: Array<
    | {
        /** 列 ID */
        columnId: string
        /** 该列在 URL 中的搜索键名 */
        searchKey: string
        /** 过滤器类型，默认为 'string' */
        type?: 'string'
        /** 可选的自定义序列化函数 */
        serialize?: (value: unknown) => unknown
        /** 可选的自定义反序列化函数 */
        deserialize?: (value: unknown) => unknown
      }
    | {
        /** 列 ID */
        columnId: string
        /** 该列在 URL 中的搜索键名 */
        searchKey: string
        /** 过滤器类型为数组 */
        type: 'array'
        /** 可选的自定义序列化函数 */
        serialize?: (value: unknown) => unknown
        /** 可选的自定义反序列化函数 */
        deserialize?: (value: unknown) => unknown
      }
  >
}

/**
 * useTableUrlState Hook 的返回值类型
 */
type UseTableUrlStateReturn = {
  /** 全局过滤器值 */
  globalFilter?: string
  /** 全局过滤器变化处理函数 */
  onGlobalFilterChange?: OnChangeFn<string>
  /** 列过滤器状态 */
  columnFilters: ColumnFiltersState
  /** 列过滤器变化处理函数 */
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>
  /** 分页状态 */
  pagination: PaginationState
  /** 分页变化处理函数 */
  onPaginationChange: OnChangeFn<PaginationState>
  /** 确保页码在有效范围内的辅助函数 */
  ensurePageInRange: (
    pageCount: number,
    opts?: { resetTo?: 'first' | 'last' }
  ) => void
}

/**
 * 表格 URL 状态管理 Hook
 * 将表格的分页、过滤等状态同步到 URL 搜索参数中，实现状态持久化和可分享的 URL
 *
 * @param params - Hook 配置参数
 * @returns 返回表格状态管理相关的值和函数
 *
 * @remarks
 * 此 Hook 实现了以下功能：
 * 1. 将分页状态（页码、每页数量）同步到 URL
 * 2. 将全局过滤器同步到 URL
 * 3. 将列过滤器同步到 URL
 * 4. 从 URL 初始化表格状态
 * 5. 提供确保页码在有效范围内的辅助函数
 *
 * 当状态改变时，会自动更新 URL，使得状态可以通过 URL 分享和持久化
 * 如果值为默认值，则从 URL 中移除该参数
 *
 * @example
 * ```tsx
 * const { pagination, onPaginationChange, globalFilter, onGlobalFilterChange } =
 *   useTableUrlState({
 *     search: router.state.location.search,
 *     navigate: router.navigate,
 *     pagination: { defaultPage: 1, defaultPageSize: 10 },
 *     globalFilter: { key: 'search' },
 *     columnFilters: [
 *       { columnId: 'status', searchKey: 'status', type: 'string' },
 *       { columnId: 'tags', searchKey: 'tags', type: 'array' },
 *     ],
 *   })
 * ```
 */
export function useTableUrlState(
  params: UseTableUrlStateParams
): UseTableUrlStateReturn {
  const {
    search,
    navigate,
    pagination: paginationCfg,
    globalFilter: globalFilterCfg,
    columnFilters: columnFiltersCfg = [],
  } = params

  const pageKey = paginationCfg?.pageKey ?? ('page' as string)
  const pageSizeKey = paginationCfg?.pageSizeKey ?? ('pageSize' as string)
  const defaultPage = paginationCfg?.defaultPage ?? 1
  const defaultPageSize = paginationCfg?.defaultPageSize ?? 10

  const globalFilterKey = globalFilterCfg?.key ?? ('filter' as string)
  const globalFilterEnabled = globalFilterCfg?.enabled ?? true
  const trimGlobal = globalFilterCfg?.trim ?? true

  // 从当前搜索参数构建初始列过滤器
  const initialColumnFilters: ColumnFiltersState = useMemo(() => {
    const collected: ColumnFiltersState = []
    for (const cfg of columnFiltersCfg) {
      const raw = (search as SearchRecord)[cfg.searchKey]
      const deserialize = cfg.deserialize ?? ((v: unknown) => v)
      if (cfg.type === 'string') {
        const value = (deserialize(raw) as string) ?? ''
        if (typeof value === 'string' && value.trim() !== '') {
          collected.push({ id: cfg.columnId, value })
        }
      } else {
        // 默认为数组类型
        const value = (deserialize(raw) as unknown[]) ?? []
        if (Array.isArray(value) && value.length > 0) {
          collected.push({ id: cfg.columnId, value })
        }
      }
    }
    return collected
  }, [columnFiltersCfg, search])

  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>(initialColumnFilters)

  const pagination: PaginationState = useMemo(() => {
    const rawPage = (search as SearchRecord)[pageKey]
    const rawPageSize = (search as SearchRecord)[pageSizeKey]
    const pageNum = typeof rawPage === 'number' ? rawPage : defaultPage
    const pageSizeNum =
      typeof rawPageSize === 'number' ? rawPageSize : defaultPageSize
    return { pageIndex: Math.max(0, pageNum - 1), pageSize: pageSizeNum }
  }, [search, pageKey, pageSizeKey, defaultPage, defaultPageSize])

  const onPaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next = typeof updater === 'function' ? updater(pagination) : updater
    const nextPage = next.pageIndex + 1
    const nextPageSize = next.pageSize
    navigate({
      search: (prev) => ({
        ...(prev as SearchRecord),
        [pageKey]: nextPage <= defaultPage ? undefined : nextPage,
        [pageSizeKey]:
          nextPageSize === defaultPageSize ? undefined : nextPageSize,
      }),
    })
  }

  const [globalFilter, setGlobalFilter] = useState<string | undefined>(() => {
    if (!globalFilterEnabled) return undefined
    const raw = (search as SearchRecord)[globalFilterKey]
    return typeof raw === 'string' ? raw : ''
  })

  const onGlobalFilterChange: OnChangeFn<string> | undefined =
    globalFilterEnabled
      ? (updater) => {
          const next =
            typeof updater === 'function'
              ? updater(globalFilter ?? '')
              : updater
          const value = trimGlobal ? next.trim() : next
          setGlobalFilter(value)
          navigate({
            search: (prev) => ({
              ...(prev as SearchRecord),
              [pageKey]: undefined,
              [globalFilterKey]: value ? value : undefined,
            }),
          })
        }
      : undefined

  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
    const next =
      typeof updater === 'function' ? updater(columnFilters) : updater
    setColumnFilters(next)

    const patch: Record<string, unknown> = {}

    for (const cfg of columnFiltersCfg) {
      const found = next.find((f) => f.id === cfg.columnId)
      const serialize = cfg.serialize ?? ((v: unknown) => v)
      if (cfg.type === 'string') {
        const value =
          typeof found?.value === 'string' ? (found.value as string) : ''
        patch[cfg.searchKey] =
          value.trim() !== '' ? serialize(value) : undefined
      } else {
        const value = Array.isArray(found?.value)
          ? (found!.value as unknown[])
          : []
        patch[cfg.searchKey] = value.length > 0 ? serialize(value) : undefined
      }
    }

    navigate({
      search: (prev) => ({
        ...(prev as SearchRecord),
        [pageKey]: undefined,
        ...patch,
      }),
    })
  }

  const ensurePageInRange = (
    pageCount: number,
    opts: { resetTo?: 'first' | 'last' } = { resetTo: 'first' }
  ) => {
    const currentPage = (search as SearchRecord)[pageKey]
    const pageNum = typeof currentPage === 'number' ? currentPage : defaultPage
    if (pageCount > 0 && pageNum > pageCount) {
      navigate({
        replace: true,
        search: (prev) => ({
          ...(prev as SearchRecord),
          [pageKey]: opts.resetTo === 'last' ? pageCount : undefined,
        }),
      })
    }
  }

  return {
    globalFilter: globalFilterEnabled ? (globalFilter ?? '') : undefined,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  }
}
