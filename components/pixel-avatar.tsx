import type { Agent } from "@/lib/types"

interface PixelAvatarProps {
  agent: Agent
  size?: "small" | "medium" | "large"
}

export default function PixelAvatar({ agent, size = "medium" }: PixelAvatarProps) {
  const sizeClasses = {
    small: "w-8 h-8",
    medium: "w-12 h-12",
    large: "w-16 h-16",
  }

  return (
    <div className={`pixel-avatar ${sizeClasses[size]}`}>
      {/* Fallback to pixel art if no image */}
      <div className="pixel-character">{agent.name.charAt(0)}</div>
    </div>
  )
}
