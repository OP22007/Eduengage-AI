'use client'

import { useState } from 'react'
import { analyticsAPI } from '@/lib/api'
import { Brain, CheckCircle2, AlertTriangle, XCircle, Loader } from 'lucide-react'

export default function MLTestPage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const runMLTests = async () => {
    setLoading(true)
    setError('')
    setTestResults(null)

    const results: {
      mlStatus: any,
      overview: any,
      learnerInfo: any,
      riskPrediction: any,
      errors: string[]
    } = {
      mlStatus: null,
      overview: null,
      learnerInfo: null,
      riskPrediction: null,
      errors: []
    }

    try {
      // Test 1: ML Service Status
      console.log('Testing ML service status...')
      try {
        const statusResponse = await analyticsAPI.getMLStatus()
        results.mlStatus = statusResponse.data.data
      } catch (err: any) {
        results.errors.push(`ML Status Error: ${err.message}`)
      }

      // Test 2: Analytics Overview
      console.log('Testing analytics overview...')
      try {
        const overviewResponse = await analyticsAPI.getOverview()
        results.overview = overviewResponse.data.data
      } catch (err: any) {
        results.errors.push(`Overview Error: ${err.message}`)
      }

      // Test 3: Get Learner ID for current user
      console.log('Getting learner ID for current user...')
      try {
        const learnerIdResponse = await analyticsAPI.getLearnerId()
        results.learnerInfo = learnerIdResponse.data.data
      } catch (err: any) {
        results.errors.push(`Learner ID Error: ${err.response?.data?.message || err.message}`)
      }

      // Test 4: Risk Prediction for current user
      console.log('Testing risk prediction for current user...')
      try {
        const riskResponse = await analyticsAPI.predictRiskForMe()
        results.riskPrediction = riskResponse.data.data
      } catch (err: any) {
        results.errors.push(`Risk Prediction Error: ${err.response?.data?.message || err.message}`)
      }

      setTestResults(results)
    } catch (err: any) {
      setError(`Overall test failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const TestResultCard = ({ title, result, error }: { title: string; result?: any; error?: string }) => (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        {error ? (
          <XCircle className="h-5 w-5 text-red-500" />
        ) : result ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
        )}
        <h3 className="font-semibold">{title}</h3>
      </div>
      
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
      
      {result && (
        <div className="text-sm">
          <pre className="bg-gray-50 p-2 rounded overflow-auto text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Brain className="h-8 w-8 text-blue-600" />
            ML Integration Test
          </h1>
          <p className="text-gray-600">
            Test the complete ML integration including service status, analytics, and risk predictions
          </p>
        </div>

        <div className="text-center mb-8">
          <button
            onClick={runMLTests}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {loading ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Brain className="h-5 w-5" />
                Run ML Integration Tests
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="h-5 w-5" />
              <span className="font-semibold">Test Failed</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {testResults && (
          <div className="space-y-6">
            <TestResultCard
              title="ML Service Status"
              result={testResults.mlStatus}
              error={testResults.errors.find((e: string) => e.includes('ML Status'))}
            />
            
            <TestResultCard
              title="Analytics Overview"
              result={testResults.overview}
              error={testResults.errors.find((e: string) => e.includes('Overview'))}
            />
            
            <TestResultCard
              title="Learner Information"
              result={testResults.learnerInfo}
              error={testResults.errors.find((e: string) => e.includes('Learner ID'))}
            />
            
            <TestResultCard
              title="Risk Prediction"
              result={testResults.riskPrediction}
              error={testResults.errors.find((e: string) => e.includes('Risk Prediction'))}
            />

            {testResults.errors.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">All Tests Passed!</span>
                </div>
                <p className="text-green-700 mt-1">
                  ML integration is working correctly. The system can:
                </p>
                <ul className="text-green-700 mt-2 list-disc list-inside space-y-1">
                  <li>Connect to ML service</li>
                  <li>Retrieve analytics data</li>
                  <li>Process risk predictions</li>
                  <li>Display ML insights</li>
                </ul>
              </div>
            )}

            {testResults.errors.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-semibold">Partial Success</span>
                </div>
                <p className="text-yellow-700 mt-1">
                  Some components are working, but there are issues with:
                </p>
                <ul className="text-yellow-700 mt-2 list-disc list-inside space-y-1">
                  {testResults.errors.map((error: string, index: number) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Integration Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-1">Backend Integration:</h4>
              <ul className="space-y-1">
                <li>• ML service health monitoring</li>
                <li>• Risk prediction API</li>
                <li>• Batch processing</li>
                <li>• Analytics dashboard</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">Frontend Features:</h4>
              <ul className="space-y-1">
                <li>• Risk indicators on courses</li>
                <li>• Progress tracking</li>
                <li>• ML analytics dashboard</li>
                <li>• AI-powered insights</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
