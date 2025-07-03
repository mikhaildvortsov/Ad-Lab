"use client";
import { useState } from 'react';
import { ChatInterface } from '@/components/chat-interface';

export default function ChatPage() {
  const [open, setOpen] = useState(true);
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">ChatGPT Assistant</h1>
        <p className="text-muted-foreground">
          Ask me anything! I'm here to help with your questions and tasks.
        </p>
      </div>
      
      <ChatInterface open={open} onOpenChange={setOpen} />
    </div>
  );
} 