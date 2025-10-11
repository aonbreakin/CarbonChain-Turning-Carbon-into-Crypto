import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Sensors from './pages/Sensors';
import Rewards from './pages/Rewards';
import './styles.css';

function App() {
  return (
    <Router>
      <Navbar />
      <div className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sensors" element={<Sensors />} />
          <Route path="/rewards" element={<Rewards />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;