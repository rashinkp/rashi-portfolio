import { motion } from 'motion/react'
import { VStack, HStack } from '@astryxdesign/core/Stack'
import { Card } from '@astryxdesign/core/Card'

// Wrap the design-system primitives so layout and spacing still belong to Astryx.
export const MotionVStack = motion.create(VStack)
export const MotionHStack = motion.create(HStack)
export const MotionCard = motion.create(Card)
export const noteSpring = { type: 'spring' as const, stiffness: 400, damping: 30, mass: 1 }
export const revealSpring = { type: 'spring' as const, stiffness: 300, damping: 24, mass: 4 }

export function durationToken(element: Element, name: string, fallback: number) {
  const value = getComputedStyle(element).getPropertyValue(name).trim()
  const amount = parseFloat(value)
  return Number.isFinite(amount) ? amount / (value.endsWith('ms') ? 1000 : 1) : fallback
}

export function spacingToken(name: string) {
  const value = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name))
  return Number.isFinite(value) ? value : 0
}
