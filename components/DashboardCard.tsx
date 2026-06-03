// components/DashboardCard.tsx
import React from 'react'

interface DashboardCardProps {
  title: string
  children: React.ReactNode
  className?: string
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`rounded-xl border border-border/50 bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
      <h3 className="text-lg font-semibold tracking-tight text-primary">{title}</h3>
      <div className="mt-4 text-foreground/90">{children}</div>
    </div>
  )
}

export default DashboardCard