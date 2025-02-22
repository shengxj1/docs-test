import WordAnalyzer from './components/WordAnalyzer'
import './App.css'

function App() {
  return (
    <div className="container">
      <div className="content">
        <div style={{ width: '100%', maxWidth: '600px' }}>
          <WordAnalyzer />
        </div>
      </div>
    </div>
  )
}

export default App
