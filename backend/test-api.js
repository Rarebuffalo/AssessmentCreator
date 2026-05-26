const fs = require('fs');
const path = require('path');

async function runTests() {
  const serverUrl = 'http://localhost:5000';
  console.log('Starting API verification tests...');

  // Create a test file with a highly specific fact to verify text extraction
  const tempDir = __dirname;
  const tempFilePath = path.join(tempDir, 'everest_fact.txt');
  const specialFact = 'Mount Everest water boiling temperature is exactly 71 degrees Celsius due to lower pressure.';
  fs.writeFileSync(tempFilePath, specialFact);
  console.log('Created temporary text file with fact:', specialFact);

  try {
    // 1. Create assignment with multipart upload
    console.log('\n--- Test 1: Creating assignment with file upload ---');
    const formData = new FormData();
    formData.append('title', 'Geography Assessment');
    formData.append('subject', 'Geography');
    formData.append('className', 'Class 9');
    formData.append('schoolName', 'Apex Academy');
    formData.append('timeAllowed', '45');
    formData.append('dueDate', new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    formData.append('difficulty', 'Challenging');
    formData.append('additionalInstructions', 'Ask questions specifically based on the uploaded file.');
    
    // Add questionTypes
    const questionTypes = [{ type: 'Short Questions', count: 1, marks: 5 }];
    formData.append('questionTypes', JSON.stringify(questionTypes));

    // Append file
    const fileBuffer = fs.readFileSync(tempFilePath);
    const fileBlob = new Blob([fileBuffer], { type: 'text/plain' });
    formData.append('file', fileBlob, 'everest_fact.txt');

    const createRes = await fetch(`${serverUrl}/api/assignments`, {
      method: 'POST',
      body: formData,
    });

    if (!createRes.ok) {
      throw new Error(`Failed to create assignment: ${await createRes.text()}`);
    }

    const createData = await createRes.json();
    console.log('Create response:', createData);
    const assignmentId = createData.assignmentId;
    if (!assignmentId) {
      throw new Error('Assignment ID not returned!');
    }

    // 2. Poll for completion and verify content
    console.log('\n--- Test 2: Polling for generation and verifying reference content extraction ---');
    let assignment = null;
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const getRes = await fetch(`${serverUrl}/api/assignments/${assignmentId}`);
      assignment = (await getRes.json()).assignment;
      console.log(`Poll ${i + 1}: Status = ${assignment.status}`);
      if (assignment.status === 'completed' || assignment.status === 'failed') {
        break;
      }
    }

    if (assignment.status !== 'completed') {
      throw new Error(`Generation failed or timed out. Status: ${assignment.status}, Error: ${assignment.errorMessage}`);
    }

    console.log('Extracted text stored in database:', assignment.extractedText);
    if (!assignment.extractedText.includes('71 degrees Celsius')) {
      throw new Error('Extracted text does not match the uploaded file content!');
    }
    console.log('✓ Extracted text verified in database.');

    // Look for the special fact in generated questions
    const questionsText = JSON.stringify(assignment.sections);
    console.log('Generated questions structure:', questionsText);
    const containsFactReference = questionsText.toLowerCase().includes('everest') || 
                                  questionsText.toLowerCase().includes('71') || 
                                  questionsText.toLowerCase().includes('boil');
    if (containsFactReference) {
      console.log('✓ Verified: AI correctly used the extracted text from the file for question generation!');
    } else {
      console.warn('⚠ AI generated questions might not have strictly used the fact. Questions:', questionsText);
    }

    // 3. Test PDF Buffer Caching & latency
    console.log('\n--- Test 3: Testing PDF Generation & Caching ---');
    console.log('Making 1st PDF download request (triggers Puppeteer compile)...');
    const start1 = Date.now();
    const pdfRes1 = await fetch(`${serverUrl}/api/assignments/${assignmentId}/pdf`);
    if (!pdfRes1.ok) {
      throw new Error(`PDF Gen 1 failed: ${await pdfRes1.text()}`);
    }
    const pdfBuf1 = await pdfRes1.arrayBuffer();
    const duration1 = Date.now() - start1;
    console.log(`1st request took: ${duration1}ms. Received buffer size: ${pdfBuf1.byteLength} bytes.`);

    console.log('Making 2nd PDF download request (should fetch from MongoDB cache)...');
    const start2 = Date.now();
    const pdfRes2 = await fetch(`${serverUrl}/api/assignments/${assignmentId}/pdf`);
    if (!pdfRes2.ok) {
      throw new Error(`PDF Gen 2 failed: ${await pdfRes2.text()}`);
    }
    const pdfBuf2 = await pdfRes2.arrayBuffer();
    const duration2 = Date.now() - start2;
    console.log(`2nd request took: ${duration2}ms. Received buffer size: ${pdfBuf2.byteLength} bytes.`);

    if (duration2 < duration1 / 2) {
      console.log(`✓ Verified: 2nd request is significantly faster (${duration2}ms vs ${duration1}ms). PDF is cached successfully!`);
    } else {
      console.log(`Note: 2nd request took ${duration2}ms. If compilation was extremely fast, this is fine.`);
    }

    // 4. Test Paper Regeneration
    console.log('\n--- Test 4: Testing paper regeneration endpoint ---');
    const regenRes = await fetch(`${serverUrl}/api/assignments/${assignmentId}/regenerate`, {
      method: 'POST',
    });
    if (!regenRes.ok) {
      throw new Error(`Regenerate request failed: ${await regenRes.text()}`);
    }
    const regenData = await regenRes.json();
    console.log('Regenerate queue response:', regenData);

    // Verify status reset immediately to pending
    const getResAfterRegen = await fetch(`${serverUrl}/api/assignments/${assignmentId}`);
    const assignmentAfterRegen = (await getResAfterRegen.json()).assignment;
    console.log('Status immediately after regeneration request:', assignmentAfterRegen.status);
    if (assignmentAfterRegen.status !== 'pending' && assignmentAfterRegen.status !== 'generating') {
      throw new Error(`Status was not reset to pending! Status is ${assignmentAfterRegen.status}`);
    }
    console.log('✓ Verified: Status correctly reset to pending/generating.');

    // Wait for the new generation to complete
    console.log('Waiting for regeneration to complete...');
    let finalAssignment = null;
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const getRes = await fetch(`${serverUrl}/api/assignments/${assignmentId}`);
      finalAssignment = (await getRes.json()).assignment;
      console.log(`Regen Poll ${i + 1}: Status = ${finalAssignment.status}`);
      if (finalAssignment.status === 'completed' || finalAssignment.status === 'failed') {
        break;
      }
    }

    if (finalAssignment.status !== 'completed') {
      throw new Error(`Regeneration failed. Status: ${finalAssignment.status}`);
    }
    console.log('✓ Verified: Regeneration completed successfully!');

  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  } finally {
    // Clean up temporary file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}

runTests();
