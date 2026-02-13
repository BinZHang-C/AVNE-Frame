import React from 'react';
import { Language, SpatialDNA } from '../types';
import { t } from '../locales';

interface DNAPanelProps {
  dna: SpatialDNA;
  onChange: (next: SpatialDNA) => void;
  lang: Language;
}

const panelInputClass =
  'w-full bg-[#0F141C] border border-white/10 rounded-lg text-[10px] font-semibold text-zinc-200 px-3 py-2 outline-none focus:border-[#3B82F6]/50';

export const DNAPanel: React.FC<DNAPanelProps> = ({ dna, onChange, lang }) => {
  return (
    <aside className="w-[320px] bg-[#10141A] border-l border-white/5 p-6 overflow-y-auto custom-scrollbar">
      <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-4">{t.spatialDNA[lang]}</h4>

      <div className="bg-[#151B22] rounded-2xl border border-white/5 p-4 space-y-4">
        <div className="text-[9px] text-emerald-400/80 font-black uppercase tracking-widest">{t.dnaLocks[lang]}</div>

        <label className="block space-y-2">
          <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600">{t.textureRef[lang]}</div>
          <input
            className={panelInputClass}
            value={dna.material_dna.texture_reference}
            onChange={(event) =>
              onChange({
                ...dna,
                material_dna: { ...dna.material_dna, texture_reference: event.target.value },
              })
            }
          />
        </label>

        <label className="block space-y-2">
          <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600">{t.reflectivity[lang]}</div>
          <input
            className={panelInputClass}
            min={0}
            max={1}
            step={0.05}
            type="range"
            value={dna.material_dna.reflection_level}
            onChange={(event) =>
              onChange({
                ...dna,
                material_dna: { ...dna.material_dna, reflection_level: Number(event.target.value) },
              })
            }
          />
        </label>

        <label className="block space-y-2">
          <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600">{t.roughness[lang]}</div>
          <input
            className={panelInputClass}
            min={0}
            max={1}
            step={0.05}
            type="range"
            value={dna.material_dna.roughness_level}
            onChange={(event) =>
              onChange({
                ...dna,
                material_dna: { ...dna.material_dna, roughness_level: Number(event.target.value) },
              })
            }
          />
        </label>
      </div>
    </aside>
  );
};
