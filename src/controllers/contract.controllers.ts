import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import contractService from '../services/contract.services'
import { TokenPayload } from '../models/request/User.request'
import { wrapAsync } from '../utils/handler'

// Contract request interfaces
interface CreateContractReqBody {
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

interface UpdateContractReqBody {
  staff_name?: string
  staff_phone?: string
  theater_name?: string
  theater_location?: string
  salary?: number
  start_date?: string
  end_date?: string
  status?: string
  terms?: string
  responsibilities?: string[]
  benefits?: string[]
  contract_file_url?: string
  notes?: string
}

interface ContractIdReqParams extends ParamsDictionary {
  contract_id: string
}

interface GetContractsReqQuery {
  page?: string
  limit?: string
  status?: string
  staff_id?: string
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// Admin Controllers
export const createContractController = async (
  req: Request<ParamsDictionary, any, CreateContractReqBody>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await contractService.createContract(user_id, req.body)

  res.json({
    message: 'Create contract success',
    result
  })
}

export const getContractsController = async (
  req: Request<ParamsDictionary, any, any, GetContractsReqQuery>,
  res: Response
) => {
  const result = await contractService.getContracts(req.query)

  res.json({
    message: 'Get contracts success',
    result
  })
}

export const getContractByIdController = async (req: Request<ContractIdReqParams>, res: Response) => {
  const { contract_id } = req.params
  const result = await contractService.getContractById(contract_id)

  res.json({
    message: 'Get contract success',
    result
  })
}

export const updateContractController = async (
  req: Request<ContractIdReqParams, any, UpdateContractReqBody>,
  res: Response
) => {
  const { contract_id } = req.params
  const result = await contractService.updateContract(contract_id, req.body as any)

  res.json({
    message: 'Update contract success',
    result
  })
}

export const activateContractController = async (req: Request<ContractIdReqParams>, res: Response) => {
  const { contract_id } = req.params
  const result = await contractService.activateContract(contract_id)

  res.json({
    message: 'Activate contract success',
    result
  })
}

export const terminateContractController = async (
  req: Request<ContractIdReqParams, any, { reason?: string }>,
  res: Response
) => {
  const { contract_id } = req.params
  const { reason } = req.body
  const result = await contractService.terminateContract(contract_id, reason)

  res.json({
    message: 'Terminate contract success',
    result
  })
}

// Staff Controllers
export const getMyContractController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await contractService.getStaffContract(user_id)

  res.json({
    message: result ? 'Get contract success' : 'No active contract found',
    result
  })
}

// System Controllers
export const checkExpiredContractsController = async (req: Request, res: Response) => {
  const expiredCount = await contractService.checkExpiredContracts()

  res.json({
    message: 'Check expired contracts completed',
    result: {
      expired_count: expiredCount
    }
  })
}
