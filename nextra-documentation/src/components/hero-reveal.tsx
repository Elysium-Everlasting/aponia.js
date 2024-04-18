import { motion, stagger, useAnimate } from 'framer-motion'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

const heroWords = [
  {
    label: 'Simple',
    gradient: 'bg-gradient-to-r from-violet-200 to-pink-200',
  },
  {
    label: 'Headless',
    gradient: 'bg-gradient-to-r from-blue-200 to-cyan-200',
  },
  {
    label: 'Powerful',
    gradient: 'bg-gradient-to-r from-teal-200 to-teal-500',
  },
]

export function HeroReveal() {
  const [scope, animate] = useAnimate()

  const wordsArray = heroWords

  useEffect(() => {
    animate(
      'span',
      {
        opacity: 1,
      },
      {
        duration: 2,
        delay: stagger(0.5),
      },
    )
  }, [scope.current])

  return (
    <div className="">
      <motion.div ref={scope} className={cn('flex flex-col items-center gap-8')}>
        <div>
          {wordsArray.map((word, idx) => {
            return (
              <motion.span
                key={idx}
                className={cn(
                  'font-extrabold text-center text-2xl md:text-4xl lg:text-5xl',
                  'opacity-0',
                  'bg-clip-text text-transparent',
                  word.gradient,
                )}
              >
                {word.label}{' '}
              </motion.span>
            )
          })}
        </div>

        <motion.span key={wordsArray.length} className="opacity-0 space-x-4">
          <Button size="lg">Get Started</Button>
          <Button variant="secondary" size="lg">
            API Reference
          </Button>
        </motion.span>
      </motion.div>
    </div>
  )
}
