import { useState } from 'react'
import { motion, useScroll } from 'motion/react'
import MedianTrends from './components/MedianTrends'
import FertilityVsIndicatorScatterplot from './components/FertilityVsIndicatorScatterplot'
import CountryChangeChart from './components/CountryChangeChart'
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
        <p>If life gets better, why do families often have fewer children?</p>
        <p className="interaction-hint">Hover or focus charts for exact values.</p>
        <a className="story-start" href="#section-1">Follow the story <span aria-hidden="true">↓</span></a>
        <div className="intro-facts"><span><strong>182</strong> countries</span><span><strong>6</strong> chapters</span></div>
      </header>

      <section className="story-section" aria-labelledby="section-1">
        <div className="section-intro">
          <span className="section-number">01</span>
          <div>
            <h2 id="section-1">The big picture</h2>
            <p>Fertility and child mortality fell, while income and enrollment rose. Each line shows the median country value.</p>
          </div>
        </div>
        <MedianTrends />
        <details className="data-method">
          <summary>Data collection and preprocessing</summary>
          <div>
            <p>I downloaded fertility, GDP per person, under-five mortality, and female secondary enrollment from the World Bank WDI API.</p>
            <p>I removed regional totals and duplicates, then reshaped the data into one row per country and year. Missing values stayed blank; charts that need complete records use only those rows. I kept unusual values rather than automatically deleting outliers.</p>
            <p>The main charts use 182 countries from 1990 to 2024. Female secondary enrollment uses a separate 2001–2023 sample.</p>
            <p>Source: <a href="https://datacatalog.worldbank.org/search/dataset/0037712/world-development-indicators">World Bank WDI</a> · License: <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.</p>
          </div>
        </details>
      </section>

      <section className="story-section" aria-labelledby="section-2">
        <div className="section-intro">
          <span className="section-number">02</span>
          <div>
            <h2 id="section-2">Do countries follow the same pattern?</h2>
          </div>
        </div>
        <ScrollStory steps={[
          { title: 'Look at income', indicator: 'gdp_pc', year: 2024, text: 'Higher-income countries usually have lower fertility, but there are plenty of exceptions.' },
          { title: 'Look at child mortality', indicator: 'mortality', year: 2024, text: 'Countries with more deaths among young children usually have higher fertility.' },
          { title: 'Look at education', indicator: 'education', year: 2023, text: 'Higher female secondary enrollment often goes with lower fertility. These data cover fewer countries.' },
        ]}>
          {(step) => <FertilityVsIndicatorScatterplot selectedCountry={selectedCountry} onCountrySelect={setSelectedCountry} initialYear={step.year} initialIndicator={step.indicator} />}
        </ScrollStory>
      </section>

      <section className="story-section" aria-labelledby="section-3">
        <div className="section-intro">
          <span className="section-number">03</span>
          <div>
            <h2 id="section-3">Follow one country</h2>
          </div>
        </div>
        <OverviewChart selectedCountry={selectedCountry} onCountrySelect={setSelectedCountry} />
      </section>

      <section className="story-section" aria-labelledby="section-4">
        <div className="section-intro">
          <span className="section-number">04</span>
          <div>
            <h2 id="section-4">Did bigger development gains go with bigger fertility drop?</h2>
          </div>
        </div>
        <ScrollStory steps={[
          { title: 'Income', indicator: 'gdp', text: 'Faster income growth did not always go with a bigger fertility drop.' },
          { title: 'Child mortality', indicator: 'mortality', text: 'A big drop in child mortality did not always mean a big drop in fertility.' },
          { title: 'Education', indicator: 'education', text: 'Countries with bigger enrollment gains often had bigger fertility drops, but not always.' },
        ]}>
          {(step) => <CountryChangeChart initialIndicator={step.indicator} />}
        </ScrollStory>
      </section>

      <section className="story-section outlier-section" aria-labelledby="section-5">
        <div className="section-intro">
          <span className="section-number">05</span>
          <div>
            <h2 id="section-5">Similar development, different fertility paths</h2>
          </div>
        </div>
        <CaseComparisonChart />
      </section>

      <section className="story-section model-section" aria-labelledby="section-6">
        <div className="section-intro">
          <span className="section-number">06</span>
          <div>
            <h2 id="section-6">How well can we predict fertility?</h2>
          </div>
        </div>
        <ModelComparisonChart />
      </section>

      <section className="story-ending" aria-labelledby="story-ending-title">
        <div className="ending-heading">
          <span className="ending-label">The takeaway</span>
          <h2 id="story-ending-title">So, what did we learn?</h2>
        </div>
        <ol className="ending-grid">
          <li className="ending-card">
            <span className="ending-number">01</span>
            <h3>A clear overall pattern</h3>
            <p>Across countries, lower fertility generally goes together with higher incomes, lower child mortality, and higher female secondary enrollment.</p>
          </li>
          <li className="ending-card">
            <span className="ending-number">02</span>
            <h3>But no single path</h3>
            <p>Bigger development gains don't always come with bigger fertility declines. Even countries with similar indicators can follow very different fertility paths.</p>
          </li>
          <li className="ending-card">
            <span className="ending-number">03</span>
            <h3>Useful signals, not the whole story</h3>
            <p>These indicators improve fertility prediction, but they cannot fully explain the differences between countries or tell us what causes fertility to change.</p>
          </li>
        </ol>
        <div className="ending-final">
          <p>Income, child survival, and female education reveal an important pattern in fertility, but every country's story is more complicated than a few factors can capture.</p>
        </div>
      </section>
    </main>
  )
}
