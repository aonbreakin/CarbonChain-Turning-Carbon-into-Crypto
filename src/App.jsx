import { useState } from 'react';
//import reactLogo from './assets/react.svg';
//import viteLogo from '/vite.svg';
import './App.css';
import { Routes, Route, Link } from 'react-router-dom';
import Carbonchain from './components/carbonchain-dapp.tsx';
//import Carbonchain from './components/remixed-99c53481.tsx';


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      
	  
	  {}
      <Link to="/"></Link>
	  <Routes>
	  <Route path="/" element={<Carbonchain />} />
		{/* Catch-all route for 404 Not Found */}
			{/*<Route path="*" element={<NotFound />} />*/}
	</Routes>
	  
    </>
  )
}

export default App
