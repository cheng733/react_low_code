import React from 'react';
import { Input, Select, Switch, Slider, Radio, Checkbox, InputNumber, ColorPicker, Button, Table, Tooltip } from 'antd';
import { PropertyConfig, PropertyType } from '../../config/propertyPanelConfig';
import styled from 'styled-components';
import { get } from 'lodash';
import { InfoCircleOutlined } from '@ant-design/icons';

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
  value: unknown;
  onChange: (key: string, value: unknown) => void;
  componentProps: Record<string, unknown>;
}

const PropertyField: React.FC<PropertyFieldProps> = ({ config, value, onChange, componentProps }) => {
  if (config.condition && !config.condition(componentProps)) {
    return null;
  }
  const currentValue = value !== undefined ? value : config.defaultValue;
  const handleChange = (newValue: unknown) => {
    if (config.onChange) {
      newValue = config.onChange(newValue, componentProps);
    }
    onChange(config.key, newValue);
  };

  const renderField = () => {
    switch (config.type) {
      case PropertyType.TEXT:
        return (
          <Input
            value={currentValue as string}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={config.placeholder}
          />
        );

      case PropertyType.NUMBER:
        return (
          <InputNumber
            value={typeof currentValue === 'number' ? currentValue : undefined}
            onChange={(value) => {
              if (value !== null) {
                handleChange(value);
              }
            }}
            min={config.min}
            max={config.max}
            step={config.step}
            style={{ width: '100%' }}
          />
        );

      case PropertyType.SELECT:
        return (
          <Select
            value={currentValue as string}
            onChange={(value) => handleChange(value)}
            style={{ width: '100%' }}
            placeholder={config.placeholder}
          >
            {config.options?.map((option) => (
              <Option key={String(option.value)} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        );

      case PropertyType.SWITCH:
        return <Switch checked={Boolean(currentValue)} onChange={(checked) => handleChange(checked)} />;

      case PropertyType.COLOR:
        return (
          <ColorPicker
            value={currentValue as string}
            onChange={(color) => handleChange(color.toHexString())}
          />
        );

      case PropertyType.SLIDER:
        return (
          <Slider
            value={typeof currentValue === 'number' ? currentValue : 0}
            onChange={(value) => handleChange(value)}
            min={config.min}
            max={config.max}
            step={config.step}
          />
        );

      case PropertyType.RADIO:
        return (
          <Radio.Group value={currentValue as string} onChange={(e) => handleChange(e.target.value)}>
            {config.options?.map((option) => (
              <Radio key={String(option.value)} value={option.value}>
                {option.label}
              </Radio>
            ))}
          </Radio.Group>
        );

      case PropertyType.CHECKBOX:
        return (
          <Checkbox checked={Boolean(currentValue)} onChange={(e) => handleChange(e.target.checked)}>
            {config.label}
          </Checkbox>
        );

      case PropertyType.TEXTAREA:
        return (
          <TextArea
            value={currentValue as string}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={config.placeholder}
            rows={4}
          />
        );

      case PropertyType.PADDING:
      case PropertyType.MARGIN: {
        const type = config.type === PropertyType.MARGIN ? 'margin' : 'padding';
        const directions = ['Top', 'Right', 'Bottom', 'Left'];

        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {directions.map((direction) => (
              <div key={direction} style={{ flex: '1 0 45%' }}>
                <FieldLabel style={{ fontSize: '12px' }}>{direction}</FieldLabel>
                <Input
                  value={String(get(componentProps, `style.${type}${direction}`) ?? currentValue)}
                  onChange={(e) => onChange(`style.${type}${direction}`, e.target.value)}
                  size="small"
                />
              </div>
            ))}
          </div>
        );
      }

      case PropertyType.BORDER: {
        return (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <Input
                value={String(get(componentProps, 'style.borderWidth') || '')}
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
              value={get(componentProps, 'style.borderColor') as string}
              onChange={(color) => onChange('style.borderColor', color.toHexString())}
            />
          </div>
        );
      }

      case PropertyType.COLUMNS: {
        return (
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
              {config.label}
              <Tooltip title={config.description}>
                <InfoCircleOutlined style={{ marginLeft: '4px', color: '#999' }} />
              </Tooltip>
            </label>
            <Radio.Group
              value={Number(currentValue) || 2}
              onChange={(e) => {
                const value = e.target.value;
                if (typeof value === 'number') {
                  handleChange(value);
                }
              }}
              optionType="button"
              buttonStyle="solid"
              style={{ width: '100%', display: 'flex' }}
            >
              <Radio.Button value={1} style={{ flex: 1, textAlign: 'center' }}>1列</Radio.Button>
              <Radio.Button value={2} style={{ flex: 1, textAlign: 'center' }}>2列</Radio.Button>
              <Radio.Button value={3} style={{ flex: 1, textAlign: 'center' }}>3列</Radio.Button>
              <Radio.Button value={4} style={{ flex: 1, textAlign: 'center' }}>4列</Radio.Button>
            </Radio.Group>
          </div>
        );
      }

      case PropertyType.COLUMN_WIDTH: {
        const cells = (componentProps.cells || []) as CellType[];
        const totalColumns = Number(componentProps.columns) || cells.length || 2;

        // 定义单元格类型
        interface CellType {
          id: string;
          width?: number;
          [key: string]: unknown;
        }

        interface TableRecordType {
          key: string;
          id: string;
          column: string;
          width: number;
          index: number;
        }

        // 重新计算确保总和为100%
        const recalculateWidths = (updatedCells: CellType[], newValue: number, currentIndex: number) => {
          // 计算当前的总宽度和已固定的宽度
          const fixedWidth = newValue;
          const otherCellsCount = updatedCells.length - 1;

          // 计算剩余宽度并平均分配给其他列
          const remainingWidth = 100 - fixedWidth;
          const widthPerCell = Math.max(10, remainingWidth / otherCellsCount);
          // 更新其他单元格的宽度
          updatedCells.forEach((cell, i) => {
            if (i !== currentIndex) {
              updatedCells[i] = { ...cell, width: Math.round(widthPerCell * 10) / 10 }
            }
          });
          return updatedCells;
        };

        return (
          <div>
            <Table
              dataSource={cells.slice(0, totalColumns).map((cell: CellType, index: number) => ({
                key: cell.id,
                id: cell.id,
                column: `列 ${index + 1}`,
                width: Number(cell.width) || (100 / totalColumns),
                index
              }))}
              pagination={false}
              size="small"
              bordered
            >
              <Table.Column title="列" dataIndex="column" width={50}/>
              <Table.Column
                title="宽度 (%)"
                dataIndex="width"
                render={(width: number, record: TableRecordType) => (
                  <InputNumber
                    value={Math.round(width)}
                    min={10}
                    max={90}
                    formatter={(value) => `${value}%`}
                    parser={(value) => value ? parseFloat(value.replace('%', '')) : 0}
                    onChange={(value) => {
                      if (value !== null) {
                        // 复制cells数组并更新指定cell的width值
                        const updatedCells = [...cells] as CellType[];
                        const cellIndex = updatedCells.findIndex(c => c.id === record.id);

                        if (cellIndex !== -1) {
                          // 更新当前列宽度
                          updatedCells[cellIndex] = {
                            ...updatedCells[cellIndex],
                            width: value
                          };

                          // 重新计算其他列宽度以确保总和为100%
                          const balancedCells = recalculateWidths(updatedCells, value, record.index);
                          // 直接使用 cells 键更新组件的 cells 属性
                          onChange('cells', balancedCells);
                        }
                      }
                    }}
                    style={{ width: '100%' }}
                  />
                )}
              />
            </Table>
            <FieldDescription>
              调整某一列的宽度后，其他列将自动平分剩余空间，总和始终为100%
            </FieldDescription>
            <div style={{ marginTop: '8px' }}>
              <Button
                size="small"
                type="primary"
                onClick={() => {
                  // 重置为平均分配
                  const equalWidth = 100 / totalColumns;
                  const resetCells = cells.map((cell: CellType) => ({
                    ...cell,
                    width: Math.round(equalWidth * 10) / 10 // 保留一位小数
                  }));
                  // 直接更新 cells 属性
                  onChange('cells', resetCells);
                }}
              >
                平均分配所有列宽
              </Button>
            </div>
          </div>
        );
      }

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