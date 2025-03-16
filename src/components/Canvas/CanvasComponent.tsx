import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { useStore } from '../../store/useStore';
import { ComponentInstance, ComponentType } from '../../types';
import { Input, Typography, Image, Row, Col, QRCode } from 'antd';
import styled from 'styled-components';
import 'react-resizable/css/styles.css';
interface CanvasComponentProps {
  component: ComponentInstance;
}

// 修改 ComponentWrapper 样式，使其能够适应容器宽度
const ComponentWrapper = styled.div<{ isSelected: boolean; ispreview: boolean; isGrid?: boolean }>`
  position: relative;
  display: ${({ isGrid }) => (isGrid ? 'block' : 'inline-block')};
  gap:4px;
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
  const { selectComponent, selectedId, addComponent, moveComponent, ispreview, updateComponent } =
    useStore();
  const componentRef = useRef<HTMLDivElement>(null);
  const [dropPosition, setDropPosition] = React.useState<
    'top' | 'right' | 'bottom' | 'left' | 'next-line' | null
  >(null);

  // 组件点击处理
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ispreview) {
      selectComponent(component.id);
    }
  };

  // 渲染组件
  const renderComponent = () => {
    const props = {
      ...component.props,
      style: {
        // ...(component.props.style ? component.props.style : {}),
        pointerEvents: ispreview ? 'none' : 'auto',
      },
    };

    switch (component.type) {
      case ComponentType.INPUT:
        return <Input {...props} />;
      case ComponentType.TEXT:
        return <Typography.Text {...props}>{props.content}</Typography.Text>;
      case ComponentType.IMAGE:
        return <Image {...props} />;
      case ComponentType.ROW:
        return (
          <Row {...props}>
            {component.children?.map((child) => (
              <CanvasComponent key={child.id} component={child} />
            ))}
          </Row>
        );
      case ComponentType.COLUMN:
        return (
          <Col {...props}>
            {component.children?.map((child) => (
              <CanvasComponent key={child.id} component={child} />
            ))}
          </Col>
        );
      case ComponentType.QRCODE:
        return (
          <QRCode
            value={props.value || 'https://baidu.com'}
            size={props.size || 128}
            icon={props.icon}
            color={props.color}
            bgColor={props.bgColor}
            style={props.style}
          />
        );
      // 修改 GRID 组件的渲染部分
      case ComponentType.GRID:
        const cells = props.cells;

        return (
          <div className="grid-container" style={{ ...props.style, width: '100%' }}>
            <div>
              {cells.map((cell, index) => {
                const isLastCell = index === cells.length - 1;
                const cellChildren =
                  component.children?.filter((child) => child.props?.cellId === cell.id) || [];

                // 为每个单元格创建独立的拖放区域
                const [{ isOver }, dropRef] = useDrop({
                  accept: ['COMPONENT', 'CANVAS_COMPONENT'],
                  drop: (item: any, monitor) => {
                    if (monitor.didDrop()) {
                      return;
                    }

                    console.log('Dropping item:', item);

                    if (item.id && !item.id.includes('template')) {
                      // 移动现有组件到这个单元格
                      console.log('Moving component to cell:', cell.id);
                      moveComponent(item.id, component.id, { cellId: cell.id });
                    } else {
                      // 添加新组件到这个单元格
                      console.log('Adding new component to cell:', cell.id);
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
                      minHeight: '100px',
                      border: isOver ? '1px solid #1890ff' : '1px dashed #e8e8e8',
                      transition: 'all 0.3s',
                    }}
                  >
                    <div
                      ref={dropRef}
                      style={{
                        width: '100%',
                        height: '100%',
                        minHeight: '100px',
                        position: 'relative',
                      }}
                    >
                      {/* 单元格内容区域 */}
                      <div className="cell-content" style={{gap:'4px',display:'flex',flexWrap:"wrap"}}>
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
                              width:"100%",
                              height: '100%',
                              minHeight: '100px',
                              color: '#999',
                              fontSize: '12px',
                            }}
                          >
                            {isOver ? '放置组件到这里' : '拖拽组件到这里'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 拖拽调整宽度的手柄 */}
                    {!isLastCell && !ispreview && (
                      <div
                        className="resize-handle"
                        style={{
                          position: 'absolute',
                          right: '-5px',
                          top: 0,
                          bottom: 0,
                          width: '10px',
                          cursor: 'col-resize',
                          zIndex: 100,
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          const startX = e.clientX;
                          const startSpan = cell.span;
                          const nextCell = cells[index + 1];
                          const nextSpan = nextCell.span;
                          const totalSpan = startSpan + nextSpan;

                          const handleMouseMove = (moveEvent) => {
                            const containerWidth =
                              e.currentTarget.parentElement.parentElement.clientWidth;
                            const deltaX = moveEvent.clientX - startX;
                            const deltaSpan = Math.round((deltaX / containerWidth) * 24);

                            if (deltaSpan !== 0) {
                              const newSpan = Math.max(
                                1,
                                Math.min(totalSpan - 1, startSpan + deltaSpan),
                              );
                              const newNextSpan = totalSpan - newSpan;

                              // 更新组件状态
                              const updatedCells = [...cells];
                              updatedCells[index] = { ...cell, span: newSpan };
                              updatedCells[index + 1] = { ...nextCell, span: newNextSpan };

                              updateComponent(component.id, {
                                props: {
                                  ...component.props,
                                  cells: updatedCells,
                                },
                              });
                            }
                          };

                          const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                          };

                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // 修改拖拽源配置
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
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['COMPONENT', 'CANVAS_COMPONENT'],
    hover: (item, monitor) => {
      if (!componentRef.current) return;
      
      const componentRect = componentRef.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      
      if (clientOffset) {
        const position = detectDropPosition(
          { clientX: clientOffset.x, clientY: clientOffset.y } as React.DragEvent,
          componentRect
        );
        setDropPosition(position);
      }
    },
    drop: (item: { id: string; type: ComponentType; cellId?: string }, monitor) => {
      if (monitor.didDrop() || item.id === component.id) {
        return;
      }

      if (item.id && !item.id.includes('template')) {
        // 如果是在同一个单元格内的组件
        if (component.props?.cellId && item.cellId === component.props.cellId) {
          // 如果是放置到下一行
          if (dropPosition === 'next-line') {
            // 使用 moveComponent 函数将组件移动到下一行
            moveComponent(item.id, component.parentId, { 
              targetId: component.id,
              position: 'next-line',
              cellId: component.props.cellId
            });
          } else {
            // 统一处理同一单元格内组件的交换位置逻辑
            moveComponent(item.id, component.parentId, { 
              targetId: component.id,
              position: dropPosition,
              cellId: component.props.cellId,
              isSwap: true
            });
          }
        } else if (component.type === ComponentType.GRID) {
          // 如果是拖到栅格容器上，将组件移动到栅格的单元格中
          const cellId = component.props?.cells?.[0]?.id;
          if (cellId) {
            moveComponent(item.id, component.id, { cellId });
          }
        } else {
          // 如果是拖到其他类型的组件上，根据位置进行交换
          moveComponent(item.id, component.parentId, { 
            targetId: component.id,
            position: dropPosition,
            isSwap: true
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

      // 重置放置位置
      setDropPosition(null);
    },
    collect: (monitor) => ({
      isOver: !!monitor?.isOver({ shallow: true }),
      canDrop: !!monitor?.canDrop(),
    }),
  });

return (
  <ComponentWrapper
    ref={(node) => {
      drag(drop(node));
      componentRef.current = node;
    }}
    onClick={handleClick}
    isSelected={selectedId === component.id}
    ispreview={ispreview}
    isGrid={component.type === ComponentType.GRID}
    style={{
      opacity: isDragging ? 0.5 : 1,
      cursor: ispreview ? 'default' : 'move',
      position: 'relative',
      gap:'4px',
        ...(component.props.style ? component.props.style : {}),
    }}
  >
    {renderComponent()}
  </ComponentWrapper>
);
};

export default CanvasComponent;
