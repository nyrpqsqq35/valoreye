import { Header } from './Header'
import { Content } from './Content'

export interface PagePropTypes extends React.PropsWithChildren {}
function Page({ children }: PagePropTypes) {
  return <>{children}</>
}

Page.Content = Content
Page.Header = Header

export type { PropTypes as HeaderPropTypes } from './Header'
export type { PropTypes as ContentPropTypes } from './Content'
export default Page
