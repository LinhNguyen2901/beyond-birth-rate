import { useState } from 'react'
import { motion, useScroll } from 'motion/react'
import AllCountryFertilityChart from './components/AllCountryFertilityChart'
import MedianTrends from './components/MedianTrends'
import FertilityVsIndicatorScatterplot from './components/FertilityVsIndicatorScatterplot'
import CountryChangeChart from './components/CountryChangeChart'
import PeerHistoryChart from './components/PeerHistoryChart'
import CaseComparisonChart from './components/CaseComparisonChart'
import ModelComparisonChart from './components/ModelComparisonChart'
import OverviewChart from './components/OverviewChart'
import ScrollStory from './components/ScrollStory'
import './App.css'

function OpeningStep({ country, onCountrySelect }) {
  const [selected, setSelected] = useState(country)
  return <AllCountryFertilityChart selectedCountry={selected} onCountrySelect={code => {
    setSelected(code)
    onCountrySelect(code)
  }} />
}

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
            <p>Start with the broad trends, then scroll through individual economies to see how their paths differ.</p>
          </div>
        </div>
        <MedianTrends />
        <ScrollStory steps={[
          { title: 'Many paths, one broad shift.', country: 'IND', text: 'Follow India through the web of country histories. Across the sample, the median fertility rate moves downward—but no single line tells the whole story.', detail: '1990–2024 · 182 economies' },
          { title: 'The pace is not the same.', country: 'NGA', text: 'Now follow Nigeria. Its path sits above the median, even as fertility falls. The broad trend leaves room for very different starting points and speeds of change.', detail: 'Highlighted economy · Nigeria' },
          { title: 'Some paths fall much further.', country: 'KOR', text: 'Korea ends near the bottom of the chart. Choose another economy to see where its path fits, then explore what changed alongside fertility.', detail: 'Highlighted economy · Korea, Rep.' },
        ]}>
          {step => <OpeningStep country={step.country} onCountrySelect={setSelectedCountry} />}
        </ScrollStory>
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
          {step => <FertilityVsIndicatorScatterplot selectedCountry={selectedCountry} onCountrySelect={setSelectedCountry} initialYear={step.year} initialIndicator={step.indicator} />}
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
            <p>Comparing each economy in 1990 and 2024 asks a different question: how did fertility change alongside child mortality or income?</p>
          </div>
        </div>
        <ScrollStory steps={[
          { title: 'Trade a snapshot for a journey.', indicator: 'mortality', text: 'Each dot now compares one economy with itself, from 1990 to 2024. Larger reductions in child mortality tend to accompany larger reductions in fertility.', detail: 'Move right · Larger mortality reduction' },
          { title: 'Income tells a less tidy story.', indicator: 'gdp', text: 'Switch to income growth. The dots are more scattered: a larger rise in income does not consistently go with a larger fertility decline. Comparing changes asks a different question from comparing levels.', detail: 'Move right · Greater GDP growth' },
          { title: 'What changed in education?', indicator: 'education', text: 'Compare gains in female secondary enrollment with fertility reductions. This view uses economies with data at both endpoints of 2001–2023. Hover over a dot to explore its changes.', detail: '2001–2023 · Separate education sample' },
        ]}>
          {step => <CountryChangeChart initialIndicator={step.indicator} />}
        </ScrollStory>
      </section>

      <section className="story-section" aria-labelledby="section-5">
        <div className="section-intro">
          <span className="section-number">05</span>
          <div>
            <h2 id="section-5">Similar beginnings, different journeys</h2>
            <p>Choose one economy to see nearby peers based on three measured starting conditions in 2001. Then compare the fertility paths that followed.</p>
          </div>
        </div>
        <PeerHistoryChart />
        <CaseComparisonChart />
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
