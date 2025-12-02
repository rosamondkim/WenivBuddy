import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare } from "lucide-react"

const mockSimilarQuestions = [
  {
    id: "1",
    question: "useState와 useReducer의 차이점은 무엇인가요?",
    category: "Frontend",
    matchScore: 92,
  },
  {
    id: "2",
    question: "React Hook의 규칙을 지켜야 하는 이유",
    category: "Frontend",
    matchScore: 85,
  },
  {
    id: "3",
    question: "useState 업데이트가 비동기로 동작하는 이유",
    category: "Frontend",
    matchScore: 78,
  },
]

export function SimilarQuestions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          {"유사 질문"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockSimilarQuestions.map((item) => (
          <button
            key={item.id}
            className="w-full rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-accent/10 hover:border-primary/50"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <Badge variant="outline" className="text-xs">
                {item.category}
              </Badge>
              <span className="text-xs font-medium text-primary">
                {item.matchScore}% {"일치"}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-card-foreground text-pretty">{item.question}</p>
          </button>
        ))}
      </CardContent>
    </Card>
  )
}
