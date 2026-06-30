import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Lobby from './pages/Lobby'
import SoloMode from './pages/SoloMode'
import DebateRoom from './pages/DebateRoom'
import Leaderboard from './pages/Leaderboard'
import Replay from './pages/Replay'
import Profile from './pages/Profile'
import ProtectedRoute from './components/shared/ProtectedRoute'

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
        <Route path="/lobby" element={
          <ProtectedRoute><Lobby /></ProtectedRoute>
        } />
        <Route path="/solo" element={
          <ProtectedRoute><SoloMode /></ProtectedRoute>
        } />
        <Route path="/arena/:id" element={
          <ProtectedRoute><DebateRoom /></ProtectedRoute>
        } />
        <Route path="/leaderboard" element={
          <ProtectedRoute><Leaderboard /></ProtectedRoute>
        } />
        <Route path="/replay/:id" element={
          <ProtectedRoute><Replay /></ProtectedRoute>
        } />
        <Route path="/profile/:username" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />

        {/* Default */}
        <Route path="*" element={<Navigate to="/lobby" replace />} />
      </Routes>
    </Router>
  )
}
