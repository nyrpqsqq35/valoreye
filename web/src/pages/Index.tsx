import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import Page from '../components/Page'

export default function PageIndex() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate('/game')
  }, [navigate])
  return (
    <Page>
      <Page.Header title={'Index'} />
      <Page.Content></Page.Content>
    </Page>
  )
}
