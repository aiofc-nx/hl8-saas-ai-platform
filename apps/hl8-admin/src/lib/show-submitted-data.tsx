import { toast } from 'sonner'

/**
 * 显示提交的数据
 * 以格式化的 JSON 形式在 toast 消息中显示提交的数据，用于调试和确认
 *
 * @param data - 要显示的数据（任意类型）
 * @param title - 消息标题，默认为 '您提交了以下值：'
 *
 * @remarks
 * 数据将以格式化的 JSON 字符串形式显示在代码块中，便于阅读
 * 主要用于表单提交后的数据确认和调试
 *
 * @example
 * ```tsx
 * const formData = { name: 'John', age: 30 }
 * showSubmittedData(formData)
 * showSubmittedData(formData, '表单数据：')
 * ```
 */
export function showSubmittedData(
  data: unknown,
  title: string = '您提交了以下值：'
) {
  toast.message(title, {
    description: (
      // w-[340px]
      <pre className='mt-2 w-full overflow-x-auto rounded-md bg-slate-950 p-4'>
        <code className='text-white'>{JSON.stringify(data, null, 2)}</code>
      </pre>
    ),
  })
}
