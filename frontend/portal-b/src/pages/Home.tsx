import React, { useState, useEffect } from 'react'
import SplashScreen from '../components/common/SplashScreen'
import Hero from '../components/sections/Hero'
import MainSections from '../components/sections/MainSections'

const Home: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 3500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {showSplash && <SplashScreen />}
      <Hero />
      <MainSections />
    </>
  )
}

export default Home