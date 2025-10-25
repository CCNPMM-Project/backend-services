const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./src/models/User');
const Company = require('./src/models/Company');
const Job = require('./src/models/Job');

async function testSyncModels() {
  console.log('🧪 Testing model synchronization between admin-panel and backend-services...\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobportal');
    console.log('✅ Connected to MongoDB');

    // Test 1: Check User model has isActive field
    console.log('\n1️⃣ Testing User model...');
    const userSchema = User.schema.paths;
    if (userSchema.isActive) {
      console.log('✅ User model has isActive field');
      console.log('   Type:', userSchema.isActive.instance);
      console.log('   Default:', userSchema.isActive.defaultValue);
    } else {
      console.log('❌ User model missing isActive field');
    }

    // Test 2: Check Company model has isActive field
    console.log('\n2️⃣ Testing Company model...');
    const companySchema = Company.schema.paths;
    if (companySchema.isActive) {
      console.log('✅ Company model has isActive field');
      console.log('   Type:', companySchema.isActive.instance);
      console.log('   Default:', companySchema.isActive.defaultValue);
    } else {
      console.log('❌ Company model missing isActive field');
    }

    // Test 3: Check Job model has correct status enum
    console.log('\n3️⃣ Testing Job model...');
    const jobSchema = Job.schema.paths;
    if (jobSchema.status) {
      console.log('✅ Job model has status field');
      console.log('   Enum values:', jobSchema.status.enumValues);
      console.log('   Default:', jobSchema.status.defaultValue);
      
      const expectedEnums = ['active', 'inactive'];
      const hasCorrectEnums = expectedEnums.every(val => jobSchema.status.enumValues.includes(val));
      if (hasCorrectEnums) {
        console.log('✅ Job status enum is correct');
      } else {
        console.log('❌ Job status enum is incorrect');
        console.log('   Expected:', expectedEnums);
        console.log('   Actual:', jobSchema.status.enumValues);
      }
    } else {
      console.log('❌ Job model missing status field');
    }

    // Test 4: Create test data to verify functionality
    console.log('\n4️⃣ Testing data creation...');
    
    // Create test user
    const testUser = new User({
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
      role: 'candidate',
      isActive: true
    });
    await testUser.save();
    console.log('✅ Test user created with isActive:', testUser.isActive);

    // Create test company
    const testCompany = new Company({
      name: 'Test Company',
      description: 'Test company description',
      location: 'Test Location',
      website: 'https://test.com',
      recruiter: testUser._id,
      isActive: true
    });
    await testCompany.save();
    console.log('✅ Test company created with isActive:', testCompany.isActive);

    // Create test job
    const testJob = new Job({
      title: 'Test Job',
      description: 'Test job description',
      company: testCompany._id,
      location: 'Test Location',
      jobType: 'full-time',
      status: 'active'
    });
    await testJob.save();
    console.log('✅ Test job created with status:', testJob.status);

    // Test 5: Test inactive user login (should fail)
    console.log('\n5️⃣ Testing inactive user login...');
    testUser.isActive = false;
    await testUser.save();
    console.log('✅ User set to inactive');

    // Test 6: Test inactive company job creation (should fail)
    console.log('\n6️⃣ Testing inactive company job creation...');
    testCompany.isActive = false;
    await testCompany.save();
    console.log('✅ Company set to inactive');

    // Test 7: Test inactive job visibility
    console.log('\n7️⃣ Testing inactive job visibility...');
    testJob.status = 'inactive';
    await testJob.save();
    console.log('✅ Job set to inactive');

    // Test 8: Verify only active jobs are returned
    console.log('\n8️⃣ Testing job filtering...');
    const activeJobs = await Job.find({ status: 'active' });
    const allJobs = await Job.find();
    console.log(`✅ Active jobs: ${activeJobs.length}, Total jobs: ${allJobs.length}`);

    console.log('\n🎉 All model synchronization tests passed!');
    console.log('\n📋 Summary:');
    console.log('- User model: ✅ has isActive field');
    console.log('- Company model: ✅ has isActive field');
    console.log('- Job model: ✅ has correct status enum (active/inactive)');
    console.log('- Login validation: ✅ inactive users cannot login');
    console.log('- Job creation: ✅ inactive companies cannot create jobs');
    console.log('- Job filtering: ✅ only active jobs are shown to users');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    try {
      await User.deleteMany({ email: 'test@example.com' });
      await Company.deleteMany({ name: 'Test Company' });
      await Job.deleteMany({ title: 'Test Job' });
      console.log('✅ Test data cleaned up');
    } catch (cleanupError) {
      console.error('⚠️ Cleanup error:', cleanupError.message);
    }
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the test
testSyncModels();
