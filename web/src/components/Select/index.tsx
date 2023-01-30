import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import { Fragment } from 'react'
import usePreferences, { getPref, setPref } from '../../stores/usePreferences'
interface SelectPropTypes {
  label?: string
  items: string[]

  name?: string
  prefPath: string

  defaultValue?: number | number[]

  multiple?: boolean

  className?: string
  as?: React.ElementType
}

export default function Select({
  label,
  items,

  name,
  prefPath,

  defaultValue,

  multiple = false,

  className,
  as: As = 'div',
}: SelectPropTypes) {
  const value = usePreferences(getPref(prefPath))

  return (
    <Listbox value={value} onChange={setPref(prefPath)} multiple={multiple}>
      {({ open }) => (
        <As className={clsx(className)}>
          {label && (
            <Listbox.Label className="block text-sm font-medium text-ctp-text">
              {label}
            </Listbox.Label>
          )}
          <div className="mt-1 relative">
            <Listbox.Button className="bg-ctp-crust relative w-full border border-ctp-mantle rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-ctp-mauve focus:border-ctp-mauve sm:text-sm">
              <span className="block truncate">
                {Array.isArray(value)
                  ? !value.length
                    ? 'None selected'
                    : value.map(i => items[i]).join(', ')
                  : items[value]}
              </span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronUpDownIcon
                  className="h-5 w-5 text-ctp-mauve"
                  aria-hidden="true"
                />
              </span>
            </Listbox.Button>
            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-1 w-full bg-ctp-crust shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                {items.map((item, index) => (
                  <Listbox.Option
                    key={item}
                    className={({ active }) =>
                      clsx(
                        active
                          ? 'text-white bg-primary-600'
                          : 'text-ctp-subtext0',
                        'cursor-default select-none relative py-2 pl-8 pr-4'
                      )
                    }
                    value={index}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={clsx(
                            selected ? 'font-semibold' : 'font-normal',
                            'block truncate'
                          )}
                        >
                          {item}
                        </span>

                        {selected ? (
                          <span
                            className={clsx(
                              active ? 'text-ctp-text' : 'text-ctp-mauve',
                              'absolute inset-y-0 left-0 flex items-center pl-1.5'
                            )}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </As>
      )}
    </Listbox>
  )
}
