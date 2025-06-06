"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface EmojiSelectorProps {
  selectedEmoji: string
  onEmojiSelect: (emoji: string) => void
}

const emojiCategories = {
  human: {
    label: "👤 Human",
    emojis: ["🧑‍💼", "👩‍💻", "👨‍🔬", "👨‍🏫", "👩‍🚀", "👨‍💼", "👩‍🔬", "🧑‍🚀"],
  },
  animal: {
    label: "🐾 Animal",
    emojis: ["🐸", "🐻", "🐱", "🦊", "🐼", "🐺", "🦁", "🐯"],
  },
  fantasy: {
    label: "👽 Fantasy",
    emojis: ["👽", "🤖", "👻", "🧙‍♂️", "🐉", "🦄", "🧚‍♀️", "🧞‍♂️"],
  },
  iconic: {
    label: "💎 Iconic",
    emojis: ["⚡", "🎯", "🔥", "🧠", "🎮", "💎", "🌟", "🚀"],
  },
}

export function EmojiSelector({ selectedEmoji, onEmojiSelect }: EmojiSelectorProps) {
  const [activeCategory, setActiveCategory] = useState("human")

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="font-pixel text-sm text-primary mb-2">PICK YOUR AGENT'S VIBE</h3>
        <p className="text-xs text-muted-foreground">Choose a symbol to represent them</p>
      </div>

      <div className="flex justify-center">
        <div className="text-4xl p-4 border-2 border-pixel rounded-lg bg-muted/30">{selectedEmoji || "❓"}</div>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-4 font-pixel">
          <TabsTrigger value="human" className="text-xs">
            👤
          </TabsTrigger>
          <TabsTrigger value="animal" className="text-xs">
            🐾
          </TabsTrigger>
          <TabsTrigger value="fantasy" className="text-xs">
            👽
          </TabsTrigger>
          <TabsTrigger value="iconic" className="text-xs">
            💎
          </TabsTrigger>
        </TabsList>

        {Object.entries(emojiCategories).map(([category, data]) => (
          <TabsContent key={category} value={category} className="mt-4">
            <div className="grid grid-cols-4 gap-2">
              {data.emojis.map((emoji) => (
                <Button
                  key={emoji}
                  variant={selectedEmoji === emoji ? "default" : "outline"}
                  className={`h-12 text-2xl p-0 transition-all ${
                    selectedEmoji === emoji ? "ring-2 ring-primary ring-offset-2" : ""
                  }`}
                  onClick={() => onEmojiSelect(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Selected: <span className="font-pixel">{selectedEmoji ? `${selectedEmoji} Ready!` : "Choose an emoji"}</span>
        </p>
      </div>
    </div>
  )
}
