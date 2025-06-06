import type React from "react"
interface GameboyFrameProps {
  children: React.ReactNode
}

export default function GameboyFrame({ children }: GameboyFrameProps) {
  return (
    <div className="gameboy-container">
      <div className="gameboy-outer-frame">
        <div className="gameboy-inner-frame">{children}</div>

        {/* D-Pad */}
        <div className="gameboy-controls">
          <div className="d-pad">
            <div className="d-pad-horizontal"></div>
            <div className="d-pad-vertical"></div>
          </div>

          {/* A/B Buttons */}
          <div className="action-buttons">
            <div className="button button-b">B</div>
            <div className="button button-a">A</div>
          </div>

          {/* Start/Select */}
          <div className="menu-buttons">
            <div className="button button-select">SELECT</div>
            <div className="button button-start">START</div>
          </div>
        </div>
      </div>
    </div>
  )
}
