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
  const { components, selectedId, updateComponent, canvas, updateCanvas } = useStore();

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

  const propertyConfigs = useMemo(() => {
    if (!selectedComponent) {
      return getPropertyConfigByType(ComponentType.CANVAS);
    }
    return getPropertyConfigByType(selectedComponent.type);
  }, [selectedComponent]);

  // 按组分组属性
  const groupedProperties = useMemo(() => {
    const groups: Record<string, PropertyConfig[]> = {};
    propertyConfigs.forEach((config) => {
      const group = config.group || '基础';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(config);
    });

    return groups;
  }, [propertyConfigs]);

  const handlePropertyChange = (key: string, value: unknown) => {
    if (!selectedComponent) {
      const updates: Record<string, unknown> = {};
      if (key.includes('.')) {
        const [parent, child] = key.split('.');
        if (!updates[parent]) {
          updates[parent] = {};
        }
        (updates[parent] as Record<string, unknown>)[child] = value;
      } else {
        updates[key] = value;
      }

      updateCanvas(updates);
      return;
    }

    const updatedProps = cloneDeep(selectedComponent.props || {});
    set(updatedProps, key, value);
    updateComponent(selectedComponent.id, { props: updatedProps });
  };

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
              {configs.map((config) => (
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
