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
        <p>Fertility fell across many economies, but each followed its own path. Explore how those paths changed alongside income, child survival, and education.</p>
        <p className="interaction-hint">Hover or focus chart marks for exact values. Select a country dot to follow its history.</p>
        <a className="story-start" href="#section-1">Follow the story <span aria-hidden="true">↓</span></a>
        <div className="intro-facts"><span><strong>182</strong> economies in the main sample</span><span><strong>35</strong> years of country histories</span><span><strong>6</strong> chapters to explore</span></div>
      </header>

      <section className="story-section" aria-labelledby="section-1">
        <div className="section-intro">
          <span className="section-number">01</span>
          <div>
            <h2 id="section-1">A world of changing paths</h2>
            <p>See how fertility, income, child mortality, and education changed over time.</p>
          </div>
        </div>
        <MedianTrends />
      </section>

      <section className="story-section" aria-labelledby="section-2">
        <div className="section-intro">
          <span className="section-number">02</span>
          <div>
            <h2 id="section-2">What changes alongside fertility?</h2>
            <p>Compare fertility with income, child mortality, or female secondary enrollment in one chart. Choose a measure and year to explore the pattern.</p>
          </div>
        </div>
        <ScrollStory steps={[
          { title: 'Start with income.', indicator: 'gdp_pc', year: 2024, text: 'In this snapshot, higher-income economies tend to have lower fertility. But notice how much the dots spread out: income alone does not describe every economy.', detail: '2024 · GDP per person' },
          { title: 'Look at child survival.', indicator: 'mortality', year: 2024, text: 'Switch to child mortality. Economies with more deaths among young children generally also have higher fertility. This is an association across economies.', detail: '2024 · Under-five mortality' },
          { title: 'Education adds another view.', indicator: 'education', year: 2023, text: 'Higher female secondary enrollment often appears alongside lower fertility. This view has a different sample: education data are not available for every economy and year.', detail: '2023 · Separate education sample' },
        ]}>
          {(step, onExplore) => <FertilityVsIndicatorScatterplot selectedCountry={selectedCountry} onCountrySelect={setSelectedCountry} initialYear={step.year} initialIndicator={step.indicator} onExplore={onExplore} />}
        </ScrollStory>
      </section>

      <section className="story-section" aria-labelledby="section-3">
        <div className="section-intro">
          <span className="section-number">03</span>
          <div>
            <h2 id="section-3">Follow one dot</h2>
            <p>One dot has a history of its own. Select an economy to follow fertility, income, child mortality, and available education data over time.</p>
          </div>
        </div>
        <OverviewChart selectedCountry={selectedCountry} onCountrySelect={setSelectedCountry} />
      </section>

      <section className="story-section" aria-labelledby="section-4">
        <div className="section-intro">
          <span className="section-number">04</span>
          <div>
            <h2 id="section-4">Did they change together?</h2>
            <p>How did fertility change alongside income, mortality, or education? Positive values mean an increase; negative values mean a decrease.</p>
          </div>
        </div>
        <ScrollStory steps={[
          { title: 'Income growth is a weak guide.', indicator: 'gdp', text: 'Bigger income gains only weakly tended to go with bigger fertility declines. Knowing how much an economy grew tells us little about how far its fertility fell.', detail: 'Takeaway · More growth does not reliably mean a bigger fertility drop' },
          { title: 'Falling mortality, different fertility paths.', indicator: 'mortality', text: 'Economies with bigger percentage declines in child mortality only weakly tended to have bigger percentage declines in fertility. The wide spread shows that the two did not change closely together everywhere.', detail: 'Takeaway · A weak relationship, with many exceptions' },
          { title: 'Education gains show a clearer pattern.', indicator: 'education', text: 'Economies with bigger gains in female secondary enrollment tended to see larger percentage declines in fertility. This pattern is clearer than the income comparison, but countries still differ substantially.', detail: 'Takeaway · Bigger enrollment gains often accompanied bigger fertility declines' },
        ]}>
          {(step, onExplore) => <CountryChangeChart initialIndicator={step.indicator} onExplore={onExplore} />}
        </ScrollStory>
      </section>

      <section className="story-section" aria-labelledby="section-5">
        <div className="section-intro">
          <span className="section-number">05</span>
          <div>
            <h2 id="section-5">Similar beginnings, different journeys</h2>
            <p>Choose an economy, meet peers with similar measured conditions in 2001, and follow their fertility paths.</p>
          </div>
        </div>
        <PeerHistoryChart />
        <div className="case-bridge">
          <span>Surprising contrasts</span>
          <h3>Similar conditions at both ends. Different fertility paths.</h3>
          <p>The explorer above matches conditions in 2001. These pairs also look similar on the measured indicators in 2023, yet their fertility gaps grew.</p>
        </div>
        <details className="case-study">
          <summary><span><strong>Explore a surprising pair</strong><small>Start with Albania and Mongolia · compare fertility, income, mortality, and education</small></span><span aria-hidden="true" className="case-arrow">⌄</span></summary>
          <CaseComparisonChart />
        </details>
      </section>

      <section className="story-section" aria-labelledby="section-6">
        <div className="section-intro">
          <span className="section-number">06</span>
          <div>
            <h2 id="section-6">Can we predict fertility?</h2>
            <p>How close can a prediction get for economies the model has not seen? Compare a simple guess with models using income, child mortality, and education.</p>
          </div>
        </div>
        <ModelComparisonChart />
      </section>
    </main>
  )
}
