import React from 'react';
import { Language, QualityLevel, Resolution, SpecBarParams, VeoMode } from '../types';
import { t } from '../locales';

interface SpecBarProps {
  params: SpecBarParams;
  onChange: (next: SpecBarParams) => void;
  lang: Language;
}

const PANEL_CLASS =
  'bg-[#151B22] rounded-2xl border border-white/5 p-4 space-y-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]';

const LABEL_CLASS = 'text-[9px] font-black uppercase tracking-widest text-zinc-600';

const SELECT_CLASS =
  'w-full bg-[#0F141C] border border-white/10 rounded-lg text-[10px] font-semibold text-zinc-200 px-3 py-2 outline-none focus:border-[#3B82F6]/50';

export const SpecBar: React.FC<SpecBarProps> = ({ params, onChange, lang }) => {
  return (
    <div className={PANEL_CLASS}>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-2">
          <div className={LABEL_CLASS}>{t.resolution[lang]}</div>
          <select
            value={params.resolution}
            className={SELECT_CLASS}
            onChange={(event) => onChange({ ...params, resolution: event.target.value as Resolution })}
          >
            <option value={Resolution.R720P}>720P</option>
            <option value={Resolution.R1080P}>1080P</option>
          </select>
        </label>

        <label className="space-y-2">
          <div className={LABEL_CLASS}>{t.duration[lang]}</div>
          <select
            value={params.duration}
            className={SELECT_CLASS}
            onChange={(event) => onChange({ ...params, duration: Number(event.target.value) as 5 | 10 })}
          >
            <option value={5}>5s</option>
            <option value={10}>10s</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-2">
          <div className={LABEL_CLASS}>{t.quality[lang]}</div>
          <select
            value={params.quality}
            className={SELECT_CLASS}
            onChange={(event) => onChange({ ...params, quality: event.target.value as QualityLevel })}
          >
            <option value={QualityLevel.SKETCH}>{t.quality_sketch[lang]}</option>
            <option value={QualityLevel.EXPRESSION}>{t.quality_expression[lang]}</option>
            <option value={QualityLevel.REPORT}>{t.quality_report[lang]}</option>
          </select>
        </label>

        <label className="space-y-2">
          <div className={LABEL_CLASS}>{t.mode[lang]}</div>
          <select
            value={params.veoMode}
            className={SELECT_CLASS}
            onChange={(event) => onChange({ ...params, veoMode: event.target.value as VeoMode })}
          >
            <option value={VeoMode.FAST}>{t.mode_fast[lang]}</option>
            <option value={VeoMode.HIGH_QUALITY}>{t.mode_high[lang]}</option>
            <option value={VeoMode.FRAME_CONTROL}>{t.mode_frame[lang]}</option>
          </select>
        </label>
      </div>
    </div>
  );
};
