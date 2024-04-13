const { Op } = require('sequelize');
const { default: Sequelize } = require('sequelize/lib/sequelize');
const { sequelize } = require('../model.js')

/**
 * Get all unpaid jobs for a user (client or contractor), for active contracts only
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const getJobsUnpaid = async (req, res) => {
    const { Job } = req.app.get('models')
    let conditional = {
        where: {
            paid: {
                [Op.is]: null
            },
            '$Contract.status$': 'in_progress'
        }
    }

    if (req.profile.type == 'client') {
        conditional.where['$Contract.ClientId$'] = req.profile.id
    } else if (req.profile.type == 'contractor') {
        conditional.where['$Contract.ContractorId$'] = req.profile.id
    }

    conditional.include = { all: true, nested: true }

    const jobs = await Job.findAll(conditional)
    if (!jobs) return res.status(404).end()
    res.json(jobs)
}

/**
 * Pay for a Job
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const payJob = async (req, res) => {
    const { Job } = req.app.get('models')
    const { job_id } = req.params
    let conditional = { where: { id: job_id } }
    conditional.include = { all: true, nested: true }

    const job = await Job.findOne(conditional)
    if (!job) return res.status(404).end()

    if (job.paid) return res.status(404).send('Job is already paid')
    if (job.Contract.status != 'in_progress') return res.status(404).send('Contract is not in progress')

    if (
        (req.profile.type == 'client' && job.Contract.ClientId != req.profile.id) ||
        (req.profile.type == 'contractor' && job.Contract.ContractorId != req.profile.id)
    ) {
        return res.status(404).send('This job doesn`t belong to authenticate user')
    }

    if (job?.Contract?.Client.balance < job.price) return res.status(404).send('Client with insufficient balance')

    try {
        await sequelize.transaction(async t => {
            job.Contract.Client.balance -= job.price
            await job.Contract.Client.save()

            job.Contract.Contractor.balance += job.price
            await job.Contract.Contractor.save()

            job.paid = true
            job.paymentDate = new Date()
            await job.save()

            return true
        })

        res.send('ok')
    } catch (error) {
        console.error(`An error occurred:`, error);
    }
}


module.exports = {
    getJobsUnpaid,
    payJob
}