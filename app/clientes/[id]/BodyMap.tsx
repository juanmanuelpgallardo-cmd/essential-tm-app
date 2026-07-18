'use client'

import { useState } from 'react'

const zonas: Record<string, { label: string; path: string }[]> = {
  frontal: [
    {
      label: 'Hombro Izq',
      path: 'M38 115 C28 115, 18 130, 18 155 C18 170, 22 178, 28 180 L38 180 Z',
    },
    {
      label: 'Hombro Der',
      path: 'M162 115 C172 115, 182 130, 182 155 C182 170, 178 178, 172 180 L162 180 Z',
    },
    {
      label: 'Pectoral Izq',
      path: 'M40 130 C40 130, 55 128, 70 130 L70 170 L40 170 Z',
    },
    {
      label: 'Pectoral Der',
      path: 'M160 130 C160 130, 145 128, 130 130 L130 170 L160 170 Z',
    },
    {
      label: 'Abdominales',
      path: 'M72 172 L128 172 L128 245 L72 245 Z',
    },
    {
      label: 'Cuádriceps Izq',
      path: 'M75 248 L98 248 L98 370 L80 370 Z',
    },
    {
      label: 'Cuádriceps Der',
      path: 'M125 248 L102 248 L102 370 L120 370 Z',
    },
    {
      label: 'Gemelo Izq',
      path: 'M78 375 L96 375 L96 460 L82 460 Z',
    },
    {
      label: 'Gemelo Der',
      path: 'M122 375 L104 375 L104 460 L118 460 Z',
    },
  ],
  dorsal: [
    {
      label: 'Trapecio Izq',
      path: 'M45 108 C45 108, 55 115, 65 125 L40 125 Z',
    },
    {
      label: 'Trapecio Der',
      path: 'M155 108 C155 108, 145 115, 135 125 L160 125 Z',
    },
    {
      label: 'Dorsal Izq',
      path: 'M42 127 L70 127 L70 195 L42 195 Z',
    },
    {
      label: 'Dorsal Der',
      path: 'M158 127 L130 127 L130 195 L158 195 Z',
    },
    {
      label: 'Lumbar',
      path: 'M72 197 L128 197 L128 250 L72 250 Z',
    },
    {
      label: 'Glúteo Izq',
      path: 'M75 252 L98 252 L98 280 L72 280 Z',
    },
    {
      label: 'Glúteo Der',
      path: 'M125 252 L102 252 L102 280 L128 280 Z',
    },
    {
      label: 'Isquiotibial Izq',
      path: 'M74 282 L98 282 L98 370 L80 370 Z',
    },
    {
      label: 'Isquiotibial Der',
      path: 'M126 282 L102 282 L102 370 L120 370 Z',
    },
    {
      label: 'Gemelo Izq',
      path: 'M78 375 L96 375 L96 460 L82 460 Z',
    },
    {
      label: 'Gemelo Der',
      path: 'M122 375 L104 375 L104 460 L118 460 Z',
    },
  ],
}

const siluetaFemeninaFrontal =
  'M100 18 C110 18, 118 26, 118 36 C118 46, 112 52, 105 56 L105 80 L95 80 L95 56 C88 52, 82 46, 82 36 C82 26, 90 18, 100 18 Z ' +
  'M84 82 L100 82 L116 82 L118 105 L112 110 L108 102 L100 106 L92 102 L88 110 L82 105 Z ' +
  'M82 110 C75 115, 68 125, 65 145 C63 160, 68 175, 75 180 L84 180 L84 110 Z ' +
  'M118 110 C125 115, 132 125, 135 145 C137 160, 132 175, 125 180 L116 180 L116 110 Z ' +
  'M85 110 L85 182 L75 182 C72 182, 70 188, 70 200 L70 212 C70 218, 74 222, 78 222 L92 222 L92 248 L108 248 L108 222 L122 222 C126 222, 130 218, 130 212 L130 200 C130 188, 128 182, 125 182 L115 182 L115 110 Z ' +
  'M92 250 L76 250 C73 250, 70 255, 70 262 L70 370 C70 380, 74 385, 80 385 L92 385 Z ' +
  'M108 250 L124 250 C127 250, 130 255, 130 262 L130 370 C130 380, 126 385, 120 385 L108 385 Z ' +
  'M80 388 L92 388 L92 465 C92 472, 88 478, 82 478 L78 478 C74 478, 70 474, 70 468 L70 400 Z ' +
  'M120 388 L108 388 L108 465 C108 472, 112 478, 118 478 L122 478 C126 478, 130 474, 130 468 L130 400 Z'

const siluetaMasculinaFrontal =
  'M100 18 C110 18, 118 26, 118 36 C118 46, 112 52, 105 56 L105 80 L95 80 L95 56 C88 52, 82 46, 82 36 C82 26, 90 18, 100 18 Z ' +
  'M80 82 L100 82 L120 82 L122 108 L116 114 L110 104 L100 108 L90 104 L84 114 L78 108 Z ' +
  'M78 114 C70 120, 60 132, 56 155 C54 170, 58 182, 66 188 L82 188 L82 114 Z ' +
  'M122 114 C130 120, 140 132, 144 155 C146 170, 142 182, 134 188 L118 188 L118 114 Z ' +
  'M82 116 L82 190 L68 190 C64 190, 60 196, 60 208 L60 218 C60 224, 64 228, 68 228 L92 228 L92 248 L108 248 L108 228 L132 228 C136 228, 140 224, 140 218 L140 208 C140 196, 136 190, 132 190 L118 190 L118 116 Z ' +
  'M92 250 L74 250 C70 250, 66 255, 66 264 L66 372 C66 384, 70 390, 78 390 L92 390 Z ' +
  'M108 250 L126 250 C130 250, 134 255, 134 264 L134 372 C134 384, 130 390, 122 390 L108 390 Z ' +
  'M78 392 L92 392 L92 470 C92 478, 88 484, 80 484 L76 484 C72 484, 66 480, 66 472 L66 404 Z ' +
  'M122 392 L108 392 L108 470 C108 478, 112 484, 120 484 L124 484 C128 484, 134 480, 134 472 L134 404 Z'

const siluetaFemeninaDorsal =
  'M100 18 C110 18, 118 26, 118 36 C118 46, 112 52, 105 56 L105 80 L95 80 L95 56 C88 52, 82 46, 82 36 C82 26, 90 18, 100 18 Z ' +
  'M84 82 L100 82 L116 82 L118 105 L112 110 L108 102 L100 106 L92 102 L88 110 L82 105 Z ' +
  'M82 110 C75 115, 68 125, 65 145 C63 160, 68 175, 75 180 L84 180 L84 110 Z ' +
  'M118 110 C125 115, 132 125, 135 145 C137 160, 132 175, 125 180 L116 180 L116 110 Z ' +
  'M85 110 L85 182 L75 182 C72 182, 70 188, 70 200 L70 212 C70 218, 74 222, 78 222 L92 222 L92 248 L108 248 L108 222 L122 222 C126 222, 130 218, 130 212 L130 200 C130 188, 128 182, 125 182 L115 182 L115 110 Z ' +
  'M92 250 L76 250 C73 250, 70 255, 70 262 L70 370 C70 380, 74 385, 80 385 L92 385 Z ' +
  'M108 250 L124 250 C127 250, 130 255, 130 262 L130 370 C130 380, 126 385, 120 385 L108 385 Z ' +
  'M80 388 L92 388 L92 465 C92 472, 88 478, 82 478 L78 478 C74 478, 70 474, 70 468 L70 400 Z ' +
  'M120 388 L108 388 L108 465 C108 472, 112 478, 118 478 L122 478 C126 478, 130 474, 130 468 L130 400 Z'

const siluetaMasculinaDorsal =
  'M100 18 C110 18, 118 26, 118 36 C118 46, 112 52, 105 56 L105 80 L95 80 L95 56 C88 52, 82 46, 82 36 C82 26, 90 18, 100 18 Z ' +
  'M80 82 L100 82 L120 82 L122 108 L116 114 L110 104 L100 108 L90 104 L84 114 L78 108 Z ' +
  'M78 114 C70 120, 60 132, 56 155 C54 170, 58 182, 66 188 L82 188 L82 114 Z ' +
  'M122 114 C130 120, 140 132, 144 155 C146 170, 142 182, 134 188 L118 188 L118 114 Z ' +
  'M82 116 L82 190 L68 190 C64 190, 60 196, 60 208 L60 218 C60 224, 64 228, 68 228 L92 228 L92 248 L108 248 L108 228 L132 228 C136 228, 140 224, 140 218 L140 208 C140 196, 136 190, 132 190 L118 190 L118 116 Z ' +
  'M92 250 L74 250 C70 250, 66 255, 66 264 L66 372 C66 384, 70 390, 78 390 L92 390 Z ' +
  'M108 250 L126 250 C130 250, 134 255, 134 264 L134 372 C134 384, 130 390, 122 390 L108 390 Z ' +
  'M78 392 L92 392 L92 470 C92 478, 88 484, 80 484 L76 484 C72 484, 66 480, 66 472 L66 404 Z ' +
  'M122 392 L108 392 L108 470 C108 478, 112 484, 120 484 L124 484 C128 484, 134 480, 134 472 L134 404 Z'

export default function BodyMap({ sexo }: { sexo: string }) {
  const [vista, setVista] = useState<'frontal' | 'dorsal'>('frontal')
  const [selected, setSelected] = useState<string[]>([])

  const esFemenino = sexo === 'Mujer'
  const siluetaFrontal = esFemenino ? siluetaFemeninaFrontal : siluetaMasculinaFrontal
  const siluetaDorsal = esFemenino ? siluetaFemeninaDorsal : siluetaMasculinaDorsal

  const toggleZona = (label: string) => {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((z) => z !== label) : [...prev, label]
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#3A5A40]">Mapa Anatómico</h3>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setVista('frontal')}
            className={`px-3 py-1 text-xs rounded-md transition ${
              vista === 'frontal' ? 'bg-white shadow-sm text-[#3A5A40] font-medium' : 'text-[#8A9A8A] hover:text-[#5A6B5A]'
            }`}
          >
            Frontal
          </button>
          <button
            onClick={() => setVista('dorsal')}
            className={`px-3 py-1 text-xs rounded-md transition ${
              vista === 'dorsal' ? 'bg-white shadow-sm text-[#3A5A40] font-medium' : 'text-[#8A9A8A] hover:text-[#5A6B5A]'
            }`}
          >
            Dorsal
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <svg viewBox="0 0 200 500" className="w-full max-w-[160px] h-auto select-none">
          {/* Silueta base */}
          <path
            d={vista === 'frontal' ? siluetaFrontal : siluetaDorsal}
            fill="#F0EFEA"
            stroke="#D4D0C5"
            strokeWidth="1.5"
          />

          {/* Zonas interactivas */}
          {(vista === 'frontal' ? zonas.frontal : zonas.dorsal).map((zona) => (
            <path
              key={zona.label}
              d={zona.path}
              fill={selected.includes(zona.label) ? '#C99470' : 'transparent'}
              fillOpacity={selected.includes(zona.label) ? 0.35 : 0}
              stroke={selected.includes(zona.label) ? '#C99470' : '#D4D0C5'}
              strokeWidth={selected.includes(zona.label) ? 1.5 : 0.5}
              className="cursor-pointer transition-all duration-200 hover:fill-[#C99470] hover:fill-opacity-20"
              onClick={() => toggleZona(zona.label)}
            />
          ))}
        </svg>
      </div>

      {selected.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {selected.map((z) => (
            <span
              key={z}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#C99470]/10 text-[#C99470] rounded-full text-[10px] font-medium"
            >
              {z}
              <button onClick={() => toggleZona(z)} className="hover:text-[#B88363]">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
