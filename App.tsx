
import React, { useState, useEffect } from 'react';
import { 
  Project, 
  Language, 
  VisualMode, 
  InputMode, 
  CameraPath, 
  Resolution, 
  QualityLevel, 
  VeoMode, 
  SpecBarParams,
  Scene
} from './types';
import { DNAPanel } from './components/DNAPanel';
import { SpecBar } from './components/SpecBar';
import { t } from './locales';
import { DEFAULT_SPATIAL_DNA } from './constants';
import { optimizeArchitecturalPrompt, runNarrativeRender, generate9Grid } from './services/geminiService';

const KeyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.5-2.5" />
  </svg>
);

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState(false);
  const [lang, setLang] = useState<Language>(Language.ZH);
  const [loading, setLoading] = useState<string | null>(null);

  const [project, setProject] = useState<Project>({
    id: 'prj_' + Date.now(),
    name: 'UNTITLED PROJECT',
    visualMode: VisualMode.ARCHITECTURE,
    spatial_dna: DEFAULT_SPATIAL_DNA,
  });

  const [activeScene, setActiveScene] = useState<Scene>({
    id: 'scn_curr',
    inputMode: InputMode.TEXT_TO_VIDEO,
    cameraPath: CameraPath.DOLLY_IN,
    prompt_input: '',
    prompt_enhanced: '',
    render_status: 'idle'
  });

  const [specs, setSpecs] = useState<SpecBarParams>({
    resolution: Resolution.R1080P,
    duration: 5,
    quality: QualityLevel.EXPRESSION,
    veoMode: VeoMode.FAST
  });

  useEffect(() => {
    // @ts-ignore
    window.aistudio?.hasSelectedApiKey().then(setHasKey);
  }, []);

  const handleOpenKeyDialog = async () => {
    // @ts-ignore
    await window.aistudio?.openSelectKey();
    setHasKey(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: 'image_start' | 'image_end') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setActiveScene(prev => ({ ...prev, [key]: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleOptimize = async () => {
    setLoading('optimizing');
    try {
      const res = await optimizeArchitecturalPrompt(
        activeScene.prompt_input,
        project.visualMode,
        activeScene.cameraPath,
        activeScene.inputMode,
        project.spatial_dna,
        lang
      );
      setActiveScene(prev => ({ ...prev, prompt_enhanced: res }));
    } finally {
      setLoading(null);
    }
  };

  const handleRender = async () => {
    setLoading('rendering');
    setActiveScene(prev => ({ ...prev, render_status: 'processing' }));
    try {
      const url = await runNarrativeRender(activeScene, specs, (msg) => {});
      setActiveScene(prev => ({ ...prev, video_url: url, render_status: 'completed' }));
    } catch (e) {
      setActiveScene(prev => ({ ...prev, render_status: 'failed' }));
    } finally {
      setLoading(null);
    }
  };

  const handleGenerate9Grid = async () => {
    if (!activeScene.image_start) return;
    setLoading('generating');
    try {
      const images = await generate9Grid(activeScene.image_start, project.visualMode, lang);
      setActiveScene(prev => ({ ...prev, nine_grid_images: images }));
    } finally {
      setLoading(null);
    }
  };

  if (!hasKey) {
    return (
      <div className="h-screen bg-[#0B0D10] flex flex-col items-center justify-center p-8">
        <h1 className="text-5xl font-heading font-black tracking-tighter text-white opacity-80 mb-12">AVNE</h1>
        <button 
          onClick={handleOpenKeyDialog}
          className="px-12 py-5 bg-white text-black font-bold uppercase tracking-[0.5em] text-[10px] rounded-full hover:scale-105 transition-all shadow-2xl"
        >
          {t.authBtn[lang]}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0B0D10] text-zinc-100 overflow-hidden">
      {/* Studio Header */}
      <header className="fixed top-0 left-0 right-0 h-14 border-b border-white/5 px-6 flex items-center justify-between bg-[#10141A]/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-10">
          <div className="text-lg font-heading font-black tracking-tighter opacity-90">AVNE</div>
          <div className="flex gap-1 bg-[#151B22] p-1 rounded-full border border-white/5">
            {[VisualMode.ARCHITECTURE, VisualMode.INTERIOR].map(m => (
              <button 
                key={m}
                onClick={() => setProject({ ...project, visualMode: m })}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${project.visualMode === m ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
              >
                {t[`${m}Mode` as keyof typeof t]?.[lang] || m}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <button 
            onClick={handleOpenKeyDialog}
            className="p-2.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-[#3B82F6] hover:border-[#3B82F6]/50 transition-all shadow-lg"
            title="Configure API Key"
          >
            <KeyIcon />
          </button>
          <button onClick={() => setLang(lang === Language.ZH ? Language.EN : Language.ZH)} className="text-[10px] font-bold text-zinc-600 hover:text-white uppercase tracking-widest px-2">{lang === Language.ZH ? 'EN' : 'ZH'}</button>
          <button className="px-6 py-2 bg-[#3B82F6] text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg">{t.export[lang]}</button>
        </div>
      </header>

      <div className="flex-1 mt-14 flex overflow-hidden">
        {/* Creator Rail */}
        <aside className="w-[340px] bg-[#10141A] border-r border-white/5 flex flex-col p-6 overflow-y-auto custom-scrollbar shadow-2xl">
          
          {/* Step 1: Input */}
          <section className="mb-8">
            <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-4">{t.step_input[lang]}</h4>
            <div className="grid grid-cols-2 gap-2">
              {[InputMode.TEXT_TO_VIDEO, InputMode.IMAGE_TO_VIDEO, InputMode.NINE_GRID, InputMode.FIRST_LAST_FRAMES].map(mode => (
                <button
                  key={mode}
                  onClick={() => setActiveScene({ ...activeScene, inputMode: mode, prompt_enhanced: '', video_url: undefined, nine_grid_images: undefined })}
                  className={`py-2.5 rounded-xl border text-[9px] font-bold uppercase transition-all ${activeScene.inputMode === mode ? 'bg-[#3B82F6]/10 border-[#3B82F6] text-white' : 'bg-[#151B22] border-white/5 text-zinc-600 hover:border-white/20'}`}
                >
                  {t[`input_${mode.replace('to_video', '').replace('nine_grid', 'grid').replace('first_last_frames', 'frames').trim()}` as keyof typeof t]?.[lang] || mode.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </section>

          {/* Step 2: Camera */}
          <section className="mb-8">
            <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-4">{t.step_camera[lang]}</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(CameraPath).map(path => (
                <button
                  key={path}
                  onClick={() => setActiveScene({ ...activeScene, cameraPath: path })}
                  className={`py-2 px-3 rounded-lg border text-[9px] font-bold uppercase text-left transition-all ${activeScene.cameraPath === path ? 'bg-white text-black border-white' : 'bg-[#151B22] border-white/5 text-zinc-500 hover:border-white/20'}`}
                >
                  {t[`path_${path}` as keyof typeof t]?.[lang] || path.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </section>

          {/* Step 3: Intent */}
          <section className="mb-8">
            <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-4">{t.step_intent[lang]}</h4>
            
            {activeScene.inputMode !== InputMode.TEXT_TO_VIDEO && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="aspect-video bg-[#0B0D10] rounded-xl border border-dashed border-zinc-800 flex flex-col items-center justify-center relative overflow-hidden group hover:border-[#3B82F6]/50 transition-all">
                  {activeScene.image_start ? <img src={activeScene.image_start} className="absolute inset-0 w-full h-full object-cover" /> : <div className="text-[8px] font-black uppercase text-zinc-700">{activeScene.inputMode === InputMode.FIRST_LAST_FRAMES ? t.startFrame[lang] : t.input_image[lang]}</div>}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileChange(e, 'image_start')} />
                </div>
                {activeScene.inputMode === InputMode.FIRST_LAST_FRAMES && (
                  <div className="aspect-video bg-[#0B0D10] rounded-xl border border-dashed border-zinc-800 flex flex-col items-center justify-center relative overflow-hidden group hover:border-[#3B82F6]/50 transition-all">
                    {activeScene.image_end ? <img src={activeScene.image_end} className="absolute inset-0 w-full h-full object-cover" /> : <div className="text-[8px] font-black uppercase text-zinc-700">{t.endFrame[lang]}</div>}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileChange(e, 'image_end')} />
                  </div>
                )}
              </div>
            )}

            <div className="bg-[#151B22] rounded-2xl border border-white/5 p-4 group focus-within:ring-1 focus-within:ring-[#3B82F6]/50 transition-all">
              <textarea 
                className="w-full h-32 bg-transparent text-xs text-zinc-200 outline-none resize-none placeholder:text-zinc-700 font-medium"
                placeholder={t.promptPlaceholder[lang]}
                value={activeScene.prompt_input}
                onChange={e => setActiveScene({ ...activeScene, prompt_input: e.target.value })}
              />
              <div className="flex justify-end mt-2">
                <button 
                  onClick={handleOptimize}
                  disabled={!activeScene.prompt_input || !!loading}
                  className="px-3 py-1.5 bg-zinc-800 text-zinc-500 border border-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 transition-all disabled:opacity-30"
                >
                  {t.optimizeBtn[lang]}
                </button>
              </div>
            </div>

            {activeScene.prompt_enhanced && (
              <div className="mt-4 p-4 bg-[#3B82F6]/5 border border-[#3B82F6]/20 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                <p className="text-[10px] text-[#3B82F6] italic leading-relaxed font-mono">{activeScene.prompt_enhanced}</p>
                <div className="flex gap-2">
                  <button className="flex-1 py-1.5 bg-[#3B82F6] text-white rounded-lg text-[9px] font-bold uppercase tracking-widest hover:brightness-110 transition-all">{t.applyBtn[lang]}</button>
                  <button onClick={() => setActiveScene({ ...activeScene, prompt_enhanced: '' })} className="flex-1 py-1.5 bg-zinc-900 text-zinc-500 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:text-white transition-all">{t.keepBtn[lang]}</button>
                </div>
              </div>
            )}
          </section>

          {/* Step 4: Spec & Render */}
          <section className="mt-auto space-y-4">
            <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">{t.step_specs[lang]}</h4>
            <SpecBar params={specs} onChange={setSpecs} lang={lang} />
            <button 
              onClick={activeScene.inputMode === InputMode.NINE_GRID ? handleGenerate9Grid : handleRender}
              disabled={(!activeScene.prompt_input && !activeScene.image_start) || !!loading}
              className="w-full py-5 bg-white text-black font-black uppercase tracking-[0.4em] text-[11px] rounded-2xl hover:bg-zinc-200 transition-all disabled:opacity-30 shadow-[0_10px_40px_rgba(0,0,0,0.4)] active:scale-95 duration-100"
            >
              {activeScene.inputMode === InputMode.NINE_GRID ? t.generateGrid[lang] : t.renderBtn[lang]}
            </button>
          </section>
        </aside>

        {/* Cinematic Canvas */}
        <main className="flex-1 relative bg-[#0B0D10] flex flex-col p-8 overflow-hidden">
          <div className="relative flex-1 bg-[#10141A]/40 rounded-[28px] border border-white/5 flex items-center justify-center overflow-hidden shadow-[inset_0_10px_40px_rgba(0,0,0,0.6)]">
            
            {/* Viewfinder Corners */}
            <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5 m-6 z-20">
               <div className="absolute top-0 left-0 w-12 h-12 border-t-[1px] border-l-[1px] border-white/20" />
               <div className="absolute top-0 right-0 w-12 h-12 border-t-[1px] border-r-[1px] border-white/20" />
               <div className="absolute bottom-0 left-0 w-12 h-12 border-b-[1px] border-l-[1px] border-white/20" />
               <div className="absolute bottom-0 right-0 w-12 h-12 border-b-[1px] border-r-[1px] border-white/20" />
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-px bg-white/10" />
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-px bg-white/10" />
            </div>

            {activeScene.video_url ? (
              <video src={activeScene.video_url} controls autoPlay loop className="w-full h-full object-cover animate-in fade-in duration-1000" />
            ) : activeScene.nine_grid_images ? (
              <div className="grid grid-cols-3 gap-3 p-10 w-full h-full overflow-y-auto custom-scrollbar">
                {activeScene.nine_grid_images.map((img, i) => (
                  <div key={i} className="aspect-video relative rounded-2xl overflow-hidden border border-white/10 group cursor-pointer shadow-xl hover:scale-105 transition-all">
                    <img src={img} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-[#3B82F6]/30 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                       <button className="px-5 py-2 bg-white text-black text-[9px] font-black uppercase rounded-full shadow-2xl">Select Frame</button>
                    </div>
                  </div>
                ))}
                <div className="col-span-3 flex justify-center pt-8">
                  <button className="px-10 py-3 bg-[#1B2430] text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-[#3B82F6]/30 hover:bg-[#3B82F6] transition-all shadow-xl">
                    {t.createScenes[lang]}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4 z-10">
                {loading ? (
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-12 h-12 border-2 border-[#3B82F6]/10 border-t-[#3B82F6] rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white animate-pulse">{t[loading as keyof typeof t]?.[lang] || loading}</p>
                  </div>
                ) : (
                  <div className="animate-in fade-in duration-1000">
                    <div className="text-8xl opacity-[0.03] font-heading font-black mb-8 select-none">AVNE</div>
                    <h3 className="text-[14px] font-black uppercase tracking-[0.5em] text-zinc-500 mb-2">{t.awaitingVis[lang]}</h3>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-700">{t.awaitingSub[lang]}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="h-10 flex items-center justify-between px-6 mt-4">
             <div className="flex gap-8 items-center">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                  <span className="text-[9px] font-mono text-zinc-600 tracking-widest uppercase">REC_LIVE</span>
                </div>
                <span className="text-[9px] font-mono text-zinc-700 tracking-widest uppercase opacity-60">VE-3.1-SYS-ONLINE</span>
             </div>
             <div className="text-[9px] font-mono text-zinc-600 tracking-widest uppercase bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                {project.visualMode} · {activeScene.inputMode} · {specs.resolution}
             </div>
          </div>
        </main>

        <DNAPanel 
          dna={project.spatial_dna} 
          onChange={(newDna) => setProject({ ...project, spatial_dna: newDna })}
          lang={lang}
        />
      </div>
    </div>
  );
};

export default App;
