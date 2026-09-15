import React, { useEffect, useRef } from 'react'

const SplashScreen: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const particles: any[] = []
    const count = Math.min(150, Math.floor(window.innerWidth / 5))

    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      opacity: number

      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 2 + 0.5
        this.speedX = (Math.random() - 0.5) * 0.5
        this.speedY = (Math.random() - 0.5) * 0.5
        this.opacity = Math.random() * 0.5 + 0.2
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY
        if (this.x > canvas.width) this.x = 0
        if (this.x < 0) this.x = canvas.width
        if (this.y > canvas.height) this.y = 0
        if (this.y < 0) this.y = canvas.height
      }

      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 215, 0, ${this.opacity})`
        ctx.fill()
        ctx.shadowColor = 'rgba(255, 215, 0, 0.3)'
        ctx.shadowBlur = 10
      }
    }

    for (let i = 0; i < count; i++) {
      particles.push(new Particle())
    }

    const drawLines = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance < 150) {
            const opacity = (1 - distance / 150) * 0.3
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(255, 215, 0, ${opacity})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
    }

    let animationId: number

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 2
      )
      gradient.addColorStop(0, 'rgba(30, 15, 50, 0.3)')
      gradient.addColorStop(1, 'rgba(10, 10, 30, 0.8)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        p.update()
        p.draw()
      }
      drawLines()
      animationId = requestAnimationFrame(animate)
    }

    animate()

    const timer = setTimeout(() => {
      const el = document.querySelector('.splash-screen')
      if (el) el.classList.add('hide')
    }, 3500)

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <div className="splash-screen" id="splashScreen">
      <canvas ref={canvasRef} id="particlesCanvas" />
      <div className="splash-content">
        <div className="splash-icon">
          <svg width="80" height="80" viewBox="0 0 640 512" fill="none">
            <path d="M493.9 295.6c-50.3 0-83.5-38.9-92.8-53.9 11.9-95.3 46.8-125.4 92.8-125.4 45.5 0 80.9 36.4 80.9 89.7s-35.4 89.7-80.9 89.7l0-.1zm0-237.8c-81.9 0-127.8 53.4-141 108.4-14.9-28-25.9-65.5-34.5-100.3l-113.2 0 0 141c0 51.1-23.3 89-68.8 89s-71.6-37.8-71.6-89l.5-141-65.3 0 0 141c0 41.1 13.3 78.4 37.6 105.1 25 27.5 59.2 41.8 98.8 41.8 78.8 0 133.8-60.4 133.8-146.9l0-94.8c8.2 31.2 27.8 91.1 65.3 143.6l-35 199.4 66.4 0 23.1-141.3c7.6 6.3 15.7 12 24.2 17 22.2 14 47.7 21.9 73.9 22.8 0 0 4 .2 6.1 .2 81.2 0 145.9-62.9 145.9-147.8S575.3 57.9 494.1 57.9l-.2-.1z" 
              fill="url(#goldGradient)" opacity="0.9"/>
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD700" />
                <stop offset="25%" stopColor="#FFF8DC" />
                <stop offset="50%" stopColor="#FFD700" />
                <stop offset="75%" stopColor="#FFA500" />
                <stop offset="100%" stopColor="#FFD700" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 className="gold-text">ERTIQAA</h1>
        <p className="splash-subtitle">The Future of Academic Excellence</p>
        <div className="loader-bar">
          <div className="loader-fill"></div>
        </div>
        <span className="loader-text">جاري التحميل...</span>
      </div>
    </div>
  )
}

export default SplashScreen