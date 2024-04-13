const { Op } = require('sequelize');
const { default: Sequelize } = require('sequelize/lib/sequelize');
const { sequelize } = require('../model.js')


/**
 * Deposits money into the the the balance of a client, a client can't deposit more than 25% his total of jobs to pay. (at the deposit moment)
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const deepositToProfile = async (req, res) => {
    const money = parseFloat(req.body.money)
    const { userId } = req.params

    if (req.profile.type != 'client') {
        return res.status(404).send('This user is not a client')
    }

    if (req.profile.id != userId) {
        return res.status(404).send('This userId is different from authenticate user')
    }

    const { Job, Contract } = req.app.get('models')
    let conditional = {
        where: {
            paid: {
                [Op.is]: null
            },
            '$Contract.status$': 'in_progress',
            '$Contract.ClientId$': userId
        },
        include: { model: Contract }
    }

    const jobs = await Job.findAll(conditional)
    let sum_jobs = 0

    if (jobs?.length) {
        for (const job of jobs) {
            sum_jobs += job.price
        }
    }

    if (sum_jobs > 0) sum_jobs = sum_jobs * 0.25

    if (sum_jobs > 0 && money > sum_jobs) {
        return res.status(404).send('deposit more than 25% his total of jobs to pay.')
    }

    try {
        await sequelize.transaction(async t => {
            req.profile.balance += money
            await req.profile.save()
            return true
        })

        res.send('ok')
    } catch (error) {
        console.error(`An error occurred:`, error);
    }
}

/**
 * Returns the profession that earned the most money (sum of jobs paid) for any contactor that worked in the query time range.
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const getBestProfession = async (req, res) => {
    const { start, end } = req.query
    const { Job, Contract, Profile } = req.app.get('models')
    let conditional = {
        where: {
            paid: {
                [Op.is]: 1
            },
            paymentDate: {
                [Op.between]: [start, end]
            }
        },
        attributes: [
            'Contract.ContractorId',
            [sequelize.fn('sum', sequelize.col('price')), 'total_amount'],
        ],
        group: ['Contract.ContractorId'],
        order: [sequelize.literal('total_amount DESC')],
        include: { model: Contract },
    }

    const job = await Job.findOne(conditional)
    if (!job) return res.status(404).end()

    const profile = await Profile.findOne({ where: { id: job.Contract.ContractorId } })
    res.json({ profession: profile.profession })
}

/**
 * returns the clients the paid the most for jobs in the query time period. limit query parameter should be applied, default limit is 2
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const getBestClient = async (req, res) => {
    const { start, end } = req.query
    let limit = req.query.limit ? req.query.limit : 2

    const { Job, Contract, Profile } = req.app.get('models')
    let conditional = {
        where: {
            paid: {
                [Op.is]: 1
            },
            paymentDate: {
                [Op.between]: [start, end]
            }
        },
        order: [sequelize.literal('price DESC')],
        include: { all: true, nested: true },
        limit: limit
    }

    let jobs = await Job.findAll(conditional)
    if (!jobs) return res.status(404).end()

    jobs = jobs.map((x) => {
        return {
            id: x.Contract.ClientId,
            fullName: x.Contract.Client.firstName + ' ' + x.Contract.Client.lastName,
            paid: x.price,

        }
    })

    res.json(jobs)
}

module.exports = {
    deepositToProfile,
    getBestProfession,
    getBestClient,
}