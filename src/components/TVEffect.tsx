"use client"
import * as React from "react"

export function TVEffect() {
  const [active, setActive] = React.useState(true)

  React.useEffect(() => {
    // Efek awal saat halaman dimuat (3 detik)
    const initialTimer = setTimeout(() => {
      setActive(false)
    }, 3000)

    // Efek berulang setiap 5 detik
    const interval = setInterval(() => {
      setActive(true)
      // Tampilkan efek selama 400ms untuk simulasi "flicker" yang lebih terasa
      setTimeout(() => {
        setActive(false)
      }, 400)
    }, 5000)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [])

  if (!active) return null

  return (
    <div 
      className="tv-screen" 
      aria-hidden="true" 
      style={{
        animation: 'tv-flicker 0.15s infinite'
      }}
    />
  )
}