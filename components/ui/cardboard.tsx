import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CardboardProps {
  title: string
  value: number
  description: string
}

export default function Cardboard({ title, value, description }: CardboardProps) {
  const getGradientClass = () => {
    switch(title) {
      case "HK": return "bg-gradient-to-br from-blue-500 to-blue-600"
      case "HKE": return "bg-gradient-to-br from-green-500 to-green-600"
      case "HKNE": return "bg-gradient-to-br from-amber-500 to-amber-600"
      default: return "bg-gradient-to-br from-gray-500 to-gray-600"
    }
  }

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <div className={`${getGradientClass()} p-6 text-white`}>
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-4xl font-bold mb-2">{value}</div>
          <p className="text-sm opacity-90">{description}</p>
        </CardContent>
      </div>
    </Card>
  )
}