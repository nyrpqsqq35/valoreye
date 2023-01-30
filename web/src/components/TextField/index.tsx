import clsx from 'clsx'
import { HTMLInputTypeAttribute } from 'react'

export interface TextFieldPropTypes {
  className?: string
  name: string
  label?: string
  type?: HTMLInputTypeAttribute
  placeholder?: string

  value: string
  highlight?: boolean
  setValue: (e: string) => any
  autoFocus?: boolean
}

export default function TextField({
  className,
  name,
  label,
  type = 'text',
  placeholder,

  highlight = false,
  value,
  setValue,
  autoFocus = false,
}: TextFieldPropTypes) {
  return (
    <div className={clsx(!highlight && 'border border-transparent')}>
      <div
        className={clsx(
          'relative rounded-md border bg-ctp-base border-ctp-mantle px-3 py-2 shadow-sm focus-within:border-ctp-mauve focus-within:ring-1 focus-within:ring-ctp-mauve mt-4',
          highlight &&
            '!border-2 !border-dashed !border-ctp-yellow !animate-pulse-border focus-within:ring-ctp-mauve/40',
          className
        )}
      >
        <label
          htmlFor={name}
          className="absolute -top-2 left-2 -mt-px inline-block bg-ctp-base px-1 text-xs font-medium text-ctp-text0 select-none"
        >
          {label}
        </label>
        <input
          type={type}
          name={name}
          id={name}
          className="block w-full bg-ctp-base border-0 p-0 text-ctp-subtext0 focus:text-ctp-text placeholder-gray-600 focus:ring-0 sm:text-sm"
          placeholder={placeholder}
          value={value}
          onChange={e => {
            setValue(e.target.value)
          }}
          autoFocus={autoFocus}
        />
      </div>
    </div>
  )
}
