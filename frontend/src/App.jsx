
import React from 'react'
import {Route, BrowserRouter as Router, Routes} from 'react-router-dom';
import Landing from './pages/Landing';
import Authentication from './pages/authentication';
import { AuthProvider } from './contexts/AuthContext';
import VideoMeetComponent from './pages/VideoMeet';
import HomeComponent from './pages/home';
import History from './pages/history';
import './styles/globals.css';


function App() {
  return (
    <div className='App'>
   <Router>

    <AuthProvider> 

    <Routes>

 <Route path='/' element={<Landing/>} />


<Route path='/auth' element={<Authentication />} />

<Route path='/home' element={<HomeComponent />} />

<Route path='/history' element={<History />} />

<Route path='/:url' element={<VideoMeetComponent />} />



    </Routes>
    </AuthProvider>

   </Router>
    </div>
  )
}

export default App
