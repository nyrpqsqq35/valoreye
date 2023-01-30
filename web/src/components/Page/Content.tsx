export interface PropTypes extends React.PropsWithChildren {}
export function Content({ children }: PropTypes) {
  return (
    <main>
      <div className="max-w-7xl mx-auto py-6 px-2 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  )
}
