'use client'

import { useState } from 'react'
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
  X
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
  const [isOpen, setIsOpen] = useState(false)

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

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="outline"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white transition-transform duration-300 z-40',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold">STRESS TEMPO</h2>
          <p className="text-sm text-gray-400 mt-1">Hi, {userName}</p>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-700 text-gray-300'
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
          <Button
            variant="outline"
            className="w-full bg-transparent border-gray-600 text-white hover:bg-red-600 hover:border-red-600 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut size={20} className="mr-2" />
            Log Out
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}