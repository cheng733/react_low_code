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

interface EditorState {
  components: ComponentInstance[];
  selectedId: string | null;
  canvas: Partial<CanvasState>;
  history: HistoryItem[];
  historyIndex: number;
  ispreview: boolean;
  showCodePreview: boolean;
  contentRef: React.MutableRefObject<HTMLDivElement >| null;
  addComponent: (component: Partial<ComponentInstance>, cellId?: string) => void;
  deleteComponent: (id: string) => void;
  updateComponent: (id: string, props: Partial<ComponentInstance>) => void;
  updateCanvas: (updates: Partial<CanvasState>) => void;
  selectComponent: (id: string | null) => void;
  moveComponent: (
    id: string,
    parentId: string | null,
    options?: {
      index?: number;
      cellId?: string;
      position?: 'top' | 'right' | 'bottom' | 'left' | 'next-line';
      targetId?: string;
      isSwap?: boolean;
    },
  ) => void;
  setCanvasSize: (size: CanvasSize) => void;
  undo: () => void;
  redo: () => void;
  togglePreview: () => void;
  toggleCodePreview: () => void;
  exportToJSON: () => string;
  importFromJSON: (json: string) => void;
}

const canvasSizeConfig: Record<CanvasSize, { width: number; height: number }> = {
  [CanvasSize.A4]: { width: 794, height: 1123 },
  [CanvasSize.A5]: { width: 559, height: 794 },
  [CanvasSize.FIVE_JOINT]: { width: 400, height: 300 },
};

export const useStore = create<EditorState>()(
  immer((set, get) => ({
    components: [],
    selectedId: null,
    canvas: {
      size: CanvasSize.A4,
      ...canvasSizeConfig[CanvasSize.A4],
      padding:'10px'
    },
    history: [],
    historyIndex: -1,
    ispreview: false,
    showCodePreview: false,
    contentRef: null,
    saveContentRef: (ref) => {
      set((state) => {
        state.contentRef = ref;
      });
    },
    updateComponent: (id, props) => {
      set((state) => {
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

        const findParentAndAddComponent = (
          components: ComponentInstance[],
          parentId: string,
          component: ComponentInstance,
          options: {
            index?: number;
            cellId?: string;
            position?: 'top' | 'right' | 'bottom' | 'left' | 'next-line';
            targetId?: string;
            isSwap?: boolean;
          } = {},
        ): ComponentInstance[] => {
          return components.map((comp) => {
            if (options.isSwap && options.targetId && comp.id === options.targetId) {
              if (options.cellId) {
                component.props = {
                  ...component.props,
                  cellId: options.cellId,
                };
              }

              // 查找目标组件的父组件
              const findParentComponent = (
                comps: ComponentInstance[],
                childId: string,
              ): ComponentInstance | null => {
                for (const c of comps) {
                  if (c.children && c.children.some((child) => child.id === childId)) {
                    return c;
                  }
                  if (c.children) {
                    const parent = findParentComponent(c.children, childId);
                    if (parent) return parent;
                  }
                }
                return null;
              };

              // 查找目标组件的父组件
              const targetParent = findParentComponent(state.components, options.targetId);

              if (targetParent && targetParent.children) {
                // 查找目标组件在父组件中的索引
                const targetIndex = targetParent.children.findIndex(
                  (child) => child.id === options.targetId,
                );

                if (targetIndex !== -1) {
                  // 处理 next-line 位置
                  if (options.position === 'next-line') {
                    // 设置组件样式，使其显示在下一行
                    component.props = {
                      ...component.props,
                      style: {
                        ...component.props?.style,
                        display: 'block',
                        width: 'auto',
                        marginTop: '4px',
                        clear: 'both', // 确保组件显示在新行
                      },
                    };

                    // 将组件插入到目标位置后面
                    targetParent.children = [
                      ...targetParent.children.slice(0, targetIndex + 1),
                      component,
                      ...targetParent.children.slice(targetIndex + 1),
                    ];
                  } else {
                    // 根据位置确定插入位置
                    let insertIndex = targetIndex;
                    if (options.position === 'bottom' || options.position === 'right') {
                      insertIndex = targetIndex + 1;
                    }

                    // 将组件插入到目标位置
                    targetParent.children = [
                      ...targetParent.children.slice(0, insertIndex),
                      component,
                      ...targetParent.children.slice(insertIndex),
                    ];
                  }

                  // 更新组件的父组件ID
                  component.parentId = targetParent.id;

                  // 如果有单元格ID，确保设置正确
                  if (options.cellId) {
                    component.props = {
                      ...component.props,
                      cellId: options.cellId,
                    };
                  }

                  return comp;
                }
              }
            }

            // 原有逻辑：如果找到指定的父组件，将组件添加到其子组件列表中
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
              if (options.position && options.targetId && comp.children) {
                const targetIndex = comp.children.findIndex(
                  (child) => child.id === options.targetId,
                );

                if (targetIndex !== -1) {
                  // 处理 next-line 位置
                  if (options.position === 'next-line') {
                    // 设置组件样式，使其显示在下一行
                    component.props = {
                      ...component.props,
                      style: {
                        ...component.props?.style,
                        display: 'block',
                        width: 'auto',
                        marginTop: '4px',
                        clear: 'both', // 确保组件显示在新行
                      },
                    };

                    // 将组件插入到目标位置后面
                    comp.children = [
                      ...comp.children.slice(0, targetIndex + 1),
                      component,
                      ...comp.children.slice(targetIndex + 1),
                    ];
                  } else {
                    // 根据位置确定插入位置
                    let insertIndex = targetIndex;
                    if (options.position === 'bottom' || options.position === 'right') {
                      insertIndex = targetIndex + 1;
                    }

                    // 将组件插入到目标位置
                    comp.children = [
                      ...comp.children.slice(0, insertIndex),
                      component,
                      ...comp.children.slice(insertIndex),
                    ];
                  }
                } else {
                  // 如果找不到目标组件，添加到末尾
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

              // 更新组件的父组件ID
              component.parentId = comp.id;

              // 更新容器高度以适应子组件
              comp.props = {
                ...comp.props,
                style: {
                  ...comp.props?.style,
                  height: Math.min(
                    state.canvas.height,
                    (comp.children || []).reduce((sum, child) => {
                      const height = child.props?.style?.height || 0;
                      return sum + (typeof height === 'number' ? height : 0);
                    }, 0),
                  ),
                },
              };
            } else if (comp.children) {
              // 递归查找父组件
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
          // 如果设置了 isSwap 标志，则进行组件位置交换
          if (options.isSwap && options.targetId) {
            // 查找目标组件所在的父组件
            const findTargetParent = (
              comps: ComponentInstance[],
              targetId: string,
            ): string | null => {
              for (const c of comps) {
                if (c.children && c.children.some((child) => child.id === targetId)) {
                  return c.id;
                }
                if (c.children) {
                  const parentId = findTargetParent(c.children, targetId);
                  if (parentId) return parentId;
                }
              }
              return null;
            };

            const targetParentId = findTargetParent(state.components, options.targetId) || parentId;

            // 使用目标组件的父组件ID
            state.components = findParentAndAddComponent(
              state.components,
              targetParentId,
              foundComponent,
              options,
            );
          } else {
            // 使用指定的父组件ID
            state.components = findParentAndAddComponent(
              state.components,
              parentId || '',
              foundComponent,
              options,
            );
          }

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
      const newComponent: Partial<ComponentInstance> = {
        id: `${component.type}-${Date.now()}`,
        type: component.type!,
        category: component.category!,
        props: {
          ...component.props,
          ...(cellId ? { cellId } : {}),
        },
        children: component.children || [],
        parentId: component.parentId || null,
      };

      set((state) => {
        const willExceedCanvasHeight = () => {
          if (!newComponent.parentId) {
            const totalHeight = state.components.reduce((sum, comp) => {
              const height = comp.props?.style?.height || 0;
              return sum + (typeof height === 'number' ? height : 0);
            }, 0);

            const newComponentHeight = newComponent.props?.style?.height || 0;
            return (
              totalHeight + (typeof newComponentHeight === 'number' ? newComponentHeight : 0) >
              state.canvas.height
            );
          }

          const calculateContainerHeight = (
            components: ComponentInstance[],
            parentId: string,
          ): number => {
            for (const comp of components) {
              if (comp.id === parentId) {
                const childrenHeight = (comp.children || []).reduce((sum, child) => {
                  const height = child.props?.style?.height || 0;
                  return sum + (typeof height === 'number' ? height : 0);
                }, 0);

                const newComponentHeight = newComponent.props?.style?.height || 0;
                return (
                  childrenHeight + (typeof newComponentHeight === 'number' ? newComponentHeight : 0)
                );
              }

              if (comp.children && comp.children.length > 0) {
                const height = calculateContainerHeight(comp.children, parentId);
                if (height > 0) return height;
              }
            }
            return 0;
          };

          if (newComponent.parentId) {
            const containerHeight = calculateContainerHeight(
              state.components,
              newComponent.parentId,
            );
            return containerHeight > state.canvas.height;
          }

          return false;
        };


        if (willExceedCanvasHeight()) {
          console.warn('添加组件将超出画布高度限制，无法添加');
          return;
        }

        if (newComponent.parentId) {
          const addChildToParent = (
            components: ComponentInstance[],
            parentId: string,
            child: ComponentInstance,
          ): ComponentInstance[] => {
            return components.map((comp) => {
              if (comp.id === parentId) {
                // 如果找到父组件，将新组件添加到其children中
                return {
                  ...comp,
                  children: [...(comp.children || []), child],
                  props: {
                    ...comp.props,
                    style: {
                      ...comp.props?.style,
                      // 更新容器高度以适应子组件
                      height: Math.min(
                        state.canvas.height,
                        (comp.children || []).reduce((sum, c) => {
                          const height = c.props?.style?.height || 0;
                          return sum + (typeof height === 'number' ? height : 0);
                        }, 0) + (child.props?.style?.height || 0),
                      ),
                    },
                  },
                };
              }
              if (comp.children && comp.children.length > 0) {
                // 递归查找子组件
                comp.children = addChildToParent(comp.children, parentId, child);
              }
              return comp;
            });
          };

          state.components = addChildToParent(
            state.components,
            newComponent.parentId,
            newComponent,
          );
        } else {
          // 如果没有指定父组件，则添加到根级别
          state.components.push(newComponent);
        }

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
      get().selectComponent(newComponent.id);
    },
    // 添加删除组件方法
    deleteComponent: (id) => {
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
    // 添加复制组件方法
    duplicateComponent: (id: string) => {},
    updateCanvas: (updates) => {
      set((state) => {
        const newCanvas = { ...state.canvas };

        // 处理普通属性
        Object.keys(updates).forEach((key) => {
          if (key !== 'style') {
            newCanvas[key] = updates[key];
          }
        });

        // 处理样式属性
        if (updates.style) {
          if (!newCanvas.style) {
            newCanvas.style = {};
          }
          newCanvas.style = { ...newCanvas.style, ...updates.style };
        }

        console.log('Updated canvas:', newCanvas);
        return { canvas: newCanvas };
      });
    },
  })),
);
