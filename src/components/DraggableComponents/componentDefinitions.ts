import { ComponentType, ComponentCategory, ComponentDefinition } from '../../types';

export const layoutComponents: ComponentDefinition[] = [
  {
    id: 'grid-template',
    type: ComponentType.GRID,
    category: ComponentCategory.LAYOUT,
    name: '栅格容器',
    icon: 'BorderOuterOutlined',
    props: {
      columns: 1,
      gutter: [16, 16],
      cells: [
        { id: 'cell-1', span: 24 },
      ],
      style: {
        background: '#fafafa',
        borderRadius: '4px',
        position: 'relative',
        minHeight: '100px',
        gap:"4px"
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
        width: '200px',
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
