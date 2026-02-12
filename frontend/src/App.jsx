import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DailyView from './pages/DailyView';
import ClientList from './pages/ClientList';
import TemplateList from './pages/TemplateList';
import WeeklySchedule from './pages/WeeklySchedule';
import Expenses from './pages/Expenses';

// Placeholder components to allow build
function Placeholder({ title }) {
  return <div className="p-4"><h1 className="text-2xl font-bold text-white">{title}</h1></div>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DailyView />} />
          <Route path="clients" element={<ClientList />} />
          <Route path="templates" element={<TemplateList />} />
          <Route path="schedule" element={<WeeklySchedule />} />
          <Route path="expenses" element={<Expenses />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
