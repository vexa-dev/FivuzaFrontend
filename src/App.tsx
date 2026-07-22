import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './features/core/AuthContext'
import { CorePage } from './features/core/CorePage'
import { LoginPage } from './features/core/LoginPage'
import { ProtectedRoute } from './features/core/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<CorePage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
