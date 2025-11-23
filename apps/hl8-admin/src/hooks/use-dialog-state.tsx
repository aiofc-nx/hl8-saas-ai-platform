import { useState } from 'react'

/**
 * 确认对话框状态管理 Hook
 * 用于管理确认对话框的打开/关闭状态，支持通过字符串或布尔值标识不同的对话框
 *
 * @param initialState - 初始状态值，可以是字符串、布尔值或 null，默认为 null
 * @returns 返回一个元组 [open, setOpen]，其中：
 *   - open: 当前打开的状态值（T | null）
 *   - setOpen: 设置状态的函数，如果传入的值与当前值相同，则关闭对话框（设置为 null）
 *
 * @remarks
 * 当调用 setOpen 时，如果传入的值与当前打开的值相同，对话框将关闭（状态变为 null）
 * 这允许通过同一个 hook 管理多个对话框，通过不同的字符串值区分
 *
 * @example
 * ```tsx
 * // 使用字符串类型管理多个对话框
 * const [open, setOpen] = useDialogState<'approve' | 'reject'>()
 * setOpen('approve') // 打开批准对话框
 * setOpen('approve') // 再次调用相同值，关闭对话框
 *
 * // 使用布尔值
 * const [open, setOpen] = useDialogState<boolean>(false)
 * setOpen(true) // 打开对话框
 * ```
 */
export default function useDialogState<T extends string | boolean>(
  initialState: T | null = null
) {
  const [open, _setOpen] = useState<T | null>(initialState)

  const setOpen = (str: T | null) =>
    _setOpen((prev) => (prev === str ? null : str))

  return [open, setOpen] as const
}
