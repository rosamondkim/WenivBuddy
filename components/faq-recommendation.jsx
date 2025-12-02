"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, X, CheckCircle } from "lucide-react"

export function FaqRecommendation() {
  const [isVisible, setIsVisible] = useState(true)
  const [isRegistered, setIsRegistered] = useState(false)

  if (!isVisible) return null

  const handleRegister = () => {
    console.log("[v0] Registering as FAQ")
    setIsRegistered(true)
    setTimeout(() => {
      setIsVisible(false)
    }, 2000)
  }

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            {isRegistered ? (
              <CheckCircle className="h-5 w-5 text-primary" />
            ) : (
              <AlertCircle className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1">
            {isRegistered ? (
              <div>
                <h3 className="font-medium text-card-foreground">{"FAQ로 등록되었습니다"}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {"이제 다른 강사들도 이 답변을 빠르게 찾을 수 있습니다."}
                </p>
              </div>
            ) : (
              <>
                <h3 className="font-medium text-card-foreground">{"반복되는 질문이 감지되었습니다"}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {"이 질문은 최근 7일간 5회 이상 반복되었습니다. FAQ로 등록하시겠습니까?"}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={handleRegister} className="gap-2">
                    {"FAQ로 등록하기"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsVisible(false)}>
                    {"나중에"}
                  </Button>
                </div>
              </>
            )}
          </div>
          <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => setIsVisible(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
