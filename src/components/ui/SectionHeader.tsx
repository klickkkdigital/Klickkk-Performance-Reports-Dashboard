type Props = {
  title: string
  description?: string
  action?: React.ReactNode
}

export default function SectionHeader({ title, description, action }: Props) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-default-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}
