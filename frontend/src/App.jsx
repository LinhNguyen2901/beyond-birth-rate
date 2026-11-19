import { useState } from 'react'
import AllCountryFertilityChart from './components/AllCountryFertilityChart'
import MedianTrends from './components/MedianTrends'
import FertilityVsIndicatorScatterplot from './components/FertilityVsIndicatorScatterplot'
import CountryChangeChart from './components/CountryChangeChart'
import PeerHistoryChart from './components/PeerHistoryChart'
import ModelComparisonChart from './components/ModelComparisonChart'
import OverviewChart from './components/OverviewChart'
import './App.css'

export default function App() {
  const [selectedCountry, setSelectedCountry] = useState('IND')

  return (
    <main className="page">
      <header className="intro">
        <div className="eyebrow">World Bank data · 1990–2024</div>
        <h1>Beyond the Birth Rate</h1>
        <p>Fertility fell across many economies, but each followed its own path. Explore how those paths changed alongside income, child survival, and education.</p>
        <p className="interaction-hint">Hover or focus chart marks for exact values. Select a country dot to follow its history.</p>
      </header>

      <section className="story-section" aria-labelledby="section-1">
        <div className="section-intro">
          <span className="section-number">01</span>
          <div>
            <h2 id="section-1">A world of changing paths</h2>
            <p>Fertility fell broadly, but every economy followed its own path. Highlight one economy, then explore the median trends below.</p>
          </div>
        </div>
        <AllCountryFertilityChart selectedCountry={selectedCountry} onCountrySelect={setSelectedCountry} />
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
        <FertilityVsIndicatorScatterplot selectedCountry={selectedCountry} onCountrySelect={setSelectedCountry} />
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
            <p>Comparing each economy in 1990 and 2024 asks a different question: how did fertility change alongside child mortality or income?</p>
          </div>
        </div>
        <CountryChangeChart />
      </section>

      <section className="story-section" aria-labelledby="section-5">
        <div className="section-intro">
          <span className="section-number">05</span>
          <div>
            <h2 id="section-5">Similar beginnings, different journeys</h2>
            <p>Economies with similar measured starting conditions can still take different paths. Follow the Central African Republic and five peers.</p>
          </div>
        </div>
        <PeerHistoryChart />
      </section>

      <section className="story-section" aria-labelledby="section-6">
        <div className="section-intro">
          <span className="section-number">06</span>
          <div>
            <h2 id="section-6">Can we predict fertility?</h2>
            <p>Income, child mortality, and education can improve predictions, but errors remain. These comparisons describe patterns, not causes.</p>
          </div>
        </div>
        <ModelComparisonChart />
      </section>
    </main>
  )
}
