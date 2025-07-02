'use client'

import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import AnalysisPage from './analysis-page';

export default function Page({ params }: { params: { id: string } }) {
  const runtime = useChatRuntime({
    api: "/api/chat",
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <AnalysisPage />
    </AssistantRuntimeProvider>
  )
}