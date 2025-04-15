import { ComponentType, ComponentCategory, ComponentDefinition } from '../../types';

export const layoutComponents: ComponentDefinition[] = [
  {
    id: 'grid-template',
    type: ComponentType.GRID,
    category: ComponentCategory.LAYOUT,
    name: '栅格容器',
    icon: 'BorderOuterOutlined',
    props: {
      columns: 2,
      cells: [
        { id: 'cell-1', span: 1, width: 50 },
        { id: 'cell-2', span: 1, width: 50 },
      ],
      style: {
        background: '#fafafa',
        borderRadius: '4px',
        padding: '0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        position: 'relative',
        minHeight: '200px',
        width: '100%'
      },
    },
    children: [],
  },
];

// 常规组件定义
export const generalComponents: ComponentDefinition[] = [
  {
    id: 'text-template',
    type: ComponentType.TEXT,
    category: ComponentCategory.GENERAL,
    name: '文本框',
    icon: 'FontSizeOutlined',
    props: {
      content: '示例文本',
      style: {
        fontSize: '14px',
        color: '#000000',
        display: 'block',
        width: '100%',
      },
    },
  },
  {
    id: 'input-template',
    type: ComponentType.INPUT,
    category: ComponentCategory.GENERAL,
    name: '输入框',
    icon: 'FormOutlined',
    props: {
      placeholder: '请输入',
      style: {
        width: '100%',
        display: 'block',
      },
    },
  },
  {
    id: 'image-template',
    type: ComponentType.IMAGE,
    category: ComponentCategory.GENERAL,
    name: '图片',
    icon: 'PictureOutlined',
    props: {
      src: 'https://via.placeholder.com/150',
      alt: '示例图片',
      style: {
        width: '100%',
        maxWidth: '300px',
        display: 'block',
      },
    },
  },
  {
    id: 'qrcode-template',
    type: ComponentType.QRCODE,
    category: ComponentCategory.GENERAL,
    name: '二维码',
    icon: 'QrcodeOutlined',
    props: {
      value: 'https://example.com',
      size: 128,
      icon: '',
      color: '#000000',
      bgColor: '#ffffff',
      style: {
        display: 'inline-block',
        padding: '10px',
        maxWidth: '100%',
      },
    },
  },
];

// 所有组件定义
export const allComponents = [...layoutComponents, ...generalComponents];

// 根据类型获取组件定义
export const getComponentDefinitionByType = (
  type: ComponentType,
): ComponentDefinition | undefined => {
  return allComponents.find((comp) => comp.type === type);
};
