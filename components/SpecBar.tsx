import React from 'react';
import { Language, QualityLevel, Resolution, SpecBarParams, VeoMode } from '../types';
import { t } from '../locales';

interface SpecBarProps {
  params: SpecBarParams;
  onChange: (next: SpecBarParams) => void;
  lang: Language;
}

const buttonBase = 'px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wide border transition-all';

export const SpecBar: React.FC<SpecBarProps> = ({ params, onChange, lang }) => {
  const set = <K extends keyof SpecBarParams>(key: K, value: SpecBarParams[K]) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <div className="space-y-3 bg-[#151B22] border border-white/5 rounded-2xl p-3">
      <div className="space-y-1">
        <div className="text-[9px] text-zinc-500 uppercase tracking-widest">{t.resolution[lang]}</div>
        <div className="flex gap-2">
          {[Resolution.R720P, Resolution.R1080P].map((value) => (
            <button
              key={value}
              onClick={() => set('resolution', value)}
              className={`${buttonBase} ${params.resolution === value ? 'bg-white text-black border-white' : 'bg-[#0B0D10] text-zinc-500 border-white/10 hover:text-white'}`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-[9px] text-zinc-500 uppercase tracking-widest">{t.duration[lang]}</div>
        <div className="flex gap-2">
          {[5, 10].map((value) => (
            <button
              key={value}
              onClick={() => set('duration', value as 5 | 10)}
              className={`${buttonBase} ${params.duration === value ? 'bg-white text-black border-white' : 'bg-[#0B0D10] text-zinc-500 border-white/10 hover:text-white'}`}
            >
              {value}s
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-[9px] text-zinc-500 uppercase tracking-widest">{t.quality[lang]}</div>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: QualityLevel.SKETCH, label: t.quality_sketch[lang] },
            { value: QualityLevel.EXPRESSION, label: t.quality_expression[lang] },
            { value: QualityLevel.REPORT, label: t.quality_report[lang] }
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => set('quality', item.value)}
              className={`${buttonBase} ${params.quality === item.value ? 'bg-white text-black border-white' : 'bg-[#0B0D10] text-zinc-500 border-white/10 hover:text-white'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-[9px] text-zinc-500 uppercase tracking-widest">{t.mode[lang]}</div>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: VeoMode.FAST, label: t.mode_fast[lang] },
            { value: VeoMode.HIGH_QUALITY, label: t.mode_high[lang] },
            { value: VeoMode.FRAME_CONTROL, label: t.mode_frame[lang] }
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => set('veoMode', item.value)}
              className={`${buttonBase} ${params.veoMode === item.value ? 'bg-white text-black border-white' : 'bg-[#0B0D10] text-zinc-500 border-white/10 hover:text-white'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
