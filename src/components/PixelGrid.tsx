import React from 'react'

const GRID_SIZE = 16

export default function PixelGrid() {
  const cells = Array.from({ length: GRID_SIZE * GRID_SIZE })
  return (
    <div
      className="grid gap-px bg-gray-400"
      style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
    >
      {cells.map((_, i) => (
        <div key={i} className="w-6 h-6 bg-white" />
      ))}
    </div>
  )
}
