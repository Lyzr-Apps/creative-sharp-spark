import React, { useState, useEffect } from 'react'
import parseLLMJson from './utils/jsonParser'

interface AgentResponse {
  result: any
  confidence: number
  metadata: any
}

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

// Sequential agent processing with proper JSON parsing
function App() {
  const [currentStep, setCurrentStep] = useState<'idea' | 'processing' | 'unit' | 'count' | 'results'>('idea')
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

  // Sequential agent calls with proper JSON parsing
  const callAgent = async (agentId: string, message: string): Promise<AgentResponse | null> => {
    const userId = `user-${Math.random().toString(36).substr(2, 9)}@app.com`
    const sessionId = `${agentId}-${Math.random().toString(36).substr(2, 12)}`

    try {
      setCurrentStep('processing')

      const response = await fetch('https://agent-prod.studio.lyzr.ai/v3/inference/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'sk-default-obhGvAo6gG9YT9tu6ChjyXLqnw7TxSGY'
        },
        body: JSON.stringify({
          user_id: userId,
          agent_id: agentId,
          session_id: sessionId,
          message: message
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const text = await response.text()
      const parsed = parseLLMJson(text)

      if (!parsed) {
        throw new Error('Failed to parse agent response')
      }

      return {
        result: parsed.result || parsed,
        confidence: parsed.confidence || 0,
        metadata: parsed.metadata || {}
      }
    } catch (error) {
      console.error('Agent call failed:', error)
      setError('An error occurred contacting the agent')
      return null
    }
  }

  // Sequential agent processing
  const processBusinessIdea = async () => {
    if (!businessIdea.trim()) return

    setLoading(true)
    setError(null)
    setCurrentStep('processing')

    try {
      // Step 1: Call ScenarioParser to analyze the business idea
      const scenarioResponse = await callAgent('68e01d2cf40da92f699a9501', businessIdea)

      if (!scenarioResponse?.result) {
        throw new Error('Failed to process business scenario')
      }

      setScenarioData(scenarioResponse.result)
      setCurrentStep('unit')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process business idea')
      setCurrentStep('idea')
    } finally {
      setLoading(false)
    }
  }

  const calculateCredits = async () => {
    if (!unitOfWork.trim() || !monthlyCount) return

    setLoading(true)
    setError(null)

    const calculatorMessage = `
      Business idea: ${businessIdea}
      Unit of work: ${unitOfWork}
      Monthly count: ${monthlyCount}
      ${scenarioData ? `Defaults applied: ${JSON.stringify(scenarioData.defaultsApplied)}` : ''}
    `

    try {
      // Step 2: Call CreditCalculator with parsed scenario data
      const creditResponse = await callAgent('68e01d3a010a31eba98903e5', calculatorMessage)

      if (!creditResponse?.result) {
        throw new Error('Failed to calculate credits')
      }

      setCreditData(creditResponse.result)
      setCurrentStep('results')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate credits')
    } finally {
      setLoading(false)
    }
  }

  if (loading || currentStep === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8F9FB' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg" style={{ color: '#202124' }}>Processing your request with Lyzr agents...</p>
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
        {currentStep === 'idea' && currentStep !== 'processing' && (
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

        {currentStep === 'unit' && currentStep !== 'processing' && (
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

        {currentStep === 'count' && currentStep !== 'processing' && (
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
