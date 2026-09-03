import Button from '../components/ui/Button'
import { Logo } from '../components/Icons'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <Logo className="mb-8 h-11 w-11" />
      <p className="text-7xl font-bold text-gradient">404</p>
      <h1 className="mt-4 text-2xl font-bold text-white">Page not found</h1>
      <p className="mt-2 max-w-sm text-ink-400">
        This admin route does not exist.
      </p>
      <Button to="/" className="mt-8">
        Back to overview
      </Button>
    </div>
  )
}
