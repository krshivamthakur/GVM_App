import { GVMPreloader } from '@/components/ui/GVMPreloader'

export default function AdminLoading() {
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center p-6 animate-in fade-in duration-200">
      <GVMPreloader
        size="md"
        text="Loading Admin Portal"
        subtext="Fetching platform data and management tools..."
      />
    </div>
  )
}
