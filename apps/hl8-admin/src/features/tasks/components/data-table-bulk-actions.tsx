import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { Trash2, CircleArrowUp, ArrowUpDown, Download } from 'lucide-react'
import { toast } from 'sonner'
import { sleep } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { priorities, statuses } from '../data/data'
import { type Task } from '../data/schema'
import { TasksMultiDeleteDialog } from './tasks-multi-delete-dialog'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBulkStatusChange = (status: string) => {
    const selectedTasks = selectedRows.map((row) => row.original as Task)
    toast.promise(sleep(2000), {
      loading: '正在更新状态...',
      success: () => {
        table.resetRowSelection()
        return `已将 ${selectedTasks.length} 个任务的状态更新为 "${status}"。`
      },
      error: '错误',
    })
    table.resetRowSelection()
  }

  const handleBulkPriorityChange = (priority: string) => {
    const selectedTasks = selectedRows.map((row) => row.original as Task)
    toast.promise(sleep(2000), {
      loading: '正在更新优先级...',
      success: () => {
        table.resetRowSelection()
        return `已将 ${selectedTasks.length} 个任务的优先级更新为 "${priority}"。`
      },
      error: '错误',
    })
    table.resetRowSelection()
  }

  const handleBulkExport = () => {
    const selectedTasks = selectedRows.map((row) => row.original as Task)
    toast.promise(sleep(2000), {
      loading: '正在导出任务...',
      success: () => {
        table.resetRowSelection()
        return `已导出 ${selectedTasks.length} 个任务到 CSV。`
      },
      error: '错误',
    })
    table.resetRowSelection()
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='task'>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='icon'
                  className='size-8'
                  aria-label='Update status'
                  title='Update status'
                >
                  <CircleArrowUp />
                  <span className='sr-only'>Update status</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Update status</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent sideOffset={14}>
            {statuses.map((status) => (
              <DropdownMenuItem
                key={status.value}
                defaultValue={status.value}
                onClick={() => handleBulkStatusChange(status.value)}
              >
                {status.icon && (
                  <status.icon className='text-muted-foreground size-4' />
                )}
                {status.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='icon'
                  className='size-8'
                  aria-label='Update priority'
                  title='Update priority'
                >
                  <ArrowUpDown />
                  <span className='sr-only'>Update priority</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Update priority</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent sideOffset={14}>
            {priorities.map((priority) => (
              <DropdownMenuItem
                key={priority.value}
                defaultValue={priority.value}
                onClick={() => handleBulkPriorityChange(priority.value)}
              >
                {priority.icon && (
                  <priority.icon className='text-muted-foreground size-4' />
                )}
                {priority.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={() => handleBulkExport()}
              className='size-8'
              aria-label='Export tasks'
              title='Export tasks'
            >
              <Download />
              <span className='sr-only'>Export tasks</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export tasks</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              className='size-8'
              aria-label='Delete selected tasks'
              title='Delete selected tasks'
            >
              <Trash2 />
              <span className='sr-only'>Delete selected tasks</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete selected tasks</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <TasksMultiDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        table={table}
      />
    </>
  )
}
