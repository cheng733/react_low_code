import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  ComponentInstance,
  CanvasState,
  CanvasSize,
  HistoryItem,
  HistoryActionType,
  ComponentType,
} from '../types';
import { v4 as uuidv4 } from 'uuid';

interface EditorState {
  // 画布上的组件
  components: ComponentInstance[];
  // 当前选中的组件ID
  selectedId: string | null;
  // 画布状态
  canvas: CanvasState;
  // 历史记录
  history: HistoryItem[];
  // 当前历史记录索引
  historyIndex: number;
  // 是否处于预览模式
  ispreview: boolean;
  // 是否显示代码预览
  showCodePreview: boolean;

  // Actions
  addComponent: (component: Partial<ComponentInstance>, cellId?: string) => void;
  removeComponent: (id: string) => void;
  updateComponent: (id: string, props: Partial<ComponentInstance>) => void;
  selectComponent: (id: string | null) => void;
  moveComponent: (id: string, parentId: string | null, index?: number) => void;
  setCanvasSize: (size: CanvasSize) => void;
  undo: () => void;
  redo: () => void;
  togglePreview: () => void;
  toggleCodePreview: () => void;
  exportToJSON: () => string;
  importFromJSON: (json: string) => void;
}

// 画布尺寸配置
const canvasSizeConfig: Record<CanvasSize, { width: number; height: number }> = {
  [CanvasSize.A4]: { width: 794, height: 1123 }, // A4 尺寸 (px)
  [CanvasSize.A5]: { width: 559, height: 794 }, // A5 尺寸 (px)
  [CanvasSize.FIVE_JOINT]: { width: 241, height: 140 }, // 五联纸尺寸 (px)
};

export const useStore = create<EditorState>()(
  immer((set, get) => ({
    components: [],
    selectedId: null,
    canvas: {
      size: CanvasSize.A4,
      ...canvasSizeConfig[CanvasSize.A4],
      scale: 1,
    },
    history: [],
    historyIndex: -1,
    ispreview: false,
    showCodePreview: false,

    // 添加组件
    // addComponent: (component) => {
    //   const newComponent = {
    //     ...component,
    //     id: uuidv4(),
    //   };

    //   set((state) => {
    //     // 添加组件到画布
    //     state.components.push(newComponent);

    //     // 添加历史记录
    //     state.history = state.history.slice(0, state.historyIndex + 1);
    //     state.history.push({
    //       actionType: HistoryActionType.ADD,
    //       components: [...state.components],
    //       selectedId: newComponent.id,
    //     });
    //     state.historyIndex = state.history.length - 1;

    //     // 选中新添加的组件
    //     state.selectedId = newComponent.id;
    //   });
    // },

    // 移除组件
    removeComponent: (id) => {
      set((state) => {
        // 递归移除组件及其子组件
        const removeComponentById = (
          components: ComponentInstance[],
          id: string,
        ): ComponentInstance[] => {
          return components.filter((comp) => {
            if (comp.id === id) return false;
            if (comp.children) {
              comp.children = removeComponentById(comp.children, id);
            }
            return true;
          });
        };

        state.components = removeComponentById(state.components, id);

        // 添加历史记录
        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push({
          actionType: HistoryActionType.REMOVE,
          components: [...state.components],
          selectedId: null,
        });
        state.historyIndex = state.history.length - 1;

        // 取消选中
        state.selectedId = null;
      });
    },

    // 更新组件
    updateComponent: (id, props) => {
      set((state) => {
        // 递归查找并更新组件
        const updateComponentById = (
          components: ComponentInstance[],
          id: string,
          props: Partial<ComponentInstance>,
        ) => {
          return components.map((comp) => {
            if (comp.id === id) {
              return { ...comp, ...props };
            }
            if (comp.children) {
              comp.children = updateComponentById(comp.children, id, props);
            }
            return comp;
          });
        };

        state.components = updateComponentById(state.components, id, props);

        // 添加历史记录
        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push({
          actionType: HistoryActionType.UPDATE,
          components: [...state.components],
          selectedId: id,
        });
        state.historyIndex = state.history.length - 1;
      });
    },

    // 选中组件
    selectComponent: (id) => {
      set((state) => {
        // 取消所有组件的选中状态
        const unselectAll = (components: ComponentInstance[]) => {
          return components.map((comp) => {
            comp.selected = false;
            if (comp.children) {
              comp.children = unselectAll(comp.children);
            }
            return comp;
          });
        };

        // 选中指定组件
        const selectById = (components: ComponentInstance[], id: string | null) => {
          return components.map((comp) => {
            if (comp.id === id) {
              comp.selected = true;
            }
            if (comp.children) {
              comp.children = selectById(comp.children, id);
            }
            return comp;
          });
        };

        state.components = unselectAll(state.components);
        if (id) {
          state.components = selectById(state.components, id);
        }
        state.selectedId = id;
      });
    },

    // 移动组件
    moveComponent: (id, parentId, options = {}) => {
      set((state) => {
        // 查找并移除组件
        const findAndRemoveComponent = (
          components: ComponentInstance[],
          id: string,
        ): [ComponentInstance[], ComponentInstance | null] => {
          let foundComponent: ComponentInstance | null = null;
          const newComponents = components.filter((comp) => {
            if (comp.id === id) {
              foundComponent = comp;
              return false;
            }
            if (comp.children) {
              const [newChildren, found] = findAndRemoveComponent(comp.children, id);
              if (found) {
                foundComponent = found;
                comp.children = newChildren;
              }
            }
            return true;
          });
          return [newComponents, foundComponent];
        };

        // 查找父组件并添加组件
        const findParentAndAddComponent = (
          components: ComponentInstance[],
          parentId: string,
          component: ComponentInstance,
          options: {
            index?: number;
            cellId?: string;
            position?: 'top' | 'right' | 'bottom' | 'left';
          } = {},
        ): ComponentInstance[] => {
          return components.map((comp) => {
            if (comp.id === parentId) {
              // 如果是栅格容器，处理单元格
              if (comp.type === ComponentType.GRID && options.cellId) {
                // 设置组件的单元格ID
                component.props = {
                  ...component.props,
                  cellId: options.cellId,
                };
              }

              // 如果指定了位置，根据位置调整顺序
              if (options.position && comp.children) {
                const targetIndex = comp.children.findIndex((child) => child.id === component.id);
                if (targetIndex !== -1) {
                  // 根据位置确定插入点
                  let insertIndex;
                  switch (options.position) {
                    case 'top':
                    case 'left':
                      insertIndex = targetIndex;
                      break;
                    case 'bottom':
                    case 'right':
                      insertIndex = targetIndex + 1;
                      break;
                    default:
                      insertIndex = comp.children.length;
                  }

                  comp.children = [
                    ...comp.children.slice(0, insertIndex),
                    component,
                    ...comp.children.slice(insertIndex),
                  ];
                } else {
                  comp.children = [...(comp.children || []), component];
                }
              } else if (options.index !== undefined && comp.children) {
                // 如果指定了索引，在指定位置插入
                comp.children = [
                  ...comp.children.slice(0, options.index),
                  component,
                  ...comp.children.slice(options.index),
                ];
              } else {
                // 否则添加到末尾
                comp.children = [...(comp.children || []), component];
              }
            } else if (comp.children) {
              comp.children = findParentAndAddComponent(
                comp.children,
                parentId,
                component,
                options,
              );
            }
            return comp;
          });
        };

        // 1. 查找并移除组件
        const [newComponents, foundComponent] = findAndRemoveComponent(state.components, id);
        state.components = newComponents;

        // 2. 如果找到组件，添加到新位置
        if (foundComponent) {
          // 修复：使用 foundComponent 而不是 component
          state.components = findParentAndAddComponent(
            state.components,
            parentId,
            foundComponent,
            options,
          );

          // 添加历史记录
          state.history = state.history.slice(0, state.historyIndex + 1);
          state.history.push({
            actionType: HistoryActionType.MOVE,
            components: [...state.components],
            selectedId: id,
          });
          state.historyIndex = state.history.length - 1;
        }
      });
    },

    // 设置画布尺寸
    setCanvasSize: (size) => {
      set((state) => {
        state.canvas = {
          ...state.canvas,
          size,
          ...canvasSizeConfig[size],
        };
      });
    },

    // 撤销操作
    undo: () => {
      set((state) => {
        if (state.historyIndex > 0) {
          state.historyIndex--;
          const historyItem = state.history[state.historyIndex];
          state.components = historyItem.components;
          state.selectedId = historyItem.selectedId;
        }
      });
    },

    // 重做操作
    redo: () => {
      set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          state.historyIndex++;
          const historyItem = state.history[state.historyIndex];
          state.components = historyItem.components;
          state.selectedId = historyItem.selectedId;
        }
      });
    },

    // 切换预览模式
    togglePreview: () => {
      set((state) => {
        state.ispreview = !state.ispreview;
        if (state.ispreview) {
          state.selectedId = null;
        }
      });
    },

    // 切换代码预览
    toggleCodePreview: () => {
      set((state) => {
        state.showCodePreview = !state.showCodePreview;
      });
    },

    // 导出为JSON
    exportToJSON: () => {
      const { components, canvas } = get();
      return JSON.stringify({ components, canvas });
    },

    // 从JSON导入
    importFromJSON: (json) => {
      try {
        const { components, canvas } = JSON.parse(json);
        set((state) => {
          state.components = components;
          state.canvas = canvas;
          state.selectedId = null;
          state.history = [
            {
              actionType: HistoryActionType.ADD,
              components: [...components],
              selectedId: null,
            },
          ];
          state.historyIndex = 0;
        });
      } catch (error) {
        console.error('导入JSON失败:', error);
      }
    },
    addComponent: (component: Partial<ComponentInstance>, cellId?: string) => {
      const newComponent: ComponentInstance = {
        id: `${component.type}-${Date.now()}`,
        type: component.type!,
        category: component.category!,
        props: {
          ...component.props,
          ...(cellId ? { cellId } : {}),
        },
        children: component.children || [],
      };

      // setComponents([...components, newComponent]);
      set((state) => {
        // 添加组件到画布
        state.components.push(newComponent);

        // 添加历史记录
        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push({
          actionType: HistoryActionType.ADD,
          components: [...state.components],
          selectedId: newComponent.id,
        });
        state.historyIndex = state.history.length - 1;

        // 选中新添加的组件
        state.selectedId = newComponent.id;
      });
      selectComponent(newComponent.id);
    },
    // 添加删除组件方法
    deleteComponent: (id: string) => {},
    // 添加复制组件方法
    duplicateComponent: (id: string) => {},
  })),
);
