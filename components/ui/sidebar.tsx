"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Home, 
  User, 
  FileText, 
  BarChart3, 
  Truck, 
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface SidebarProps {
  userRole: 'admin' | 'regular'
  userName: string
}

export default function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Handle scroll untuk mobile
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const adminItems = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    { href: '/admin/profile', label: 'Profile', icon: User },
    { href: '/admin/rekap', label: 'Rekap', icon: FileText },
    { href: '/admin/performa-driver', label: 'Performa Driver', icon: BarChart3 },
    { href: '/admin/shipment-all-driver', label: 'Shipment All Driver', icon: Truck },
  ]

  const regularItems = [
    { href: '/regular', label: 'Dashboard', icon: Home },
    { href: '/regular/profile', label: 'Profile', icon: User },
  ]

  const navItems = userRole === 'admin' ? adminItems : regularItems

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        toast({
          title: 'Logout Berhasil',
          description: 'Anda telah keluar dari sistem',
        })
        router.push('/login')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal logout',
        variant: 'destructive',
      })
    }
  }

  const sidebarWidth = isCollapsed ? 'w-16' : 'w-64'
  const mobileTopPosition = isScrolled ? 'top-4' : 'top-6'

  return (
    <>
      {/* Mobile Menu Button - HANYA DI MOBILE */}
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "lg:hidden fixed right-4 z-50",
          mobileTopPosition,
          "bg-white shadow-md"
        )}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {/* Desktop Toggle Button - HANYA DI DESKTOP */}
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "hidden lg:flex fixed right-4 top-6 z-50",
          "bg-white shadow-md hover:bg-gray-50",
          isCollapsed ? "right-16" : "right-64"
        )}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </Button>

      {/* Sidebar - SISI KANAN */}
      <aside
        className={cn(
          'fixed right-0 top-0 h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 z-40',
          sidebarWidth,
          'lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}
      >
        {/* Sidebar Header */}
        <div className={cn(
          "p-6 border-b border-gray-700 flex items-center justify-between",
          isCollapsed && "flex-col justify-center p-4"
        )}>
          {!isCollapsed ? (
            <>
              <div>
                <h2 className="text-xl font-bold">STRESS TEMPO</h2>
                <p className="text-sm text-gray-400 mt-1">Hi, {userName}</p>
              </div>
              {/* Remove duplicate toggle button inside sidebar for desktop */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(true)}
                className="text-gray-400 hover:text-white hover:bg-gray-700 lg:hidden"
              >
                <ChevronRight size={20} />
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center">
              <div className="text-lg font-bold mb-1">ST</div>
              {/* Remove duplicate toggle button inside sidebar for desktop */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(false)}
                className="text-gray-400 hover:text-white hover:bg-gray-700 mt-2 lg:hidden"
              >
                <ChevronLeft size={20} />
              </Button>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className={cn("p-4", isCollapsed && "p-2")}>
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center rounded-lg transition-colors',
                      isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3',
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-700 text-gray-300'
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                    title={isCollapsed ? item.label : ''}
                  >
                    <Icon size={20} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className={cn(
          "absolute bottom-0 w-full border-t border-gray-700",
          isCollapsed ? "p-2" : "p-4"
        )}>
          <Button
            variant="outline"
            className={cn(
              "w-full bg-transparent border-gray-600 text-white hover:bg-red-600 hover:border-red-600 hover:text-white",
              isCollapsed && "justify-center p-2"
            )}
            onClick={handleLogout}
            title={isCollapsed ? "Logout" : ""}
          >
            <LogOut size={20} className={cn(isCollapsed ? "" : "mr-2")} />
            {!isCollapsed && "Log Out"}
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main content margin adjustment */}
      <style jsx>{`
        main {
          margin-right: ${isCollapsed ? '4rem' : '16rem'};
          transition: margin-right 0.3s ease;
        }
        
        @media (max-width: 1024px) {
          main {
            margin-right: 0;
          }
        }
      `}</style>
    </>
  )
}