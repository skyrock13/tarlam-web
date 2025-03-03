// src/components/shared/error.tsx
interface ErrorProps {
    message?: string
  }
  
  export default function Error({ message = 'Something went wrong' }: ErrorProps) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Error</h2>
          <p className="text-muted-foreground">{message}</p>
        </div>
      </div>
    )
  }