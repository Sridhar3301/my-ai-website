import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import MentalHealth from "./pages/MentalHealth";
import Fitness from "./pages/Fitness";
import Medication from "./pages/Medication";
import Advisor from "./pages/Advisor";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/mental-health" element={<MentalHealth />} />
          <Route path="/fitness" element={<Fitness />} />
          <Route path="/medication" element={<Medication />} />
          <Route path="/advisor" element={<Advisor />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Layout>
    </Router>
  );
}
