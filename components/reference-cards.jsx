import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ExternalLink } from "lucide-react"

const mockReferences = [
  {
    id: "1",
    title: "React Hooks 공식 문서",
    source: "React.dev",
    url: "#",
    type: "docs",
  },
  {
    id: "2",
    title: "useState 완벽 가이드",
    source: "Blog",
    url: "#",
    type: "blog",
  },
  {
    id: "3",
    title: "React State 관리 패턴",
    source: "Tutorial",
    url: "#",
    type: "tutorial",
  },
]

const typeLabels = {
  docs: "문서",
  blog: "블로그",
  video: "영상",
  tutorial: "튜토리얼",
}

export function ReferenceCards() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          {"추가 자료"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockReferences.map((ref) => (
          <a
            key={ref.id}
            href={ref.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/10 hover:border-primary/50"
          >
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {typeLabels[ref.type]}
                </Badge>
              </div>
              <h4 className="mb-1 text-sm font-medium text-card-foreground text-balance">{ref.title}</h4>
              <p className="text-xs text-muted-foreground">{ref.source}</p>
            </div>
            <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
          </a>
        ))}
      </CardContent>
    </Card>
  )
}
