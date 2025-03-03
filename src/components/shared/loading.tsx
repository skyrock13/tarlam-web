// src/components/shared/loading.tsx
import { cn } from "@/lib/utils/helpers"

interface LoadingProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  fullHeight?: boolean
  fullScreen?: boolean
  overlay?: boolean
  text?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12'
}

export default function Loading({ 
  className, 
  size = 'md', 
  fullHeight = true,
  fullScreen = false,
  overlay = false,
  text
}: LoadingProps) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    if (overlay) {
      return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80">
          {children}
        </div>
      )
    }
    return <>{children}</>
  }

  return (
    <Wrapper>
      <div className={cn(
        "flex flex-col items-center justify-center gap-4",
        fullScreen && "fixed inset-0 z-50 bg-background",
        fullHeight && !fullScreen && "h-[calc(100vh-4rem)]",
        !fullHeight && !fullScreen && "h-[400px]",
        className
      )}>
        <div className={cn(
          "animate-spin rounded-full border-4 border-primary border-t-transparent",
          sizeClasses[size]
        )} />
        {text && (
          <p className="text-sm text-muted-foreground">{text}</p>
        )}
      </div>
    </Wrapper>
  )
}

// Özel durumlar için hazır bileşenler
export function LoadingOverlay({ text }: { text?: string }) {
  return (
    <Loading 
      size="lg" 
      fullHeight={false} 
      overlay 
      text={text} 
    />
  )
}

export function LoadingSection({ text }: { text?: string }) {
  return (
    <Loading 
      fullHeight={false} 
      text={text} 
    />
  )
}

export function LoadingFullScreen({ text }: { text?: string }) {
  return (
    <Loading 
      size="lg" 
      fullScreen 
      text={text} 
    />
  )
}

// PageLoading bileşeni - Sayfa yüklenirken kullanılır
export function PageLoading({ text = "Loading..." }: { text?: string }) {
  return (
    <Loading 
      size="lg"
      fullHeight 
      text={text}
    />
  )
}