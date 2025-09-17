const mongoose = require('mongoose');
require('./config/database');
const Job = require('./models/Job');
const User = require('./models/User');

async function assignJobsToTestVendor() {
    try {
        // Find test vendor
        const vendor = await User.findOne({ email: 'testvendor@test.com' });
        if (!vendor) {
            console.log('Test vendor not found');
            return;
        }
        
        console.log('Test vendor found:', vendor.email, vendor._id);
        
        // Find some unassigned jobs and assign them to our test vendor
        const jobs = await Job.find({}).limit(3);
        console.log(`Found ${jobs.length} jobs to potentially assign`);
        
        if (jobs.length > 0) {
            // Assign the first few jobs to our test vendor with different statuses
            await Job.findByIdAndUpdate(jobs[0]._id, { 
                assignedVendor: vendor._id,
                status: 'ASSIGNED'
            });
            
            if (jobs.length > 1) {
                await Job.findByIdAndUpdate(jobs[1]._id, { 
                    assignedVendor: vendor._id,
                    status: 'IN_PROGRESS'
                });
            }
            
            if (jobs.length > 2) {
                await Job.findByIdAndUpdate(jobs[2]._id, { 
                    assignedVendor: vendor._id,
                    status: 'COMPLETED'
                });
            }
            
            console.log('Assigned jobs to test vendor');
            
            // Verify the assignments
            const assignedJobs = await Job.find({ assignedVendor: vendor._id });
            console.log(`Test vendor now has ${assignedJobs.length} jobs:`);
            assignedJobs.forEach(job => {
                console.log(`- Job ${job._id.toString().substring(0,8)}: ${job.status}`);
            });
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

mongoose.connection.once('open', assignJobsToTestVendor);
