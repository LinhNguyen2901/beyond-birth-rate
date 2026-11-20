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
        <div className="intro-facts"><span><strong>182</strong> countries</span><span><strong>6</strong> chapters</span></div>
      </header>

      <section className="story-section" aria-labelledby="section-1">
        <div className="section-intro">
          <span className="section-number">01</span>
          <div>
            <h2 id="section-1">How the world has changed</h2>
            <p>In this sample, fertility and child mortality fell while income and enrollment rose.</p>
          </div>
        </div>
        <MedianTrends />
      </section>

      <section className="story-section" aria-labelledby="section-2">
        <div className="section-intro">
          <span className="section-number">02</span>
          <div>
            <h2 id="section-2">How do countries compare?</h2>
            <p>Now look at fertility and living conditions in the same year.</p>
          </div>
        </div>
        <ScrollStory steps={[
          { title: 'Look at income', indicator: 'gdp_pc', year: 2024, text: 'Higher-income countries usually have lower fertility, but there are plenty of exceptions.' },
          { title: 'Look at child mortality', indicator: 'mortality', year: 2024, text: 'Countries with more deaths among young children usually have higher fertility.' },
          { title: 'Look at education', indicator: 'education', year: 2023, text: 'Higher female secondary enrollment often goes with lower fertility. These data cover fewer countries.' },
        ]}>
          {(step, onExplore) => <FertilityVsIndicatorScatterplot selectedCountry={selectedCountry} onCountrySelect={setSelectedCountry} initialYear={step.year} initialIndicator={step.indicator} onExplore={onExplore} />}
        </ScrollStory>
      </section>

      <section className="story-section" aria-labelledby="section-3">
        <div className="section-intro">
          <span className="section-number">03</span>
          <div>
            <h2 id="section-3">How has one country changed?</h2>
            <p>Choose a country to see how it changed over time.</p>
          </div>
        </div>
        <OverviewChart selectedCountry={selectedCountry} onCountrySelect={setSelectedCountry} />
      </section>

      <section className="story-section" aria-labelledby="section-4">
        <div className="section-intro">
          <span className="section-number">04</span>
          <div>
            <h2 id="section-4">Did these changes happen together?</h2>
            <p>Now compare how much each country changed.</p>
          </div>
        </div>
        <ScrollStory steps={[
          { title: 'Does income growth matter?', indicator: 'gdp', text: 'Bigger income gains did not consistently come with bigger fertility declines.' },
          { title: 'What about child mortality?', indicator: 'mortality', text: 'Even where child mortality fell sharply, fertility did not always fall as much.' },
          { title: 'Education shows a clearer pattern', indicator: 'education', text: 'Bigger gains in female secondary enrollment often went with bigger fertility declines, though there are exceptions.' },
        ]}>
          {(step, onExplore) => <CountryChangeChart initialIndicator={step.indicator} onExplore={onExplore} />}
        </ScrollStory>
      </section>

      <section className="story-section" aria-labelledby="section-5">
        <div className="section-intro">
          <span className="section-number">05</span>
          <div>
            <h2 id="section-5">What if countries start out alike?</h2>
            <p>Choose a country and see what happened to its closest peers since 2001.</p>
          </div>
        </div>
        <PeerHistoryChart />
        <div className="case-bridge">
          <h3>Fertility didn't follow</h3>
          <p>These pairs started alike, and their income, child mortality, and enrollment changed by similar amounts from 2001 to 2023. Their fertility rates moved apart.</p>
        </div>
        <details className="case-study">
          <summary><span><strong>Explore an unusual pair</strong></span><span aria-hidden="true" className="case-arrow">⌄</span></summary>
          <CaseComparisonChart />
        </details>
      </section>

      <section className="story-section" aria-labelledby="section-6">
        <div className="section-intro">
          <span className="section-number">06</span>
          <div>
            <h2 id="section-6">How close were the predictions?</h2>
            <p>We tested predictions on countries the model had not trained on.</p>
          </div>
        </div>
        <ModelComparisonChart />
      </section>
    </main>
  )
}
