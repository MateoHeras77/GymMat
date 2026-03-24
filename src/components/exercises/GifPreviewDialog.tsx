import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface GifPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gifUrl: string
  exerciseName: string
}

export function GifPreviewDialog({
  open,
  onOpenChange,
  gifUrl,
  exerciseName,
}: GifPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="capitalize">{exerciseName}</DialogTitle>
        </DialogHeader>
        <img
          src={gifUrl}
          alt={exerciseName}
          className="w-full rounded-lg"
        />
      </DialogContent>
    </Dialog>
  )
}
