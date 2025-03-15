import React from 'react';
import { useDrag } from 'react-dnd';
import { ComponentDefinition } from '../../types';
import { Tooltip } from 'antd';
import styled from 'styled-components';

interface DraggableItemProps {
  component: ComponentDefinition;
}

const ItemWrapper = styled.div`
  padding: 8px;
  background: white;
  border-radius: 4px;
  cursor: move;
  transition: all 0.2s;
  border: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    border-color: #1890ff;
  }
`;

const ComponentName = styled.div`
  font-size: 16px;
  color: #333;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
`;

const DraggableItem: React.FC<DraggableItemProps> = ({ component }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'COMPONENT',
    item: { ...component },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <Tooltip title={component.name} placement="top">
      <ItemWrapper
        ref={drag}
        style={{
          opacity: isDragging ? 0.5 : 1,
        }}
      >
        <ComponentName>{component.name}</ComponentName>
      </ItemWrapper>
    </Tooltip>
  );
};

export default DraggableItem;
