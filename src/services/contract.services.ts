import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import Contract, { ContractStatus } from '../models/schemas/Contact.schema'
import { ErrorWithStatus } from '../models/Errors'
import HTTP_STATUS from '../constants/httpStatus'
import { UserRole } from '../models/schemas/User.schema'

interface CreateContractPayload {
  staff_id: string
  staff_name: string
  staff_email: string
  staff_phone: string
  theater_name: string
  theater_location: string
  salary: number
  start_date: string
  end_date: string
  terms: string
  responsibilities: string[]
  benefits: string[]
  contract_file_url?: string
  notes?: string
}

interface UpdateContractPayload {
  staff_name?: string
  staff_phone?: string
  theater_name?: string
  theater_location?: string
  salary?: number
  start_date?: string
  end_date?: string
  status?: ContractStatus
  terms?: string
  responsibilities?: string[]
  benefits?: string[]
  contract_file_url?: string
  notes?: string
}

interface GetContractsQuery {
  page?: string
  limit?: string
  status?: string
  staff_id?: string
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

class ContractService {
  async createContract(admin_id: string, payload: CreateContractPayload) {
    // Kiểm tra staff có tồn tại không
    const staff = await databaseService.users.findOne({
      _id: new ObjectId(payload.staff_id)
    })

    if (!staff) {
      throw new ErrorWithStatus({
        message: 'Staff not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Kiểm tra staff đã có role Staff chưa
    if (staff.role !== UserRole.Staff) {
      throw new ErrorWithStatus({
        message: 'User must have Staff role to create contract',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Kiểm tra staff đã có hợp đồng active chưa
    const existingContract = await databaseService.contracts.findOne({
      staff_id: new ObjectId(payload.staff_id),
      status: ContractStatus.ACTIVE
    })

    if (existingContract) {
      throw new ErrorWithStatus({
        message: 'Staff already has an active contract',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const contract_id = new ObjectId()
    // If theater name/location not provided, try to auto-populate from theaters managed by this staff
    let autoTheaterName = payload.theater_name
    let autoTheaterLocation = payload.theater_location
    try {
      const managed = await databaseService.theaters.findOne({ manager_id: new ObjectId(payload.staff_id) }, { projection: { name: 1, location: 1 } })
      if (managed) {
        if (!autoTheaterName) autoTheaterName = managed.name
        if (!autoTheaterLocation) autoTheaterLocation = managed.location
      }
    } catch (err) {
      // ignore, not critical
    }

    const contract = new Contract({
      _id: contract_id,
      admin_id: new ObjectId(admin_id),
      staff_id: new ObjectId(payload.staff_id),
      staff_name: payload.staff_name,
      staff_email: payload.staff_email,
      staff_phone: payload.staff_phone,
      theater_name: autoTheaterName,
      theater_location: autoTheaterLocation,
      salary: payload.salary,
      start_date: new Date(payload.start_date),
      end_date: new Date(payload.end_date),
      terms: payload.terms,
      responsibilities: payload.responsibilities,
      benefits: payload.benefits,
      contract_file_url: payload.contract_file_url,
      notes: payload.notes,
      status: ContractStatus.DRAFT,
      contract_number: `CON-${new Date().getFullYear()}-${contract_id.toString().slice(-6)}`
    })

    await databaseService.contracts.insertOne(contract)

    return { contract_id: contract_id.toString() }
  }

  async getContracts(query: GetContractsQuery) {
    const { page = '1', limit = '10', status, staff_id, search, sort_by = 'created_at', sort_order = 'desc' } = query

    const filter: any = {}

    // Filter by status
    if (status && Object.values(ContractStatus).includes(status as ContractStatus)) {
      filter.status = status
    }

    // Filter by staff_id
    if (staff_id && ObjectId.isValid(staff_id)) {
      filter.staff_id = new ObjectId(staff_id)
    }

    // Search by staff name, email, theater name
    if (search) {
      filter.$or = [
        { staff_name: { $regex: search, $options: 'i' } },
        { staff_email: { $regex: search, $options: 'i' } },
        { theater_name: { $regex: search, $options: 'i' } },
        { contract_number: { $regex: search, $options: 'i' } }
      ]
    }

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    const sortObj: any = {}
    sortObj[sort_by] = sort_order === 'asc' ? 1 : -1

    const totalContracts = await databaseService.contracts.countDocuments(filter)

    const contracts = await databaseService.contracts.find(filter).sort(sortObj).skip(skip).limit(limitNum).toArray()

    // Enrich với thông tin staff và admin
    const enrichedContracts = await Promise.all(
      contracts.map(async (contract) => {
        const [staff, admin] = await Promise.all([
          databaseService.users.findOne(
            { _id: contract.staff_id },
            { projection: { _id: 1, name: 1, email: 1, avatar: 1 } }
          ),
          databaseService.users.findOne({ _id: contract.admin_id }, { projection: { _id: 1, name: 1, email: 1 } })
        ])

        // Find theaters managed by this staff (if staff exists)
        let theatersManaged: any[] = []
        if (staff && staff._id) {
          // Ensure we query with an ObjectId to match stored theater.manager_id
          const managerObjectId = new ObjectId(String((staff as any)._id))
          console.log(`DEBUG: Querying theaters for manager_id: ${managerObjectId}`)
          theatersManaged = await databaseService.theaters
            .find({ manager_id: managerObjectId }, { projection: { _id: 1, name: 1 } })
            .toArray()
          console.log(`DEBUG: Found ${theatersManaged.length} theaters:`, theatersManaged)
        }

        return {
          ...contract,
          staff: staff || null,
          admin: admin || null,
          theaters_managed: theatersManaged.map((t) => ({ _id: t._id, name: t.name }))
        }
      })
    )

    return {
      contracts: enrichedContracts,
      total: totalContracts,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(totalContracts / limitNum)
    }
  }

  async getContractById(contract_id: string) {
    if (!ObjectId.isValid(contract_id)) {
      throw new ErrorWithStatus({
        message: 'Invalid contract ID',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const contract = await databaseService.contracts.findOne({
      _id: new ObjectId(contract_id)
    })

    if (!contract) {
      throw new ErrorWithStatus({
        message: 'Contract not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // Enrich với thông tin staff và admin
    const [staff, admin] = await Promise.all([
      databaseService.users.findOne(
        { _id: contract.staff_id },
        { projection: { _id: 1, name: 1, email: 1, phone: 1, avatar: 1 } }
      ),
      databaseService.users.findOne({ _id: contract.admin_id }, { projection: { _id: 1, name: 1, email: 1 } })
    ])

    // Find theaters managed by this staff
    let theatersManaged: any[] = []
    if (staff && staff._id) {
      // Ensure we query with an ObjectId to match stored theater.manager_id
      const managerObjectId = new ObjectId(String((staff as any)._id))
      console.log(`DEBUG: Querying theaters for manager_id: ${managerObjectId}`)
      theatersManaged = await databaseService.theaters.find({ manager_id: managerObjectId }, { projection: { _id: 1, name: 1 } }).toArray()
      console.log(`DEBUG: Found ${theatersManaged.length} theaters:`, theatersManaged)
    }

    return {
      ...contract,
      staff: staff || null,
      admin: admin || null,
      theaters_managed: theatersManaged.map((t) => ({ _id: t._id, name: t.name }))
    }
  }

  async updateContract(contract_id: string, payload: UpdateContractPayload) {
    if (!ObjectId.isValid(contract_id)) {
      throw new ErrorWithStatus({
        message: 'Invalid contract ID',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const contract = await databaseService.contracts.findOne({
      _id: new ObjectId(contract_id)
    })

    if (!contract) {
      throw new ErrorWithStatus({
        message: 'Contract not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const updateData: any = { ...payload }

    // Convert date strings to Date objects
    if (payload.start_date) {
      updateData.start_date = new Date(payload.start_date)
    }
    if (payload.end_date) {
      updateData.end_date = new Date(payload.end_date)
    }

    await databaseService.contracts.updateOne(
      { _id: new ObjectId(contract_id) },
      {
        $set: updateData,
        $currentDate: { updated_at: true }
      }
    )

    return { contract_id }
  }

  async activateContract(contract_id: string) {
    if (!ObjectId.isValid(contract_id)) {
      throw new ErrorWithStatus({
        message: 'Invalid contract ID',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const contract = await databaseService.contracts.findOne({
      _id: new ObjectId(contract_id)
    })

    if (!contract) {
      throw new ErrorWithStatus({
        message: 'Contract not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (contract.status === ContractStatus.ACTIVE) {
      throw new ErrorWithStatus({
        message: 'Contract is already active',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    // Kiểm tra xem staff có hợp đồng active khác không
    const existingActiveContract = await databaseService.contracts.findOne({
      staff_id: contract.staff_id,
      status: ContractStatus.ACTIVE,
      _id: { $ne: new ObjectId(contract_id) }
    })

    if (existingActiveContract) {
      throw new ErrorWithStatus({
        message: 'Staff already has another active contract',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    await databaseService.contracts.updateOne(
      { _id: new ObjectId(contract_id) },
      {
        $set: { status: ContractStatus.ACTIVE },
        $currentDate: { updated_at: true }
      }
    )

    return { contract_id }
  }

  async terminateContract(contract_id: string, reason?: string) {
    if (!ObjectId.isValid(contract_id)) {
      throw new ErrorWithStatus({
        message: 'Invalid contract ID',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const contract = await databaseService.contracts.findOne({
      _id: new ObjectId(contract_id)
    })

    if (!contract) {
      throw new ErrorWithStatus({
        message: 'Contract not found',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    await databaseService.contracts.updateOne(
      { _id: new ObjectId(contract_id) },
      {
        $set: {
          status: ContractStatus.TERMINATED,
          notes: reason ? `${contract.notes}\nTermination reason: ${reason}` : contract.notes
        },
        $currentDate: { updated_at: true }
      }
    )

    return { contract_id }
  }

  async getStaffContract(staff_id: string) {
    if (!ObjectId.isValid(staff_id)) {
      throw new ErrorWithStatus({
        message: 'Invalid staff ID',
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const contract = await databaseService.contracts.findOne({
      staff_id: new ObjectId(staff_id),
      status: ContractStatus.ACTIVE
    })

    if (!contract) {
      return null
    }

    // Enrich với thông tin admin
    const admin = await databaseService.users.findOne(
      { _id: contract.admin_id },
      { projection: { _id: 1, name: 1, email: 1 } }
    )

    return {
      ...contract,
      admin: admin || null
    }
  }

  // Tự động check và cập nhật expired contracts
  async checkExpiredContracts() {
    const expiredContracts = await databaseService.contracts
      .find({
        status: ContractStatus.ACTIVE,
        end_date: { $lt: new Date() }
      })
      .toArray()

    if (expiredContracts.length > 0) {
      await databaseService.contracts.updateMany(
        {
          status: ContractStatus.ACTIVE,
          end_date: { $lt: new Date() }
        },
        {
          $set: { status: ContractStatus.EXPIRED },
          $currentDate: { updated_at: true }
        }
      )

      console.log(`Updated ${expiredContracts.length} expired contracts`)
    }

    return expiredContracts.length
  }
}

const contractService = new ContractService()
export default contractService
