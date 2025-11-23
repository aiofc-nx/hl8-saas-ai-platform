import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并 Tailwind CSS 类名
 * 使用 clsx 处理条件类名，使用 twMerge 合并冲突的 Tailwind 类
 *
 * @param inputs - 要合并的类名值（可以是字符串、对象、数组等）
 * @returns 合并后的类名字符串
 *
 * @example
 * ```ts
 * cn('px-2 py-1', 'bg-red-500', { 'text-white': isActive })
 * cn('px-2', 'px-4') // 返回 'px-4'（后面的覆盖前面的）
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 延迟执行指定毫秒数
 * 返回一个 Promise，在指定时间后 resolve
 *
 * @param ms - 延迟的毫秒数，默认为 1000 毫秒
 * @returns Promise，在指定时间后 resolve
 *
 * @example
 * ```ts
 * await sleep(2000) // 等待 2 秒
 * ```
 */
export function sleep(ms: number = 1000) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 生成带省略号的分页页码数组
 * 根据当前页码和总页数生成页码数组，当页数较多时使用省略号表示中间部分
 *
 * @param currentPage - 当前页码（从 1 开始）
 * @param totalPages - 总页数
 * @returns 页码数组，可能包含数字和省略号字符串 '...'
 *
 * @remarks
 * 最多显示 5 个页码按钮。当总页数超过 5 页时，会根据当前位置智能显示：
 * - 小数据集（≤5 页）：[1, 2, 3, 4, 5]
 * - 靠近开头：[1, 2, 3, 4, '...', 10]
 * - 中间位置：[1, '...', 4, 5, 6, '...', 10]
 * - 靠近结尾：[1, '...', 7, 8, 9, 10]
 *
 * @example
 * ```ts
 * getPageNumbers(1, 10) // [1, 2, 3, 4, '...', 10]
 * getPageNumbers(5, 10) // [1, '...', 4, 5, 6, '...', 10]
 * getPageNumbers(10, 10) // [1, '...', 7, 8, 9, 10]
 * ```
 */
export function getPageNumbers(currentPage: number, totalPages: number) {
  const maxVisiblePages = 5 // 最大显示的页码按钮数
  const rangeWithDots = []

  if (totalPages <= maxVisiblePages) {
    // 如果总页数小于等于 5，显示所有页码
    for (let i = 1; i <= totalPages; i++) {
      rangeWithDots.push(i)
    }
  } else {
    // 始终显示第一页
    rangeWithDots.push(1)

    if (currentPage <= 3) {
      // 靠近开头：[1] [2] [3] [4] ... [10]
      for (let i = 2; i <= 4; i++) {
        rangeWithDots.push(i)
      }
      rangeWithDots.push('...', totalPages)
    } else if (currentPage >= totalPages - 2) {
      // 靠近结尾：[1] ... [7] [8] [9] [10]
      rangeWithDots.push('...')
      for (let i = totalPages - 3; i <= totalPages; i++) {
        rangeWithDots.push(i)
      }
    } else {
      // 中间位置：[1] ... [4] [5] [6] ... [10]
      rangeWithDots.push('...')
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        rangeWithDots.push(i)
      }
      rangeWithDots.push('...', totalPages)
    }
  }

  return rangeWithDots
}
