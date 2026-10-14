import { useState, useRef } from 'react';
import type { Scene } from '@/types';
import { SAMPLE_PANORAMAS } from '@/utils/samplePanoramas';
import { Button, Modal, Input } from '@/components/ui';
import { Plus, Home, Trash2, Edit2, Check, X, Sparkles, Upload, Image as ImageIcon, Camera } from 'lucide-react';

interface SceneManagerProps {
  scenes: Scene[];
  currentSceneId: string | null;
  startSceneId: string | null;
  onSelectScene: (sceneId: string) => void;
  onAddSceneFile: (file: File, title: string) => Promise<void>;
  onAddSampleScene: (sample: typeof SAMPLE_PANORAMAS[0]) => Promise<void>;
  onUpdateScene: (sceneId: string, data: Partial<Scene>) => Promise<void>;
  onDeleteScene: (sceneId: string) => Promise<void>;
  onSetStartScene: (sceneId: string) => Promise<void>;
  onSetInitialView: (sceneId: string) => Promise<void>;
}

export function SceneManager({
  scenes,
  currentSceneId,
  startSceneId,
  onSelectScene,
  onAddSceneFile,
  onAddSampleScene,
  onUpdateScene,
  onDeleteScene,
  onSetStartScene,
  onSetInitialView,
}: SceneManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  const handleStartRename = (scene: Scene) => {
    setEditingSceneId(scene.id);
    setEditingTitle(scene.title);
  };

  const handleSaveRename = async (sceneId: string) => {
    if (editingTitle.trim()) {
      await onUpdateScene(sceneId, { title: editingTitle.trim() });
    }
    setEditingSceneId(null);
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadLoading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const defaultTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        await onAddSceneFile(file, defaultTitle);
      }
      setShowAddModal(false);
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleChooseSample = async (sample: typeof SAMPLE_PANORAMAS[0]) => {
    setUploadLoading(true);
    try {
      await onAddSampleScene(sample);
      setShowAddModal(false);
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 p-2 overflow-x-auto no-scrollbar">
        {scenes.map((scene, idx) => {
          const isActive = scene.id === currentSceneId;
          const isStart = scene.id === startSceneId || (idx === 0 && !startSceneId);

          return (
            <div
              key={scene.id}
              onClick={() => onSelectScene(scene.id)}
              className={`group relative flex-shrink-0 flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? 'bg-primary-500/15 border-primary-500/60 shadow-lg shadow-primary-500/10'
                  : 'bg-dark-900/90 border-dark-800 hover:border-dark-700 hover:bg-dark-800'
              }`}
            >
              {/* Thumbnail */}
              <div className="relative w-12 h-10 rounded-lg overflow-hidden bg-dark-800 flex-shrink-0">
                <img
                  src={scene.thumbnailUrl || scene.imageUrl}
                  alt={scene.title}
                  className="w-full h-full object-cover"
                />
                {isStart && (
                  <div className="absolute top-1 left-1 p-0.5 rounded bg-primary-500 text-white" title="Tour Starting Scene">
                    <Home className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>

              {/* Title / Renaming */}
              <div className="min-w-0 max-w-[130px]">
                {editingSceneId === scene.id ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(scene.id);
                        if (e.key === 'Escape') setEditingSceneId(null);
                      }}
                      className="px-1.5 py-0.5 rounded bg-dark-950 border border-primary-500 text-xs text-white w-24 focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveRename(scene.id)}
                      className="p-1 rounded text-primary-400 hover:bg-dark-800"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <p className={`text-xs font-medium truncate ${isActive ? 'text-white' : 'text-dark-300 group-hover:text-white'}`}>
                      {scene.title}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartRename(scene);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-dark-400 hover:text-white transition-opacity"
                      title="Rename Scene"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
                <p className="text-[10px] text-dark-500">Scene {idx + 1}</p>
              </div>

              {/* Scene Quick Actions */}
              <div className="flex items-center gap-1 pl-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                {!isStart && (
                  <button
                    type="button"
                    onClick={() => onSetStartScene(scene.id)}
                    className="p-1 rounded-md text-dark-400 hover:text-primary-400 hover:bg-dark-800 transition-colors"
                    title="Make this the Tour Start Scene"
                  >
                    <Home className="w-3 h-3" />
                  </button>
                )}
                {scenes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onDeleteScene(scene.id)}
                    className="p-1 rounded-md text-dark-400 hover:text-red-400 hover:bg-dark-800 transition-colors"
                    title="Delete Scene"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add Scene Button */}
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setShowAddModal(true)}
          className="flex-shrink-0 h-10 px-3 rounded-xl border-dashed border-dark-700 bg-dark-900/60 hover:bg-dark-800"
          leftIcon={<Plus className="w-4 h-4 text-primary-400" />}
        >
          Add Scene
        </Button>
      </div>

      {/* Add Scene Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add 360° Scene"
        description="Upload an equirectangular panorama image or choose from presets"
        size="lg"
      >
        <div className="space-y-6">
          {/* File Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-dark-700 hover:border-primary-500/60 bg-dark-900/40 hover:bg-primary-500/5 cursor-pointer transition-all text-center"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleFileInputChange}
            />
            <div className="p-3.5 rounded-2xl bg-dark-800 text-primary-400 group-hover:scale-110 transition-transform mb-3 shadow-xl">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white">Click or drag & drop 360° photos here</p>
            <p className="text-xs text-dark-400 mt-1">JPEG, PNG, WebP up to 50MB (ideal aspect ratio ~2:1)</p>
          </div>

          {/* Preset Panoramas */}
          <div className="space-y-3 pt-2 border-t border-dark-800">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-dark-400">
              <Sparkles className="w-3.5 h-3.5 text-primary-400" />
              <span>Or choose from curated 360° presets</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SAMPLE_PANORAMAS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleChooseSample(preset)}
                  className="group relative rounded-xl overflow-hidden border border-dark-800 hover:border-primary-500/60 bg-dark-900 cursor-pointer transition-all hover:scale-[1.02] shadow-lg"
                >
                  <div className="aspect-[16/10] bg-dark-950 overflow-hidden">
                    <img
                      src={preset.thumbnailUrl}
                      alt={preset.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold text-white truncate">{preset.title}</p>
                    <p className="text-[10px] text-dark-400">{preset.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
