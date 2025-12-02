"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, ImageIcon, Copy, CheckCheck } from "lucide-react"

const mockAnswers = [
  {
    id: "1",
    question: "React useState 초기값 설정 방법",
    summary: "useState 훅을 사용할 때 초기값은 첫 번째 인자로 전달합니다. 원시값, 객체, 배열 모두 가능합니다.",
    fullAnswer:
      'useState 훅을 사용할 때 초기값은 첫 번째 인자로 전달합니다. 원시값(문자열, 숫자, 불린), 객체, 배열 모두 가능합니다.\n\n예시:\nconst [count, setCount] = useState(0);\nconst [user, setUser] = useState({ name: "", age: 0 });\n\n초기값이 복잡한 계산이 필요한 경우, 함수를 전달하여 지연 초기화를 사용할 수 있습니다:\nconst [value, setValue] = useState(() => expensiveComputation());',
    category: "Frontend",
    hasImage: true,
    imageUrl: "/react-usestate-code-example.jpg",
    timestamp: "2024-01-15 14:30",
  },
  {
    id: "2",
    question: "Node.js에서 환경변수 사용하기",
    summary: "process.env를 통해 환경변수에 접근할 수 있으며, .env 파일과 dotenv 패키지를 사용하는 것이 일반적입니다.",
    fullAnswer:
      'Node.js에서는 process.env 객체를 통해 환경변수에 접근할 수 있습니다.\n\n.env 파일 생성:\nDB_HOST=localhost\nDB_PORT=5432\n\ndotenv 패키지 설치 및 사용:\nnpm install dotenv\n\n코드에서:\nrequire("dotenv").config();\nconst dbHost = process.env.DB_HOST;',
    category: "Backend",
    hasImage: false,
    timestamp: "2024-01-15 13:15",
  },
  {
    id: "3",
    question: "Git merge conflict 해결 방법",
    summary:
      "merge conflict는 같은 파일의 같은 부분을 다르게 수정했을 때 발생합니다. 수동으로 충돌 부분을 확인하고 수정해야 합니다.",
    fullAnswer:
      "Git merge conflict 해결 단계:\n\n1. git status로 충돌 파일 확인\n2. 충돌 파일을 열어 <<<<<<, =======, >>>>>> 마커 확인\n3. 필요한 코드만 남기고 마커 제거\n4. git add <파일명>으로 해결된 파일 스테이징\n5. git commit으로 머지 완료\n\nVS Code 같은 IDE의 merge tool을 사용하면 더 쉽게 해결할 수 있습니다.",
    category: "Git",
    hasImage: true,
    imageUrl: "/git-merge-conflict-resolution.jpg",
    timestamp: "2024-01-14 16:45",
  },
]

export function PreviousAnswers({ searchQuery }) {
  const [expandedId, setExpandedId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const copyToClipboard = async (answer) => {
    const text = `[${answer.category}] ${answer.question}\n\n${answer.fullAnswer}`
    await navigator.clipboard.writeText(text)
    setCopiedId(answer.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-balance">
          {"이전 답변"}
          <Badge variant="secondary">{mockAnswers.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockAnswers
          .filter(
            (answer) =>
              answer.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
              answer.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
              answer.fullAnswer.toLowerCase().includes(searchQuery.toLowerCase()),
          )
          .map((answer) => {
            const isExpanded = expandedId === answer.id
            const isCopied = copiedId === answer.id

            return (
              <div
                key={answer.id}
                className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/5"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {answer.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{answer.timestamp}</span>
                    </div>
                    <h4 className="font-medium text-card-foreground text-balance">{answer.question}</h4>
                  </div>
                  {answer.hasImage && <ImageIcon className="h-4 w-4 shrink-0 text-primary" />}
                </div>

                <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                  {isExpanded ? answer.fullAnswer : answer.summary}
                </p>

                {isExpanded && answer.hasImage && answer.imageUrl && (
                  <div className="mb-3 overflow-hidden rounded-md border border-border">
                    <img
                      src={answer.imageUrl || "/placeholder.svg"}
                      alt="Answer screenshot"
                      className="h-auto w-full"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => toggleExpand(answer.id)} className="gap-1.5 text-xs">
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3.5 w-3.5" />
                        {"접기"}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" />
                        {"더보기"}
                      </>
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(answer)} className="gap-1.5 text-xs">
                    {isCopied ? (
                      <>
                        <CheckCheck className="h-3.5 w-3.5" />
                        {"복사됨"}
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        {"복사"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
      </CardContent>
    </Card>
  )
}
