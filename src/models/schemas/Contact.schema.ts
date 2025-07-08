import { ObjectId } from 'mongodb'

interface ContractType {
  _id?: ObjectId
  staff_id: ObjectId // User ID của staff
  admin_id: ObjectId // Admin tạo hợp đồng
  contract_number: string // Số hợp đồng
  staff_name: string
  staff_email: string
  staff_phone: string
  theater_name: string // Tên rạp sẽ quản lý
  theater_location: string
  salary: number // Lương tháng
  start_date: Date // Ngày bắt đầu hợp đồng
  end_date: Date // Ngày kết thúc hợp đồng
  status: ContractStatus
  terms: string // Điều khoản hợp đồng
  responsibilities: string[] // Trách nhiệm công việc
  benefits: string[] // Quyền lợi
  contract_file_url?: string // Link file hợp đồng đã ký
  notes?: string // Ghi chú
  created_at?: Date
  updated_at?: Date
}

export enum ContractStatus {
  DRAFT = 'draft', // Nháp
  ACTIVE = 'active', // Đang hoạt động
  EXPIRED = 'expired', // Hết hạn
  TERMINATED = 'terminated', // Chấm dứt
  SUSPENDED = 'suspended' // Tạm ngưng
}

export default class Contract {
  _id?: ObjectId
  staff_id: ObjectId
  admin_id: ObjectId
  contract_number: string
  staff_name: string
  staff_email: string
  staff_phone: string
  theater_name: string
  theater_location: string
  salary: number
  start_date: Date
  end_date: Date
  status: ContractStatus
  terms: string
  responsibilities: string[]
  benefits: string[]
  contract_file_url: string
  notes: string
  created_at: Date
  updated_at: Date

  constructor({
    _id,
    staff_id,
    admin_id,
    contract_number,
    staff_name,
    staff_email,
    staff_phone,
    theater_name,
    theater_location,
    salary,
    start_date,
    end_date,
    status,
    terms,
    responsibilities,
    benefits,
    contract_file_url,
    notes,
    created_at,
    updated_at
  }: ContractType) {
    const date = new Date()
    this._id = _id
    this.staff_id = staff_id
    this.admin_id = admin_id
    this.contract_number = contract_number || this.generateContractNumber()
    this.staff_name = staff_name
    this.staff_email = staff_email
    this.staff_phone = staff_phone
    this.theater_name = theater_name
    this.theater_location = theater_location
    this.salary = salary
    this.start_date = start_date
    this.end_date = end_date
    this.status = status || ContractStatus.DRAFT
    this.terms = terms
    this.responsibilities = responsibilities || []
    this.benefits = benefits || []
    this.contract_file_url = contract_file_url || ''
    this.notes = notes || ''
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }

  private generateContractNumber(): string {
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    const random = Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, '0')
    return `CT${year}${month}${random}`
  }
}
