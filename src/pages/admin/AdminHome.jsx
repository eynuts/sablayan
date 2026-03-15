import { useState, useEffect } from 'react'
import './AdminHome.css'

const AdminHome = () => {
  // Placeholder data for the dashboard
  const stats = [
    { id: 1, label: 'Total Bookings', value: '128', icon: 'fa-calendar-check', color: '#d94e28', trend: '+12% from last month' },
    { id: 2, label: 'Monthly Revenue', value: '₱145,200', icon: 'fa-peso-sign', color: '#22c55e', trend: '+8% from last month' },
    { id: 3, label: 'Active Users', value: '1,240', icon: 'fa-users', color: '#a8d5ba', trend: '+5% from last month' },
    { id: 4, label: 'Room Occupancy', value: '85%', icon: 'fa-bed', color: '#122b36', trend: 'High demand' },
  ]

  const recentActivity = [
    { id: 1, user: 'John Doe', action: 'booked', target: 'MARIA (Large Duplex)', time: '2 hours ago', status: 'confirmed' },
    { id: 2, user: 'Jane Smith', action: 'cancelled', target: 'ELVIRA (Standard Room)', time: '5 hours ago', status: 'cancelled' },
    { id: 3, user: 'Michael Garcia', action: 'paid', target: 'Deposit for CARMEN House', time: 'Yesterday', status: 'paid' },
    { id: 4, user: 'Sarah Johnson', action: 'registered', target: 'New Account', time: '2 days ago', status: 'new' },
  ]

  return (
    <div className="admin-home-container">
      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.id} className="stat-card">
            <div className="stat-header">
              <div className="stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                <i className={`fas ${stat.icon}`}></i>
              </div>
              <span className="stat-trend">{stat.trend}</span>
            </div>
            <div className="stat-body">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-main-grid">
        {/* Revenue Overview Chart Placeholder */}
        <div className="admin-card chart-card">
          <div className="card-header">
            <h3>Revenue Overview</h3>
            <select className="chart-filter">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="chart-placeholder">
            <div className="placeholder-bars">
              <div className="bar" style={{ height: '40%' }}></div>
              <div className="bar" style={{ height: '70%' }}></div>
              <div className="bar" style={{ height: '55%' }}></div>
              <div className="bar" style={{ height: '90%' }}></div>
              <div className="bar" style={{ height: '65%' }}></div>
              <div className="bar" style={{ height: '80%' }}></div>
              <div className="bar" style={{ height: '45%' }}></div>
            </div>
            <div className="chart-labels">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="admin-card activity-card">
          <div className="card-header">
            <h3>Recent Activity</h3>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="activity-list">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className={`activity-status-dot ${activity.status}`}></div>
                <div className="activity-content">
                  <p><strong>{activity.user}</strong> {activity.action} <span>{activity.target}</span></p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="admin-card quick-actions-card">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="quick-action-btn">
            <i className="fas fa-plus"></i>
            <span>New Booking</span>
          </button>
          <button className="quick-action-btn">
            <i className="fas fa-user-plus"></i>
            <span>Add User</span>
          </button>
          <button className="quick-action-btn">
            <i className="fas fa-file-export"></i>
            <span>Export Report</span>
          </button>
          <button className="quick-action-btn">
            <i className="fas fa-tools"></i>
            <span>Maintenance</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminHome
