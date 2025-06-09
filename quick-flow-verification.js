// Quick Flow Verification - Automated Testing
// Tests basic functionality before manual testing

const quickFlowTest = async () => {
  console.log('🔥 QUICK FLOW VERIFICATION');
  console.log('==========================');
  
  const baseUrl = 'http://localhost:3000';
  let testResults = {
    passed: 0,
    failed: 0,
    total: 0
  };

  const test = async (name, testFn) => {
    testResults.total++;
    try {
      const result = await testFn();
      if (result) {
        console.log(`✅ ${name}`);
        testResults.passed++;
      } else {
        console.log(`❌ ${name}`);
        testResults.failed++;
      }
    } catch (error) {
      console.log(`❌ ${name} - Error: ${error.message}`);
      testResults.failed++;
    }
  };

  // Test 1: App Accessibility
  await test('App loads successfully', async () => {
    const response = await fetch(baseUrl);
    return response.status === 200;
  });

  // Test 2: API Security
  await test('API endpoints are secured', async () => {
    const response = await fetch(`${baseUrl}/api/agents`);
    return response.status === 401;
  });

  // Test 3: Real-time endpoint
  await test('Real-time endpoint responds', async () => {
    const response = await fetch(`${baseUrl}/api/realtime/events`);
    return response.status === 200;
  });

  // Test 4: Page load performance
  await test('Page loads under 3 seconds', async () => {
    const start = Date.now();
    const response = await fetch(baseUrl);
    const loadTime = Date.now() - start;
    console.log(`   Load time: ${loadTime}ms`);
    return loadTime < 3000;
  });

  // Test 5: HTML content verification
  await test('Authentication system present', async () => {
    const response = await fetch(baseUrl);
    const html = await response.text();
    return html.includes('auth') || html.includes('login') || html.includes('sign');
  });

  // Test 6: Check for critical components
  await test('Dashboard components present', async () => {
    const response = await fetch(baseUrl);
    const html = await response.text();
    return html.includes('dashboard') || html.includes('agent') || html.includes('hire');
  });

  // Test 7: API error handling
  await test('API returns proper error format', async () => {
    const response = await fetch(`${baseUrl}/api/agents`);
    const data = await response.json();
    return data.error && typeof data.error === 'string';
  });

  // Results Summary
  console.log('\n📊 QUICK TEST RESULTS');
  console.log('=====================');
  console.log(`✅ Passed: ${testResults.passed}/${testResults.total}`);
  console.log(`❌ Failed: ${testResults.failed}/${testResults.total}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);

  if (testResults.failed === 0) {
    console.log('\n🎉 ALL BASIC TESTS PASSED! Ready for manual testing.');
  } else {
    console.log('\n⚠️  Some tests failed. Check issues before manual testing.');
  }

  console.log('\n🧪 MANUAL TESTING CHECKLIST:');
  console.log('1. Open http://localhost:3000 in browser');
  console.log('2. Test authentication flow');
  console.log('3. Test agent creation');
  console.log('4. Test navigation between pages');
  console.log('5. Test all interactive elements');
  console.log('6. Check responsive design');
  console.log('7. Verify error handling');
  console.log('8. Test performance on different devices');

  return testResults;
};

// Run the quick verification
quickFlowTest().catch(console.error); 