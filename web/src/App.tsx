import { Suspense, useState, lazy, useEffect } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from 'react-router-dom'
import { Disclosure } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import ReactTooltip from 'react-tooltip'

import SuspenseFallback from './components/SuspenseFallback'

import clsx from 'clsx'
import useGameData from './stores/useGameData'
import { sharedCache } from './sharedCache'
import ws from './api'
import { IFlags, useFlags } from './flag'
import { Flag } from './types'
import { InformationCircleIcon } from '@heroicons/react/24/solid'
import logoUrl from './img/logo.png'
const PageIndex = lazy(() => import('./pages/Index'))
const PageGame = lazy(() => import('./pages/Game'))
const PageParty = lazy(() => import('./pages/Party'))
const PageMisc = lazy(() => import('./pages/Misc'))
const PagePresence = lazy(() => import('./pages/Presence'))
const PageXHair = lazy(() => import('./pages/XHair'))
const PagePrefs = lazy(() => import('./pages/Prefs'))

const navigation: {
  key: string
  name: string
  to: string
  visible: (flags: IFlags) => boolean
}[] = [
  {
    key: 'game',
    name: 'Game',
    to: '/game',
    visible: () => true,
  },
  {
    key: 'party',
    name: 'Party',
    to: '/party',
    visible: flags => flags.en(Flag.PARTY_INVITE),
  },
  {
    key: 'misc',
    name: 'Misc',
    to: '/misc',
    visible: flags => flags.en(Flag.ENABLE_AUTOLOCK),
  },
  {
    key: 'presence',
    name: 'Presence',
    to: '/presence',
    visible: flags =>
      flags.en(Flag.PRESENCE_SPOOFING) || flags.en(Flag.STATUS_SPOOFING),
  },
  {
    key: 'xhair',
    name: 'Crosshair',
    to: '/xhair',
    visible: flags => flags.en(Flag.XHAIR_EDITOR),
  },
  {
    key: 'prefs',
    name: 'VALORANT Prefs',
    to: '/prefs',
    visible: flags => flags.en(Flag.PREF_EDITOR),
  },
]

function Navigation() {
  const { connected } = useGameData(state => ({ connected: state.connected }))
  const loc = useLocation()
  const { pathname } = loc

  const flags = useFlags()
  return (
    <Disclosure as="nav" className="bg-base">
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center w-full">
                <div className="flex-shrink-0 select-none ">
                  <img
                    src={logoUrl}
                    className="h-9 w-9 mb-1"
                    draggable={false}
                  />
                </div>
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-4">
                    {navigation
                      .filter(i => i.visible(flags))
                      .map(item => {
                        const current = pathname.startsWith(item.to)
                        return (
                          <Link
                            key={item.key}
                            to={item.to}
                            className={clsx(
                              current
                                ? 'bg-ctp-crust text-ctp-text'
                                : 'text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text',
                              'px-3 py-2 rounded-md text-sm font-medium select-none'
                            )}
                            aria-current={current ? 'page' : undefined}
                          >
                            {item.name}
                          </Link>
                        )
                      })}
                  </div>
                </div>
                <div className="flex-grow" />
                <div className="flex flex-row items-center ">
                  <div
                    className={clsx(
                      'w-3 h-3 animate-pulse bg-ctp-red rounded-full mr-2',
                      {
                        'bg-ctp-red': !connected,
                        'bg-ctp-green': connected,
                      }
                    )}
                  ></div>
                  <span className="select-none">
                    {connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="flex-grow md:flex-grow-0" />
              </div>
              <div className="-mr-2 flex md:hidden">
                <Disclosure.Button className="bg-ctp-surface0 inline-flex items-center justify-center p-2 rounded-md text-ctp-subtext1 hover:text-ctp-text hover:bg-ctp-surface1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-ctp-mauve">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navigation
                .filter(i => i.visible(flags))
                .map(item => {
                  const current = pathname === item.to
                  return (
                    <Disclosure.Button
                      key={item.key}
                      as={Link}
                      to={item.to}
                      className={clsx(
                        current
                          ? 'bg-ctp-crust text-ctp-text'
                          : 'text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text',
                        'block px-3 py-2 rounded-md text-base font-medium select-none'
                      )}
                      aria-current={current ? 'page' : undefined}
                    >
                      {item.name}
                    </Disclosure.Button>
                  )
                })}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  )
}

function S({ el: El }: { el: React.ElementType }) {
  return <Suspense fallback={<SuspenseFallback />} children={<El />} />
}

export default function App() {
  const [loaded, setLoaded] = useState<boolean>(false)
  useEffect(() => {
    if (!sharedCache.initialized) {
      sharedCache
        .init()
        .then(() => {
          ws.connect()
          setLoaded(true)
        })
        .catch(err => {
          console.error('Failed to init database')
        })
    }
  }, [sharedCache.initialized])
  return (
    <BrowserRouter>
      {!loaded && <SuspenseFallback />}
      {loaded && (
        <>
          <Navigation />
          <ReactTooltip id="tip" />

          <Routes>
            <Route path="/" element={<S el={PageIndex} />} />
            <Route path="/game" element={<S el={PageGame} />} />
            <Route path="/party" element={<S el={PageParty} />} />
            <Route path="/misc" element={<S el={PageMisc} />} />
            <Route path="/presence" element={<S el={PagePresence} />} />
            <Route path="/xhair" element={<S el={PageXHair} />} />
            <Route path="/prefs" element={<S el={PagePrefs} />} />
            <Route path="/prefs/current" element={<S el={PagePrefs} />} />
            <Route path="/prefs/presets" element={<S el={PagePrefs} />} />
            <Route path="/prefs/presets/:id" element={<S el={PagePrefs} />} />
          </Routes>
        </>
      )}

      <div
        id="version-overlay"
        className="fixed group bottom-0 right-0 p-4 text-xs text-ctp-base hover:text-ctp-subtext0 hover:bg-ctp-mantle transition-colors flex flex-row items-center opacity-25 hover:opacity-100"
      >
        <div className="hidden group-hover:block">
          <span>built from</span>
          &nbsp;
          <code>
            {BUILD_META.version}+{BUILD_META.commit}
          </code>{' '}
          at <code>{BUILD_META.buildDate}</code>
        </div>
        <div className="ml-2">
          <InformationCircleIcon className="w-5 h-5" />
        </div>
      </div>
    </BrowserRouter>
  )
}
