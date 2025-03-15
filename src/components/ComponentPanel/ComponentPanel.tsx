import React, { useState } from 'react';
import { Tabs, Typography, Button } from 'antd';
import {
  AppstoreOutlined,
  LayoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { layoutComponents, generalComponents } from '../DraggableComponents/componentDefinitions';
import DraggableItem from '../DraggableComponents/DraggableItem';
import styled from 'styled-components';

const { TabPane } = Tabs;
const { Title } = Typography;

const PanelContainer = styled.div<{ collapsed: boolean }>`
  height: 100%;
  overflow-y: auto;
  border-right: 1px solid #f0f0f0;
  width: ${(props) => (props.collapsed ? '50px' : '280px')};
  transition: width 0.3s;
`;

const PanelHeader = styled.div<{ collapsed: boolean }>`
  padding: ${(props) => (props.collapsed ? '16px 0' : '16px')};
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: ${(props) => (props.collapsed ? 'center' : 'space-between')};
  align-items: center;
`;

const StyledTitle = styled(Title)<{ collapsed: boolean }>`
  margin-bottom: 0 !important;
  font-size: 16px !important;
  display: ${(props) => (props.collapsed ? 'none' : 'block')};
`;

const CollapseButton = styled(Button)`
  border: none;
  padding: 0;
`;

const StyledTabs = styled(Tabs)<{ collapsed: boolean }>`
  display: ${(props) => (props.collapsed ? 'none' : 'block')};
`;

const ComponentsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 12px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const CollapsedPanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 16px;
`;

const CollapsedIcon = styled.div`
  font-size: 20px;
  margin-bottom: 16px;
  cursor: pointer;
  color: #1890ff;
`;

const ComponentPanel: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  if (collapsed) {
    return (
      <PanelContainer collapsed={collapsed}>
        <PanelHeader collapsed={collapsed}>
          <CollapseButton type="text" icon={<MenuUnfoldOutlined />} onClick={toggleCollapsed} />
        </PanelHeader>
        <CollapsedPanel>
          <CollapsedIcon>
            <AppstoreOutlined />
          </CollapsedIcon>
          <CollapsedIcon>
            <LayoutOutlined />
          </CollapsedIcon>
        </CollapsedPanel>
      </PanelContainer>
    );
  }

  return (
    <PanelContainer collapsed={collapsed}>
      <PanelHeader collapsed={collapsed}>
        <StyledTitle level={4} collapsed={collapsed}>
          组件库
        </StyledTitle>
        <CollapseButton type="text" icon={<MenuFoldOutlined />} onClick={toggleCollapsed} />
      </PanelHeader>
      <StyledTabs defaultActiveKey="general" collapsed={collapsed}>
        <TabPane
          tab={
            <span>
              <AppstoreOutlined />
              &nbsp; 常规组件
            </span>
          }
          key="general"
        >
          <ComponentsGrid>
            {generalComponents.map((component) => (
              <DraggableItem key={component.id} component={component} />
            ))}
          </ComponentsGrid>
        </TabPane>
        <TabPane
          tab={
            <span>
              <LayoutOutlined />
              &nbsp; 布局组件
            </span>
          }
          key="layout"
        >
          <ComponentsGrid>
            {layoutComponents.map((component) => (
              <DraggableItem key={component.id} component={component} />
            ))}
          </ComponentsGrid>
        </TabPane>
      </StyledTabs>
    </PanelContainer>
  );
};

export default ComponentPanel;
