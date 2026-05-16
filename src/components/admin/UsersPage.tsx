'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  UserCheck,
  UserPlus,
  Crown,
  Search,
  MoreHorizontal,
  Shield,
  Ban,
  Mail,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SimUser {
  id: string
  username: string
  email: string
  role: 'admin' | 'user'
  joinedDate: string
  status: 'active' | 'inactive'
  avatar: string
}

const simulatedUsers: SimUser[] = [
  { id: '1', username: 'streammaster', email: 'streammaster@xtube.io', role: 'admin', joinedDate: '2024-01-15', status: 'active', avatar: 'S' },
  { id: '2', username: 'videofan42', email: 'videofan42@gmail.com', role: 'user', joinedDate: '2024-02-20', status: 'active', avatar: 'V' },
  { id: '3', username: 'nightwatcher', email: 'nightwatcher@outlook.com', role: 'user', joinedDate: '2024-03-10', status: 'active', avatar: 'N' },
  { id: '4', username: 'cinemalover', email: 'cinemalover@yahoo.com', role: 'user', joinedDate: '2024-03-22', status: 'inactive', avatar: 'C' },
  { id: '5', username: 'binge_king', email: 'binge_king@proton.me', role: 'user', joinedDate: '2024-04-05', status: 'active', avatar: 'B' },
  { id: '6', username: 'admin_sarah', email: 'sarah@xtube.io', role: 'admin', joinedDate: '2024-01-02', status: 'active', avatar: 'A' },
  { id: '7', username: 'moviebuff99', email: 'moviebuff99@gmail.com', role: 'user', joinedDate: '2024-05-18', status: 'active', avatar: 'M' },
  { id: '8', username: 'chillstream', email: 'chillstream@live.com', role: 'user', joinedDate: '2024-06-01', status: 'inactive', avatar: 'C' },
  { id: '9', username: 'premiumpete', email: 'pete@xtube.io', role: 'user', joinedDate: '2024-06-15', status: 'active', avatar: 'P' },
  { id: '10', username: 'dailywatcher', email: 'dailywatcher@gmail.com', role: 'user', joinedDate: '2024-07-03', status: 'active', avatar: 'D' },
  { id: '11', username: 'techguru', email: 'techguru@outlook.com', role: 'user', joinedDate: '2024-07-20', status: 'active', avatar: 'T' },
  { id: '12', username: 'streamqueen', email: 'streamqueen@icloud.com', role: 'user', joinedDate: '2024-08-11', status: 'inactive', avatar: 'S' },
  { id: '13', username: 'filmcritic', email: 'filmcritic@proton.me', role: 'user', joinedDate: '2024-09-05', status: 'active', avatar: 'F' },
  { id: '14', username: 'admin_mike', email: 'mike@xtube.io', role: 'admin', joinedDate: '2024-01-10', status: 'active', avatar: 'M' },
  { id: '15', username: 'newbie2024', email: 'newbie2024@gmail.com', role: 'user', joinedDate: '2024-11-28', status: 'active', avatar: 'N' },
]

const avatarColors = [
  'bg-xtube-red',
  'bg-blue-600',
  'bg-green-600',
  'bg-purple-600',
  'bg-amber-600',
  'bg-cyan-600',
  'bg-pink-600',
  'bg-indigo-600',
]

function getAvatarColor(letter: string): string {
  const index = letter.charCodeAt(0) % avatarColors.length
  return avatarColors[index]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredUsers = simulatedUsers.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const activeToday = simulatedUsers.filter((u) => u.status === 'active').length
  const newThisWeek = 3
  const premiumUsers = simulatedUsers.filter((u) => u.role === 'admin').length

  const stats = [
    { title: 'Total Users', value: simulatedUsers.length.toString(), icon: Users, color: 'text-xtube-red' },
    { title: 'Active Today', value: activeToday.toString(), icon: UserCheck, color: 'text-green-400' },
    { title: 'New This Week', value: newThisWeek.toString(), icon: UserPlus, color: 'text-blue-400' },
    { title: 'Premium Users', value: premiumUsers.toString(), icon: Crown, color: 'text-amber-400' },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="group rounded-xl border border-white/5 bg-[#0f0f0f]/80 backdrop-blur-xl p-4 md:p-6 transition-colors hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)]"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-xtube-text-secondary">{stat.title}</p>
                <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-xtube-red/10">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Users Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-white/5 bg-[#0f0f0f]/80 backdrop-blur-xl p-4 md:p-6 hover:border-xtube-red/20 hover:shadow-[0_0_15px_rgba(229,9,20,0.1)] transition-colors"
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-white">Users</h3>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-xtube-text-secondary" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-xtube-border bg-xtube-bg text-white placeholder:text-xtube-text-secondary pl-9 h-9 w-full sm:w-[200px]"
              />
            </div>
            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="border-xtube-border bg-xtube-bg text-white h-9 w-full sm:w-[130px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent className="border-xtube-border bg-xtube-card text-white">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-xtube-border bg-xtube-bg text-white h-9 w-full sm:w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="border-xtube-border bg-xtube-card text-white">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-xtube-border hover:bg-transparent">
                <TableHead className="text-xtube-text-secondary">User</TableHead>
                <TableHead className="text-xtube-text-secondary">Email</TableHead>
                <TableHead className="text-xtube-text-secondary">Role</TableHead>
                <TableHead className="text-xtube-text-secondary hidden sm:table-cell">Joined</TableHead>
                <TableHead className="text-xtube-text-secondary">Status</TableHead>
                <TableHead className="text-xtube-text-secondary text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user, idx) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.03, duration: 0.3 }}
                  className="border-xtube-border hover:bg-white/[0.02] transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${getAvatarColor(user.avatar)}`}>
                        {user.avatar}
                      </div>
                      <span className="font-medium text-white">{user.username}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xtube-text-secondary">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === 'admin' ? 'default' : 'secondary'}
                      className={
                        user.role === 'admin'
                          ? 'bg-xtube-red/20 text-xtube-red hover:bg-xtube-red/30 border-0 text-xs'
                          : 'bg-white/5 text-xtube-text-secondary hover:bg-white/10 border-0 text-xs'
                      }
                    >
                      {user.role === 'admin' ? (
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3" /> Admin
                        </span>
                      ) : (
                        'User'
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xtube-text-secondary hidden sm:table-cell">
                    {formatDate(user.joinedDate)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        user.status === 'active'
                          ? 'border-green-500/30 bg-green-500/10 text-green-400 text-xs'
                          : 'border-red-500/30 bg-red-500/10 text-red-400 text-xs'
                      }
                    >
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xtube-text-secondary hover:text-white hover:bg-white/10 text-xs"
                      >
                        <Shield className="h-3.5 w-3.5 mr-1" />
                        <span className="hidden md:inline">Edit Role</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xtube-text-secondary hover:text-red-400 hover:bg-red-500/10 text-xs"
                      >
                        <Ban className="h-3.5 w-3.5 mr-1" />
                        <span className="hidden md:inline">Suspend</span>
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="mb-3 h-10 w-10 text-xtube-text-secondary/50" />
            <p className="text-sm text-xtube-text-secondary">No users match your filters</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
