import React, { useState } from 'react'
import Fuse from 'fuse.js'
import { Combobox } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import Loading from '../Loading'

type RetrieverRetVal = string
type Retriever<T> = (i: T) => RetrieverRetVal
type IntRetriever<T> = (i: T | T[]) => RetrieverRetVal
type ObjectKey<T> = keyof T
type ObjectKeyOrRetriever<T> = ObjectKey<T> | Retriever<T>
interface UniversalSelectPropTypes<T> extends React.PropsWithChildren {
  className?: string
  itemKey: ObjectKey<T>
  defaultValue?: string
  keys: ObjectKey<T> | ObjectKey<T>[] | Fuse.FuseOptionKeyObject<T>[]
  valueKey: ObjectKeyOrRetriever<T>
  displayKey: ObjectKeyOrRetriever<T>
  list: T[]
}

function createRetriever<T>(k: ObjectKeyOrRetriever<T>): IntRetriever<T> {
  let ret: Retriever<T> =
    typeof k === 'function' ? k : (i: T) => i[k] as RetrieverRetVal
  return (i: T | T[]) => {
    if (!Array.isArray(i)) i = [i]
    return i.map(v => ret(v)).join(', ')
  }
}
export default function OldUniversalSelect<T extends object>({
  className,
  itemKey,
  keys,
  valueKey,
  displayKey,
  defaultValue,
  list,
}: UniversalSelectPropTypes<T>) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<T>()

  const fuse = new Fuse<T>(list, {
    // @ts-ignore
    keys: Array.isArray(keys) ? keys : [keys],
  })

  const retValue = createRetriever(valueKey),
    retDisplay = createRetriever(displayKey)

  if (!list.length) return <Loading />

  const filteredList = !query ? list : fuse.search(query).map(i => i.item)

  return (
    <Combobox<T, 'div'>
      as="div"
      value={selected}
      onChange={setSelected}
      multiple={false}
      defaultValue={
        (defaultValue
          ? list.find(i => i[itemKey] === defaultValue)!
          : null) as any // :))))
      }
    >
      <div className={clsx('relative mt-1', className)}>
        <Combobox.Input<'input', T>
          as={'input'}
          className="w-full rounded-md border border-ctp-mantle bg-ctp-crust py-2 pl-3 pr-10 shadow-sm focus:border-ctp-mauve focus:outline-none focus:ring-1 focus:ring-ctp-mauve sm:text-sm text-ctp-text"
          onChange={event => setQuery(event.target.value)}
          displayValue={item => (item ? retDisplay(item) : 'idk')}
        />
        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
          <ChevronUpDownIcon
            className="h-5 w-5 text-gray-400"
            aria-hidden="true"
          />
        </Combobox.Button>
        {filteredList.length > 0 && (
          <Combobox.Options className="absolute z-10 mt-1 w-full bg-ctp-crust shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
            {filteredList.map(item => (
              <Combobox.Option
                key={item[itemKey] as React.Key}
                value={item}
                className={({ active }) =>
                  clsx(
                    'relative cursor-default select-none py-2 pl-3 pr-9',
                    active ? 'bg-primary-600 text-white' : 'text-ctp-subtext0'
                  )
                }
              >
                {({ active, selected }) => (
                  <>
                    <div className="flex items-center">
                      {/* <img
                        src={item.imageUrl}
                        alt=""
                        className="h-6 w-6 flex-shrink-0 rounded-full"
                      /> */}
                      <span
                        className={clsx(
                          'ml-3 truncate',
                          selected ? 'font-semibold' : 'font-normal'
                        )}
                      >
                        {retDisplay(item)}
                      </span>
                    </div>

                    {selected && (
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
                )}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        )}
      </div>
    </Combobox>
  )
}
