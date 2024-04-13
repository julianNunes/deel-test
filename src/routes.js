const express = require('express')
const router = express.Router()
const { getProfile } = require('./middleware/getProfile')

const {
    findContract,
    getContractsTerminated,
} = require('../src/controllers/contract.controller.js')

const {
    getJobsUnpaid,
    payJob,
} = require('../src/controllers/job.controller.js')

const {
    deepositToProfile,
    getBestProfession,
    getBestClient,
} = require('../src/controllers/profile.controller.js')

router.use(getProfile)

// contract routes
router.get('/contracts/:id', findContract)
router.get('/contracts', getContractsTerminated)

// jobs routes
router.get('/jobs/unpaid', getJobsUnpaid)
router.post('/jobs/:job_id/pay', payJob)

// profile routes
router.post('/balances/deposit/:userId', deepositToProfile)
router.get('/admin/best-profession', getBestProfession)
router.get('/admin/best-clients', getBestClient)


module.exports = router
