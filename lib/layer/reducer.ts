// 图层状态管理 Reducer

import {
  CanvasState,
  Layer,
  LayerAction,
  DEFAULT_CANVAS_STATE,
  generateId,
} from './types';

export function layerReducer(state: CanvasState, action: LayerAction): CanvasState {
  switch (action.type) {
    case 'SET_CANVAS_SIZE':
      return {
        ...state,
        width: action.width,
        height: action.height,
      };

    case 'SET_BACKGROUND_COLOR':
      return {
        ...state,
        backgroundColor: action.color,
      };

    case 'SET_BACKGROUND_IMAGE':
      return {
        ...state,
        backgroundImage: action.layer,
      };

    case 'ADD_LAYER':
      return {
        ...state,
        layers: [...state.layers, action.layer],
        selectedLayerId: action.layer.id,
      };

    case 'REMOVE_LAYER': {
      const newLayers = state.layers.filter((l) => l.id !== action.id);
      return {
        ...state,
        layers: newLayers,
        selectedLayerId:
          state.selectedLayerId === action.id ? null : state.selectedLayerId,
      };
    }

    case 'UPDATE_LAYER': {
      return {
        ...state,
        layers: state.layers.map((layer) =>
          layer.id === action.id
            ? ({ ...layer, ...action.updates } as Layer)
            : layer
        ),
      };
    }

    case 'SELECT_LAYER':
      return {
        ...state,
        selectedLayerId: action.id,
      };

    case 'REORDER_LAYERS': {
      const newLayers = [...state.layers];
      const [removed] = newLayers.splice(action.fromIndex, 1);
      newLayers.splice(action.toIndex, 0, removed);
      return {
        ...state,
        layers: newLayers,
      };
    }

    case 'MOVE_LAYER_UP': {
      const index = state.layers.findIndex((l) => l.id === action.id);
      if (index === -1) return state;
      if (index < state.layers.length - 1) {
        const newLayers = [...state.layers];
        const temp = newLayers[index];
        newLayers[index] = newLayers[index + 1];
        newLayers[index + 1] = temp;
        return { ...state, layers: newLayers };
      }
      return state;
    }

    case 'MOVE_LAYER_DOWN': {
      const index = state.layers.findIndex((l) => l.id === action.id);
      if (index === -1) return state;
      if (index > 0) {
        const newLayers = [...state.layers];
        const temp = newLayers[index];
        newLayers[index] = newLayers[index - 1];
        newLayers[index - 1] = temp;
        return { ...state, layers: newLayers };
      }
      return state;
    }

    case 'DUPLICATE_LAYER': {
      const layer = state.layers.find((l) => l.id === action.id);
      if (layer) {
        const newLayer: Layer = {
          ...layer,
          id: generateId(),
          name: `${layer.name} 副本`,
          x: layer.x + 20,
          y: layer.y + 20,
        };
        return {
          ...state,
          layers: [...state.layers, newLayer],
          selectedLayerId: newLayer.id,
        };
      }
      return state;
    }

    case 'TOGGLE_LAYER_VISIBILITY': {
      return {
        ...state,
        layers: state.layers.map((layer) =>
          layer.id === action.id ? { ...layer, visible: !layer.visible } : layer
        ),
      };
    }

    case 'TOGGLE_LAYER_LOCK': {
      return {
        ...state,
        layers: state.layers.map((layer) =>
          layer.id === action.id ? { ...layer, locked: !layer.locked } : layer
        ),
      };
    }

    case 'LOAD_STATE':
      return action.state;

    case 'RESET':
      return DEFAULT_CANVAS_STATE;

    default:
      return state;
  }
}
