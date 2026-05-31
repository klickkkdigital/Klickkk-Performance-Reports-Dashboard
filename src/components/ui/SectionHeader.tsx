type Props = {
  title: string
  description?: string
  action?: React.ReactNode
}

export default function SectionHeader({ title, description, action }: Props) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  )
}
