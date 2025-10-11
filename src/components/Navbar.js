import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => (
  <nav className="navbar">
    <h2>CarbonChain</h2>
    <ul>
      <li><Link to="/">Home</Link></li>
      <li><Link to="/sensors">Sensors</Link></li>
      <li><Link to="/rewards">Rewards</Link></li>
    </ul>
  </nav>
);

export default Navbar;