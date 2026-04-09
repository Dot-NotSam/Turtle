import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CommandCenter from './pages/CommandCenter.jsx'
import OutputConsole from './pages/OutputConsole.jsx'
import ToastContainer from './components/ToastContainer.jsx'

export default function App() {
  return (
    <>
    <ToastContainer />
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/command" element={<CommandCenter />} />
          <Route path="/output" element={<OutputConsole />} />
        </Routes>
      </Layout>
    </BrowserRouter>
    </>
  )
}
