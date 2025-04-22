import React, { useEffect } from 'react';
import { Input, Typography, Image, QRCode, Form } from 'antd';
import styled from 'styled-components';
import { ComponentInstance, ComponentType, CanvasState, ProcessorType } from '../../types';

const { Text } = Typography;

// Clean component styling for form preview - no borders or shadows
const PreviewContainer = styled.div<CanvasState>`
  background-color: white;
  ${({ width, height, padding }) =>
    `width: ${width}px;
  height: ${height}px;
  padding: ${padding};
  `
  }
`;

interface FormPreviewProps {
  json: { components: ComponentInstance[], canvas: CanvasState };
  formData?: Record<string, any>;
  onValuesChange?: (changedValues: any, allValues: any) => void;
}

/**
 * FormPreview component renders components as a form without borders or shadows
 * It uses the formId property of components to bind form data
 */
const FormPreview = React.forwardRef<HTMLDivElement, FormPreviewProps>(({ json, formData = {}, onValuesChange }, ref) => {
  const [form] = Form.useForm();
  const processors = json.canvas.dataProcessorConfig?.processors || [];

  // Create a default form data object
  const defaultFormData = {
    title: "技术栈",
    name: '啊程',
    gender: '男',
    desc: "技术不止于代码；技术不止于代码；技术不止于代码；技术不止于代码；技术不止于代码；技术不止于代码；技术不止于代码；技术不止于代码；技术不止于代码；技术不止于代码；技术不止于代码；技术不止于代码；",
    capacity: "全栈开发工程师(nodejs、React、Vue、uniapp、low-code和typescript)",
    qrcode: "https://github.com/low-code-project",
    phone: "12345678901",
    date: "2025-04-17 18:00:00"
  };

  // Merge with provided formData
  const mergedData = { ...defaultFormData, ...formData };

  // Process a field value based on the processor rules
  const processFieldValue = (fieldId: string, value: any): any => {
    const processor = processors.find(p => p.fieldId === fieldId && p.enabled);
    if (!processor || value === undefined || value === null) return value;

    try {
      switch (processor.processorType) {
        case ProcessorType.PREFIX:
          return `${processor.processorValue || ''}${value}`;
        case ProcessorType.SUFFIX:
          return `${value}${processor.processorValue || ''}`;
        case ProcessorType.REPLACE:
          return processor.processorValue || value;
        case ProcessorType.TRANSFORM:
          if (processor.customProcessor) {
            try {
              // Get all field values including the current value
              const allValues = {
                ...mergedData,
                value // Make the current field value available as 'value'
              };

              // Create a safe evaluation context with all field values as variables
              const contextKeys = Object.keys(allValues);
              const contextValues = contextKeys.map(key => allValues[key]);

              // Create a template literal evaluator function that has access to all field values
              const templateFunction = new Function(
                ...contextKeys, // Parameters are all field names
                `try { ${processor.customProcessor} } catch (e) { console.error(e); return value; }`
              );

              // Call the function with all field values
              return templateFunction(...contextValues);
            } catch (error) {
              console.error('Error executing custom processor:', error);
              return value;
            }
          }
          return value;
        case ProcessorType.CONDITIONAL:
          if (processor.processorCondition && processor.processorValue) {
            try {
              // Create a function from the condition string
              const conditionFn = new Function('value', `return ${processor.processorCondition}`);
              return conditionFn(value) ? processor.processorValue : value;
            } catch (error) {
              console.error('Error evaluating condition:', error);
              return value;
            }
          }
          return value;
        case ProcessorType.NONE:
        default:
          return value;
      }
    } catch (error) {
      console.error(`Error processing field ${fieldId}:`, error);
      return value;
    }
  };

  // Set initial values from formData
  useEffect(() => {

    // Process all values according to processing rules
    const processedData = Object.keys(mergedData).reduce((acc, key) => {
      acc[key] = processFieldValue(key, mergedData[key]);
      return acc;
    }, {} as Record<string, any>);

    // Set the processed values to the form
    form.setFieldsValue(processedData);
  }, [formData, form, processors]);
  // Recursively render components
  const renderComponents = (comps: ComponentInstance[]) => {
    return comps.map((component) => renderComponent(component));
  };

  // Render a single component
  const renderComponent = (component: ComponentInstance) => {
    const { id, type, props = {}, children = [] } = component;
    const formId = props.formId as string;

    // Common clean style without borders and shadows
    const cleanStyle = {
      ...(props.style || {}),
      border: 'none',
      boxShadow: 'none',
      borderRadius: '0',
      backgroundColor: 'transparent'
    };

    switch (type) {
      case ComponentType.TEXT:
        console.log(props)
        return (
          <Form.Item
            key={id}
            name={formId}
            noStyle
            className={`preview-component preview-${type.toLowerCase()}`}
            initialValue={props.content}
          >
            {formId ? <CustomText
              style={props.style || {}} /> : <Text style={props.style || {}}>{props.content}</Text>}
          </Form.Item>
        );

      case ComponentType.INPUT:
        return (
          <Form.Item
            key={id}
            name={formId}
            style={cleanStyle}
            className={`preview-component preview-${type.toLowerCase()}`}
            initialValue={props.content}
          >
            <Input
              variant="borderless"
              disabled
            />
          </Form.Item>
        );

      case ComponentType.IMAGE:
        return (
          <div key={id} style={cleanStyle} className={`preview-component preview-${type.toLowerCase()}`}>
            <Image
              src={props.src}
              alt={props.alt}
              preview={false} // Always disable preview in form mode
              style={{ maxWidth: '100%' }}
            />
          </div>
        );

      case ComponentType.QRCODE:
        return (
          <Form.Item
            key={id}
            name={formId}
            className={`preview-component preview-${type.toLowerCase()}`}
            initialValue={props.content}
            noStyle
          >
            <QRCode
              // style={props.style || {}}
              size={props.size || 128}
              style={{ maxWidth: '100%', border: 'none' }}
            />
          </Form.Item>
        );

      case ComponentType.GRID:
        // Calculate cell widths
        const columns = props.columns || 2;
        const cells = props.cells || Array.from({ length: columns }, (_, i) => ({ id: `cell-${i}`, width: 100 / columns }));

        // Find children for each cell
        const cellChildren = cells.map(cell => {
          return children.filter(child => child.props?.cellId === cell.id);
        });

        return (
          <div
            key={id}
            style={{
              ...cleanStyle,
              display: 'flex',
              flexWrap: 'wrap',
              width: '100%',
            }}
            className={`preview-component preview-${type.toLowerCase()}`}
          >
            {cells.map((cell, index) => {
              const cellWidth = `${cell.width || 100 / columns}%`;
              return (
                <div
                  key={cell.id}
                  style={{
                    flex: `0 0 ${cellWidth}`,
                    width: cellWidth,
                    boxSizing: 'border-box',
                  }}
                >
                  {renderComponents(cellChildren[index] || [])}
                </div>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PreviewContainer {...json.canvas} ref={ref} style={json.canvas.style}>
      <Form
        form={form}
        layout="vertical"
        onValuesChange={onValuesChange}
      >
        {renderComponents(json.components)}
      </Form>
    </PreviewContainer>
  );
});

const CustomText = ({ value, ...res }) => {
  return <Text {...res}>{value}</Text>
}
export default FormPreview;
