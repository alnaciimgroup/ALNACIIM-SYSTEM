import { Header } from '@/components/layout/header'
import { getDebtorsList } from './actions'
import { DebtorsList } from '@/components/accountant/debtors-list'

export default async function DebtorsPage() {
  const debtors = await getDebtorsList()

  return (
    <div className="flex flex-col h-full overflow-hidden w-full bg-[#f8fafc]">
      <Header title="Debtors List" />
      <main className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
        <DebtorsList debtors={debtors} />
      </main>
    </div>
  )
}
