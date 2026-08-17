"use client"

import * as React from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { SystemLoader } from "@/components/SystemLoader"

const MIN_LOADING_MS = 1100
const MAX_LOADING_MS = 4200

function getInternalAnchor(target: EventTarget | null): HTMLAnchorElement | null {
  if (!(target instanceof Element)) {
    return null
  }

  return target.closest("a[href]")
}

export function RouteLoadingOverlay() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isVisible, setIsVisible] = React.useState(false)
  const startedAtRef = React.useRef(0)
  const hideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const fallbackTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = React.useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }

    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }
  }, [])

  const finishLoading = React.useCallback(() => {
    if (!startedAtRef.current) {
      return
    }

    const elapsed = window.performance.now() - startedAtRef.current
    const remaining = Math.max(MIN_LOADING_MS - elapsed, 260)

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
    }

    hideTimerRef.current = setTimeout(() => {
      startedAtRef.current = 0
      setIsVisible(false)
    }, remaining)
  }, [])

  React.useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }

      const anchor = getInternalAnchor(event.target)
      if (!anchor || anchor.target || anchor.hasAttribute("download")) {
        return
      }

      const nextUrl = new URL(anchor.href, window.location.href)
      if (nextUrl.origin !== window.location.origin || nextUrl.hash && nextUrl.pathname === window.location.pathname) {
        return
      }

      const currentPath = `${window.location.pathname}${window.location.search}`
      const nextPath = `${nextUrl.pathname}${nextUrl.search}`
      if (currentPath === nextPath) {
        return
      }

      clearTimers()
      startedAtRef.current = window.performance.now()
      setIsVisible(true)

      fallbackTimerRef.current = setTimeout(() => {
        finishLoading()
      }, MAX_LOADING_MS)
    }

    document.addEventListener("click", handleClick, true)

    return () => {
      document.removeEventListener("click", handleClick, true)
      clearTimers()
    }
  }, [clearTimers, finishLoading])

  React.useEffect(() => {
    finishLoading()
  }, [pathname, searchParams, finishLoading])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="route-loading-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="fixed inset-0 z-[180] flex items-center justify-center bg-background/82 px-4 backdrop-blur-md"
          aria-label="Loading next page"
        >
          <motion.div
            initial={{ y: 14, scale: 0.985, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -8, scale: 0.99, opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xl"
          >
            <SystemLoader
              size="panel"
              message="Switching secure route"
              detail="Synchronizing interface state for a smoother transition."
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
