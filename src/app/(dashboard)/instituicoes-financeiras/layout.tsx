import InstituicoesFinanceirasSidebar from './_components/InstituicoesFinanceirasSidebar'

export default function InstituicoesFinanceirasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rh-layout-container">
      <InstituicoesFinanceirasSidebar />
      <div className="rh-content">{children}</div>
    </div>
  )
}
