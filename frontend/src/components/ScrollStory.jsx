import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'

export default function ScrollStory({ steps, children }) {
  const [active, setActive] = useState(0)
  const [wide, setWide] = useState(() => window.matchMedia('(min-width: 1024px) and (min-height: 600px)').matches)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px) and (min-height: 600px)')
    const resize = () => setWide(media.matches)
    media.addEventListener('change', resize)
    return () => media.removeEventListener('change', resize)
  }, [])

  return (
    <div className={`scroll-story ${wide ? 'is-wide' : 'is-stacked'}`}>
      <div className="story-steps">
        {steps.map((step, index) => (
          <motion.article key={step.title}
            className={`story-step ${active === index || !wide ? 'is-current' : ''}`}
            onViewportEnter={() => { if (wide) setActive(index) }}
            viewport={{ margin: '-35% 0px -45% 0px' }}>
            <motion.div className="step-copy"
              initial={reducedMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: reducedMotion ? 0 : 0.45 }}>
              <span className="step-count">{String(index + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              <span className="step-detail">{step.detail}</span>
            </motion.div>
            {!wide && <motion.div initial={reducedMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: reducedMotion ? 0 : 0.45 }}>{children(step)}</motion.div>}
          </motion.article>
        ))}
      </div>
      {wide && <div className="story-stage">
        <div className="story-stage-nav" aria-label="Story steps">
          <span>Scroll to change the view <span aria-hidden="true">↓</span></span>
          <div>{steps.map((step, index) => <button key={step.title} type="button"
            aria-label={`Show step ${index + 1}: ${step.title}`} aria-pressed={active === index}
            onClick={event => {
              setActive(index)
              event.currentTarget.closest('.scroll-story').querySelectorAll('.story-step')[index]
                .scrollIntoView({ block: 'center', behavior: reducedMotion ? 'instant' : 'smooth' })
            }}>{index + 1}</button>)}</div>
        </div>
        <div className="story-view-label"><span>STEP {active + 1} / {steps.length}</span><strong>{steps[active].title}</strong></div>
        <motion.div key={active} initial={reducedMotion ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }} transition={{ duration: reducedMotion ? 0 : 0.45 }}>
          {children(steps[active])}
        </motion.div>
        <p className="story-stage-hint">Try the controls anytime. The next story step starts a new view.</p>
      </div>}
    </div>
  )
}
