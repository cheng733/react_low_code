import React, { useMemo } from 'react';
import { Collapse } from 'antd';
import styled from 'styled-components';
import { get, set, cloneDeep } from 'lodash';
import { useStore } from '../../store/useStore';
import { ComponentInstance, ComponentType } from '../../types';
import PropertyField from './PropertyField';
import { getPropertyConfigByType, PropertyConfig } from '../../config/propertyPanelConfig';

const { Panel } = Collapse;

const PanelContainer = styled.div`
  width: 300px;
  height: 100%;
  overflow-y: auto;
  border-left: 1px solid #f0f0f0;
  background-color: #fff;
  padding: 0;
`;

const PanelHeader = styled.div`
  padding: 16px;
  font-size: 16px;
  font-weight: 500;
  border-bottom: 1px solid #f0f0f0;
`;

const PropertyGroup = styled.div`
  padding: 12px 16px;
`;

const PropertyPanel: React.FC = () => {
  const { components, selectedId, updateComponent, canvas,updateCanvas } = useStore();

  // 查找选中的组件
  const selectedComponent = useMemo(() => {
    if (!selectedId) return null;

    const findComponent = (comps: ComponentInstance[]): ComponentInstance | null => {
      for (const comp of comps) {
        if (comp.id === selectedId) {
          return comp;
        }
        if (comp.children) {
          const found = findComponent(comp.children);
          if (found) return found;
        }
      }
      return null;
    };

    return findComponent(components);
  }, [components, selectedId]);

  // 根据组件类型获取属性配置
  const propertyConfigs = useMemo(() => {
    if (!selectedComponent) {
      // 如果没有选中组件，返回画布属性配置
      return getPropertyConfigByType(ComponentType.CANVAS);
    }
    return getPropertyConfigByType(selectedComponent.type);
  }, [selectedComponent]);

  // 按组分组属性
  const groupedProperties = useMemo(() => {
    const groups: Record<string, PropertyConfig[]> = {};
    
    propertyConfigs.forEach(config => {
      const group = config.group || '基础';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(config);
    });
    
    return groups;
  }, [propertyConfigs]);

  // 处理属性变更
  const handlePropertyChange = (key: string, value: any) => {
    if (!selectedComponent) {
      // 如果是画布属性
      const updates = {};
      
      // 处理嵌套属性 (如 style.fontSize)
      if (key.includes('.')) {
        const [parent, child] = key.split('.');
        if (!updates[parent]) {
          updates[parent] = {};
        }
        updates[parent][child] = value;
      } else {
        updates[key] = value;
      }
      
      console.log('Updating canvas property:', key, value, updates);
      updateCanvas(updates);
      return;
    }
  
    // 更新组件属性
    const updatedProps = cloneDeep(selectedComponent.props || {});
    
    // 处理嵌套属性 (如 style.width)
    set(updatedProps, key, value);
    
    updateComponent(selectedComponent.id, { props: updatedProps });
  };

  // 获取面板标题
  const getPanelTitle = () => {
    if (selectedComponent) {
      return `${selectedComponent.type} 属性`;
    }
    return '画布属性';
  };

  return (
    <PanelContainer>
      <PanelHeader>{getPanelTitle()}</PanelHeader>
      <Collapse defaultActiveKey={Object.keys(groupedProperties)} bordered={false}>
        {Object.entries(groupedProperties).map(([group, configs]) => (
          <Panel header={group} key={group}>
            <PropertyGroup>
              {configs.map(config => (
                <PropertyField
                  key={config.key}
                  config={config}
                  value={
                    selectedComponent
                      ? get(selectedComponent.props, config.key)
                      : get(canvas, config.key)
                  }
                  onChange={handlePropertyChange}
                  componentProps={selectedComponent ? selectedComponent.props : canvas}
                />
              ))}
            </PropertyGroup>
          </Panel>
        ))}
      </Collapse>
    </PanelContainer>
  );
};

export default PropertyPanel;
