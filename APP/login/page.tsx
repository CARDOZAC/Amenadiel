'use client';

import React, { useState, useRef, MouseEvent } from "react";
import { login } from "@/app/actions/auth";
import UserIcon from "@/app/components/icons/UserIcon";
import LockIcon from "@/app/components/icons/LockIcon";

/**
 * PÁGINA DE LOGIN V3 - "El Login Bien Perroso"
 *
 * Llevando la experiencia al siguiente nivel con interacciones 3D,
 * animaciones de entrada y micro-interacciones refinadas.
 */
export default function LoginPageV3() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const x = e.clientX - left - width / 2;
    const y = e.clientY - top - height / 2;
    
    const rotateX = (-y / height) * 10; // Invertido para que se sienta natural
    const rotateY = (x / width) * 10;

    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
  };

  const onMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
  };
  
  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
    circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
    circle.classList.add("ripple");

    const ripple = button.getElementsByClassName("ripple")[0];
    if (ripple) {
      ripple.remove();
    }
    button.appendChild(circle);
  };


  return (
    <main 
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-blue-950 p-4"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* --- Fondo Mejorado --- */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-blue-900 to-[#020617] animate-gradient-bg" />
      <div className="absolute inset-0 opacity-10 stars-bg" />
      
      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        {/* --- Título --- */}
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl font-bold text-white-pure">
            Iniciar Sesión
          </h1>
          <p className="text-blue-300/70 mt-2">
            Bienvenido al Sistema de Gestión DLE.
          </p>
        </div>

        {/* --- Tarjeta 3D --- */}
        <div 
          ref={cardRef}
          className="glass-card p-8 bg-blue-950/20 border-white-pure/10 transition-transform duration-200 ease-out"
          style={{ transformStyle: "preserve-3d" }}
        >
          <form action={login as any} className="space-y-8">
            {/* --- Input con Floating Label --- */}
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="floating-input peer"
                placeholder=" "
              />
              <label htmlFor="email" className="floating-label">
                <UserIcon className="w-5 h-5 mr-2 inline-block"/>
                Email
              </label>
            </div>

            {/* --- Input con Floating Label --- */}
            <div className="relative">
              <input
                type="password"
                id="password"
                name="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="floating-input peer"
                placeholder=" "
              />
              <label htmlFor="password" className="floating-label">
                <LockIcon className="w-5 h-5 mr-2 inline-block"/>
                Contraseña
              </label>
            </div>

            {/* --- Botón con Ripple --- */}
            <button
              type="submit"
              onClick={createRipple}
              className="ripple-button w-full py-3.5 font-bold text-lg text-white-pure rounded-lg 
                         bg-gradient-primary
                         shadow-2xl shadow-blue-600/30
                         hover:shadow-xl hover:shadow-blue-500/50
                         transform hover:-translate-y-1 transition-all duration-300"
            >
              ACCEDER
            </button>
          </form>
        </div>
      </div>

      {/* --- Estilos Adicionales en Componente --- */}
      <style jsx>{`
        .stars-bg {
          background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><g fill="white" fill-opacity="0.3"><circle cx="50" cy="50" r="0.5"/><circle cx="10" cy="20" r="0.5"/><circle cx="90" cy="30" r="0.5"/><circle cx="30" cy="80" r="0.5"/><circle cx="70" cy="60" r="0.5"/></g></svg>');
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }

        .floating-input {
          @apply w-full px-4 py-3 bg-transparent text-white-pure rounded-lg border-2 border-blue-700/50
                 focus:outline-none focus:ring-0 focus:border-blue-400 transition-colors;
        }
        .floating-label {
          @apply absolute left-4 top-3.5 text-blue-300/70 transition-all duration-300 
                 flex items-center
                 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base 
                 peer-focus:top-[-12px] peer-focus:text-xs peer-focus:text-blue-300
                 peer-[:not(:placeholder-shown)]:top-[-12px] peer-[:not(:placeholder-shown)]:text-xs
                 bg-blue-950/60 px-1;
        }
        
        .ripple-button {
          position: relative;
          overflow: hidden;
        }
      `}</style>
      <style global jsx>{`
        .ripple {
          position: absolute;
          border-radius: 50%;
          transform: scale(0);
          animation: ripple-effect 0.6s linear;
          background-color: rgba(255, 255, 255, 0.7);
        }
        @keyframes ripple-effect {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
    </main>
  );
}
