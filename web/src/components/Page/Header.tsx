import clsx from 'clsx'
import { Fragment } from 'react'

export type SubItem = {
  icon: React.ElementType
  className?: string
  pClassName?: string
  key: string
  value: string | React.ReactNode
}

export interface PropTypes {
  title: string
  subtitle?: string
  subitems?: SubItem[]
  image?: string
}

export function Header({ title, subtitle, subitems, image }: PropTypes) {
  return (
    <header className="bg-ctp-mantle shadow">
      <div className="flex max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold leading-7 text-ctp-mauve sm:leading-9 sm:truncate select-none">
            {title}
          </h1>
          <dl className="flex flex-col mt-2 sm:flex-row sm:flex-wrap select-none">
            {subtitle && (
              <dd className="flex items-center text-sm text-ctp-subtext0 font-medium sm:mr-6">
                {subtitle}
              </dd>
            )}
            {subitems &&
              subitems.map(
                ({ icon: Icon, className, pClassName, key, value }) => (
                  <Fragment key={key}>
                    <dt className="sr-only">{key}</dt>
                    <dd
                      className={clsx(
                        'flex items-center text-sm text-ctp-subtext1 font-medium capitalize sm:mr-6 select-none',
                        pClassName
                      )}
                    >
                      <Icon
                        className={clsx(
                          'flex-shrink-0 mr-1.5 h-5 w-5 text-ctp-subtext1',
                          className
                        )}
                        aria-hidden="true"
                      />
                      {value}
                    </dd>
                  </Fragment>
                )
              )}
          </dl>
        </div>
        {image && (
          <>
            <div className="flex-grow" />
            <div
              className="w-96 h-full bg-cover bg-no-repeat absolute top-0 right-0"
              style={{
                backgroundImage: `linear-gradient(to right, rgba(24,24,37,1), rgba(24,24,37,0.45) 20%, rgba(0,0,0,0) 100%), url(${image})`,
              }}
            ></div>
          </>
        )}
      </div>
    </header>
  )
}
