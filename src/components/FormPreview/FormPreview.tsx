import React from 'react';
import { Input, Typography, Image, QRCode, Form } from 'antd';
import styled from 'styled-components';
import { ComponentInstance, ComponentType, CanvasState } from '../../types';

const { Text } = Typography;

// Clean component styling for form preview - no borders or shadows
const PreviewContainer = styled.div<CanvasState>`
  background-color: white;
  ${({ width, height, padding }) =>
    `width: ${width}px;
  height: ${height}px;
  padding: ${padding}px;
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
const FormPreview: React.FC<FormPreviewProps> = ({ json, formData = {}, onValuesChange }) => {
  const [form] = Form.useForm();

  // Set initial values from formData
  React.useEffect(() => {
    // if (formData && Object.keys(formData).length > 0) {
    form.setFieldsValue({
      title: "技术栈",
      name: '啊程',
      gender: '男',
      desc: "技术不止于代码；技术不止于代码；技术不止于代码；技术不止于代码；技术不止于代码；技术不止于代码；技术不止于代码；技术不止于代码；技术不止于代码；技术不止于代码；技术不止于代码；技术不止于代码；",
      capacity: "全栈开发工程师(nodejs、React、Vue、uniapp、low-code和typescript)",
      qrcode: "https://github.com/low-code-project",
      phone: "12345678901",
      date:"2025-04-17 18:00:00"
    });
    // }
  }, [formData, form]);

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
    <PreviewContainer {...json.canvas}>
      <Form
        form={form}
        layout="vertical"
        onValuesChange={onValuesChange}
      >
        {renderComponents(json.components)}
      </Form>
    </PreviewContainer>
  );
};

const CustomText = ({ value, ...res }) => {
  return <Text {...res}>{value}</Text>
}
export default FormPreview;
