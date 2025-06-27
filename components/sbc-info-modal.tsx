"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface SbcInfoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SbcInfoModal({ open, onOpenChange }: SbcInfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>What is an SBC Document?</DialogTitle>
          <DialogDescription>
            A Summary of Benefits and Coverage (SBC) is a standardized document that health insurance plans must provide to help you understand your coverage. It breaks down your plan's benefits, costs, and coverage in an easy-to-compare format.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <iframe
            src="https://jjvwq07vwjg4fpdc.public.blob.vercel-storage.com/40513CA0390012-00-en-2025-8PWDEL585Y363gXC67AzIF5wrTTWWz.pdf"
            className="w-full h-[70vh] border rounded-md"
            title="Example SBC Document"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}