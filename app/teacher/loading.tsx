import { GVMPreloader } from '@/components/ui/GVMPreloader'

export default function TeacherLoading() {
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center p-6 animate-in fade-in duration-200">
      <GVMPreloader
        size="md"
        text="Loading Teacher Portal"
        subtext="Preparing your courses and classroom workspace..."
      />
    </div>
  )
}
