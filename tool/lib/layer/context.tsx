"use client";

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import {
  CanvasState,
  Layer,
  TextLayer,
  ImageLayer,
  LayerAction,
  DEFAULT_CANVAS_STATE,
  createTextLayer,
  createImageLayer,
} from './types';
import { layerReducer } from './reducer';

interface LayerContextValue {
  state: CanvasState;
  dispatch: React.Dispatch<LayerAction>;
  
  // 便捷方法
  addTextLayer: (content?: string) => void;
  addImageLayer: (src: string, width: number, height: number) => void;
  setBackgroundImage: (src: string, width: number, height: number) => void;
  removeBackgroundImage: () => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  removeLayer: (id: string) => void;
  selectLayer: (id: string | null) => void;
  getSelectedLayer: () => Layer | null;
}

const LayerContext = createContext<LayerContextValue | null>(null);

export function LayerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(layerReducer, DEFAULT_CANVAS_STATE);

  const addTextLayer = useCallback((content?: string) => {
    const layer = createTextLayer(
      content ? { content } : {},
      state.width,
      state.height
    );
    dispatch({ type: 'ADD_LAYER', layer });
  }, [state.width, state.height]);

  const addImageLayer = useCallback((src: string, width: number, height: number) => {
    const layer = createImageLayer(src, width, height, state.width, state.height);
    dispatch({ type: 'ADD_LAYER', layer });
  }, [state.width, state.height]);

  const setBackgroundImage = useCallback((src: string, width: number, height: number) => {
    const layer: ImageLayer = {
      id: 'background',
      type: 'image',
      name: '底图',
      src,
      x: state.width / 2,
      y: state.height / 2,
      width: state.width,
      height: state.height,
      originalWidth: width,
      originalHeight: height,
      rotation: 0,
      visible: true,
      locked: true,
      opacity: 1,
    };
    // 调整画布大小以匹配底图
    dispatch({ type: 'SET_CANVAS_SIZE', width, height });
    dispatch({ type: 'SET_BACKGROUND_IMAGE', layer: { ...layer, x: width / 2, y: height / 2, width, height } });
  }, [state.width, state.height]);

  const removeBackgroundImage = useCallback(() => {
    dispatch({ type: 'SET_BACKGROUND_IMAGE', layer: null });
  }, []);

  const updateLayer = useCallback((id: string, updates: Partial<Layer>) => {
    dispatch({ type: 'UPDATE_LAYER', id, updates });
  }, []);

  const removeLayer = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_LAYER', id });
  }, []);

  const selectLayer = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_LAYER', id });
  }, []);

  const getSelectedLayer = useCallback(() => {
    if (!state.selectedLayerId) return null;
    return state.layers.find((l) => l.id === state.selectedLayerId) || null;
  }, [state.selectedLayerId, state.layers]);

  const value: LayerContextValue = {
    state,
    dispatch,
    addTextLayer,
    addImageLayer,
    setBackgroundImage,
    removeBackgroundImage,
    updateLayer,
    removeLayer,
    selectLayer,
    getSelectedLayer,
  };

  return (
    <LayerContext.Provider value={value}>
      {children}
    </LayerContext.Provider>
  );
}

export function useLayerContext() {
  const context = useContext(LayerContext);
  if (!context) {
    throw new Error('useLayerContext must be used within a LayerProvider');
  }
  return context;
}
