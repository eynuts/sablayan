import { useEffect, useRef, useCallback } from 'react'

const useScrollReveal = (options = {}) => {
  const observerRef = useRef(null)
  const elementsRef = useRef([])

  const getObserver = useCallback(() => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-active')
            entry.target.classList.remove('reveal-hidden')
            if (options.once !== false) {
              observerRef.current.unobserve(entry.target)
            }
          } else if (options.once === false) {
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
      el.classList.add('reveal-hidden')
      const observer = getObserver()
      observer.observe(el)
    }
  }, [getObserver])

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  return addToRefs
}

export default useScrollReveal
