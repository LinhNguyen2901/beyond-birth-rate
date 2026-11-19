import { useState } from 'react'
import MedianTrends from './components/MedianTrends'
import FertilityVsIndicatorScatterplot from './components/FertilityVsIndicatorScatterplot'
import CountryChangeChart from './components/CountryChangeChart'
import EducationChart from './components/EducationChart'
import CountryHistoryChart from './components/CountryHistoryChart'
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
        <h1>Fertility and development</h1>
        <p>How have fertility rates changed alongside income, child survival, and education? Explore the broad pattern, then look at where economies differ.</p>
        <p className="interaction-hint">Hover or focus chart marks for exact values. Select a country dot to update its history.</p>
      </header>

      <OverviewChart selectedCountry={selectedCountry} onCountrySelect={setSelectedCountry} />

      <h2 className="chapter-heading"><span>01</span> The broad shift</h2>
      <MedianTrends />

      <h2 className="chapter-heading"><span>02</span> Compare economies</h2>
      <FertilityVsIndicatorScatterplot selectedCountry={selectedCountry} onCountrySelect={setSelectedCountry} />

      <h2 className="chapter-heading"><span>03</span> Changes over time</h2>
      <CountryChangeChart />

      <h2 className="chapter-heading"><span>04</span> Education, with a narrower lens</h2>
      <EducationChart />

      <h2 className="chapter-heading"><span>05</span> Follow a country</h2>
      <CountryHistoryChart selectedCountry={selectedCountry} onCountrySelect={setSelectedCountry} />
      <PeerHistoryChart />

      <h2 className="chapter-heading"><span>06</span> Prediction</h2>
      <ModelComparisonChart />
    </main>
  )
}
