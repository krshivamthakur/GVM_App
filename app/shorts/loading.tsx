import { GVMPreloader } from '@/components/ui/GVMPreloader'

export default function ShortsLoading() {
  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center p-6 animate-in fade-in duration-200">
      <GVMPreloader
        size="md"
        text="Loading Shorts"
        subtext="Fetching micro-lessons and video feed..."
      />
    </div>
  )
}
