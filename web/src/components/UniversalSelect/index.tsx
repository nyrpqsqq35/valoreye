import React, { Fragment, useState, useRef, useEffect } from 'react'
import Fuse from 'fuse.js'
import { Combobox } from '@headlessui/react'
import {
  CheckIcon,
  ArrowPathIcon,
  ChevronUpDownIcon,
  TrashIcon,
} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import Loading from '../Loading'

// all of this should be rewrote

export interface IBadge {
  name: string
  className: string
}

type RetrieverRetVal = string
type Retriever<T> = (i: T) => RetrieverRetVal
type IntRetriever<T> = (i: T | T[]) => RetrieverRetVal
type ObjectKey<T> = keyof T
type ObjectKeyOrRetriever<T> = ObjectKey<T> | Retriever<T>
type StyleFunc<T> = (i: T | undefined) => React.CSSProperties
type StyleRet<T> = React.CSSProperties | StyleFunc<T>

export interface UniversalSelectPropTypes<T> extends React.PropsWithChildren {
  className?: string
  itemKey: ObjectKey<T>
  defaultValue?: string | number
  keys: ObjectKey<T> | ObjectKey<T>[] | Fuse.FuseOptionKeyObject<T>[]
  valueKey: ObjectKeyOrRetriever<T>
  displayKey: ObjectKeyOrRetriever<T>
  imageKey?: ObjectKeyOrRetriever<T>
  realDisplayKey?: ObjectKeyOrRetriever<T>
  list: T[]

  divStyles?: StyleRet<T>
  inputStyles?: StyleRet<T>
  imageStyles?: StyleRet<T>
  optionClassName?: string
  inputClassName?: string
  imageClassName?: string
  selectorClassName?: string
  filter?: boolean

  getBadges?: (i: T) => IBadge[]

  selected: T | null | undefined
  setSelected: (i: (T | null) & (T | undefined)) => void

  // post?: React.ReactNode
  post?: string | null
  highlight?: boolean
  showRemoveElement?: boolean
  fallbackDisplay?: string
  border?: boolean
}

const $removeEl = Symbol('removeElement')
// lol
const isRemoveEl = (e: any) => typeof e === typeof $removeEl
function createRetriever<T>(k: ObjectKeyOrRetriever<T>): IntRetriever<T> {
  let ret: Retriever<T> =
    typeof k === 'function' ? k : (i: T) => i[k] as RetrieverRetVal
  return (i: T | T[]) => {
    if (!Array.isArray(i)) i = [i]
    return i.map(v => ret(v)).join(', ')
  }
}
function createStyleFn<T>(k: StyleRet<T> | undefined): StyleFunc<T> {
  if (!k)
    return () => {
      return {}
    }
  return typeof k === 'function' ? k : _ => k
}

// lol
export default function UniversalSelect<T>({
  className,
  itemKey,
  keys,
  valueKey,
  displayKey,
  imageKey,
  realDisplayKey,
  defaultValue,
  list,

  divStyles,
  inputStyles,
  imageStyles,
  optionClassName,
  inputClassName,
  imageClassName,
  selectorClassName,

  selected,
  setSelected,

  filter = true,
  getBadges,
  post,
  children,

  highlight = false,
  showRemoveElement = false,
  fallbackDisplay,
  border = false,
}: UniversalSelectPropTypes<T>) {
  const [query, setQuery] = useState('')

  const fuse = new Fuse<T>(list, {
    // @ts-ignore
    keys: Array.isArray(keys) ? keys : [keys],
  })

  const filteredList =
    !query || !filter ? list : fuse.search(query).map(i => i.item)

  const retValue = createRetriever(valueKey),
    retDisplay = createRetriever(displayKey),
    retRealDisplay = realDisplayKey
      ? createRetriever(realDisplayKey || displayKey)
      : retDisplay,
    retImage = imageKey ? createRetriever(imageKey) : () => ''

  const divStyle = createStyleFn(divStyles),
    inpStyle = createStyleFn(inputStyles),
    imageStyle = createStyleFn(imageStyles)

  const defVal =
    typeof defaultValue !== 'undefined'
      ? list.find(i => i[itemKey] === defaultValue)!
      : undefined

  const hasImage = typeof imageKey !== 'undefined',
    hasLeft = hasImage

  const inputRef = useRef<HTMLInputElement>(null)

  const td = selected ? retRealDisplay(selected) : null
  useEffect(() => {
    if (!inputRef.current) return

    let nv
    if (!filter) {
      td && inputRef.current && (inputRef.current.value = td)
    }

    if (nv) {
      inputRef.current.value = nv
    }

    if (post) {
      inputRef.current.value = inputRef.current.value.split(' #')[0] + post
    }
  }, [td, filter, post])
  if (!list.length) return <Loading />

  if (
    showRemoveElement &&
    filteredList.every(e => typeof e !== 'symbol') &&
    !query
  )
    filteredList.unshift($removeEl as any)

  return (
    <Combobox<T, typeof Fragment>
      as={Fragment}
      value={selected}
      onChange={v => {
        if (isRemoveEl(v)) (v as any) = null
        setSelected(v as any)
      }}
      multiple={false}
      defaultValue={defVal as any}
      name={selected?.toString()}
      nullable={true}
    >
      <div
        className={clsx(
          'relative p-0 m-0 w-full',
          className,
          highlight && '!border-none',
          !highlight && 'border border-transparent'
        )}
        style={divStyle(selected || defVal)}
      >
        {children}
        <div className="flex flex-row">
          <Combobox.Input<'input', T>
            as={'input'}
            className={clsx(
              'w-full rounded-sm border border-ctp-mantle bg-transparent focus:border-ctp-mauve focus:outline-none focus:ring-1 focus:ring-ctp-mauve p-0',
              inputClassName,
              border && 'border-dashed',
              highlight && '!border-2 !border-ctp-yellow !animate-pulse-border'
            )}
            onChange={event => setQuery(event.target.value)}
            displayValue={item =>
              item ? retRealDisplay(item) : fallbackDisplay || 'idk'
            }
            onBlur={e =>
              setTimeout(() => {
                setQuery('')
              }, 250)
            }
            style={inpStyle(selected || defVal)}
            ref={inputRef}
          />
        </div>
        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
          <ChevronUpDownIcon
            className={clsx('h-5 w-5 text-ctp-yellow', selectorClassName)}
            aria-hidden="true"
          />
        </Combobox.Button>
        {filteredList.length > 0 && (
          <Combobox.Options className="absolute z-10 mt-1 w-full bg-ctp-crust shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
            {filteredList.map(item => (
              <Combobox.Option
                key={
                  isRemoveEl(item)
                    ? $removeEl.toString()
                    : (item[itemKey] as React.Key)
                }
                value={item}
                className={({ active }) =>
                  clsx(
                    'relative cursor-default select-none py-2 pl-3 pr-7',
                    active ? 'bg-primary-600 text-white' : 'text-ctp-subtext0'
                  )
                }
              >
                {({ active, selected: selected_ }) => {
                  const b = getBadges ? getBadges(item) : []
                  if (isRemoveEl(item)) {
                    return (
                      <>
                        <div className="flex items-center font-sans">
                          <TrashIcon className="w-6 h-6 flex-shrink-0 rounded-full" />
                          <span
                            className={clsx(
                              'truncate',
                              hasLeft && 'ml-3',
                              selected_ ? 'font-semibold' : 'font-normal',
                              optionClassName
                            )}
                          >
                            Clear
                          </span>
                        </div>
                        {(selected_ || !selected) && (
                          <span
                            className={clsx(
                              'absolute inset-y-0 right-0 flex items-center pr-4',
                              active ? 'text-ctp-text' : 'text-ctp-mauve'
                            )}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        )}
                      </>
                    )
                  }
                  return (
                    <>
                      <div className="flex items-center font-sans">
                        {(item as any)?.uuid === 'random' ? (
                          <ArrowPathIcon className="h-6 w-6 flex-shrink-0 rounded-full" />
                        ) : (
                          hasLeft &&
                          hasImage && (
                            <img
                              src={retImage(item)}
                              alt=""
                              style={imageStyle(item)}
                              className={clsx(
                                'h-6 w-6 flex-shrink-0 rounded-full',
                                imageClassName
                              )}
                              draggable={false}
                            />
                          )
                        )}
                        <span
                          className={clsx(
                            'truncate',
                            hasLeft && 'ml-3',
                            selected_ ? 'font-semibold' : 'font-normal',
                            optionClassName
                          )}
                        >
                          {retDisplay(item)}
                        </span>
                        {b.map((badge, i) => (
                          <span
                            key={i}
                            className={clsx(
                              'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ml-2',
                              badge.className
                            )}
                          >
                            {badge.name}
                          </span>
                        ))}
                      </div>

                      {selected_ && (
                        <span
                          className={clsx(
                            'absolute inset-y-0 right-0 flex items-center pr-4',
                            active ? 'text-ctp-text' : 'text-ctp-mauve'
                          )}
                        >
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )
                }}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        )}
      </div>
    </Combobox>
  )
}
