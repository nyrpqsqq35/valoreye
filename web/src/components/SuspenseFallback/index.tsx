import { ArrowPathIcon } from '@heroicons/react/24/outline'

export default function SuspenseFallback() {
  return (
    <div className="flex h-full flex-col space-y-4 items-center justify-center">
      <ArrowPathIcon className="text-ctp-mauve animate-spin h-16 w-16" />
      <span className="text-ctp-subtext0 uppercase tracking-wider text-2xl font-semibold">
        Loading
      </span>
    </div>
  )
}
