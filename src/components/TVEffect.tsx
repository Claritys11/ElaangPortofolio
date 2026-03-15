"use client"
import * as React from "react"

export function TVEffect() {
  const [active, setActive] = React.useState(true)

  React.useEffect(() => {
    // Menjalankan efek TV selama 3 detik saat komponen dimuat
    const timer = setTimeout(() => setActive(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  if (!active) return null

  return <div className="tv-screen" aria-hidden="true" />
}
