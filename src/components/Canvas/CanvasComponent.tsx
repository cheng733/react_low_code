import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { useStore } from '../../store/useStore';
import { ComponentInstance, ComponentType } from '../../types';
import { Input, Typography, Image, QRCode } from 'antd';
import styled from 'styled-components';
import { DeleteOutlined, ScissorOutlined } from '@ant-design/icons';
import { set, cloneDeep } from 'lodash';

interface CanvasComponentProps {
  component: ComponentInstance;
}

const ComponentWrapper = styled.div<{ isSelected: boolean; ispreview: boolean; isGrid?: boolean }>`
  position: relative;
  display: ${({ isGrid }) => (isGrid ? 'block' : 'inline-block')};
  width: ${({ isGrid }) => (isGrid ? '100%' : 'auto')};
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
  const componentRef = useRef<HTMLDivElement>(null);
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
        pointerEvents: ispreview ? 'none' : 'auto',
        ...(ispreview ? { border: 'none', backgroundColor: '#fff' } : {}),
      },
    };
    switch (component.type) {
      case ComponentType.INPUT:
        return (
          <Input
            {...props}
            onChange={(e) => handleChange(e.target.value)}
            {...(ispreview ? { type: 'text' } : {})}
          />
        );
      case ComponentType.TEXT:
        return <Typography.Text {...props}>{props.content}</Typography.Text>;
      case ComponentType.IMAGE:
        return <Image {...props} />;
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
      case ComponentType.GRID:
        const cells = props.cells;
        return (
          <div className="grid-container" style={{ ...props.style, width: '100%', height: '100%' }}>
            <div>
              {cells.map((cell, index) => {
                const cellChildren =
                  component.children?.filter((child) => child.props?.cellId === cell.id) || [];

                const [{ isOver }, dropRef] = useDrop({
                  accept: ['COMPONENT', 'CANVAS_COMPONENT'],
                  drop: (item: any, monitor) => {
                    if (monitor.didDrop()) {
                      return;
                    }
                    if (item.id && !item.id.includes('template')) {
                      moveComponent(item.id, component.id, { cellId: cell.id });
                    } else {
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
                      border: ispreview ? '' : isOver ? '1px solid #1890ff' : '1px dashed #e8e8e8',
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
                      <div
                        className="cell-content"
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
          componentRect,
        );
        setDropPosition(position);
      }
    },
    drop: (item: { id: string; type: ComponentType; cellId?: string }, monitor) => {
      if (monitor.didDrop() || item.id === component.id) {
        return;
      }

      if (item.id && !item.id.includes('template')) {
        if (component.props?.cellId && item.cellId === component.props.cellId) {
          if (dropPosition === 'next-line') {
            moveComponent(item.id, component.parentId, {
              targetId: component.id,
              position: 'next-line',
              cellId: component.props.cellId,
            });
          } else {
            moveComponent(item.id, component.parentId, {
              targetId: component.id,
              position: dropPosition,
              cellId: component.props.cellId,
              isSwap: true,
            });
          }
        } else if (component.type === ComponentType.GRID) {
          const cellId = component.props?.cells?.[0]?.id;
          if (cellId) {
            moveComponent(item.id, component.id, { cellId });
          }
        } else {
          // 如果是拖到其他类型的组件上，根据位置进行交换
          moveComponent(item.id, component.parentId, {
            targetId: component.id,
            position: dropPosition,
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
        gap: '4px',
        ...(component.props.style ? component.props.style : {}),
      }}
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
  );
};

export default CanvasComponent;
