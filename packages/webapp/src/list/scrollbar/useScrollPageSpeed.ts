import { useState, useEffect, useCallback, Dispatch, useMemo } from 'react'

const getScrollTop = e => e?.scrollTop || e?.scrollY || 0

const diffMap = (offset = 0) => {
  return (_, i, a) => {
    const current = a[(i + offset) % a.length]
    const prev = a[(i + offset - 1 + a.length) % a.length]

    return Math.abs(current - prev)
  }
}

const flattenMap = (size, offset = 0) => {
  return (_, i, a) => {
    let sum = 0
    for (let j = 0; j < size; j++) {
      sum += a[(i - j + offset + a.length) % a.length]
    }
    return sum / size
  }
}

const scrollPageSpeedInit = (intervalMs, count) => ({
  count,
  intervalMs,
  timeFactor: 1000 / intervalMs,
  scrollTops: new Array(count).fill(0),
  flattenSize: 3,
  index: 0
})

export const useScrollPageSpeed = (ref, pageHeight): [number, Dispatch<number>] => {
  const [pagePerSecond, setPagePerSecond] = useState(0)
  const [pageHeightState, setPageHeight] = useState(pageHeight)

  const state = useMemo(() => scrollPageSpeedInit(200, 10), [])

  const updateScrollTop = useCallback(() => {
    const { count, timeFactor, scrollTops, flattenSize, index} = state

    const scrollTop = getScrollTop(ref.current)
    scrollTops[index % count] = scrollTop

    const flattenDiffs = scrollTops
      .map(flattenMap(flattenSize, index)) // flatten scroll jittering with reindex
      .map(diffMap())                      // create scroll diffs
      .slice(0, count - flattenSize - 1)   // remove invalid values from flatten and diff
    const sumFlattenDiffs = flattenDiffs.reduce((r, v) => r + v, 0)

    const pagePerSecond = sumFlattenDiffs * timeFactor / flattenDiffs.length / pageHeightState
    // console.log(`scrollTops: ${scrollTops}, index: ${index}, flattenDiffs ${flattenDiffs}, pagePerSeconds: ${pagePerSecond}`)
    state.index++
    setPagePerSecond(value => value != pagePerSecond ? pagePerSecond : value)
  }, [ref, pageHeightState, state])

  useEffect(() => {
    const id = setInterval(updateScrollTop, state.intervalMs)
    return () => clearInterval(id)
  }, [ref])

  useEffect(() => {
    updateScrollTop()
  }, [pageHeightState])

  return [pagePerSecond, setPageHeight]
}

export enum SimplePageSpeed {
  NONE,
  SLOW,
  MEDIUM,
  FAST
}

export const useScrollPageSpeedSimple = (ref, pageHeight): [SimplePageSpeed, Dispatch<number>] => {
  const [pagePerSecond, setPageHeight] = useScrollPageSpeed(ref, pageHeight)

  const [speed, setSpeed] = useState(SimplePageSpeed.NONE)

  useEffect(() => {
    if (pagePerSecond == 0) {
      setSpeed(SimplePageSpeed.NONE)
    } else if (pagePerSecond < 0.6) {
      setSpeed(SimplePageSpeed.SLOW)
    } else if (pagePerSecond < 1.5) {
      setSpeed(SimplePageSpeed.MEDIUM)
    } else {
      setSpeed(SimplePageSpeed.FAST)
    }
  }, [pagePerSecond])

  return [speed, setPageHeight]
}