import type { PropsWithChildren } from 'react'
import { HashRouter } from 'react-router-dom'

export default function AppRouter({ children }: PropsWithChildren) {
  return <HashRouter>{children}</HashRouter>
}
