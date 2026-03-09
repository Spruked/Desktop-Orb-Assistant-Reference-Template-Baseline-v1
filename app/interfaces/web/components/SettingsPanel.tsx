import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Slider } from './ui/slider';


export interface SettingsPanelProps {
  wakeWord: string;
  setWakeWord: React.Dispatch<React.SetStateAction<string>>;
  spinozaColor: string;
  setSpinozaColor: React.Dispatch<React.SetStateAction<string>>;
  kantColor: string;
  setKantColor: React.Dispatch<React.SetStateAction<string>>;
  lockeColor: string;
  setLockeColor: React.Dispatch<React.SetStateAction<string>>;
  humeColor: string;
  setHumeColor: React.Dispatch<React.SetStateAction<string>>;
  repulsionRadius: number;
  setRepulsionRadius: React.Dispatch<React.SetStateAction<number>>;
  glideSpeed: number;
  setGlideSpeed: React.Dispatch<React.SetStateAction<number>>;
  orbScale: number;
  setOrbScale: React.Dispatch<React.SetStateAction<number>>;
  onSave: () => void;
  onRestoreDefaults: () => void;
}


export function SettingsPanel({
  wakeWord,
  setWakeWord,
  spinozaColor,
  setSpinozaColor,
  kantColor,
  setKantColor,
  lockeColor,
  setLockeColor,
  humeColor,
  setHumeColor,
  repulsionRadius,
  setRepulsionRadius,
  glideSpeed,
  setGlideSpeed,
  orbScale,
  setOrbScale,
  onSave,
  onRestoreDefaults,
}: SettingsPanelProps) {

  return (
    <div className="bg-white rounded-lg shadow-2xl w-[400px] border border-neutral-300">
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-200">
        <h2 className="text-lg font-normal text-neutral-800">Cali Settings</h2>
      </div>

      {/* Content */}
      <div className="px-6 py-5 space-y-4">
        {/* Wake Word */}
        <div className="flex items-center justify-between">
          <Label className="text-sm font-normal text-neutral-800 w-32">Wake Word:</Label>
          <Input
            value={wakeWord}
            onChange={(e) => setWakeWord(e.target.value)}
            className="flex-1 h-8 px-2 text-sm border border-neutral-300 rounded"
          />
        </div>

        {/* Mood Sensitivity */}
        <div className="flex items-center justify-between gap-3">
          <Label className="text-sm font-normal text-neutral-800 w-32">Mood Sensitivity:</Label>
          <Slider min={0} max={100} value={[50]} className="flex-1" />
        </div>

        {/* Tension Threshold */}
        <div className="flex items-center justify-between gap-3">
          <Label className="text-sm font-normal text-neutral-800 w-32">Tension Threshold:</Label>
          <Slider min={0} max={100} value={[50]} className="flex-1" />
        </div>

        {/* Visual Intensity */}
        <div className="flex items-center justify-between gap-3">
          <Label className="text-sm font-normal text-neutral-800 w-32">Visual Intensity:</Label>
          <Slider min={0} max={100} value={[50]} className="flex-1" />
        </div>

        {/* Repulsion Radius */}
        <div className="flex items-center justify-between gap-3">
          <Label className="text-sm font-normal text-neutral-800 w-32">Repulsion Radius:</Label>
          <Slider
            value={[repulsionRadius]}
            onValueChange={([value]) => setRepulsionRadius(value)}
            min={0}
            max={100}
            step={1}
            className="flex-1"
          />
        </div>

        {/* Glide Speed */}
        <div className="flex items-center justify-between gap-3">
          <Label className="text-sm font-normal text-neutral-800 w-32">Glide Speed:</Label>
          <Slider
            value={[glideSpeed]}
            onValueChange={([value]) => setGlideSpeed(value)}
            min={0}
            max={100}
            step={1}
            className="flex-1"
          />
        </div>

        {/* Orb Scale */}
        <div className="flex items-center justify-between gap-3">
          <Label className="text-sm font-normal text-neutral-800 w-32">Orb Scale (%):</Label>
          <Slider
            value={[orbScale]}
            onValueChange={([value]) => setOrbScale(value)}
            min={50}
            max={150}
            step={1}
            className="flex-1"
          />
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="px-6 py-4 flex gap-3">
        <Button
          onClick={onSave}
          variant="outline"
          className="flex-1 h-9 text-sm font-normal bg-neutral-100 hover:bg-neutral-200 border border-neutral-400 rounded"
        >
          Save
        </Button>
        <Button
          onClick={onRestoreDefaults}
          variant="outline"
          className="flex-1 h-9 text-sm font-normal bg-neutral-100 hover:bg-neutral-200 border border-neutral-400 rounded"
        >
          Restore Defaults
        </Button>
      </div>
    </div>
  );
}
