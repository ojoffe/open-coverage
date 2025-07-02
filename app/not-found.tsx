import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex h-[50vh] flex-col items-center justify-center">
      <h2 className="text-2xl font-semibold mb-4">404 - Page Not Found</h2>
      <p className="text-muted-foreground mb-4">
        The page you're looking for doesn't exist.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  )
}