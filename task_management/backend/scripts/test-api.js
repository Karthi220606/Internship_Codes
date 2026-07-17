const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🚀 Starting Programmatic API Verification Tests...');
  
  try {
    // 1. Test GET /projects
    console.log('\n--- 1. Testing GET /api/projects ---');
    const projectsRes = await fetch(`${API_URL}/projects`);
    if (!projectsRes.ok) throw new Error(`GET /projects failed: ${projectsRes.statusText}`);
    const projects = await projectsRes.json();
    console.log(`✅ Success! Fetched ${projects.length} projects.`);
    projects.forEach(p => console.log(`   - ${p.title} (${p.category})`));
    
    if (projects.length === 0) {
      throw new Error('No projects found. Seed script might not have run.');
    }

    // 2. Test POST /messages (Submit a message)
    console.log('\n--- 2. Testing POST /api/messages (Submit Contact Form) ---');
    const testMessage = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      subject: 'Verification Test',
      message: 'Hello, this is an automated integration test verifying full-stack connection.'
    };
    
    const submitMsgRes = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMessage)
    });
    if (!submitMsgRes.ok) throw new Error(`POST /messages failed: ${submitMsgRes.statusText}`);
    const msgResult = await submitMsgRes.json();
    console.log('✅ Success! Message sent successfully.');
    console.log('   Response message:', msgResult.message);

    // 3. Test GET /messages (Read Messages Log)
    console.log('\n--- 3. Testing GET /api/messages (Retrieve Message Log) ---');
    const fetchMsgRes = await fetch(`${API_URL}/messages`);
    if (!fetchMsgRes.ok) throw new Error(`GET /messages failed: ${fetchMsgRes.statusText}`);
    const messages = await fetchMsgRes.json();
    console.log(`✅ Success! Retrieved ${messages.length} messages.`);
    const matching = messages.find(m => m.email === 'jane@example.com');
    if (matching) {
      console.log('   ✅ Found submitted test message:');
      console.log(`      From: ${matching.name} | Subject: ${matching.subject}`);
      console.log(`      Content: ${matching.message}`);
    } else {
      throw new Error('Test message was not found in message log.');
    }

    // 4. Test POST /projects (Add a project)
    console.log('\n--- 4. Testing POST /api/projects (Create New Project) ---');
    const testProject = {
      title: 'INTEGRATION TEST PROJECT',
      description: 'A mock project generated to test programmatic backend database routing.',
      tools: {
        frontend: 'Vanilla JS',
        backend: 'Express',
        database: 'SQLite'
      },
      github: 'https://github.com/Karthi220606/test-project',
      category: 'Node'
    };

    const addProjRes = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testProject)
    });
    if (!addProjRes.ok) throw new Error(`POST /projects failed: ${addProjRes.statusText}`);
    const newProj = await addProjRes.json();
    console.log('✅ Success! Project added:');
    console.log(`   - ID: ${newProj._id} | Title: ${newProj.title}`);

    // 5. Test DELETE /projects/:id (Delete the project)
    console.log(`\n--- 5. Testing DELETE /api/projects/${newProj._id} (Remove Test Project) ---`);
    const delProjRes = await fetch(`${API_URL}/projects/${newProj._id}`, {
      method: 'DELETE'
    });
    if (!delProjRes.ok) throw new Error(`DELETE /projects failed: ${delProjRes.statusText}`);
    const delResult = await delProjRes.json();
    console.log('✅ Success! Project deleted:');
    console.log('   Response message:', delResult.message);

    console.log('\n🎉 ALL Programmatic API Integration Tests Passed Successfully!');
  } catch (err) {
    console.error('\n❌ Integration Test Failed:', err.message);
    process.exit(1);
  }
}

runTests();
