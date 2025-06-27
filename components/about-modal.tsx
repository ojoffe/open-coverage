"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AboutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AboutModal({ open, onOpenChange }: AboutModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">About Open Coverage</DialogTitle>
          <DialogDescription>
            Open source initiative for smarter healthcare decisions
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <p>
            Open Coverage is an open source initiative to provide free tools to US healthcare insurance consumers to make smarter insurance and provider decisions.
          </p>
          
          <div className="space-y-3">
            <h3 className="font-semibold">What we offer:</h3>
            <ul className="space-y-2 text-sm">
              <li>• Upload and analyze your health insurance documents</li>
              <li>• Compare multiple policies side-by-side</li>
              <li>• Get personalized cost estimates based on your health profile</li>
              <li>• Ask questions about your coverage using AI</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Our mission:</h3>
            <p className="text-sm">
              We believe US healthcare consumers deserve transparent, accessible tools to understand their coverage options and make informed decisions. 
              All your data stays private - we don't collect or sell your information.
            </p>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Open source project made by{" "}
              <a 
                href="https://x.com/1andyaaron" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Aaron Landy
              </a>
              .
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}