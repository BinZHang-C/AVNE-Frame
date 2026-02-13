
export const t = {
  archMode: { zh: '建筑', en: 'Arch' },
  interiorMode: { zh: '室内', en: 'Interior' },
  export: { zh: '导出叙事', en: 'Export' },
  
  // Section Headers
  step_input: { zh: '1. 输入方式', en: '1. Input Mode' },
  step_camera: { zh: '2. 镜头运动路径', en: '2. Camera Path' },
  step_intent: { zh: '3. 设计意图', en: '3. Design Intent' },
  step_specs: { zh: '4. 生成规格', en: '4. Specifications' },

  // Input Modes
  input_text: { zh: '文生视频', en: 'Text to Video' },
  input_image: { zh: '图生视频', en: 'Image to Video' },
  input_grid: { zh: '九宫格镜头生成', en: '9-Grid Gen' },
  input_frames: { zh: '首尾帧视频', en: 'First/Last' },

  // Camera Paths
  path_dolly_in: { zh: '中轴推进 (Dolly In)', en: 'Dolly In' },
  path_dolly_out: { zh: '中轴后退 (Dolly Out)', en: 'Dolly Out' },
  path_truck_left: { zh: '向左平移 (Truck L)', en: 'Truck Left' },
  path_truck_right: { zh: '向右平移 (Truck R)', en: 'Truck Right' },
  path_orbit: { zh: '中心环绕 (Orbit)', en: 'Orbit' },
  path_low_angle_push: { zh: '仰角前景推进', en: 'Low-angle Push' },
  path_top_down_drop: { zh: '俯视下降', en: 'Top-down Drop' },
  path_static: { zh: '静止观察', en: 'Static View' },

  // Controls
  promptPlaceholder: { zh: '描述空间的体量感、材质逻辑 or 光影节奏...', en: 'Describe volumes, material logic, or light rhythm...' },
  optimizeBtn: { zh: '优化表达', en: 'Optimize Expression' },
  applyBtn: { zh: '应用优化', en: 'Apply' },
  keepBtn: { zh: '保留原文', en: 'Original' },
  renderBtn: { zh: '生成叙事', en: 'Simulate' },
  generateGrid: { zh: '生成九宫格', en: 'Generate 9-Grid' },
  createScenes: { zh: '一键创建场景', en: 'Create Scenes' },

  // Specs
  resolution: { zh: '分辨率', en: 'Res' },
  duration: { zh: '时长', en: 'Dur' },
  quality: { zh: '质量档', en: 'Quality' },
  mode: { zh: '模式', en: 'Mode' },
  
  quality_sketch: { zh: '草图级', en: 'Sketch' },
  quality_expression: { zh: '表达级', en: 'Express' },
  quality_report: { zh: '汇报级', en: 'Report' },
  
  mode_fast: { zh: '快速预览', en: 'Fast' },
  mode_high: { zh: '高质量', en: 'HQ' },
  mode_frame: { zh: '帧控制', en: 'Frame' },

  // DNA
  spatialDNA: { zh: '视觉一致性 (Spatial DNA)', en: 'Spatial DNA' },
  dnaLocks: { zh: '一致性参数已激活', en: 'DNA Alignment Active' },
  textureRef: { zh: '表面纹理参考', en: 'Surface Texture' },
  reflectivity: { zh: '物理反射', en: 'Reflectivity' },
  roughness: { zh: '微观粗糙度', en: 'Roughness' },

  // States
  awaitingVis: { zh: '准备生成预览', en: 'Ready to Simulate' },
  awaitingSub: { zh: '选择输入方式并点击生成', en: 'Select input and simulate' },
  rendering: { zh: '正在模拟空间叙事...', en: 'Simulating Narrative...' },
  optimizing: { zh: '正在优化逻辑表达...', en: 'Optimizing Logic...' },
  authBtn: { zh: '初始化引擎 (Select Key)', en: 'Initialize Engine' },

  // Scene Editor & Card specific
  progAnalyze: { zh: '正在分析空间逻辑...', en: 'Analyzing spatial logic...' },
  progPrep: { zh: '正在准备渲染引擎...', en: 'Preparing render engine...' },
  narrativeGoal: { zh: '叙事目标', en: 'Narrative Goal' },
  cameraMovement: { zh: '镜头运动', en: 'Camera Movement' },
  primaryPrompt: { zh: '初步意图', en: 'Primary Intent' },
  enhanceBtn: { zh: '强化表达', en: 'Enhance' },
  dnaSync: { zh: 'DNA 同步状态', en: 'DNA Sync Status' },
  startFrame: { zh: '起始帧', en: 'Start Frame' },
  endFrame: { zh: '结束帧', en: 'End Frame' },
  tabText: { zh: '文字生成', en: 'Text' },
  tabImg: { zh: '图片参考', en: 'Image' },
  tabFrames: { zh: '首尾控制', en: 'Frames' },
  uploadImg: { zh: '上传参考图', en: 'Upload Image' },
  endImg: { zh: '上传结束帧', en: 'Upload End Frame' },
  optimize: { zh: '优化', en: 'Optimize' },
  render: { zh: '渲染', en: 'Render' },
  explore: { zh: '探索', en: 'Explore' },
  express: { zh: '表达', en: 'Express' },
  report: { zh: '汇报', en: 'Report' },

  // Narrative Goals
  goal_atmosphere: { zh: '氛围感', en: 'Atmospheric' },
  goal_structure: { zh: '结构性', en: 'Structural' },
  goal_material: { zh: '材质表现', en: 'Material' },
  goal_context: { zh: '环境融合', en: 'Contextual' },

  // Camera Types
  cam_axial_push: { zh: '轴向推进', en: 'Axial Push' },
  cam_panoramic: { zh: '全景扫描', en: 'Panoramic' },
  cam_orbit: { zh: '环绕飞行', en: 'Orbit' },
  cam_static: { zh: '固定机位', en: 'Static' }
};
