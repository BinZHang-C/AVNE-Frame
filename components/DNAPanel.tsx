import React from 'react';
import { t } from '../locales';
import { Language, SpatialDNA } from '../types';

interface DNAPanelProps {
  dna: SpatialDNA;
  onChange: (next: SpatialDNA) => void;
  lang: Language;
}

export const DNAPanel: React.FC<DNAPanelProps> = ({ dna, onChange, lang }) => {
  const patchMaterial = (key: keyof SpatialDNA['material_dna'], value: string | number) => {
    onChange({
      ...dna,
      material_dna: {
        ...dna.material_dna,
        [key]: value
      }
    });
  };

  return (
    <aside className="w-[320px] bg-[#10141A] border-l border-white/5 p-5 overflow-y-auto custom-scrollbar">
      <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">{t.spatialDNA[lang]}</h4>
      <div className="space-y-3">
        <label className="block text-[9px] uppercase tracking-wider text-zinc-500">{t.textureRef[lang]}</label>
        <textarea
          className="w-full h-24 bg-[#151B22] border border-white/5 rounded-xl p-3 text-xs text-zinc-200 outline-none resize-none"
          value={dna.material_dna.texture_reference}
          onChange={(e) => patchMaterial('texture_reference', e.target.value)}
        />

        <label className="block text-[9px] uppercase tracking-wider text-zinc-500">{t.reflectivity[lang]}: {dna.material_dna.reflection_level.toFixed(2)}</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={dna.material_dna.reflection_level}
          onChange={(e) => patchMaterial('reflection_level', Number(e.target.value))}
          className="w-full"
        />

        <label className="block text-[9px] uppercase tracking-wider text-zinc-500">{t.roughness[lang]}: {dna.material_dna.roughness_level.toFixed(2)}</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={dna.material_dna.roughness_level}
          onChange={(e) => patchMaterial('roughness_level', Number(e.target.value))}
          className="w-full"
        />
      </div>
    </aside>
  );
};
