import React from 'react';
import { Input, Select, Switch, Slider, Radio, Checkbox, InputNumber, ColorPicker } from 'antd';
import { PropertyConfig, PropertyType } from '../../config/propertyPanelConfig';
import styled from 'styled-components';
import { get } from 'lodash';

const { TextArea } = Input;
const { Option } = Select;

const FieldContainer = styled.div`
  margin-bottom: 12px;
`;

const FieldLabel = styled.div`
  font-size: 14px;
  margin-bottom: 4px;
  color: rgba(0, 0, 0, 0.85);
`;

const FieldDescription = styled.div`
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 2px;
`;

interface PropertyFieldProps {
  config: PropertyConfig;
  value: any;
  onChange: (key: string, value: any) => void;
  componentProps: any;
}

const PropertyField: React.FC<PropertyFieldProps> = ({ config, value, onChange, componentProps }) => {
  // 如果有条件显示且条件不满足，则不渲染
  if (config.condition && !config.condition(componentProps)) {
    return null;
  }

  // 获取当前值，如果没有则使用默认值
  const currentValue = value !== undefined ? value : config.defaultValue;

  // 处理值变化
  const handleChange = (newValue: any) => {
    // 如果有自定义的onChange处理函数，则调用它
    if (config.onChange) {
      newValue = config.onChange(newValue, componentProps);
    }
    onChange(config.key, newValue);
  };

  // 根据属性类型渲染不同的表单控件
  const renderField = () => {
    switch (config.type) {
      case PropertyType.TEXT:
        return (
          <Input
            value={currentValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={config.placeholder}
          />
        );

      case PropertyType.NUMBER:
        return (
          <InputNumber
            value={currentValue}
            onChange={handleChange}
            min={config.min}
            max={config.max}
            step={config.step}
            style={{ width: '100%' }}
          />
        );

      case PropertyType.SELECT:
        return (
          <Select
            value={currentValue}
            onChange={handleChange}
            style={{ width: '100%' }}
            placeholder={config.placeholder}
          >
            {config.options?.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        );

      case PropertyType.SWITCH:
        return <Switch checked={currentValue} onChange={handleChange} />;

      case PropertyType.COLOR:
        return (
          <ColorPicker
            value={currentValue}
            onChange={(color) => handleChange(color.toHexString())}
          />
        );

      case PropertyType.SLIDER:
        return (
          <Slider
            value={currentValue}
            onChange={handleChange}
            min={config.min}
            max={config.max}
            step={config.step}
          />
        );

      case PropertyType.RADIO:
        return (
          <Radio.Group value={currentValue} onChange={(e) => handleChange(e.target.value)}>
            {config.options?.map((option) => (
              <Radio key={option.value} value={option.value}>
                {option.label}
              </Radio>
            ))}
          </Radio.Group>
        );

      case PropertyType.CHECKBOX:
        return (
          <Checkbox checked={currentValue} onChange={(e) => handleChange(e.target.checked)}>
            {config.label}
          </Checkbox>
        );

      case PropertyType.TEXTAREA:
        return (
          <TextArea
            value={currentValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={config.placeholder}
            rows={4}
          />
        );

      case PropertyType.MARGIN || PropertyType.PADDING:
        const type = config.type === PropertyType.MARGIN ? 'margin' : 'padding';
        const directions = ['Top', 'Right', 'Bottom', 'Left'];
        
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {directions.map((direction) => (
              <div key={direction} style={{ flex: '1 0 45%' }}>
                <FieldLabel style={{ fontSize: '12px' }}>{direction}</FieldLabel>
                <Input
                  value={get(componentProps, `style.${type}${direction}`)}
                  onChange={(e) => onChange(`style.${type}${direction}`, e.target.value)}
                  placeholder="0px"
                  size="small"
                />
              </div>
            ))}
          </div>
        );

      case PropertyType.BORDER:
        // 边框设置组件
        return (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <Input
                value={get(componentProps, 'style.borderWidth')}
                onChange={(e) => onChange('style.borderWidth', e.target.value)}
                placeholder="宽度"
                addonAfter="px"
                style={{ flex: 1 }}
              />
              <Select
                value={get(componentProps, 'style.borderStyle')}
                onChange={(value) => onChange('style.borderStyle', value)}
                style={{ flex: 1 }}
              >
                <Option value="solid">实线</Option>
                <Option value="dashed">虚线</Option>
                <Option value="dotted">点线</Option>
                <Option value="double">双线</Option>
              </Select>
            </div>
            <ColorPicker
              value={get(componentProps, 'style.borderColor')}
              onChange={(color) => onChange('style.borderColor', color.toHexString())}
            />
          </div>
        );

      case PropertyType.CUSTOM:
        // 栅格单元格配置的特殊处理
        if (config.key === 'cells' && componentProps.cells) {
          return (
            <div>
              {componentProps.cells.map((cell, index) => (
                <div key={cell.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ marginRight: '8px' }}>单元格 {index + 1}:</span>
                  <InputNumber
                    value={cell.span}
                    min={1}
                    max={24}
                    onChange={(value) => {
                      const newCells = [...componentProps.cells];
                      newCells[index] = { ...cell, span: value };
                      onChange('cells', newCells);
                    }}
                    style={{ width: '100%' }}
                  />
                </div>
              ))}
            </div>
          );
        }
        return null;

      default:
        return <div>不支持的属性类型: {config.type}</div>;
    }
  };

  return (
    <FieldContainer>
      <FieldLabel>{config.label}</FieldLabel>
      {renderField()}
      {config.description && <FieldDescription>{config.description}</FieldDescription>}
    </FieldContainer>
  );
};

export default PropertyField;