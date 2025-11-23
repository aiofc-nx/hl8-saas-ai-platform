import * as React from 'react'

const MOBILE_BREAKPOINT = 768

/**
 * 检测是否为移动设备的 Hook
 * 通过监听窗口宽度变化来判断当前是否为移动设备
 *
 * @returns 布尔值，true 表示当前为移动设备（宽度 < 768px），false 表示桌面设备
 *
 * @remarks
 * 使用 matchMedia API 监听窗口宽度变化
 * 断点设置为 768px，小于此宽度视为移动设备
 * 在服务端渲染时，初始值可能为 undefined，但最终会返回布尔值
 *
 * @example
 * ```tsx
 * const isMobile = useIsMobile()
 * if (isMobile) {
 *   // 移动端布局
 * } else {
 *   // 桌面端布局
 * }
 * ```
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener('change', onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isMobile
}
