import { useState } from 'react'
import { motion, useScroll } from 'motion/react'
import MedianTrends from './components/MedianTrends'
import FertilityVsIndicatorScatterplot from './components/FertilityVsIndicatorScatterplot'
import CountryChangeChart from './components/CountryChangeChart'
import PeerHistoryChart from './components/PeerHistoryChart'
import CaseComparisonChart from './components/CaseComparisonChart'
import ModelComparisonChart from './components/ModelComparisonChart'
import OverviewChart from './components/OverviewChart'
import ScrollStory from './components/ScrollStory'
import './App.css'

export default function App() {
  const [selectedCountry, setSelectedCountry] = useState('IND')
  const { scrollYProgress } = useScroll()

  return (
    <main className="page">
      <motion.div className="reading-progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" />
      <header className="intro">
        <div className="eyebrow">World Bank data · 1990–2024</div>
        <h1>Beyond the Birth Rate</h1>
        <p>Explore how fertility changed alongside income, child survival, and education.</p>
        <p className="interaction-hint">Hover or focus charts for exact values.</p>
        <a className="story-start" href="#section-1">Follow the story <span aria-hidden="true">↓</span></a>
        <div className="intro-facts"><span><strong>182</strong> economies</span><span><strong>6</strong> chapters</span></div>
      </header>

      <section className="story-section" aria-labelledby="section-1">
        <div className="section-intro">
          <span className="section-number">01</span>
          <div>
            <h2 id="section-1">A world of changing paths</h2>
          </div>
        </div>
        <MedianTrends />
      </section>

      <section className="story-section" aria-labelledby="section-2">
        <div className="section-intro">
          <span className="section-number">02</span>
          <div>
            <h2 id="section-2">What changes alongside fertility?</h2>
          </div>
        </div>
        <ScrollStory steps={[
          { title: 'Start with income.', indicator: 'gdp_pc', year: 2024, text: 'Higher-income economies tend to have lower fertility, though the dots spread widely.' },
          { title: 'Look at child survival.', indicator: 'mortality', year: 2024, text: 'More under-five deaths generally appear alongside higher fertility.' },
          { title: 'Education adds another view.', indicator: 'education', year: 2023, text: 'Higher female secondary enrollment often appears alongside lower fertility. Education has a smaller data sample.' },
        ]}>
          {(step, onExplore) => <FertilityVsIndicatorScatterplot selectedCountry={selectedCountry} onCountrySelect={setSelectedCountry} initialYear={step.year} initialIndicator={step.indicator} onExplore={onExplore} />}
        </ScrollStory>
      </section>

      <section className="story-section" aria-labelledby="section-3">
        <div className="section-intro">
          <span className="section-number">03</span>
          <div>
            <h2 id="section-3">Follow one dot</h2>
            <p>Select a dot to follow an economy over time.</p>
          </div>
        </div>
        <OverviewChart selectedCountry={selectedCountry} onCountrySelect={setSelectedCountry} />
      </section>

      <section className="story-section" aria-labelledby="section-4">
        <div className="section-intro">
          <span className="section-number">04</span>
          <div>
            <h2 id="section-4">Did they change together?</h2>
          </div>
        </div>
        <ScrollStory steps={[
          { title: 'Income growth is a weak guide.', indicator: 'gdp', text: 'Bigger income gains did not reliably mean bigger fertility declines.' },
          { title: 'Falling mortality, different fertility paths.', indicator: 'mortality', text: 'Bigger declines in child mortality only weakly tracked fertility declines.' },
          { title: 'Education gains show a clearer pattern.', indicator: 'education', text: 'Bigger enrollment gains often accompanied bigger fertility declines, with many exceptions.' },
        ]}>
          {(step, onExplore) => <CountryChangeChart initialIndicator={step.indicator} onExplore={onExplore} />}
        </ScrollStory>
      </section>

      <section className="story-section" aria-labelledby="section-5">
        <div className="section-intro">
          <span className="section-number">05</span>
          <div>
            <h2 id="section-5">Similar beginnings, different journeys</h2>
            <p>Choose an economy to follow its 2001 peers.</p>
          </div>
        </div>
        <PeerHistoryChart />
        <div className="case-bridge">
          <h3>Similar conditions at both ends. Different fertility paths.</h3>
          <p>These pairs also had similar measured conditions in 2023, yet their fertility gaps grew.</p>
        </div>
        <details className="case-study">
          <summary><span><strong>Explore a surprising pair</strong></span><span aria-hidden="true" className="case-arrow">⌄</span></summary>
          <CaseComparisonChart />
        </details>
      </section>

      <section className="story-section" aria-labelledby="section-6">
        <div className="section-intro">
          <span className="section-number">06</span>
          <div>
            <h2 id="section-6">Can we predict fertility?</h2>
            <p>How close can we get for an economy the model has not seen?</p>
          </div>
        </div>
        <ModelComparisonChart />
      </section>
    </main>
  )
}
