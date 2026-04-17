// Role-based permission system
export const ROLE_PERMISSIONS = {
  admin: {
    canAccessAdminUsers: true,
    canAccessAdminBooking: true,
    canAccessAdminRevenue: true,
    canAccessAdminRooms: true,
    canAccessAdminHome: true,
    canAccessAdminZipline: true,
    canDeleteUsers: true
  },
  moderator: {
    canAccessAdminUsers: false,
    canAccessAdminBooking: true,
    canAccessAdminRevenue: true,
    canAccessAdminRooms: true,
    canAccessAdminHome: false,
    canAccessAdminZipline: false,
    canDeleteUsers: false
  },
  customer: {
    canAccessAdminUsers: false,
    canAccessAdminBooking: false,
    canAccessAdminRevenue: false,
    canAccessAdminRooms: false,
    canAccessAdminHome: false,
    canAccessAdminZipline: false,
    canDeleteUsers: false
  }
}

export const hasPermission = (userRole, permission) => {
  const role = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.customer
  return role[permission] === true
}

export const canAccessPage = (userRole, page) => {
  const permissionMap = {
    'admin-users': 'canAccessAdminUsers',
    'admin-booking': 'canAccessAdminBooking',
    'admin-revenue': 'canAccessAdminRevenue',
    'admin-rooms': 'canAccessAdminRooms',
    'admin-home': 'canAccessAdminHome',
    'admin-zipline': 'canAccessAdminZipline'
  }
  
  const permission = permissionMap[page]
  return permission ? hasPermission(userRole, permission) : false
}

export const canDelete = (userRole) => {
  return hasPermission(userRole, 'canDeleteUsers')
}
