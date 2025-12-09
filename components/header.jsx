"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Logo } from "@/components/logo"

export function Header({ onAddQnAClick }) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Logo />
          <Button onClick={onAddQnAClick} className="gap-2">
            <Plus className="h-4 w-4" />
            새 답변 등록
          </Button>
        </div>
      </div>
    </header>
  )
}
