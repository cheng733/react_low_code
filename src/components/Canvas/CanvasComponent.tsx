import React, { useRef, useCallback, memo } from 'react';
import { useDrag, useDrop, DropTargetMonitor } from 'react-dnd';
import { useStore } from '../../store/useStore';
import { ComponentInstance, ComponentType } from '../../types';
import { Input, Typography, Image, QRCode, Slider } from 'antd';
import styled, { createGlobalStyle } from 'styled-components';
import { DeleteOutlined, ScissorOutlined } from '@ant-design/icons';
import { set, cloneDeep } from 'lodash';

// 添加全局样式以修复组件显示模式问题
const GlobalStyles = createGlobalStyle`
  .component-TEXT[style*="display: inline"] { display: inline !important; }
  .component-TEXT[style*="display: inline-block"] { display: inline-block !important; }
  .component-TEXT[style*="display: block"] { display: block !important; }
  .component-TEXT[style*="display: flex"] { display: flex !important; }
  .component-TEXT[style*="display: none"] { display: none !important; }
  
  .component-INPUT[style*="display: inline"] { display: inline !important; }
  .component-INPUT[style*="display: inline-block"] { display: inline-block !important; }
  .component-INPUT[style*="display: block"] { display: block !important; }
  .component-INPUT[style*="display: flex"] { display: flex !important; }
  .component-INPUT[style*="display: none"] { display: none !important; }
  
  .component-IMAGE[style*="display: inline"] { display: inline !important; }
  .component-IMAGE[style*="display: inline-block"] { display: inline-block !important; }
  .component-IMAGE[style*="display: block"] { display: block !important; }
  .component-IMAGE[style*="display: flex"] { display: flex !important; }
  .component-IMAGE[style*="display: none"] { display: none !important; }
  
  .component-QRCODE[style*="display: inline"] { display: inline !important; }
  .component-QRCODE[style*="display: inline-block"] { display: inline-block !important; }
  .component-QRCODE[style*="display: block"] { display: block !important; }
  .component-QRCODE[style*="display: flex"] { display: flex !important; }
  .component-QRCODE[style*="display: none"] { display: none !important; }
`;

// Define interfaces for grid component
interface GridCell {
  id: string;
  span?: number;
  width?: number;
  [key: string]: any;
}

interface GridProps {
  cells?: GridCell[];
  columns?: number;
  gutter?: number | [number, number];
  style?: React.CSSProperties;
  [key: string]: any;
}

// Define interfaces for other component types
interface TextProps {
  content?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

interface InputProps {
  placeholder?: string;
  value?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

interface ImageProps {
  src?: string;
  alt?: string;
  preview?: boolean;
  style?: React.CSSProperties;
  [key: string]: any;
}

interface QRCodeProps {
  value?: string;
  size?: number;
  icon?: string;
  color?: string;
  bgColor?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

// Define DragItem interface for drag and drop
interface DragItem {
  id: string;
  type: ComponentType;
  cellId?: string;
  props?: Record<string, any>;
}

interface CanvasComponentProps {
  component: ComponentInstance;
}

const ComponentWrapper = styled.div<{ isSelected: boolean; ispreview: boolean; isGrid?: boolean }>`
  position: relative;
  display: ${({ isGrid }) => (isGrid ? 'block' : 'auto')};
  width: ${({ isGrid }) => (isGrid ? '100%' : 'auto')};
  max-width: 100%;
  overflow: visible;
  ${({ ispreview }) =>
    ispreview
      ? `
    border: none;
  `
      : ''}
  ${({ isSelected, ispreview }) =>
    !ispreview && isSelected
      ? `
    outline: 2px solid #1890ff;
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      background-color: rgba(24, 144, 255, 0.1);
    }
  `
      : ''}
`;

const CanvasComponent: React.FC<CanvasComponentProps> = ({ component }) => {
  const {
    selectComponent,
    selectedId,
    addComponent,
    moveComponent,
    ispreview,
    updateComponent,
    deleteComponent,
  } = useStore();
  const [node, setNode] = React.useState<HTMLDivElement | null>(null);
  const [dropPosition, setDropPosition] = React.useState<
    'top' | 'right' | 'bottom' | 'left' | 'next-line' | null
  >(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ispreview) {
      selectComponent(component.id);
    }
  };
  const handleChange = (newValue: any) => {
    const updatedProps = cloneDeep(component.props || {});
    set(updatedProps, 'value', newValue);
    updateComponent(component.id, { props: updatedProps });
  };

  const renderComponent = () => {
    const props = {
      ...component.props,
      style: {
        ...(component.props.style ? component.props.style : {}),
        pointerEvents: ispreview ? 'none' as const : 'auto' as const,
        ...(ispreview ? { border: 'none', backgroundColor: '#fff' } : {}),
      },
    };
    
    switch (component.type) {
      case ComponentType.INPUT:
        const inputProps = props as unknown as InputProps;
        // 确保输入框组件有正确的display设置
        const inputStyle: React.CSSProperties = {
          ...inputProps.style,
          display: inputProps.style?.display || 'block',
          width: inputProps.style?.width || '100%'
        };
        return (
          <Input
            {...inputProps}
            style={inputStyle}
            onChange={(e) => handleChange(e.target.value)}
            {...(ispreview ? { type: 'text' } : {})}
          />
        );
      case ComponentType.TEXT:
        const textProps = props as unknown as TextProps;
        // 确保文本组件有正确的display设置
        const textStyle: React.CSSProperties = {
          ...textProps.style,
          display: textProps.style?.display || 'block'
        };
        
        // 从textProps中提取style之外的其他属性
        const { style, content, ...otherTextProps } = textProps;
        
        return <Typography.Text style={textStyle} {...otherTextProps}>{content}</Typography.Text>;
      case ComponentType.IMAGE:
        const imageProps = props as unknown as ImageProps;
        // 确保图片组件有正确的display设置
        const imageStyle: React.CSSProperties = {
          ...imageProps.style,
          display: imageProps.style?.display || 'block',
          maxWidth: '100%'
        };
        return <Image {...imageProps} style={imageStyle} />;
      case ComponentType.QRCODE:
        const qrcodeProps = props as unknown as QRCodeProps;
        // 确保QRCode组件样式正确
        const qrcodeStyle: React.CSSProperties = {
          ...qrcodeProps.style,
          display: qrcodeProps.style?.display || 'block',
          maxWidth: '100%',
          padding: '5px',
          boxSizing: 'border-box',
          overflow: 'visible'
        };
        
        return (
          <QRCode
            value={qrcodeProps.value || 'https://baidu.com'}
            size={qrcodeProps.size || 128}
            icon={qrcodeProps.icon}
            color={qrcodeProps.color}
            bgColor={qrcodeProps.bgColor}
            style={qrcodeStyle}
          />
        );
      case ComponentType.GRID:
        const gridProps = props as unknown as GridProps;
        const columns = gridProps.columns || 1;
        
        // 创建或获取单元格
        const existingCells = gridProps.cells || [];
        let cells: GridCell[] = [];
        
        // 确保单元格数量与列数一致
        if (existingCells.length === columns) {
          // 单元格数量正确，直接使用
          cells = existingCells;
        } else {
          // 单元格数量不对，需要调整
          // 创建新的单元格数组
          for (let i = 0; i < columns; i++) {
            const cellId = `cell-${i+1}`;
            // 尝试复用已有单元格
            const existingCell = existingCells.find(c => c.id === cellId);
            if (existingCell) {
              cells.push(existingCell);
            } else {
              // 为每个单元格设置默认宽度 - 平分
              const equalWidth = 100 / columns;
              cells.push({ id: cellId, span: 1, width: equalWidth });
            }
          }
          
          // 异步更新组件属性，避免渲染过程中修改状态
          setTimeout(() => {
            updateComponent(component.id, {
              props: {
                ...gridProps,
                cells
              }
            });
          }, 0);
        }
        
        return (
          <div 
            className="grid-container" 
            style={{ 
              ...gridProps.style,
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'nowrap',
              gap: '0',
              minHeight: gridProps.style?.minHeight || '200px',
              boxSizing: 'border-box',
              position: 'relative',
              padding: '0',
              margin: 0,
              borderRadius: gridProps.style?.borderRadius || '4px',
              boxShadow: gridProps.style?.boxShadow || (ispreview ? '' : '0 2px 8px rgba(0,0,0,0.08)'),
              backgroundColor: gridProps.style?.backgroundColor || '#fafafa',
              alignItems: 'stretch',
              justifyContent: 'space-between',
              overflow: 'visible'
            }}
          >
            {cells.slice(0, columns).map((cell, index) => {
              const cellChildren =
                component.children?.filter((child) => child.props?.cellId === cell.id) || [];
              
              // 获取单元格宽度比例 - 确保平分
              const cellWidth = `${cell.width || (100 / columns)}%`;
              
              return (
                <GridCell
                  key={cell.id}
                  cell={cell}
                  cellWidth={cellWidth}
                  component={component}
                  ispreview={ispreview}
                  cellChildren={cellChildren}
                  addComponent={addComponent}
                  moveComponent={moveComponent}
                  updateComponent={updateComponent}
                  index={index}
                  totalColumns={columns}
                />
              );
            })}
          </div>
        );
      default:
        return null;
    }
  };

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: 'CANVAS_COMPONENT',
      item: {
        id: component.id,
        type: component.type,
        cellId: component.props?.cellId,
      },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
      canDrag: !ispreview,
    }),
    [component.id, component.type, component.props?.cellId, ispreview],
  );

  // 修改放置目标配置，增加位置检测
  const detectDropPosition = (e: React.DragEvent, componentRect: DOMRect) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    // 计算鼠标相对于组件的位置
    const relativeX = mouseX - componentRect.left;
    const relativeY = mouseY - componentRect.top;

    // 计算组件的中心点
    const centerX = componentRect.width / 2;
    const centerY = componentRect.height / 2;

    // 计算鼠标到中心点的距离
    const distanceX = Math.abs(relativeX - centerX);
    const distanceY = Math.abs(relativeY - centerY);

    // 如果鼠标在组件下方且接近底部，设置为 next-line
    if (relativeY > componentRect.height * 0.8) {
      return 'next-line';
    }

    // 根据鼠标位置确定放置位置
    if (distanceX > distanceY) {
      // 水平方向
      return relativeX < centerX ? 'left' : 'right';
    } else {
      // 垂直方向
      return relativeY < centerY ? 'top' : 'bottom';
    }
  };

  // 在 useDrop 钩子中更新 hover 处理函数
  const [collect, drop] = useDrop<DragItem, unknown, { isOver: boolean; canDrop: boolean }>({
    accept: ['COMPONENT', 'CANVAS_COMPONENT'],
    hover: (item, monitor) => {
      if (!node) return;

      const componentRect = node.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();

      if (clientOffset) {
        const position = detectDropPosition(
          { clientX: clientOffset.x, clientY: clientOffset.y } as React.DragEvent,
          componentRect,
        );
        setDropPosition(position);
      }
    },
    drop: (item: DragItem, monitor) => {
      if (monitor.didDrop() || item.id === component.id) {
        return;
      }

      if (item.id && !item.id.includes('template')) {
        if (component.props?.cellId && item.cellId === component.props.cellId) {
          if (dropPosition === 'next-line') {
            moveComponent(item.id, component.parentId, {
              targetId: component.id,
              position: 'next-line',
              cellId: component.props.cellId as string,
            });
          } else {
            moveComponent(item.id, component.parentId, {
              targetId: component.id,
              position: dropPosition || undefined,
              cellId: component.props.cellId as string,
              isSwap: true,
            });
          }
        } else if (component.type === ComponentType.GRID) {
          const gridProps = component.props as unknown as GridProps;
          const cellId = gridProps.cells?.[0]?.id;
          if (cellId) {
            moveComponent(item.id, component.id, { cellId });
          }
        } else {
          // 如果是拖到其他类型的组件上，根据位置进行交换
          moveComponent(item.id, component.parentId, {
            targetId: component.id,
            position: dropPosition || undefined,
            isSwap: true,
          });
        }
      } else if (item.type) {
        // 添加新组件
        const newComponent = {
          ...item,
          id: undefined,
          parentId: component.type === ComponentType.GRID ? component.id : component.parentId,
          props: {
            ...(item.props || {}),
            cellId: component.props?.cellId,
          },
        };
        addComponent(newComponent);
      }
      setDropPosition(null);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver({ shallow: true }),
      canDrop: !!monitor.canDrop(),
    }),
  });

  // Combine the drag and drop refs
  const refCallback = React.useCallback(
    (element: HTMLDivElement | null) => {
      // Apply both drag and drop refs to the element
      const dragElement = drag(element);
      drop(dragElement);
      // Update our node state
      setNode(element);
    },
    [drag, drop]
  );

  return (
    <>
      <GlobalStyles />
      <ComponentWrapper
        ref={refCallback}
        onClick={handleClick}
        isSelected={selectedId === component.id}
        ispreview={ispreview}
        isGrid={component.type === ComponentType.GRID}
        style={{
          opacity: isDragging ? 0.5 : 1,
          cursor: ispreview ? 'default' : 'move',
          position: 'relative',
          gap: '4px',
          overflow: 'visible', 
          // 确保组件自定义样式应用在所有内置样式之后
          ...(component.props.style as React.CSSProperties || {}),
        }}
        className={`component-${component.type}`}
        data-component-type={component.type}
      >
        {renderComponent()}

        {!ispreview && selectedId === component.id && (
          <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 10 }}>
            <DeleteOutlined
              style={{ color: 'red', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                deleteComponent(component.id);
              }}
            />
          </div>
        )}
      </ComponentWrapper>
    </>
  );
};

// 添加到合适的位置
// 单元格容器组件
const GridCell = memo(({ 
  cell, 
  cellWidth, 
  component, 
  ispreview, 
  cellChildren, 
  addComponent, 
  moveComponent,
  updateComponent,
  index,
  totalColumns
}: {
  cell: GridCell;
  cellWidth: string;
  component: ComponentInstance;
  ispreview: boolean;
  cellChildren: ComponentInstance[];
  addComponent: (component: any) => void;
  moveComponent: (id: string, parentId: string, options: any) => void;
  updateComponent: (id: string, patch: any) => void;
  index: number;
  totalColumns: number;
}) => {
  const [{ isOver }, drop] = useDrop<DragItem, unknown, { isOver: boolean }>({
    accept: ['COMPONENT', 'CANVAS_COMPONENT'],
    drop: (item: DragItem, monitor) => {
      if (monitor.didDrop()) {
        return;
      }
      
      if (item.id && !item.id.includes('template')) {
        // 移动已有组件到单元格
        moveComponent(item.id, component.id, { cellId: cell.id });
      } else {
        // 添加新组件到单元格
        const newComponent = {
          ...item,
          id: undefined,
          parentId: component.id,
          props: {
            ...(item.props || {}),
            cellId: cell.id,
          },
        };
        addComponent(newComponent);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver({ shallow: true }),
    }),
  });

  return (
    <div
      key={cell.id}
      className="grid-cell"
      style={{
        position: 'relative',
        flex: `0 0 ${cellWidth}`,
        width: cellWidth,
        minHeight: '100%',
        height: '100%',
        padding: '8px',
        backgroundColor: ispreview ? 'transparent' : 'rgba(255, 255, 255, 0.8)',
        border: ispreview ? 'none' : '1px dashed #e8e8e8',
        borderRadius: '4px',
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'visible',
      }}
    >
      <div
        ref={drop}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '100%',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'visible',
        }}
      >
        <div 
          className="cell-content"
          style={{
            height: '100%',
            width: '100%',
            // display: 'flex',
            // flexDirection: 'column',
            // gap: '6px',
            overflow: 'visible',
          }}
        >
          {cellChildren.length > 0 ? (
            cellChildren.map((child) => (
              <CanvasComponent key={child.id} component={child} />
            ))
          ) : (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '100%',
                minHeight: '180px',
                color: '#bbb',
                fontSize: '14px',
                fontStyle: 'italic',
                backgroundColor: ispreview ? 'transparent' : isOver ? 'rgba(240, 242, 245, 0.4)' : 'rgba(248, 249, 250, 0.6)',
                borderRadius: '2px',
                border: ispreview ? 'none' : isOver ? '1px dashed #1890ff' : '1px dashed #e8e8e8'
              }}
            >
              {isOver ? '放置组件到这里' : '拖拽组件到这里'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default CanvasComponent;
