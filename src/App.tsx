import React, { useState, useEffect } from 'react'

interface ScenarioData {
  scenario_summary: string
  questions_asked: string[]
  user_responses: string[]
  defaults_applied: Record<string, any>
}

interface CreditCalculation {
  summary: {
    light_scenario: string
    heavy_scenario: string
  }
  calculations: {
    per_unit_credits: number
    monthly_total_light: number
    monthly_total_heavy: number
    dollar_cost_light: number
    dollar_cost_heavy: number
    legacy_comparison_light: number
    legacy_comparison_heavy: number
  }
  assumptions: string[]
  warnings: string[]
}

// Client-side agent simulation
const scenarioParserAgent = (businessIdea: string): any => {
  // Simulate agent parsing business scenario
  return {
    result: {
      scenario_summary: `AI automation for: ${businessIdea.substring(0, 50)}${businessIdea.length > 50 ? '...' : ''}`,
      questions_asked: ['What is your unit of work?', 'How many per month?'],
      user_responses: [],
      defaults_applied: {}
    },
    confidence: 0.95,
    metadata: {
      processing_time: '0.2s',
      validation_status: 'valid'
    }
  }
}

const creditCalculatorAgent = (message: string): any => {
  // Extract key information from message for calculation
  const monthlyCount = parseInt(message.match(/\d+/g)?.find(num => parseInt(num) > 0) || '10000') || 10000
  const extractedUnitCount = parseInt(message.match(/\d+/g)?.find((num, index) => index > 0 && parseInt(num) > 0) || '1') || 1

  // Client-side credit calculation logic
  const perUnitCredits = Math.max(1, Math.min(50, Math.floor(monthlyCount / 1000))) // 1-50 credits per unit
  const monthlyTotalLight = Math.floor(monthlyCount * perUnitCredits * 0.95) // 95% efficiency for light
  const monthlyTotalHeavy = Math.floor(monthlyCount * perUnitCredits * 1.1)   // 110% efficiency for heavy

  const dollar_cost_light = (monthlyTotalLight * 0.02).toFixed(2) // $0.02 per credit
  const dollar_cost_heavy = (monthlyTotalHeavy * 0.02).toFixed(2)

  // Legacy pricing (100x current)
  const legacy_comparison_light = monthlyTotalLight * 100
  const legacy_comparison_heavy = monthlyTotalHeavy * 100

  // Generate warnings based on limits
  const warnings: string[] = []
  if (extractedUnitCount >= 1000000) {
    warnings.push('WARNING: Extreme token usage (≥1M tokens per unit) detected')
  }
  if (Math.floor(monthlyCount / extractedUnitCount) > 20) {
    warnings.push('WARNING: High call frequency detected (>20 calls)')
  }
  if (monthlyCount > 50000) {
    warnings.push('NOTE: Large monthly volume, consider optimization')
  }

  return {
    result: {
      summary: {
        light_scenario: `${monthlyTotalLight.toLocaleString()} credits / $${dollar_cost_light}`,
        heavy_scenario: `${monthlyTotalHeavy.toLocaleString()} credits / $${dollar_cost_heavy}`
      },
      calculations: {
        per_unit_credits: perUnitCredits,
        monthly_total_light: monthlyTotalLight,
        monthly_total_heavy: monthlyTotalHeavy,
        dollar_cost_light: parseFloat(dollar_cost_light),
        dollar_cost_heavy: parseFloat(dollar_cost_heavy),
        legacy_comparison_light,
        legacy_comparison_heavy
      },
      assumptions: [
        `Processing ${monthlyCount.toLocaleString()} ${message.includes('customer support') ? 'email responses' : 'units'} per month`,
        `Unit complexity: ${extractedUnitCount.toLocaleString()} tokens per unit`,
        `Average ${perUnitCredits} agent-action credits per unit`,
        `Efficiency: 95% (light) / 110% (heavy) for processing variance`,
        'AI model token costs not included'
      ],
      warnings
    },
    confidence: 0.92,
    metadata: {
      processing_time: '0.3s',
      calculation_basis: 'Client-side simulation'
    }
  }
}

function App() {
  const [currentStep, setCurrentStep] = useState<'idea' | 'unit' | 'count' | 'results'>('idea')
  const [businessIdea, setBusinessIdea] = useState('')
  const [unitOfWork, setUnitOfWork] = useState('')
  const [monthlyCount, setMonthlyCount] = useState('')
  const [scenarioData, setScenarioData] = useState<ScenarioData | null>(null)
  const [creditData, setCreditData] = useState<CreditCalculation | null>(null)
  const [showLightDetails, setShowLightDetails] = useState(false)
  const [showHeavyDetails, setShowHeavyDetails] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load last calculation from localStorage on mount
  useEffect(() => {
    const savedCalculation = localStorage.getItem('lyzr-last-calculation')
    const savedFormData = localStorage.getItem('lyzr-form-data')

    if (savedCalculation) {
      try {
        const parsed = JSON.parse(savedCalculation)
        setCreditData(parsed)
        setCurrentStep('results')
      } catch (e) {
        localStorage.removeItem('lyzr-last-calculation')
      }
    }

    if (savedFormData) {
      try {
        const parsed = JSON.parse(savedFormData)
        setBusinessIdea(parsed.businessIdea || '')
        setUnitOfWork(parsed.unitOfWork || '')
        setMonthlyCount(parsed.monthlyCount || '')
      } catch (e) {
        localStorage.removeItem('lyzr-form-data')
      }
    }
  }, [])

  const processBusinessIdea = async () => {
    if (!businessIdea.trim()) return

    setLoading(true)
    setError(null)

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800))

      const response = scenarioParserAgent(businessIdea)
      setScenarioData(response.result)
      setCurrentStep('unit')
    } catch (err) {
      setError('Failed to process business idea')
    } finally {
      setLoading(false)
    }
  }

  const calculateCredits = async () => {
    if (!unitOfWork.trim() || !monthlyCount) return

    setLoading(true)
    setError(null)

    // Store form data for persistence
    localStorage.setItem('lyzr-form-data', JSON.stringify({
      businessIdea,
      unitOfWork,
      monthlyCount
    }))

    const calculatorMessage = `
      Calculate estimated credit usage for:
      - Business idea: ${businessIdea}
      - Unit of work: ${unitOfWork}
      - Monthly count: ${monthlyCount}
    `

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      const response = creditCalculatorAgent(calculatorMessage)
      setCreditData(response.result)

      // Store calculation for follow-up requests
      localStorage.setItem('lyzr-last-calculation', JSON.stringify(response.result))

      setCurrentStep('results')
    } catch (err) {
      setError('Failed to calculate credits')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setCurrentStep('idea')
    setBusinessIdea('')
    setUnitOfWork('')
    setMonthlyCount('')
    setScenarioData(null)
    setCreditData(null)
    setShowLightDetails(false)
    setShowHeavyDetails(false)
    setShowComparison(false)
    setError(null)

    // Clear stored data
    localStorage.removeItem('lyzr-last-calculation')
    localStorage.removeItem('lyzr-form-data')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8F9FB' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg" style={{ color: '#202124' }}>Processing your request...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F9FB' }}>
      {/* Header */}
      <header className="py-8 px-4 text-center" style={{ backgroundColor: '#1B1F23' }}>
        <h1 className="text-3xl font-bold text-white mb-2">Lyzr Credit Estimator</h1>
        <p className="text-gray-300">Estimate your credit usage for AI-powered business ideas</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full">
        {currentStep === 'idea' && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-6" style={{ color: '#1B1F23' }}>Share Your Business Idea</h2>
            <p className="mb-6" style={{ color: '#202124' }}>Describe what you want to build with AI automation</p>
            <textarea
              value={businessIdea}
              onChange={(e) => setBusinessIdea(e.target.value)}
              placeholder="e.g., I want to build an AI system that automatically responds to customer support emails..."
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              rows={4}
            />
            <button
              onClick={processBusinessIdea}
              disabled={!businessIdea.trim()}
              className="mt-6 px-8 py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90 transform hover:scale-105"
              style={{ backgroundColor: '#6C63FF' }}
            >
              Next
            </button>
          </div>
        )}

        {currentStep === 'unit' && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-6" style={{ color: '#1B1F23' }}>Define Unit of Work</h2>
            <p className="mb-6" style={{ color: '#202124' }}>What constitutes one unit of work in your business?</p>
            <input
              type="text"
              value={unitOfWork}
              onChange={(e) => setUnitOfWork(e.target.value)}
              placeholder="e.g., one customer support email response"
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
            <button
              onClick={() => setCurrentStep('count')}
              disabled={!unitOfWork.trim()}
              className="mt-6 px-8 py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90 transform hover:scale-105"
              style={{ backgroundColor: '#6C63FF' }}
            >
              Next
            </button>
          </div>
        )}

        {currentStep === 'count' && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-6" style={{ color: '#1B1F23' }}>Monthly Volume</h2>
            <p className="mb-6" style={{ color: '#202124' }}>How many of these units per month?</p>
            <input
              type="number"
              value={monthlyCount}
              onChange={(e) => setMonthlyCount(e.target.value)}
              placeholder="e.g., 10,000"
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
            <button
              onClick={calculateCredits}
              disabled={!monthlyCount || Number(monthlyCount) <= 0}
              className="mt-6 px-8 py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90 transform hover:scale-105"
              style={{ backgroundColor: '#6C63FF' }}
            >
              Calculate Credits
            </button>
          </div>
        )}

        {currentStep === 'results' && creditData && (
          <>
            <div className="text-center mb-8">
              <button
                onClick={resetForm}
                className="px-6 py-2 rounded-lg text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#2980B9' }}
              >
                Start New Estimate
              </button>
            </div>

            {/* Results Grid */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Light Usage */}
              <div className="bg-white rounded-xl shadow-lg p-8" style={{ borderLeft: '4px solid #27AE60' }}>
                <h3 className="text-xl font-semibold mb-6" style={{ color: '#27AE60' }}>Light Usage</h3>
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold mb-2" style={{ color: '#1B1F23' }}>~{creditData.summary.light_scenario.split(' ')[0]}</div>
                  <div className="text-sm" style={{ color: '#202124' }}>credits per month</div>
                </div>
                <div className="space-y-3">
                  {creditData.assumptions.map((assumption: string, i: number) => (
                    <div key={i} className="flex items-start">
                      <div className="w-2 h-2 mt-2 mr-3 rounded-full" style={{ backgroundColor: '#27AE60' }}></div>
                      <div className="text-sm" style={{ color: '#202124' }}>{assumption}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#F8F9FB' }}>
                  <p className="text-sm" style={{ color: '#202124' }}>
                    Agent-action credits only. AI model tokens billed separately.
                  </p>
                </div>
                <button
                  onClick={() => setShowLightDetails(!showLightDetails)}
                  className="mt-4 text-sm underline"
                  style={{ color: '#6C63FF' }}
                >
                  {showLightDetails ? 'Hide' : 'Show'} details/JSON
                </button>
                {showLightDetails && (
                  <div className="mt-4 p-4 rounded-lg text-xs overflow-auto" style={{ backgroundColor: '#F8F9FB', color: '#202124' }}>
                    <pre>{JSON.stringify(creditData.calculations, null, 2)}</pre>
                  </div>
                )}
              </div>

              {/* Heavy Usage */}
              <div className="bg-white rounded-xl shadow-lg p-8" style={{ borderLeft: '4px solid #F1C40F' }}>
                <h3 className="text-xl font-semibold mb-6" style={{ color: '#BF9A29' }}>Heavy Usage</h3>
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold mb-2" style={{ color: '#1B1F23' }}>~{creditData.summary.heavy_scenario.split(' ')[0]}</div>
                  <div className="text-sm" style={{ color: '#202124' }}>credits per month</div>
                </div>
                <div className="space-y-3">
                  {creditData.assumptions.map((assumption: string, i: number) => (
                    <div key={i} className="flex items-start">
                      <div className="w-2 h-2 mt-2 mr-3 rounded-full" style={{ backgroundColor: '#F1C40F' }}></div>
                      <div className="text-sm" style={{ color: '#202124' }}>{assumption}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#F8F9FB' }}>
                  <p className="text-sm" style={{ color: '#202124' }}>
                    Agent-action credits only. AI model tokens billed separately.
                  </p>
                </div>
                <button
                  onClick={() => setShowHeavyDetails(!showHeavyDetails)}
                  className="mt-4 text-sm underline"
                  style={{ color: '#6C63FF' }}
                >
                  {showHeavyDetails ? 'Hide' : 'Show'} details/JSON
                </button>
                {showHeavyDetails && (
                  <div className="mt-4 p-4 rounded-lg text-xs overflow-auto" style={{ backgroundColor: '#F8F9FB', color: '#202124' }}>
                    <pre>{JSON.stringify(creditData.calculations, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>

            {/* Comparison Toggle */}
            <div className="text-center mb-8">
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="px-6 py-3 rounded-lg text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#E74C3C' }}
              >
                Compare with Legacy Pricing
              </button>
            </div>

            {showComparison && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-xl font-semibold mb-6" style={{ color: '#E74C3C' }}>Historic Pricing Comparison (100x Current)</h3>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#F8F9FB' }}>
                    <h4 style={{ color: '#27AE60' }}>Light Usage Comparison</h4>
                    <div className="mt-3">
                      <div className="text-2xl font-bold" style={{ color: '#1B1F23' }}>{creditData.calculations.legacy_comparison_light.toLocaleString()} credits</div>
                      <div className="text-sm mt-2" style={{ color: '#202124' }}>Historic pricing vs {creditData.calculations.monthly_total_light.toLocaleString()} current</div>
                      <div className="text-xs mt-2" style={{ color: '#6C63FF' }}>~{Math.round((1 - (creditData.calculations.monthly_total_light / creditData.calculations.legacy_comparison_light)) * 100)}% savings</div>
                    </div>
                  </div>

                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#F8F9FB' }}>
                    <h4 style={{ color: '#F1C40F' }}>Heavy Usage Comparison</h4>
                    <div className="mt-3">
                      <div className="text-2xl font-bold" style={{ color: '#1B1F23' }}>{creditData.calculations.legacy_comparison_heavy.toLocaleString()} credits</div>
                      <div className="text-sm mt-2" style={{ color: '#202124' }}>Historic pricing vs {creditData.calculations.monthly_total_heavy.toLocaleString()} current</div>
                      <div className="text-xs mt-2" style={{ color: '#6C63FF' }}>~{Math.round((1 - (creditData.calculations.monthly_total_heavy / creditData.calculations.legacy_comparison_heavy)) * 100)}% savings</div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-center" style={{ color: '#202124' }}>Historic pricing model charged 100x current rates with less flexible scaling options.</p>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4" style={{ color: '#E74C3C' }}>
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}
      </main>

      {/* Sticky Footer */}
      <footer className="py-4 px-4 text-center text-sm" style={{ backgroundColor: '#1B1F23', color: '#F8F9FB' }}>
        <p>Agent-action credits only. AI model tokens billed separately at usage rates.</p>
      </footer>
    </div>
  )
}

export default App
