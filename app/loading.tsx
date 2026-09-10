import { GVMPreloader } from '@/components/ui/GVMPreloader'

export default function Loading() {
  return (
    <div className="min-h-[75vh] w-full flex items-center justify-center p-6">
      <GVMPreloader
        size="lg"
        text="Loading GVM Portal"
        subtext="Please wait while we prepare your dashboard..."
      />
    </div>
  )
}
