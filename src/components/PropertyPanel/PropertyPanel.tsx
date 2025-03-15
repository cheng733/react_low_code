import React from 'react';
import { Card, Form, Input, InputNumber, Select, ColorPicker } from 'antd';
import { useStore } from '../../store/useStore';
import { ComponentType } from '../../types';
import styled from 'styled-components';

const PanelContainer = styled.div`
  height: 100%;
  overflow-y: auto;
  border-left: 1px solid #f0f0f0;
`;

const PropertyPanel: React.FC = () => {
  const { components, selectedId, updateComponent } = useStore();
  const selectedComponent = components.find((c) => c.id === selectedId);

  if (!selectedComponent) {
    return (
      <PanelContainer>
        <Card title="属性面板" variant="borderless">
          <div style={{ textAlign: 'center', color: '#999' }}>请选择一个组件</div>
        </Card>
      </PanelContainer>
    );
  }

  const handleStyleChange = (key: string, value: string | number) => {
    updateComponent(selectedComponent.id, {
      props: {
        ...selectedComponent.props,
        style: {
          ...(selectedComponent.props.style || {}),
          [key]: value,
        },
      },
    });
  };

  const handlePropChange = (key: string, value: string | number | React.ReactNode) => {
    updateComponent(selectedComponent.id, {
      props: {
        ...selectedComponent.props,
        [key]: value,
      },
    });
  };

  return (
    <PanelContainer>
      <Card title="属性面板" bordered={false}>
        <Form layout="vertical">
          {/* 通用样式属性 */}
          <Form.Item label="宽度">
            <InputNumber
              value={selectedComponent.props.style?.width}
              onChange={(value) => handleStyleChange('width', value)}
              addonAfter="px"
              style={{ width: '100%' }}
            />
          </Form.Item>

          {selectedComponent.type === ComponentType.TEXT && (
            <>
              <Form.Item label="文本内容">
                <Input
                  value={selectedComponent.props.content as string}
                  onChange={(e) => handlePropChange('content', e.target.value)}
                />
              </Form.Item>
              <Form.Item label="字体大小">
                <InputNumber
                  value={selectedComponent.props.style?.fontSize}
                  onChange={(value) => handleStyleChange('fontSize', value + 'px')}
                  addonAfter="px"
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="文字颜色">
                <ColorPicker
                  value={selectedComponent.props.style?.color}
                  onChange={(value) => handleStyleChange('color', value.toHexString())}
                />
              </Form.Item>
            </>
          )}

          {selectedComponent.type === ComponentType.BUTTON && (
            <>
              <Form.Item label="按钮文本">
                <Input
                  value={selectedComponent.props.children}
                  onChange={(e) => handlePropChange('children', e.target.value)}
                />
              </Form.Item>
              <Form.Item label="按钮类型">
                <Select
                  value={selectedComponent.props.type}
                  onChange={(value) => handlePropChange('type', value)}
                  options={[
                    { label: '主按钮', value: 'primary' },
                    { label: '次按钮', value: 'default' },
                    { label: '虚线按钮', value: 'dashed' },
                    { label: '文本按钮', value: 'text' },
                    { label: '链接按钮', value: 'link' },
                  ]}
                />
              </Form.Item>
            </>
          )}

          {selectedComponent.type === ComponentType.QRCODE && (
            <>
              <Form.Item label="链接地址">
                <Input
                  value={selectedComponent.props.value}
                  onChange={(e) => handlePropChange('value', e.target.value)}
                />
              </Form.Item>
              <Form.Item label="尺寸大小">
                <InputNumber
                  min={64}
                  max={300}
                  value={selectedComponent.props.size}
                  onChange={(value) => handlePropChange('size', value)}
                  addonAfter="px"
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="图标地址">
                <Input
                  value={selectedComponent.props.icon}
                  onChange={(e) => handlePropChange('icon', e.target.value)}
                  placeholder="可选，图标URL"
                />
              </Form.Item>
              <Form.Item label="前景色">
                <ColorPicker
                  value={selectedComponent.props.color}
                  onChange={(value) => handlePropChange('color', value.toHexString())}
                />
              </Form.Item>
              <Form.Item label="背景色">
                <ColorPicker
                  value={selectedComponent.props.bgColor}
                  onChange={(value) => handlePropChange('bgColor', value.toHexString())}
                />
              </Form.Item>
            </>
          )}
        </Form>
      </Card>
    </PanelContainer>
  );
};

export default PropertyPanel;
