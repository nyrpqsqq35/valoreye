import Page from '../components/Page'
import { HashtagIcon, UserPlusIcon, UsersIcon } from '@heroicons/react/24/solid'
import { useRef } from 'react'
import ws from '../api'
import { Flag, OpCode } from '../types'
import { useFlags } from '../flag'

function AddToParty() {
  const usernameRef = useRef<HTMLInputElement>(null)
  const tagRef = useRef<HTMLInputElement>(null)
  const inviteClicked = () => {
    const username = usernameRef.current?.value
    const tag = tagRef.current?.value
    ws.send(OpCode.INVITE_PLAYER, [username, tag])
    usernameRef.current!.value = tagRef.current!.value = ''
  }
  return (
    <div>
      <label
        htmlFor="email"
        className="block text-sm font-medium text-ctp-text"
      >
        Invite player to party
      </label>
      <div className="mt-1 flex rounded-md shadow-sm ">
        <div className="relative flex focus-within:z-10">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <UsersIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="bg-ctp-crust text-ctp-text block w-64 rounded-none rounded-l-md border-ctp-mantle pl-10 focus:border-ctp-mauve focus:ring-ctp-mauve sm:text-sm"
              placeholder="SEN TenZ"
              maxLength={32}
              ref={usernameRef}
            />
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <HashtagIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </div>
            <input
              type="text"
              className="bg-ctp-crust text-ctp-text block w-24 rounded-none border-ctp-mantle pl-10 focus:border-ctp-mauve focus:ring-ctp-mauve sm:text-sm"
              placeholder="0505"
              maxLength={5}
              ref={tagRef}
            />
          </div>
        </div>
        <button
          type="button"
          className="relative  -ml-px inline-flex items-center space-x-2 rounded-r-md border border-ctp-mantle bg-ctp-crust px-4 py-2 text-sm font-medium text-ctp-text hover:bg-ctp-base focus:border-ctp-mauve focus:outline-none focus:ring-1 focus:ring-ctp-mauve"
          onClick={inviteClicked}
        >
          <UserPlusIcon
            className="h-5 w-5 text-ctp-text -400"
            aria-hidden="true"
          />
          <span>Invite</span>
        </button>
      </div>
    </div>
  )
}

export default function PageParty() {
  const flags = useFlags()
  return (
    <Page>
      <Page.Header title={'Party'} />
      <Page.Content>
        {flags.en(Flag.PARTY_INVITE) && <AddToParty />}
      </Page.Content>
    </Page>
  )
}
