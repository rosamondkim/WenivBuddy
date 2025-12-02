import { Sparkles } from "lucide-react";

export function Logo() {
  return (
    <div className="mb-8 flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
        <Sparkles className="h-6 w-6 text-primary-foreground" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-balance">WenivBuddy</h1>
        <p className="text-sm text-muted-foreground">
          {"부트캠프 AI Q&A 어시스턴트"}
        </p>
      </div>
    </div>
  );
}
