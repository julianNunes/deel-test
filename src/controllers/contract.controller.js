/**
 * Get the contract only if it belongs to the profile calling
 * @param {*} req 
 * @param {*} res 
 * @returns contract by id
 */
const findContract = async (req, res) => {
    const { Contract, Profile } = req.app.get('models')
    const { id } = req.params
    let conditional = {
        where: { id }
    }

    if (req.profile.type == 'client') conditional.where.ClientId = req.profile.id
    else if (req.profile.type == 'contractor') conditional.where.ContractorId = req.profile.id

    conditional.include = [
        { model: Profile, as: 'Client' },
        { model: Profile, as: 'Contractor' }
    ]

    const contract = await Contract.findOne(conditional)
    if (!contract) return res.status(404).end()
    res.json(contract)
}

/**
 * Returns a list of contracts belonging to a user (client or contractor), the list should only contain non terminated contracts.
 * @param {*} req 
 * @param {*} res 
 * @returns Array of Contracts
 */
const getContractsTerminated = async (req, res) => {
    const { Contract, Profile } = req.app.get('models')
    let conditional = {
        where: {
            status: 'terminated'
        }
    }

    if (req.profile.type == 'client') conditional.where.ClientId = req.profile.id
    else if (req.profile.type == 'contractor') conditional.where.ContractorId = req.profile.id

    conditional.include = [
        { model: Profile, as: 'Client' },
        { model: Profile, as: 'Contractor' }
    ]

    const contracts = await Contract.findAll(conditional)
    if (!contracts?.length) return res.status(404).end()
    res.json(contracts)
}


module.exports = {
    findContract,
    getContractsTerminated
}