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
        <p>Reading Hans Rosling’s <cite>Factfulness</cite> made me wonder: if life gets better, why do families often have fewer children? I looked for patterns and exceptions across 182 countries.</p>
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
          <summary>About the data and method</summary>
          <div>
            <p>I used World Bank World Development Indicators from its API. The main charts follow 182 countries with fertility, GDP per person, and under-five mortality data for every year from 1990 to 2024. Missing values were left blank, not filled in.</p>
            <p>School enrollment has fewer records, so those charts use a separate 2001–2023 sample. I kept unusual countries in the charts; chapter 5 deliberately looks at exceptions. GDP uses a log scale where labeled, and the pair comparison scales its measures for matching.</p>
            <p>I compared countries in the same year, then compared how they changed, and finally tested predictions on countries left out of training.</p>
            <p>Source: <a href="https://datacatalog.worldbank.org/search/dataset/0037712/world-development-indicators">World Bank WDI</a> · License: <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Country medians give each country equal weight.</p>
          </div>
        </details>
      </section>

      <section className="story-section" aria-labelledby="section-2">
        <div className="section-intro">
          <span className="section-number">02</span>
          <div>
            <h2 id="section-2">Do countries follow the same pattern?</h2>
            <p>The overall trend is clear. What happens when we compare countries in the same year?</p>
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
            <h2 id="section-3">Follow one country</h2>
            <p>Each dot has a history. Choose one to see what the snapshot misses.</p>
          </div>
        </div>
        <OverviewChart selectedCountry={selectedCountry} onCountrySelect={setSelectedCountry} />
      </section>

      <section className="story-section" aria-labelledby="section-4">
        <div className="section-intro">
          <span className="section-number">04</span>
          <div>
            <h2 id="section-4">Did bigger gains mean bigger fertility drops?</h2>
            <p>Countries can look different in one year. Their paths through time are another question.</p>
          </div>
        </div>
        <ScrollStory steps={[
          { title: 'Income', indicator: 'gdp', text: 'Faster income growth did not always go with a bigger fertility drop.' },
          { title: 'Child mortality', indicator: 'mortality', text: 'A big drop in child mortality did not always mean a big drop in fertility.' },
          { title: 'Education', indicator: 'education', text: 'Countries with bigger enrollment gains often had bigger fertility drops, but not always.' },
        ]}>
          {(step, onExplore) => <CountryChangeChart initialIndicator={step.indicator} onExplore={onExplore} />}
        </ScrollStory>
      </section>

      <section className="story-section outlier-section" aria-labelledby="section-5">
        <div className="section-intro">
          <span className="section-number">05</span>
          <div>
            <h2 id="section-5">Similar on paper, different paths</h2>
            <p>We chose these unusual pairs because their fertility rates split apart, despite similar income, child mortality, and enrollment.</p>
          </div>
        </div>
        <CaseComparisonChart />
      </section>

      <section className="story-section model-section" aria-labelledby="section-6">
        <div className="section-intro">
          <span className="section-number">06</span>
          <div>
            <h2 id="section-6">How well can we predict fertility?</h2>
            <p>If these measures don't tell the whole story, how far can they take us?</p>
          </div>
        </div>
        <ModelComparisonChart />
      </section>

      <section className="story-ending" aria-labelledby="story-ending-title">
        <span className="ending-label">What I found</span>
        <h2 id="story-ending-title">The pattern has exceptions</h2>
        <p>Richer countries usually had lower fertility, but faster income growth did not reliably mean a bigger fertility drop. Similar countries also took different paths. These measures help predict fertility, but they don't tell every country's story.</p>
        <div className="ending-limit">
          <h3>What this can't tell us</h3>
          <p>The charts show patterns, not causes. The main sample leaves out countries with missing data, and education covers fewer years. Next, I’d look at other influences and better education coverage.</p>
        </div>
      </section>
    </main>
  )
}
