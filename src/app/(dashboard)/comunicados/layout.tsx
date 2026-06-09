import Sidebar from '@/components/layout/Sidebar'

export default function ComunicadosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rh-layout-container">
      <Sidebar />
      <div className="rh-content">
        {children}
      </div>
    </div>
  )
}
