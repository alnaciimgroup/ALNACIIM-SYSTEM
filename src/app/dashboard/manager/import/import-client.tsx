'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Upload, FileSpreadsheet, Settings2, HelpCircle, ArrowRight, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { importCustomerBatch } from './actions'
import { useToast } from '@/components/ui/toast'

interface StaffItem {
  id: string
  full_name: string
  role: string
}

interface ImportClientProps {
  staffList: StaffItem[]
}

type ColumnMappings = {
  nameCol: string
  phoneCol: string
  tankCol: string
  debtCol: string
  addressCol: string
  guarantorCol: string
  guarantorPhoneCol: string
}

export function ImportClient({ staffList }: ImportClientProps) {
  const [importType, setImportType] = useState('customers')
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [excelData, setExcelData] = useState<any[]>([])
  
  const [mappings, setMappings] = useState<ColumnMappings>({
    nameCol: '',
    phoneCol: '',
    tankCol: '',
    debtCol: '',
    addressCol: '',
    guarantorCol: '',
    guarantorPhoneCol: ''
  })
  
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: boolean
    count: number
    skipped: number
    message?: string
  } | null>(null)
  
  const [skippedCustomersList, setSkippedCustomersList] = useState<any[]>([])
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')

  const { showToast } = useToast()

  // Handle Drag & Drop / File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    processFile(selectedFile)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const selectedFile = e.dataTransfer.files?.[0]
    if (!selectedFile) return
    processFile(selectedFile)
  }

  const processFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        // Convert to array of arrays (first row will be headers)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
        
        if (jsonData.length === 0) {
          showToast('The uploaded spreadsheet is empty.', 'error')
          return
        }

        // Find the maximum columns in any row to avoid missing columns if the first row has empty/merged cells
        const maxCols = Math.max(...jsonData.map(row => row.length), 0)

        // Get headers (first row) and fill in missing ones as "Column X"
        const rawHeaders = Array.from({ length: maxCols }, (_, index) => {
          const h = jsonData[0][index]
          return h ? String(h).trim() : `Column ${index + 1}`
        })
        setHeaders(rawHeaders)
        
        // Rows (excluding header)
        const rows = jsonData.slice(1).map(row => {
          const rowObj: Record<string, any> = {}
          rawHeaders.forEach((header, index) => {
            rowObj[header] = row[index] !== undefined && row[index] !== null ? row[index] : ''
          })
          return rowObj
        })
        
        setExcelData(rows)
        setFile(file)
        setImportResult(null)
        
        // Auto-detect mappings based on column header matching
        const newMappings = { ...mappings }
        rawHeaders.forEach(header => {
          const lower = header.toLowerCase()
          if (lower.includes('name') || lower.includes('customer') || lower.includes('magac') || lower.includes('fullname')) {
            newMappings.nameCol = header
          } else if (lower.includes('box') || lower.includes('tag') || lower.includes('tank') || lower.includes('meter') || lower.includes('lambarka') || lower.includes('id') || indexMatches(rawHeaders, header, 0)) {
            newMappings.tankCol = header
          } else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('tel') || lower.includes('number') || lower.includes('telefoon') || indexMatches(rawHeaders, header, 2)) {
            newMappings.phoneCol = header
          } else if (lower.includes('guarantor') || lower.includes('damiin') || indexMatches(rawHeaders, header, 3)) {
            newMappings.guarantorCol = header
          } else if (lower.includes('guarantor phone') || lower.includes('tel damiin') || indexMatches(rawHeaders, header, 4)) {
            newMappings.guarantorPhoneCol = header
          } else if (lower.includes('debt') || lower.includes('balance') || lower.includes('money') || lower.includes('deyn') || lower.includes('lacag')) {
            newMappings.debtCol = header
          } else if (lower.includes('address') || lower.includes('zone') || lower.includes('location')) {
            newMappings.addressCol = header
          }
        })
        
        // Fallbacks if not auto-detected
        if (!newMappings.tankCol && rawHeaders.length > 0) newMappings.tankCol = rawHeaders[0]
        if (!newMappings.nameCol && rawHeaders.length > 1) newMappings.nameCol = rawHeaders[1]
        if (!newMappings.phoneCol && rawHeaders.length > 2) newMappings.phoneCol = rawHeaders[2]
        if (!newMappings.guarantorCol && rawHeaders.length > 3) newMappings.guarantorCol = rawHeaders[3]
        if (!newMappings.guarantorPhoneCol && rawHeaders.length > 4) newMappings.guarantorPhoneCol = rawHeaders[4]

        setMappings(newMappings)
        showToast('Spreadsheet loaded and columns mapped successfully!', 'success')
      } catch (e) { const err = e as any;
        console.error(err)
        showToast('Failed to parse the file. Please ensure it is a valid Excel or CSV.', 'error')
      }
    }
    reader.readAsBinaryString(file)
  }

  const indexMatches = (headersList: string[], header: string, targetIdx: number) => {
    return headersList.indexOf(header) === targetIdx
  }

  // Handle dropdown mappings changes
  const handleMappingChange = (field: keyof ColumnMappings, value: string) => {
    setMappings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Preview helper: Get parsed preview row data
  const getMappedPreviewRows = () => {
    return excelData.slice(0, 5).map((row, idx) => {
      const name = mappings.nameCol ? String(row[mappings.nameCol] || '').trim() : ''
      const tank_number = mappings.tankCol ? String(row[mappings.tankCol] || '').trim() : ''
      const phone = mappings.phoneCol ? String(row[mappings.phoneCol] || '').trim() : ''
      const guarantor = mappings.guarantorCol ? String(row[mappings.guarantorCol] || '').trim() : ''
      const guarantor_phone = mappings.guarantorPhoneCol ? String(row[mappings.guarantorPhoneCol] || '').trim() : ''
      const debt = mappings.debtCol ? String(row[mappings.debtCol] || '').trim() : '0'
      const address = mappings.addressCol ? String(row[mappings.addressCol] || '').trim() : ''
      
      const isSkipped = !tank_number || !name

      return {
        id: idx,
        name,
        tank_number,
        phone,
        debt,
        guarantor,
        guarantor_phone,
        address,
        isSkipped
      }
    })
  }

  // Reset file upload
  const resetUpload = () => {
    setFile(null)
    setHeaders([])
    setExcelData([])
    setImportResult(null)
    setSkippedCustomersList([])
    setProgress(0)
    setProgressText('')
  }

  // Trigger Bulk Save
  const handleImportSubmit = async () => {
    if (!file) return
    if (!mappings.nameCol || !mappings.tankCol) {
      showToast('Customer Name and Box/Tag ID mappings are required.', 'error')
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setProgressText('Preparing records for batch import...')

    // 1. Separate skipped and valid rows and clean data
    const skippedList: any[] = []
    const validRowsToFormat: any[] = []

    excelData.forEach(row => {
      const name = mappings.nameCol ? String(row[mappings.nameCol] || '').trim() : ''
      const tank_number = mappings.tankCol ? String(row[mappings.tankCol] || '').trim() : ''
      
      let phone = mappings.phoneCol ? String(row[mappings.phoneCol] || '') : ''
      phone = phone.replace(/(damiin|dmn|damiiin)/gi, '').trim()
      
      let guarantor = mappings.guarantorCol ? String(row[mappings.guarantorCol] || '').trim() : ''
      let guarantor_phone = mappings.guarantorPhoneCol ? String(row[mappings.guarantorPhoneCol] || '') : ''
      guarantor_phone = guarantor_phone.replace(/(damiin|dmn|damiiin)/gi, '').trim()

      const debt = mappings.debtCol ? String(row[mappings.debtCol] || '').trim() : '0'
      const address = mappings.addressCol ? String(row[mappings.addressCol] || '').trim() : ''

      if (!name || !tank_number) {
        skippedList.push({
          name: name || '(Empty Name)',
          tank_number: tank_number || '(Empty Box ID)',
          phone,
          guarantor,
          guarantor_phone,
          debt,
          address
        })
      } else {
        // Format starting debt
        let debtAmount = 0
        const parsedDebt = parseFloat(debt.replace(/[^0-9.-]/g, ''))
        if (!isNaN(parsedDebt)) {
          debtAmount = parsedDebt
        }

        validRowsToFormat.push({
          staff_id: selectedStaffId || null,
          name,
          phone: phone || 'N/A',
          address: address || 'N/A',
          guarantor: guarantor || 'Self',
          guarantor_phone: guarantor_phone || (phone || 'N/A'),
          tank_number,
          customer_type: 'regular',
          status: 'active',
          debt: debtAmount,
          created_at: new Date().toISOString()
        })
      }
    })

    setSkippedCustomersList(skippedList)

    // 2. Loop insert in batches of 500 to prevent Vercel server timeouts
    const BATCH_SIZE = 500
    let importedCount = 0
    let hasError = false
    let errorMessage = ''

    try {
      for (let i = 0; i < validRowsToFormat.length; i += BATCH_SIZE) {
        const batch = validRowsToFormat.slice(i, i + BATCH_SIZE)
        
        const currentBatchNum = Math.floor(i / BATCH_SIZE) + 1
        const totalBatches = Math.ceil(validRowsToFormat.length / BATCH_SIZE)
        setProgressText(`Uploading segment ${currentBatchNum} of ${totalBatches}... (${importedCount.toLocaleString()} imported)`)
        setProgress(Math.round((i / validRowsToFormat.length) * 100))

        const batchRes = await importCustomerBatch(batch, selectedStaffId)
        
        if (!batchRes.success) {
          hasError = true
          errorMessage = batchRes.message || 'Batch insertion failed.'
          break
        }

        importedCount += batch.length
      }

      if (hasError) {
        throw new Error(errorMessage)
      }

      setProgress(100)
      setProgressText('All records successfully imported!')
      setImportResult({
        success: true,
        count: importedCount,
        skipped: skippedList.length
      })
      showToast(`Import completed! ${importedCount} customers added.`, 'success')
    } catch (err: any) {
      console.error(err)
      const errorText = err.message || 'A network error or Vercel gateway timeout occurred.'
      setImportResult({
        success: false,
        count: importedCount,
        skipped: skippedList.length,
        message: errorText
      })
      showToast(errorText, 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadSkippedCustomersCSV = () => {
    if (skippedCustomersList.length === 0) return
    
    // Create CSV header
    let csvContent = '\uFEFF' // UTF-8 BOM to prevent excel encoding issues
    csvContent += 'Customer Name,Box ID,Phone,Guarantor,Guarantor Phone,Starting Debt,Address\n'
    
    // Add rows
    skippedCustomersList.forEach(c => {
      const row = [
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${(c.tank_number || '').replace(/"/g, '""')}"`,
        `"${(c.phone || '').replace(/"/g, '""')}"`,
        `"${(c.guarantor || '').replace(/"/g, '""')}"`,
        `"${(c.guarantor_phone || '').replace(/"/g, '""')}"`,
        `"${(c.debt || '0').replace(/"/g, '""')}"`,
        `"${(c.address || '').replace(/"/g, '""')}"`
      ].join(',')
      csvContent += row + '\n'
    })
    
    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `skipped_customers_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      
      {/* 1. Selection & Header */}
      <div className="flex justify-between items-center mb-8 bg-white border border-[#e5e7eb] rounded-[20px] p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-black text-[#94a3b8] uppercase tracking-wider">Select Data Type</label>
          <select 
            value={importType} 
            onChange={(e) => setImportType(e.target.value)}
            className="h-10 px-4 pr-10 border border-[#e2e8f0] rounded-[10px] text-[14px] font-bold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white appearance-none cursor-pointer"
          >
            <option value="customers">Customers Registry (Active)</option>
            <option value="sales" disabled>Sales History (Coming Soon)</option>
            <option value="staff" disabled>Staff List (Coming Soon)</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2 bg-[#eff6ff] text-[#3b82f6] px-4 py-2 rounded-[10px] text-[13px] font-semibold">
          <HelpCircle size={16} />
          <span>Upload Excel (.xlsx) or CSV files</span>
        </div>
      </div>

      {/* 2. Drag and Drop Box */}
      {!file ? (
        <div 
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-[#cbd5e1] hover:border-[#3b82f6] rounded-[24px] bg-white p-12 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[300px] group shadow-sm"
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            accept=".xlsx,.xls,.csv" 
            onChange={handleFileChange} 
          />
          <div className="w-16 h-16 rounded-[20px] bg-gray-50 text-[#64748b] group-hover:bg-[#eff6ff] group-hover:text-[#3b82f6] flex items-center justify-center transition-all mb-4 border border-gray-100 shadow-sm">
            <Upload size={28} className="group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-[18px] font-extrabold text-[#0f172a] mb-1">Drag & Drop file here</h3>
          <p className="text-[14px] font-medium text-[#64748b] mb-4">or click to browse from your computer</p>
          <span className="text-[12px] font-black text-[#94a3b8] uppercase tracking-wider bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-[8px]">
            Supports Excel (.xlsx, .xls) and CSV
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          
          {/* Main Layout containing Column Mapping & Staff Assignment */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left side: file metadata and settings */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              
              {/* File Info */}
              <div className="bg-white border border-[#e5e7eb] rounded-[24px] p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-[14px] bg-[#eff6ff] text-[#3b82f6] flex items-center justify-center shrink-0">
                    <FileSpreadsheet size={24} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[14px] font-extrabold text-[#0f172a] truncate">{file.name}</span>
                    <span className="text-[12px] text-[#64748b] font-medium">{(file.size / 1024).toFixed(1)} KB • {excelData.length} rows found</span>
                  </div>
                </div>
                
                <button 
                  onClick={resetUpload}
                  className="w-full h-10 border border-[#e2e8f0] text-gray-500 hover:text-[#ef4444] hover:bg-red-50/50 hover:border-red-200 text-[13px] font-bold rounded-[10px] transition-colors"
                >
                  Remove File
                </button>
              </div>

              {/* Staff Assignment */}
              <div className="bg-white border border-[#e5e7eb] rounded-[24px] p-6 shadow-sm">
                <h3 className="text-[15px] font-extrabold text-[#0f172a] mb-2 flex items-center gap-2">
                  <ArrowRight size={16} className="text-[#3b82f6]" />
                  Staff Assignment
                </h3>
                <p className="text-[13px] font-medium text-[#64748b] mb-4">Select the staff member or driver who will be assigned to these imported customers.</p>
                
                <select 
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full h-12 px-4 border border-[#e2e8f0] rounded-[12px] text-[14px] font-bold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white cursor-pointer"
                >
                  <option value="">-- Leave Unassigned (None) --</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name} ({s.role.toUpperCase()})</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Right side: Column Mapping */}
            <div className="lg:col-span-2 bg-white border border-[#e5e7eb] rounded-[24px] p-6 shadow-sm flex flex-col">
              <h3 className="text-[16px] font-extrabold text-[#0f172a] mb-4 flex items-center gap-2">
                <Settings2 size={18} className="text-[#3b82f6]" />
                Map Spreadsheet Columns
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Name Column */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-extrabold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={mappings.nameCol}
                    onChange={(e) => handleMappingChange('nameCol', e.target.value)}
                    className="h-11 px-3 border border-[#e2e8f0] rounded-[10px] text-[13px] font-semibold text-[#0f172a] focus:outline-none"
                  >
                    <option value="">-- Do Not Import --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                {/* 2. Box ID Column */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-extrabold text-[#475569] uppercase tracking-wider flex items-center gap-1.5 text-blue-600">
                    Box ID / Tag ID <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={mappings.tankCol}
                    onChange={(e) => handleMappingChange('tankCol', e.target.value)}
                    className="h-11 px-3 border border-blue-200 bg-blue-50/10 rounded-[10px] text-[13px] font-semibold text-blue-600 focus:outline-none"
                  >
                    <option value="">-- Skip Empty --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                {/* 3. Phone Column */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-extrabold text-[#475569] uppercase tracking-wider">
                    Customer Phone
                  </label>
                  <select 
                    value={mappings.phoneCol}
                    onChange={(e) => handleMappingChange('phoneCol', e.target.value)}
                    className="h-11 px-3 border border-[#e2e8f0] rounded-[10px] text-[13px] font-semibold text-[#0f172a] focus:outline-none"
                  >
                    <option value="">-- Do Not Import --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                {/* 4. Debt Column */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-extrabold text-[#475569] uppercase tracking-wider">
                    Starting Debt / Balance
                  </label>
                  <select 
                    value={mappings.debtCol}
                    onChange={(e) => handleMappingChange('debtCol', e.target.value)}
                    className="h-11 px-3 border border-[#e2e8f0] rounded-[10px] text-[13px] font-semibold text-[#0f172a] focus:outline-none"
                  >
                    <option value="">-- Defaults to 0.00 --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                {/* 5. Address Column */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-extrabold text-[#475569] uppercase tracking-wider">
                    Address / Zone
                  </label>
                  <select 
                    value={mappings.addressCol}
                    onChange={(e) => handleMappingChange('addressCol', e.target.value)}
                    className="h-11 px-3 border border-[#e2e8f0] rounded-[10px] text-[13px] font-semibold text-[#0f172a] focus:outline-none"
                  >
                    <option value="">-- Defaults to N/A --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                {/* 6. Guarantor Column */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-extrabold text-[#475569] uppercase tracking-wider">
                    Guarantor Name
                  </label>
                  <select 
                    value={mappings.guarantorCol}
                    onChange={(e) => handleMappingChange('guarantorCol', e.target.value)}
                    className="h-11 px-3 border border-[#e2e8f0] rounded-[10px] text-[13px] font-semibold text-[#0f172a] focus:outline-none"
                  >
                    <option value="">-- Defaults to Self --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                {/* 7. Guarantor Phone */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-extrabold text-[#475569] uppercase tracking-wider">
                    Guarantor Phone
                  </label>
                  <select 
                    value={mappings.guarantorPhoneCol}
                    onChange={(e) => handleMappingChange('guarantorPhoneCol', e.target.value)}
                    className="h-11 px-3 border border-[#e2e8f0] rounded-[10px] text-[13px] font-semibold text-[#0f172a] focus:outline-none"
                  >
                    <option value="">-- Defaults to Customer Phone --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

              </div>

            </div>

          </div>

          {/* 3. Live Preview & Skip Rules Alert */}
          <div className="bg-white border border-[#e5e7eb] rounded-[24px] shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-gray-50 border-b border-[#e5e7eb] flex justify-between items-center">
              <div>
                <h3 className="text-[15px] font-extrabold text-[#0f172a] mb-0.5">Import Mapping Preview</h3>
                <p className="text-[12px] font-semibold text-gray-500">First 5 rows of mapped spreadsheet results</p>
              </div>
              <div className="flex items-center gap-2 text-[12px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-[6px]">
                <AlertTriangle size={14} />
                <span>Rows with missing Box IDs will be skipped</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100">Name</th>
                    <th className="px-6 py-3.5 text-[11px] font-black text-blue-600 uppercase tracking-wider border-b border-gray-100">Box ID</th>
                    <th className="px-6 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100">Phone</th>
                    <th className="px-6 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100">Guarantor</th>
                    <th className="px-6 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100">Address</th>
                    <th className="px-6 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100 text-right">Debt</th>
                    <th className="px-6 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {getMappedPreviewRows().map((row) => (
                    <tr 
                      key={row.id} 
                      className={`transition-colors ${
                        row.isSkipped 
                          ? 'bg-amber-50/40 hover:bg-amber-50/60' 
                          : 'hover:bg-gray-50/50'
                      }`}
                    >
                      <td className="px-6 py-3.5 text-[13px] font-bold text-gray-800 uppercase">{row.name || '(Empty Name)'}</td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold tracking-wider ${
                          row.tank_number 
                            ? 'bg-[#eff6ff] text-[#3b82f6] border border-[#dbeafe]' 
                            : 'bg-red-50 text-red-500 border border-red-100'
                        }`}>
                          {row.tank_number || 'MISSING'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-[13px] font-medium text-gray-500">{row.phone || 'N/A'}</td>
                      <td className="px-6 py-3.5 text-[13px] font-medium text-gray-500">
                        {row.guarantor ? `${row.guarantor} (${row.guarantor_phone || 'N/A'})` : 'Self'}
                      </td>
                      <td className="px-6 py-3.5 text-[13px] font-medium text-gray-500">{row.address || 'N/A'}</td>
                      <td className="px-6 py-3.5 text-[13px] font-extrabold text-right text-gray-800">${parseFloat(row.debt || '0').toFixed(2)}</td>
                      <td className="px-6 py-3.5 text-right">
                        {row.isSkipped ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-600 bg-amber-100/50 px-2 py-0.5 rounded border border-amber-200">
                            Skipped
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-[#10b981] bg-[#ecfdf5] px-2 py-0.5 rounded border border-[#a7f3d0]">
                            Ready
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Import Trigger & Results Summary */}
          <div className="flex flex-col gap-4">

            {isProcessing && (
              <div className="bg-white border border-blue-200 rounded-[24px] p-6 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-center text-[14px] font-extrabold text-[#0f172a]">
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-blue-600" />
                    Importing Records in Batches...
                  </span>
                  <span className="text-blue-600">{progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-[12px] font-medium text-[#64748b]">{progressText}</p>
              </div>
            )}
            
            {importResult && (
              <div className={`p-6 rounded-[24px] border flex flex-col gap-2 ${
                importResult.success 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center gap-3">
                  {importResult.success ? (
                    <CheckCircle2 className="text-emerald-500" size={24} />
                  ) : (
                    <AlertTriangle className="text-red-500" size={24} />
                  )}
                  <h4 className="text-[16px] font-extrabold">
                    {importResult.success ? 'Import Completed Successfully!' : 'Import Failed'}
                  </h4>
                </div>
                
                {importResult.success ? (
                  <div className="flex flex-col gap-3 pl-9">
                    <p className="text-[14px] font-medium">
                      Successfully loaded **{importResult.count.toLocaleString()}** customer accounts into your database. 
                      **{importResult.skipped.toLocaleString()}** rows were skipped due to missing Box IDs or empty fields.
                    </p>
                    {skippedCustomersList.length > 0 && (
                      <button
                        onClick={downloadSkippedCustomersCSV}
                        className="self-start mt-1 bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-300 font-bold px-4 py-2 rounded-[10px] text-[12px] flex items-center gap-1.5 transition-all shadow-sm active:scale-95 duration-200"
                      >
                        <FileSpreadsheet size={14} />
                        Download Skipped Rows ({skippedCustomersList.length.toLocaleString()})
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-[14px] font-medium pl-9">
                    {importResult.message || 'An error occurred while inserting data. Please check database logs.'}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-between items-center bg-white border border-[#e5e7eb] rounded-[24px] p-6 shadow-sm">
              <div className="flex flex-col">
                <span className="text-[14px] font-extrabold text-[#0f172a]">Ready to Import?</span>
                <span className="text-[12px] font-medium text-gray-500">This will insert valid customers into Supabase in batch segments.</span>
              </div>
              
              <button
                onClick={handleImportSubmit}
                disabled={isProcessing}
                className="bg-[#3b82f6] hover:bg-blue-600 disabled:bg-gray-200 text-white font-bold h-12 px-8 rounded-[12px] flex items-center gap-2 transition-all shadow-sm active:scale-95 duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet size={18} />
                    Import {excelData.length.toLocaleString()} Rows
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  )
}
