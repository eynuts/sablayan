import { useEffect, useRef, useCallback } from 'react'

// Custom hook for revealing elements as they scroll into view
// Usage: const revealRef = useScrollReveal({ threshold: 0.15, rootMargin: '0px', once: true })
// Then attach revealRef to any element: <div ref={revealRef}>...</div>
const useScrollReveal = (options = {}) => {
  const observerRef = useRef(null) // Stores IntersectionObserver instance
  const elementsRef = useRef([]) // Stores observed elements to prevent duplicates

  const getObserver = useCallback(() => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Element is visible, activate reveal animation
            entry.target.classList.add('reveal-active')
            entry.target.classList.remove('reveal-hidden')

            // If reveal should happen only once, stop observing after first reveal
            if (options.once !== false) {
              observerRef.current.unobserve(entry.target)
            }
          } else if (options.once === false) {
            // If configured to animate multiple times, reset the hidden state
            entry.target.classList.remove('reveal-active')
            entry.target.classList.add('reveal-hidden')
          }
        })
      }, {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '0px'
      })
    }
    return observerRef.current
  }, [options.threshold, options.rootMargin, options.once])

  const addToRefs = useCallback((el) => {
    if (el && !elementsRef.current.includes(el)) {
      elementsRef.current.push(el)
      el.classList.add('reveal-hidden') // Ensure element is hidden before it becomes visible
      const observer = getObserver()
      observer.observe(el)
    }
  }, [getObserver])

  useEffect(() => {
    // Cleanup the observer when the component unmounts
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  return addToRefs
}

export default useScrollReveal
