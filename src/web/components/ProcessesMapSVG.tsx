"use client";

import React, { useState } from "react";
import { Info, HelpCircle } from "lucide-react";

interface Hotspot {
  id: string;
  name: string;
  x: number;
  y: number;
  description: string;
  recommendation: string;
  efficiencyTip: string;
}

export default function ProcessesMapSVG() {
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [flowSpeed, setFlowSpeed] = useState<number>(30); // scale 0-100

  const hotspots: Hotspot[] = [
    {
      id: "hotspot-1",
      name: "Zona de Acumulación Térmica (Cubierta)",
      x: 350,
      y: 90,
      description: "Zona de estancamiento donde la carga térmica por radiación y procesos internos se acumula en el techo por estratificación térmica.",
      recommendation: "Extractor tipo Hongo Serie AX-H de alta capacidad para purgar volumen crítico y reducir hasta 8°C de temperatura en la base.",
      efficiencyTip: "La purga en la cumbrera reduce el consumo energético general al liberar el calor que asciende naturalmente."
    },
    {
      id: "hotspot-2",
      name: "Inyección de Aire Limpio (Base Muro)",
      x: 120,
      y: 260,
      description: "Punto de entrada de aire exterior. Necesita inyección mecánica balanceada para evitar que la planta genere vacío estático.",
      recommendation: "Blower Axial de Inyección Serie AX-HV con deflectores de flujo y filtro G4 para retener material particulado grueso.",
      efficiencyTip: "La alineación láser del acople directo motor-hélice reduce el consumo en un 8.5%."
    },
    {
      id: "hotspot-3",
      name: "Ciclón & Captura de Polvo (Proceso)",
      x: 650,
      y: 220,
      description: "Punto crítico de emisión de material particulado y solventes procedentes de molienda o soldadura.",
      recommendation: "Blower Centrífugo de Alta Presión Serie CF-B acoplado a red de ductería y damper regulador de caudal volumétrico.",
      efficiencyTip: "Limpieza periódica para evitar desbalanceo dinámico y vibración mayor a 2.5 mm/s."
    }
  ];

  return (
    <div className="w-full bg-zinc-100/50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 md:p-8 transition-colors duration-300">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Lado SVG Plano SCADA */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-sky-600 dark:text-sky-400 uppercase font-bold">Plano de Planta SCADA</span>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white font-display mt-1">Simulación Neumática de Nave Industrial</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-650 dark:text-zinc-500 font-mono">Velocidad del Flujo:</span>
              <input 
                type="range" 
                min="10" 
                max="80" 
                value={flowSpeed} 
                onChange={(e) => setFlowSpeed(Number(e.target.value))}
                className="w-24 accent-sky-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="relative aspect-[800/400] w-full bg-zinc-50 dark:bg-zinc-950/80 rounded-xl border border-zinc-200 dark:border-zinc-900 overflow-hidden">
            {/* Grid SCADA */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(100,116,139,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(100,116,139,0.08)_1px,transparent_1px)] bg-[size:2rem_2rem]" />
            
            <svg viewBox="0 0 800 400" className="w-full h-full select-none overflow-visible">
              {/* Contorno de la Nave Industrial */}
              <path 
                d="M 80,320 L 80,180 L 250,100 L 550,100 L 720,180 L 720,320 Z" 
                fill="none" 
                className="stroke-zinc-400 dark:stroke-zinc-700" 
                strokeWidth="2.5" 
                strokeLinejoin="round" 
              />
              {/* Piso */}
              <line x1="40" y1="320" x2="760" y2="320" className="stroke-zinc-500 dark:stroke-zinc-600" strokeWidth="3" />
              
              {/* Estructura Soporte / Columnas */}
              <line x1="250" y1="100" x2="250" y2="320" className="stroke-zinc-300 dark:stroke-zinc-800" strokeWidth="1" strokeDasharray="4,4" />
              <line x1="550" y1="100" x2="550" y2="320" className="stroke-zinc-300 dark:stroke-zinc-800" strokeWidth="1" strokeDasharray="4,4" />

              {/* Ductería Esquematizada */}
              <path 
                d="M 500,240 L 650,240 L 650,180" 
                fill="none" 
                className="stroke-zinc-300 dark:stroke-zinc-850" 
                strokeWidth="16" 
                strokeLinecap="square"
              />
              <path 
                d="M 500,240 L 650,240 L 650,180" 
                fill="none" 
                stroke="#0284c7" 
                strokeWidth="12" 
                strokeLinecap="square"
                opacity="0.3"
              />

              {/* Flechas de flujo de aire (Inyección en Azul) */}
              <g stroke="#0284c7" strokeWidth="2.5" fill="none" strokeLinecap="round">
                {/* Flujo inyector muro izquierdo */}
                <path 
                  d="M 50,260 Q 150,260 250,240" 
                  strokeDasharray="10,15" 
                  strokeDashoffset={-flowSpeed * 1.2}
                  className="transition-all duration-75"
                />
                <path 
                  d="M 50,280 Q 180,280 300,250" 
                  strokeDasharray="10,15" 
                  strokeDashoffset={-flowSpeed * 1.5}
                  className="transition-all duration-75"
                />
              </g>

              {/* Flechas de flujo de aire (Extracción en Rojo/Naranja en Cubierta) */}
              <g stroke="#f97316" strokeWidth="2.5" fill="none" strokeLinecap="round">
                <path 
                  d="M 300,180 Q 350,130 350,110" 
                  strokeDasharray="8,12" 
                  strokeDashoffset={flowSpeed * 1.1}
                  className="transition-all duration-75"
                />
                <path 
                  d="M 450,210 Q 550,180 645,185" 
                  strokeDasharray="8,12" 
                  strokeDashoffset={flowSpeed * 1.3}
                  className="transition-all duration-75"
                />
              </g>

              {/* Dibujo de Equipos Esquemáticos en SVG */}
              {/* Extractor de techo */}
              <rect x="330" y="85" width="40" height="15" className="fill-zinc-200 dark:fill-zinc-900 stroke-zinc-400 dark:stroke-zinc-650" strokeWidth="1.5" rx="2" />
              <circle cx="350" cy="92.5" r="5" fill="#f97316" className="animate-pulse" />

              {/* Inyector lateral izquierdo */}
              <rect x="70" y="245" width="20" height="30" className="fill-zinc-200 dark:fill-zinc-900 stroke-zinc-400 dark:stroke-zinc-650" strokeWidth="1.5" rx="2" />
              <line x1="80" y1="245" x2="80" y2="275" stroke="#0284c7" strokeWidth="2" />

              {/* Ciclón extractor de proceso */}
              <rect x="635" y="160" width="30" height="30" className="fill-zinc-200 dark:fill-zinc-900 stroke-zinc-400 dark:stroke-zinc-650" strokeWidth="1.5" rx="2" />
              <path d="M 640,190 L 640,210 L 660,210 L 660,190 Z" className="fill-zinc-300 dark:fill-zinc-800" />

              {/* Hotspots interactivos */}
              {hotspots.map((hs) => (
                <g 
                  key={hs.id} 
                  className="cursor-pointer group/hs"
                  onClick={() => setSelectedHotspot(hs)}
                >
                  <circle 
                    cx={hs.x} 
                    cy={hs.y} 
                    r="12" 
                    className="fill-sky-500/20 stroke-sky-400/60 animate-ping" 
                    style={{ transformOrigin: `${hs.x}px ${hs.y}px`, animationDuration: "3s" }} 
                  />
                  <circle 
                    cx={hs.x} 
                    cy={hs.y} 
                    r="8" 
                    className="fill-sky-500 hover:fill-sky-400 transition-colors stroke-white dark:stroke-zinc-950" 
                    strokeWidth="2" 
                  />
                  <text 
                    x={hs.x} 
                    y={hs.y + 3} 
                    fill="white" 
                    fontSize="9" 
                    fontWeight="black" 
                    textAnchor="middle"
                    className="pointer-events-none font-sans"
                  >
                    !
                  </text>
                </g>
              ))}
            </svg>

            <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-zinc-950/80 backdrop-blur-xs border border-zinc-200 dark:border-zinc-900 rounded-lg p-2 flex gap-4 text-[9px] font-mono text-zinc-600 dark:text-zinc-550 transition-colors">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-sky-500" /> Inyección Limpia</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-orange-500" /> Extracción / Calor</div>
            </div>
          </div>
        </div>

        {/* Lado Detalle de Inspección */}
        <div className="w-full lg:w-80 flex flex-col justify-between">
          <div className="border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/30 rounded-xl p-5 h-full flex flex-col justify-between min-h-[300px] transition-colors duration-300">
            {selectedHotspot ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                  <Info className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Punto Inspeccionado</span>
                </div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-white font-display leading-tight">{selectedHotspot.name}</h4>
                <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed font-light">{selectedHotspot.description}</p>
                
                <div className="border-t border-zinc-200 dark:border-zinc-900/60 pt-3 space-y-3">
                  <div>
                    <span className="text-[9px] uppercase font-mono text-zinc-500 block mb-1">Recomendación Industrial:</span>
                    <div className="text-xs text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-900 font-light">
                      {selectedHotspot.recommendation}
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-mono text-zinc-500 block mb-1">Eficiencia OPEX:</span>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                      &rsaquo; {selectedHotspot.efficiencyTip}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full text-zinc-400 dark:text-zinc-500 py-10">
                <HelpCircle className="w-8 h-8 text-zinc-300 dark:text-zinc-800 mb-3 animate-bounce" />
                <p className="text-xs font-semibold px-4 text-zinc-600 dark:text-zinc-400">Seleccione un hotspot interactivo en el plano de planta para auditar el flujo de aire.</p>
              </div>
            )}
            
            {selectedHotspot && (
              <button 
                onClick={() => setSelectedHotspot(null)}
                className="w-full mt-6 text-center text-[10px] uppercase tracking-wider font-bold text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Limpiar Selección
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
