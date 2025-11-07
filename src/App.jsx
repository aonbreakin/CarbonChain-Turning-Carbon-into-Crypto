import { useState } from 'react';
//import reactLogo from './assets/react.svg';
//import viteLogo from '/vite.svg';
import './App.css';
import { Routes, Route, Link } from 'react-router-dom';
import Carbonchain from './components/carbonchain-dapp';
//import ConnectWalletAdvanced from './components/ConnectWalletAdvanced.tsx';

function App() {
  /*const [count, setCount] = useState(0)*/
  const [connected, setConnected] = useState(false);
  return (
    <>
	<Carbonchain  />
	{/*!connected? (<Carbonchain />):(<ConnectWalletAdvanced  />)*/}
      {/*<Link to="/"></Link>
	  
	  <Routes>
	  <Route path="/" element={<ConnectWalletAdvanced />} />
		<Route path="/carbonchain-dapp" element={<Carbonchain />} />*/}
	  
		{/* Catch-all route for 404 Not Found */}
			{/*<Route path="*" element={<NotFound />} />*/}
			
			{/*</Routes>*/}
	  
    </>
  )
}

export default App
