export const preloadImage = (src) => new Promise((resolve) => {
  if (!src) {
    resolve()
    return
  }

  const image = new Image()
  image.onload = () => resolve()
  image.onerror = () => resolve()
  image.src = src
})

export const preloadImages = (sources = []) => {
  return Promise.all(sources.filter(Boolean).map(preloadImage))
}
