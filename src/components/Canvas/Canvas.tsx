import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useStore } from '../../store/useStore';
import CanvasComponent from './CanvasComponent';
import { useDrop } from 'react-dnd';

const CanvasWrapper = styled.div<{ ispreview: boolean }>`
  position: relative;
  background-color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  transform-origin: top center;
  transition: transform 0.3s;
  overflow: auto;
  cursor: ${({ ispreview }) => (ispreview ? 'default' : 'pointer')};
  ${({ ispreview }) =>
    ispreview
      ? `
    border: none;
  `
      : ''}
`;

const Canvas: React.FC = () => {
  const { components, canvas, addComponent, selectComponent, ispreview, saveContentRef } =
    useStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [{ isOver }, drop] = useDrop({
    accept: 'COMPONENT',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    drop: (item: any, monitor) => {
      if (monitor.didDrop()) {
        return;
      }

      addComponent(item);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver({ shallow: true }),
    }),
  });

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectComponent(null);
    }
  };

  const canvasStyle = {
    width: canvas.width || '800px',
    height: canvas.height || '1200px',
    backgroundColor: canvas.backgroundColor || '#fff',
    border: isOver && !ispreview ? '2px dashed #1890ff' : '1px solid #e8e8e8',
    padding: canvas.padding || '0',
    margin: canvas.margin || '0',
  };

  if (canvas.style) {
    Object.assign(canvasStyle, canvas.style);
  }
  useEffect(() => {
    saveContentRef(canvasRef);
  }, []);
  return (
    <div ref={canvasRef} style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
      <CanvasWrapper
        ref={drop}
        style={canvasStyle}
        ispreview={ispreview}
        onClick={handleCanvasClick}
      >
        {components.map((component) => (
          <CanvasComponent key={component.id} component={component} />
        ))}
      </CanvasWrapper>
    </div>
  );
};

export default Canvas;
