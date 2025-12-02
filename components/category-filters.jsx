"use client"

import { Button } from "@/components/ui/button"
import { Code, Database, GitBranch, Layout, Server, Palette } from "lucide-react"

const categories = [
  { id: "all", label: "전체", icon: null },
  { id: "fe", label: "Frontend", icon: Layout },
  { id: "be", label: "Backend", icon: Server },
  { id: "data", label: "Data", icon: Database },
  { id: "git", label: "Git", icon: GitBranch },
  { id: "design", label: "Design", icon: Palette },
  { id: "etc", label: "기타", icon: Code },
]

export function CategoryFilters({ selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const Icon = category.icon
        return (
          <Button
            key={category.id}
            variant={selected === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => onSelect(category.id)}
            className="gap-2"
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {category.label}
          </Button>
        )
      })}
    </div>
  )
}
