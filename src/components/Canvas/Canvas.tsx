import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useStore } from '../../store/useStore';
import CanvasComponent from './CanvasComponent';
import { useDrop } from 'react-dnd';

const CanvasWrapper = styled.div<{ scale: number; ispreview: boolean }>`
  position: relative;
  background-color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  transform: ${({ scale }) => `scale(${scale})`};
  transform-origin: top center;
  transition: transform 0.3s;
  margin: 20px auto;
  overflow: auto;
  cursor: ${({ ispreview }) => (ispreview ? 'default' : 'pointer')};
`;

const Canvas: React.FC = () => {
  const { components, canvas, addComponent, selectComponent, ispreview } = useStore();

  // 使用 react-dnd 的 useDrop 钩子处理拖放
  const [{ isOver }, drop] = useDrop({
    accept: 'COMPONENT',
    drop: (item: any, monitor) => {
      // 如果已经被其他组件处理了，不再处理
      if (monitor.didDrop()) {
        return;
      }

      // 添加新组件到画布
      addComponent(item);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver({ shallow: true }),
    }),
  });

  // 处理画布点击事件，取消选中
  const handleCanvasClick = (e: React.MouseEvent) => {
    // 如果点击的是画布本身，而不是其中的组件，则取消选中
    if (e.target === e.currentTarget) {
      selectComponent(null);
    }
  };

  // 调试输出画布属性
  useEffect(() => {
    console.log('Canvas properties:', canvas);
  }, [canvas]);

  // 准备画布样式
  const canvasStyle = {
    width: canvas.width || '800px',
    height: canvas.height || '1200px',
    backgroundColor: canvas.backgroundColor || '#fff',
    border: isOver && !ispreview ? '2px dashed #1890ff' : '1px solid #e8e8e8',
  };

  // 合并样式对象
  if (canvas.style) {
    Object.assign(canvasStyle, canvas.style);
  }

  return (
    <CanvasWrapper
      ref={drop}
      style={canvasStyle}
      scale={canvas.scale || 1}
      ispreview={ispreview}
      onClick={handleCanvasClick}
    >
      {components.map((component) => (
        <CanvasComponent key={component.id} component={component} />
      ))}
    </CanvasWrapper>
  );
};

export default Canvas;
