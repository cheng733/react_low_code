// 组件类型枚举
export enum ComponentType {
  // 布局组件
  GRID = 'grid',

  // 常规组件
  INPUT = 'input',
  TEXT = 'text',
  IMAGE = 'image',
  // 添加二维码类型
  QRCODE = 'qrcode',

  CANVAS = 'canvas'
}

// 组件分类
export enum ComponentCategory {
  LAYOUT = 'layout',
  GENERAL = 'general',
}

// 画布尺寸类型
export enum CanvasSize {
  A4 = 'a4',
  A5 = 'a5',
  FIVE_JOINT = 'fiveJoint',
}

// 组件定义接口
export interface ComponentDefinition {
  id: string;
  type: ComponentType;
  category: ComponentCategory;
  name: string;
  icon?: string;
  props: Record<string, unknown>;
  children?: ComponentInstance[];
}

// 组件实例接口
export interface ComponentInstance extends ComponentDefinition {
  parentId: string | null;
  selected?: boolean;
}

// 画布状态接口
export interface CanvasState {
  size: CanvasSize;
  width: number;
  height: number;
  padding:string;
  backgroundColor: string;
  style:CSSStyleRule;
}

// 历史记录操作类型
export enum HistoryActionType {
  ADD = 'add',
  REMOVE = 'remove',
  UPDATE = 'update',
  MOVE = 'move',
}

// 历史记录项
export interface HistoryItem {
  actionType: HistoryActionType;
  components: ComponentInstance[];
  selectedId: string | null;
}
