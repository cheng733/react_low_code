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
  padding: 4px;
  display: ${({ isGrid }) => (isGrid ? 'block' : 'inline-block')};
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

// 添加拖拽位置指示器样式
const DropIndicator = styled.div<{ isActive: boolean; position: string }>`
  position: absolute;
  background-color: rgba(24, 144, 255, 0.3);
  z-index: 5;
  display: ${(props) => (props.isActive ? 'block' : 'none')};
`;

const CanvasComponent: React.FC<CanvasComponentProps> = ({ component }) => {
  const { selectComponent, selectedId, addComponent, moveComponent, ispreview, updateComponent } =
    useStore();
  const componentRef = useRef<HTMLDivElement>(null);
  const [dropPosition, setDropPosition] = React.useState<
    'top' | 'right' | 'bottom' | 'left' | null
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
        ...(component.props.style ? component.props.style : {}),
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
            value={props.value || 'https://example.com'}
            size={props.size || 128}
            icon={props.icon}
            color={props.color}
            bgColor={props.bgColor}
            style={props.style}
          />
        );
      // 修改 GRID 组件的渲染部分
      case ComponentType.GRID:
        // 默认分割为两个单元格
        const cells = props.cells || [
          { id: 'cell-1', span: 12 },
          { id: 'cell-2', span: 12 },
        ];

        return (
          <div className="grid-container" style={{ ...props.style, width: '100%' }}>
            <Row gutter={props.gutter || [16, 16]}>
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
                  <Col
                    key={cell.id}
                    span={cell.span}
                    className="grid-cell"
                    style={{
                      position: 'relative',
                      minHeight: '50px',
                      border: isOver ? '1px solid #1890ff' : '1px dashed #e8e8e8',
                      padding: '8px',
                      transition: 'all 0.3s',
                    }}
                  >
                    <div
                      ref={dropRef}
                      style={{
                        width: '100%',
                        height: '100%',
                        minHeight: '50px',
                        position: 'relative',
                      }}
                    >
                      {/* 单元格内容区域 */}
                      <div className="cell-content">
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
                              height: '100%',
                              minHeight: '50px',
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
                  </Col>
                );
              })}
            </Row>
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
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: ['COMPONENT', 'CANVAS_COMPONENT'],
      hover: (item: { id: string; type: ComponentType }, monitor) => {
        if (!componentRef.current || item.id === component.id) {
          return;
        }

        // 只有当组件在同一个单元格内时才计算相对位置
        if (
          item.id &&
          !item.id.includes('template') &&
          component.props?.cellId &&
          item.cellId === component.props.cellId
        ) {
          const hoverBoundingRect = componentRef.current.getBoundingClientRect();
          const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
          const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;

          const clientOffset = monitor.getClientOffset();
          if (!clientOffset) return;

          const hoverClientY = clientOffset.y - hoverBoundingRect.top;
          const hoverClientX = clientOffset.x - hoverBoundingRect.left;

          // 确定拖拽方向
          const distanceFromTop = Math.abs(hoverClientY);
          const distanceFromBottom = Math.abs(hoverBoundingRect.height - hoverClientY);
          const distanceFromLeft = Math.abs(hoverClientX);
          const distanceFromRight = Math.abs(hoverBoundingRect.width - hoverClientX);

          const minDistance = Math.min(
            distanceFromTop,
            distanceFromBottom,
            distanceFromLeft,
            distanceFromRight,
          );

          if (minDistance === distanceFromTop) {
            setDropPosition('top');
          } else if (minDistance === distanceFromBottom) {
            setDropPosition('bottom');
          } else if (minDistance === distanceFromLeft) {
            setDropPosition('left');
          } else {
            setDropPosition('right');
          }
        } else {
          setDropPosition(null);
        }
      },
      drop: (item: { id: string; type: ComponentType }, monitor) => {
        if (monitor.didDrop() || item.id === component.id) {
          return;
        }

        if (item.id && !item.id.includes('template')) {
          // 如果是在同一个单元格内的组件
          if (component.props?.cellId && item.cellId === component.props.cellId) {
            // 根据放置位置调整组件顺序
            const position = dropPosition;
            moveComponent(item.id, component.id, { position });
          } else if (component.type === ComponentType.GRID) {
            // 如果是拖到栅格容器上
            moveComponent(item.id, component.id);
          }
        } else if (item.id && item.id.includes('template')) {
          // 添加新组件
          const newComponent = {
            ...item,
            id: undefined,
            parentId: component.type === ComponentType.GRID ? component.id : null,
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
    }),
    [component.id, component.type, component.props?.cellId, dropPosition],
  );

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
      }}
    >
      {renderComponent()}

      {/* 拖拽位置指示器 */}
      {!ispreview && isOver && canDrop && dropPosition && (
        <>
          <DropIndicator
            isActive={dropPosition === 'top'}
            position="top"
            style={{
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
            }}
          />
          <DropIndicator
            isActive={dropPosition === 'right'}
            position="right"
            style={{
              top: 0,
              right: 0,
              bottom: 0,
              width: '4px',
            }}
          />
          <DropIndicator
            isActive={dropPosition === 'bottom'}
            position="bottom"
            style={{
              bottom: 0,
              left: 0,
              right: 0,
              height: '4px',
            }}
          />
          <DropIndicator
            isActive={dropPosition === 'left'}
            position="left"
            style={{
              top: 0,
              left: 0,
              bottom: 0,
              width: '4px',
            }}
          />
        </>
      )}
    </ComponentWrapper>
  );
};

export default CanvasComponent;
