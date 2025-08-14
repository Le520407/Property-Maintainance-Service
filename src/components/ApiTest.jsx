import React, { useState } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const ApiTest = () => {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState([]);

  const runTest = async (testName, testFunction) => {
    setLoading(true);
    try {
      const result = await testFunction();
      setTestResults(prev => [...prev, { name: testName, success: true, data: result }]);
      toast.success(`${testName} 测试成功`);
    } catch (error) {
      setTestResults(prev => [...prev, { name: testName, success: false, error: error.message }]);
      toast.error(`${testName} 测试失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const tests = [
    {
      name: 'Health Check',
      function: () => fetch('http://localhost:5000/api/health').then(res => res.json())
    },
    {
      name: 'Check Token',
      function: () => Promise.resolve({
        tokenExists: !!localStorage.getItem('token'),
        tokenLength: localStorage.getItem('token')?.length || 0,
        tokenPreview: localStorage.getItem('token')?.substring(0, 50) + '...'
      })
    },
    {
      name: 'Test Auth Me',
      function: () => api.get('/auth/me')
    },
    {
      name: 'Test Jobs Endpoint',
      function: () => api.get('/jobs')
    },
    {
      name: 'Test Admin Vendors',
      function: () => api.get('/admin/vendors')
    }
  ];

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">API 连接测试</h2>
        
        {/* 测试按钮 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {tests.map((test, index) => (
              <button
                key={index}
                onClick={() => runTest(test.name, test.function)}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {test.name}
              </button>
            ))}
            <button
              onClick={clearResults}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              清除结果
            </button>
          </div>
          
          {loading && (
            <div className="text-blue-600">测试中...</div>
          )}
        </div>

        {/* 测试结果 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">测试结果:</h3>
          {testResults.length === 0 ? (
            <p className="text-gray-500">暂无测试结果</p>
          ) : (
            testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{result.name}</h4>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      result.success
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {result.success ? '成功' : '失败'}
                  </span>
                </div>
                
                {result.success ? (
                  <pre className="text-sm bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                ) : (
                  <p className="text-red-600 text-sm">{result.error}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiTest; 