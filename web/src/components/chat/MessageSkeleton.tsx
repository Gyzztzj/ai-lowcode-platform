import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function MessageSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className={`flex gap-4 items-start ${i % 2 === 1 ? 'flex-row-reverse' : ''}`}
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              <Skeleton className="h-full w-full rounded-full" />
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2 max-w-[70%]">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
