export const createRevealVariants = (reducedMotion = false, delay = 0) => ({
  hidden: {
    opacity: 0,
    y: reducedMotion ? 0 : 28
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: reducedMotion ? 0 : 0.65,
      delay,
      ease: [0.22, 1, 0.36, 1]
    }
  }
})

export const createStaggerContainer = (reducedMotion = false, staggerChildren = 0.12, delayChildren = 0) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: reducedMotion ? 0 : staggerChildren,
      delayChildren: reducedMotion ? 0 : delayChildren
    }
  }
})

export const cardHoverMotion = (reducedMotion = false) => (
  reducedMotion
    ? {}
    : {
        y: -8,
        transition: {
          duration: 0.28,
          ease: [0.22, 1, 0.36, 1]
        }
      }
)
