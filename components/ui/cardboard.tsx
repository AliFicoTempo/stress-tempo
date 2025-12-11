import { Card, CardContent } from "@/components/ui/card"
import { 
  Calendar, 
  Briefcase, 
  Users, 
  Package, 
  CheckCircle, 
  XCircle,
  ArrowUp,
  ArrowDown,
  Target,
  BarChart3
} from 'lucide-react'
import { cn } from "@/lib/utils"

interface CardboardProps {
  title: string
  value: number
  description: string
  trend?: number
  className?: string
}

export default function Cardboard({ title, value, description, trend, className }: CardboardProps) {
  // Mobile-optimized design dengan inspirasi dari Apple Design & Material Design
  const getCardConfig = () => {
    const configs = {
      "HK": {
        gradient: "from-blue-500/10 to-blue-600/5",
        border: "border-blue-200",
        iconBg: "bg-blue-500/20",
        icon: <Calendar className="h-5 w-5 text-blue-600" />,
        textColor: "text-blue-700",
        valueColor: "text-blue-900",
        accent: "bg-blue-500",
        trendIcon: <ArrowUp className="h-3 w-3" />,
        trendColor: "text-blue-600"
      },
      "HKE": {
        gradient: "from-emerald-500/10 to-emerald-600/5",
        border: "border-emerald-200",
        iconBg: "bg-emerald-500/20",
        icon: <Briefcase className="h-5 w-5 text-emerald-600" />,
        textColor: "text-emerald-700",
        valueColor: "text-emerald-900",
        accent: "bg-emerald-500",
        trendIcon: <Target className="h-3 w-3" />,
        trendColor: "text-emerald-600"
      },
      "HKNE": {
        gradient: "from-amber-500/10 to-amber-600/5",
        border: "border-amber-200",
        iconBg: "bg-amber-500/20",
        icon: <Users className="h-5 w-5 text-amber-600" />,
        textColor: "text-amber-700",
        valueColor: "text-amber-900",
        accent: "bg-amber-500",
        trendIcon: <BarChart3 className="h-3 w-3" />,
        trendColor: "text-amber-600"
      },
      "Total DP": {
        gradient: "from-indigo-500/10 to-indigo-600/5",
        border: "border-indigo-200",
        iconBg: "bg-indigo-500/20",
        icon: <Package className="h-5 w-5 text-indigo-600" />,
        textColor: "text-indigo-700",
        valueColor: "text-indigo-900",
        accent: "bg-indigo-500",
        trendIcon: <ArrowUp className="h-3 w-3" />,
        trendColor: "text-indigo-600"
      },
      "Total Terkirim": {
        gradient: "from-green-500/10 to-green-600/5",
        border: "border-green-200",
        iconBg: "bg-green-500/20",
        icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        textColor: "text-green-700",
        valueColor: "text-green-900",
        accent: "bg-green-500",
        trendIcon: <ArrowUp className="h-3 w-3" />,
        trendColor: "text-green-600"
      },
      "Total Gagal": {
        gradient: "from-rose-500/10 to-rose-600/5",
        border: "border-rose-200",
        iconBg: "bg-rose-500/20",
        icon: <XCircle className="h-5 w-5 text-rose-600" />,
        textColor: "text-rose-700",
        valueColor: "text-rose-900",
        accent: "bg-rose-500",
        trendIcon: <ArrowDown className="h-3 w-3" />,
        trendColor: "text-rose-600"
      }
    }
    
    return configs[title as keyof typeof configs] || configs["HK"]
  }

  const config = getCardConfig()
  const formattedValue = title.includes("Total") 
    ? value.toLocaleString('id-ID')
    : value.toString()

  // Hitung height responsif berdasarkan content
  const getHeightClass = () => {
    return "min-h-[120px] sm:min-h-[140px]" // Optimal untuk mobile
  }

  return (
    <Card className={cn(
      "group relative overflow-hidden",
      "border transition-all duration-300",
      "hover:shadow-lg hover:-translate-y-1",
      "active:scale-[0.98] active:shadow-md", // Feedback touch
      config.border,
      getHeightClass(),
      className
    )}>
      {/* Subtle gradient background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br",
        config.gradient,
        "opacity-50 group-hover:opacity-70 transition-opacity"
      )} />
      
      {/* Accent bar */}
      <div className={cn(
        "absolute top-0 left-0 w-1 h-full",
        config.accent,
        "opacity-0 group-hover:opacity-100 transition-opacity"
      )} />
      
      <CardContent className="relative p-4 sm:p-5 h-full flex flex-col">
        {/* Header dengan icon dan title */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-xl",
              config.iconBg,
              "transition-transform group-hover:scale-110"
            )}>
              {config.icon}
            </div>
            <div>
              <h3 className={cn(
                "text-sm font-semibold tracking-tight",
                config.textColor
              )}>
                {title}
              </h3>
              {trend !== undefined && (
                <div className="flex items-center gap-1 mt-1">
                  <span className={cn(
                    "text-xs font-medium flex items-center",
                    config.trendColor
                  )}>
                    {config.trendIcon}
                    <span className="ml-1">{trend > 0 ? '+' : ''}{trend}%</span>
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Badge untuk metrics khusus */}
          {!title.includes("Total") && (
            <span className={cn(
              "px-2 py-1 rounded-lg text-xs font-bold",
              config.iconBg,
              config.textColor
            )}>
              {title}
            </span>
          )}
        </div>
        
        {/* Main Value - Fokus utama */}
        <div className="mt-auto">
          <div className={cn(
            "text-2xl sm:text-3xl font-bold mb-1",
            config.valueColor,
            "transition-transform group-hover:scale-105"
          )}>
            {formattedValue}
          </div>
          
          {/* Description dengan typography yang jelas */}
          <p className={cn(
            "text-xs sm:text-sm font-medium",
            "text-gray-600 group-hover:text-gray-800",
            "transition-colors"
          )}>
            {description}
          </p>
          
          {/* Progress indicator untuk Total metrics */}
          {title.includes("Total") && value > 0 && (
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-500">Progress</span>
                <span className={cn(
                  "text-xs font-bold",
                  config.textColor
                )}>
                  {title === "Total Gagal" ? "Monitor" : "Active"}
                </span>
              </div>
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full", config.iconBg)}
                  style={{ 
                    width: title === "Total Gagal" 
                      ? `${Math.min(value / 100, 100)}%` 
                      : `${Math.min(value / 1000, 100)}%` 
                  }}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Corner accent - detail design */}
        <div className={cn(
          "absolute bottom-0 right-0 w-12 h-12",
          "opacity-5 group-hover:opacity-10",
          "transition-opacity rounded-tl-full",
          config.iconBg
        )} />
      </CardContent>
    </Card>
  )
}