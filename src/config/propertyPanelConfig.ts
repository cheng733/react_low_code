import { ComponentType } from '../types';

// 属性类型定义
export enum PropertyType {
  TEXT = 'text',           // 文本输入
  NUMBER = 'number',       // 数字输入
  SELECT = 'select',       // 下拉选择
  SWITCH = 'switch',       // 开关
  COLOR = 'color',         // 颜色选择器
  SLIDER = 'slider',       // 滑块
  RADIO = 'radio',         // 单选按钮组
  CHECKBOX = 'checkbox',   // 复选框
  TEXTAREA = 'textarea',   // 多行文本
  FONT = 'font',           // 字体选择
  MARGIN = 'margin',       // 外边距设置
  PADDING = 'padding',     // 内边距设置
  BORDER = 'border',       // 边框设置
  BACKGROUND = 'background', // 背景设置
  LAYOUT = 'layout',       // 布局设置
  CUSTOM = 'custom',       // 自定义组件
}

// 属性配置接口
export interface PropertyConfig {
  key: string;             // 属性键名
  label: string;           // 属性标签
  type: PropertyType;      // 属性类型
  defaultValue?: any;      // 默认值
  options?: Array<{        // 选项（用于下拉、单选等）
    label: string;
    value: any;
  }>;
  min?: number;            // 最小值（用于数字、滑块等）
  max?: number;            // 最大值（用于数字、滑块等）
  step?: number;           // 步长（用于数字、滑块等）
  placeholder?: string;    // 占位文本
  description?: string;    // 描述信息
  group?: string;          // 分组
  condition?: (props: any) => boolean; // 条件显示
  onChange?: (value: any, props: any) => any; // 值变化时的回调
}

// 组件属性面板配置
export interface ComponentPropertyConfig {
  type: ComponentType;     // 组件类型
  properties: PropertyConfig[]; // 属性配置列表
}

// 通用样式属性
const commonStyleProperties: PropertyConfig[] = [
  {
    key: 'style.width',
    label: '宽度',
    type: PropertyType.TEXT,
    defaultValue: '100%',
    placeholder: '例如：100px 或 100%',
    group: '尺寸',
  },
  {
    key: 'style.height',
    label: '高度',
    type: PropertyType.TEXT,
    placeholder: '例如：100px 或 auto',
    group: '尺寸',
  },
  {
    key: 'style.margin',
    label: '外边距',
    type: PropertyType.MARGIN,
    group: '间距',
  },
  {
    key: 'style.padding',
    label: '内边距',
    type: PropertyType.PADDING,
    group: '间距',
  },
  {
    key: 'style.backgroundColor',
    label: '背景色',
    type: PropertyType.COLOR,
    group: '外观',
  },
  {
    key: 'style.color',
    label: '文字颜色',
    type: PropertyType.COLOR,
    group: '外观',
  },
  {
    key: 'style.fontSize',
    label: '字体大小',
    type: PropertyType.TEXT,
    placeholder: '例如：14px',
    group: '文字',
  },
  {
    key: 'style.fontWeight',
    label: '字体粗细',
    type: PropertyType.SELECT,
    options: [
      { label: '正常', value: 'normal' },
      { label: '粗体', value: 'bold' },
      { label: '细体', value: '300' },
      { label: '中等', value: '500' },
    ],
    group: '文字',
  },
  {
    key: 'style.textAlign',
    label: '文本对齐',
    type: PropertyType.RADIO,
    options: [
      { label: '左', value: 'left' },
      { label: '中', value: 'center' },
      { label: '右', value: 'right' },
    ],
    group: '文字',
  },
  {
    key: 'style.borderRadius',
    label: '圆角',
    type: PropertyType.TEXT,
    placeholder: '例如：4px',
    group: '边框',
  },
  {
    key: 'style.border',
    label: '边框',
    type: PropertyType.BORDER,
    group: '边框',
  },
  {
    key: 'style.display',
    label: '显示方式',
    type: PropertyType.SELECT,
    options: [
      { label: '块级', value: 'block' },
      { label: '行内块', value: 'inline-block' },
      { label: '弹性布局', value: 'flex' },
      { label: '网格布局', value: 'grid' },
      { label: '不显示', value: 'none' },
    ],
    group: '布局',
  },
  {
    key: 'style.position',
    label: '定位方式',
    type: PropertyType.SELECT,
    options: [
      { label: '静态', value: 'static' },
      { label: '相对', value: 'relative' },
      { label: '绝对', value: 'absolute' },
      { label: '固定', value: 'fixed' },
    ],
    group: '布局',
  },
];

const canvasProperties: PropertyConfig[] = [
  {
    key: 'backgroundColor',
    label: '背景色',
    type: PropertyType.COLOR,
    defaultValue: '#ffffff',
    group: '外观',
  },
  {
    key: 'style.margin',
    label: '外边距',
    type: PropertyType.MARGIN,
    group: '间距',
  },
  {
    key: 'style.padding',
    label: '内边距',
    type: PropertyType.PADDING,
    group: '间距',
  },
  // 添加字体相关属性 - 使用与组件一致的键名结构
  {
    key: 'style.fontSize',
    label: '默认字体大小',
    type: PropertyType.TEXT,
    defaultValue: '14px',
    placeholder: '例如：14px',
    group: '文字',
  },
  {
    key: 'style.fontFamily',
    label: '默认字体',
    type: PropertyType.SELECT,
    options: [
      { label: '微软雅黑', value: 'Microsoft YaHei' },
      { label: '宋体', value: 'SimSun' },
      { label: '黑体', value: 'SimHei' },
      { label: 'Arial', value: 'Arial' },
      { label: 'Helvetica', value: 'Helvetica' },
    ],
    defaultValue: 'Microsoft YaHei',
    group: '文字',
  },
  {
    key: 'style.color',
    label: '默认文字颜色',
    type: PropertyType.COLOR,
    defaultValue: '#000000',
    group: '文字',
  },
  {
    key: 'style.fontWeight',
    label: '默认字体粗细',
    type: PropertyType.SELECT,
    options: [
      { label: '正常', value: 'normal' },
      { label: '粗体', value: 'bold' },
      { label: '细体', value: '300' },
      { label: '中等', value: '500' },
    ],
    defaultValue: 'normal',
    group: '文字',
  },
  {
    key: 'style.lineHeight',
    label: '默认行高',
    type: PropertyType.TEXT,
    defaultValue: '1.5',
    placeholder: '例如：1.5 或 24px',
    group: '文字',
  },
  {
    key: 'style.textAlign',
    label: '文本对齐',
    type: PropertyType.RADIO,
    options: [
      { label: '左', value: 'left' },
      { label: '中', value: 'center' },
      { label: '右', value: 'right' },
    ],
    defaultValue: 'left',
    group: '文字',
  },
  {
    key: 'style.borderRadius',
    label: '圆角',
    type: PropertyType.TEXT,
    placeholder: '例如：4px',
    group: '边框',
  },
  {
    key: 'style.border',
    label: '边框',
    type: PropertyType.BORDER,
    group: '边框',
  },
];

// 文本组件属性配置
const textProperties: PropertyConfig[] = [
  {
    key: 'content',
    label: '文本内容',
    type: PropertyType.TEXTAREA,
    placeholder: '请输入文本内容',
    group: '基础',
  },
  {
    key: 'style.fontSize',
    label: '字体大小',
    type: PropertyType.TEXT,
    defaultValue: '14px',
    group: '文字',
  },
  {
    key: 'style.fontWeight',
    label: '字体粗细',
    type: PropertyType.SELECT,
    options: [
      { label: '正常', value: 'normal' },
      { label: '粗体', value: 'bold' },
      { label: '细体', value: '300' },
      { label: '中等', value: '500' },
    ],
    group: '文字',
  },
  ...commonStyleProperties,
];

// 按钮组件属性配置
const buttonProperties: PropertyConfig[] = [
  {
    key: 'text',
    label: '按钮文本',
    type: PropertyType.TEXT,
    defaultValue: '按钮',
    group: '基础',
  },
  {
    key: 'type',
    label: '按钮类型',
    type: PropertyType.SELECT,
    options: [
      { label: '默认', value: 'default' },
      { label: '主要', value: 'primary' },
      { label: '虚线', value: 'dashed' },
      { label: '文本', value: 'text' },
      { label: '链接', value: 'link' },
    ],
    group: '基础',
  },
  {
    key: 'size',
    label: '按钮大小',
    type: PropertyType.RADIO,
    options: [
      { label: '大', value: 'large' },
      { label: '中', value: 'middle' },
      { label: '小', value: 'small' },
    ],
    defaultValue: 'middle',
    group: '基础',
  },
  {
    key: 'disabled',
    label: '禁用状态',
    type: PropertyType.SWITCH,
    defaultValue: false,
    group: '状态',
  },
  ...commonStyleProperties,
];

// 输入框组件属性配置
const inputProperties: PropertyConfig[] = [
  {
    key: 'placeholder',
    label: '占位文本',
    type: PropertyType.TEXT,
    defaultValue: '请输入',
    group: '基础',
  },
  {
    key: 'value',
    label: '默认值',
    type: PropertyType.TEXT,
    group: '基础',
  },
  {
    key: 'disabled',
    label: '禁用状态',
    type: PropertyType.SWITCH,
    defaultValue: false,
    group: '状态',
  },
  {
    key: 'allowClear',
    label: '允许清除',
    type: PropertyType.SWITCH,
    defaultValue: false,
    group: '功能',
  },
  ...commonStyleProperties,
];

// 栅格容器属性配置
const gridProperties: PropertyConfig[] = [
  {
    key: 'cells',
    label: '单元格配置',
    type: PropertyType.CUSTOM,
    group: '基础',
  },
  {
    key: 'gutter',
    label: '单元格间距',
    type: PropertyType.NUMBER,
    defaultValue: 0,
    min: 0,
    max: 48,
    step: 8,
    group: '基础',
  },
  ...commonStyleProperties,
];

// 容器组件属性配置
const containerProperties: PropertyConfig[] = [
  {
    key: 'style.flexDirection',
    label: '排列方向',
    type: PropertyType.RADIO,
    options: [
      { label: '水平', value: 'row' },
      { label: '垂直', value: 'column' },
    ],
    defaultValue: 'row',
    group: '布局',
    condition: (props) => props.style?.display === 'flex',
  },
  {
    key: 'style.justifyContent',
    label: '主轴对齐',
    type: PropertyType.SELECT,
    options: [
      { label: '起始', value: 'flex-start' },
      { label: '居中', value: 'center' },
      { label: '末尾', value: 'flex-end' },
      { label: '两端', value: 'space-between' },
      { label: '环绕', value: 'space-around' },
    ],
    defaultValue: 'flex-start',
    group: '布局',
    condition: (props) => props.style?.display === 'flex',
  },
  {
    key: 'style.alignItems',
    label: '交叉轴对齐',
    type: PropertyType.SELECT,
    options: [
      { label: '起始', value: 'flex-start' },
      { label: '居中', value: 'center' },
      { label: '末尾', value: 'flex-end' },
      { label: '拉伸', value: 'stretch' },
    ],
    defaultValue: 'flex-start',
    group: '布局',
    condition: (props) => props.style?.display === 'flex',
  },
  {
    key: 'style.flexWrap',
    label: '换行方式',
    type: PropertyType.RADIO,
    options: [
      { label: '不换行', value: 'nowrap' },
      { label: '换行', value: 'wrap' },
    ],
    defaultValue: 'nowrap',
    group: '布局',
    condition: (props) => props.style?.display === 'flex',
  },
  ...commonStyleProperties,
];

// 图片组件属性配置
const imageProperties: PropertyConfig[] = [
  {
    key: 'src',
    label: '图片地址',
    type: PropertyType.TEXT,
    placeholder: '请输入图片URL',
    group: '基础',
  },
  {
    key: 'alt',
    label: '替代文本',
    type: PropertyType.TEXT,
    placeholder: '图片无法显示时的替代文本',
    group: '基础',
  },
  {
    key: 'preview',
    label: '允许预览',
    type: PropertyType.SWITCH,
    defaultValue: true,
    group: '功能',
  },
  ...commonStyleProperties,
];

// 所有组件的属性配置
export const componentPropertyConfigs: ComponentPropertyConfig[] = [
  {
    type: ComponentType.CANVAS,
    properties: canvasProperties,
  },
  {
    type: ComponentType.TEXT,
    properties: textProperties,
  },
  {
    type: ComponentType.INPUT,
    properties: inputProperties,
  },
  {
    type: ComponentType.GRID,
    properties: gridProperties,
  },
  {
    type: ComponentType.IMAGE,
    properties: imageProperties,
  },
  {
    type: ComponentType.CANVAS,
    properties: canvasProperties,
  },
];

// 根据组件类型获取属性配置
export const getPropertyConfigByType = (type: ComponentType): PropertyConfig[] => {
  const config = componentPropertyConfigs.find(config => config.type === type);
  return config ? config.properties : [];
};