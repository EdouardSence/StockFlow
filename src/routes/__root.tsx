import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'StockFlow' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

function Nav() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
        <Link to="/" className="text-lg font-bold text-indigo-600">
          StockFlow
        </Link>
        <Link
          to="/"
          className="text-sm text-gray-600 hover:text-gray-900 [&.active]:font-semibold [&.active]:text-gray-900"
        >
          Dashboard
        </Link>
        <Link
          to="/equipment"
          className="text-sm text-gray-600 hover:text-gray-900 [&.active]:font-semibold [&.active]:text-gray-900"
        >
          Équipements
        </Link>
      </div>
    </nav>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-gray-50">
        <Nav />
        <main className="mx-auto max-w-6xl">{children}</main>
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[{ name: 'Tanstack Router', render: <TanStackRouterDevtoolsPanel /> }]}
        />
        <Scripts />
      </body>
    </html>
  )
}
