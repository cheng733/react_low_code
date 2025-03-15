import React from 'react';
import { useDrop } from 'react-dnd';
import { useStore } from '../../store/useStore';
import { getComponentDefinitionByType } from '../DraggableComponents/componentDefinitions';
import CanvasComponent from './CanvasComponent.tsx';
import styled from 'styled-components';

const CanvasContainer = styled.div<{ ispreview: boolean }>`
  background-color: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  padding: 10px;
  margin: 20px auto;
  position: relative;
  overflow: auto;
  transition: all 0.3s;
  ${({ ispreview }) => (ispreview ? 'pointer-events: none;' : '')}
`;

const EmptyCanvas = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 16px;
`;

const Canvas: React.FC = () => {
  const { components, canvas, addComponent, ispreview } = useStore();

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: 'COMPONENT',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      drop: (item: any, monitor) => {
        // 如果已经在其他地方处理了放置，则不再处理
        if (monitor.didDrop()) {
          return;
        }

        // 获取组件定义
        const componentDef = getComponentDefinitionByType(item.type);
        if (componentDef) {
          // 添加新组件到画布
          addComponent({
            ...componentDef,
            parentId: null,
          });
        }
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver({ shallow: true }),
      }),
    }),
    [addComponent],
  );

  return (
    <CanvasContainer
      ref={drop}
      style={{
        width: canvas.width * canvas.scale,
        height: canvas.height * canvas.scale,
        transform: `scale(${canvas.scale})`,
        transformOrigin: 'top left',
        border: isOver ? '2px dashed #1890ff' : '1px solid #d9d9d9',
      }}
      ispreview={ispreview}
    >
      {components.length === 0 ? (
        <EmptyCanvas>拖拽组件到此处</EmptyCanvas>
      ) : (
        components.map((component) => <CanvasComponent key={component.id} component={component} />)
      )}
    </CanvasContainer>
  );
};

export default Canvas;
