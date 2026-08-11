/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import AppLayout from './components/AppLayout';
import Login from './screens/Login';
import ForgotPassword from './screens/auth/ForgotPassword';
import BiometricSetup from './screens/auth/BiometricSetup';
import Dashboard from './screens/Dashboard';
import Attendance from './screens/Attendance';
import Schedule from './screens/Schedule';
import Requests from './screens/Requests';
import Profile from './screens/Profile';
import Notifications from './screens/Notifications';
import Payslip from './screens/Payslip';

import Timesheet from './screens/Timesheet';

export default function App() {
  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/setup-biometric" element={<BiometricSetup />} />
            <Route path="/notifications" element={<Notifications />} />
            
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="timesheet" element={<Timesheet />} />
              <Route path="requests" element={<Requests />} />
              <Route path="payslip" element={<Payslip />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </div>
  );
}
