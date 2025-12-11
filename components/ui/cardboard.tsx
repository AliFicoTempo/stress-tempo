import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Calendar, 
  Briefcase, 
  Users, 
  Package, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

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
      case "Total DP": return "bg-gradient-to-br from-indigo-500 to-indigo-600"
      case "Total Terkirim": return "bg-gradient-to-br from-emerald-500 to-emerald-600"
      case "Total Gagal": return "bg-gradient-to-br from-rose-500 to-rose-600"
      default: return "bg-gradient-to-br from-gray-500 to-gray-600"
    }
  }

  const getIcon = () => {
    switch(title) {
      case "HK": return <Calendar className="h-5 w-5" />
      case "HKE": return <Briefcase className="h-5 w-5" />
      case "HKNE": return <Users className="h-5 w-5" />
      case "Total DP": return <Package className="h-5 w-5" />
      case "Total Terkirim": return <CheckCircle className="h-5 w-5" />
      case "Total Gagal": return <XCircle className="h-5 w-5" />
      default: return null
    }
  }

  const formatValue = () => {
    if (title.includes("Total")) {
      return value.toLocaleString('id-ID')
    }
    return value
  }

  return (
    <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className={`${getGradientClass()} p-6 text-white`}>
        <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          <div className="opacity-90">
            {getIcon()}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-3xl font-bold mb-2">{formatValue()}</div>
          <p className="text-sm opacity-90">{description}</p>
          
          {/* 🆕 Trend indicator untuk metrics total */}
          {title.includes("Total") && value > 0 && (
            <div className="flex items-center mt-3 text-xs opacity-80">
              {title === "Total Gagal" ? (
                <TrendingDown className="h-3 w-3 mr-1" />
              ) : (
                <TrendingUp className="h-3 w-3 mr-1" />
              )}
              <span>Total keseluruhan</span>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  )
}