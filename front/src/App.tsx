import { useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'

import Home from './pages/Home'
import Game from './pages/Game'
import Signin from './pages/Signin'
import Signup from './pages/Signup'
import SignupFT from './pages/Signup42'
import TwoFA from './pages/twoFA'
import Error from './pages/Error'
import NotFound from './pages/NotFound'

import AuthContext from './contexts/AuthContext'

function App() {

	const localToken = localStorage.getItem("access_token")
	const [token, setToken] = useState<string>(localToken ? localToken : '')
	const url = "https://api.pongue.ilandols.com"

	return (
		<AuthContext.Provider value={{ token, setToken, url }}>
			<Router>
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/signin" element={<Signin />} />
					<Route path="/signup" element={<Signup />} />
					<Route path="/signup42" element={<SignupFT />} />
					<Route path="/twofa" element={<TwoFA />} />
					<Route path="/game" element={<Game />} />
					<Route path="/error" element={<Error />} />
					<Route path="*" element={<NotFound />} />
				</Routes>
			</Router>
		</AuthContext.Provider>
	)
}

export default App