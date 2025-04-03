import React, { useState } from 'react';
import { Space, Button, Radio, Tooltip, Modal, Tabs } from 'antd';
import {
  EyeOutlined,
  PrinterOutlined,
  SaveOutlined,
  UndoOutlined,
  RedoOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import { useStore } from '../../store/useStore';
import { CanvasSize } from '../../types';
import styled from 'styled-components';
import {useReactToPrint} from 'react-to-print';

const HeaderContainer = styled.div`
  padding: 8px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 0 0 50px;
`;

const CodePreview = styled.pre`
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  overflow: auto;
  max-height: 500px;
  font-family: 'Courier New', Courier, monospace;
`;

const Header: React.FC = () => {
  const {
    canvas,
    setCanvasSize,
    togglePreview,
    undo,
    redo,
    exportToJSON,
    ispreview,
    contentRef
  } = useStore();
  
  const [codePreviewVisible, setCodePreviewVisible] = useState(false);
  
  const reactToPrintFn = useReactToPrint({ contentRef });
  const handlePrint = () => {
    reactToPrintFn()
  };

  const handleExport = () => {
    const json = exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'layout.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // 处理代码预览
  const handleCodePreview = () => {
    setCodePreviewVisible(true);
  };

  // 生成React代码
  const generateReactCode = () => {
    const json = JSON.parse(exportToJSON());
    
    // 简单的代码生成逻辑
    let code = `import React from 'react';\n`;
    code += `import { Input, Typography, Image, QRCode } from 'antd';\n\n`;
    code += `const GeneratedComponent = () => {\n`;
    code += `  return (\n`;
    code += `    <div style={{ width: '${json.canvas.width}px', height: '${json.canvas.height}px', padding: '${json.canvas.padding || '0px'}' }}>\n`;
    
    // 递归生成组件代码
    const generateComponentCode = (components, indent = 6) => {
      let componentCode = '';
      components.forEach(comp => {
        const indentStr = ' '.repeat(indent);
        const style = comp.props?.style ? JSON.stringify(comp.props.style) : '{}';
        
        switch (comp.type) {
          case 'text':
            componentCode += `${indentStr}<Typography.Text style={${style}}>${comp.props?.content || ''}</Typography.Text>\n`;
            break;
          case 'input':
            componentCode += `${indentStr}<Input style={${style}} placeholder="${comp.props?.placeholder || ''}" />\n`;
            break;
          case 'image':
            componentCode += `${indentStr}<Image style={${style}} src="${comp.props?.src || ''}" />\n`;
            break;
          case 'qrcode':
            componentCode += `${indentStr}<QRCode style={${style}} value="${comp.props?.value || 'https://baidu.com'}" />\n`;
            break;
          case 'grid':
            const cells = comp.props?.cells || [];
            componentCode += `${indentStr}<div style={${style}} className="grid-container">\n`;
            
            // 处理网格单元格
            if (cells.length > 0) {
              componentCode += `${indentStr}  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '${(comp.props?.gutter?.[0] || 16)}px' }}>\n`;
              
              cells.forEach(cell => {
                const cellWidth = (cell.span / 24) * 100;
                componentCode += `${indentStr}    <div style={{ width: '${cellWidth}%', marginBottom: '${(comp.props?.gutter?.[1] || 16)}px' }}>\n`;
                
                // 查找属于该单元格的子组件
                const cellChildren = comp.children?.filter(child => child.props?.cellId === cell.id) || [];
                if (cellChildren.length > 0) {
                  componentCode += generateComponentCode(cellChildren, indent + 6);
                }
                
                componentCode += `${indentStr}    </div>\n`;
              });
              
              componentCode += `${indentStr}  </div>\n`;
            } else if (comp.children && comp.children.length > 0) {
              // 如果没有单元格但有子组件
              componentCode += generateComponentCode(comp.children, indent + 2);
            }
            
            componentCode += `${indentStr}</div>\n`;
            break;
          default:
            componentCode += `${indentStr}<div style={${style}}></div>\n`;
        }
      });
      return componentCode;
    };
    
    code += generateComponentCode(json.components);
    code += `    </div>\n`;
    code += `  );\n`;
    code += `};\n\n`;
    code += `export default GeneratedComponent;`;
    
    return code;
  };

  return (
    <HeaderContainer>
      <Space>
        <Tooltip title="撤销">
          <Button icon={<UndoOutlined />} onClick={undo} />
        </Tooltip>
        <Tooltip title="重做">
          <Button icon={<RedoOutlined />} onClick={redo} />
        </Tooltip>
      </Space>

      <Space>
        <Radio.Group value={canvas.size} onChange={(e) => setCanvasSize(e.target.value)}>
          <Radio.Button value={CanvasSize.A4}>A4</Radio.Button>
          <Radio.Button value={CanvasSize.A5}>A5</Radio.Button>
          <Radio.Button value={CanvasSize.FIVE_JOINT}>五联纸</Radio.Button>
        </Radio.Group>
      </Space>

      <Space>
        <Tooltip title="预览">
          <Button
            type={ispreview ? 'primary' : 'default'}
            icon={<EyeOutlined />}
            onClick={togglePreview}
          />
        </Tooltip>
        <Tooltip title="打印">
          <Button icon={<PrinterOutlined />} onClick={handlePrint} />
        </Tooltip>
        <Tooltip title="导出">
          <Button icon={<SaveOutlined />} onClick={handleExport} />
        </Tooltip>
        <Tooltip title="代码预览">
          <Button icon={<CodeOutlined />} onClick={handleCodePreview} />
        </Tooltip>
      </Space>
      
      {/* 代码预览弹窗 */}
      <Modal
        title="代码预览"
        open={codePreviewVisible}
        onCancel={() => setCodePreviewVisible(false)}
        width={800}
        footer={null}
      >
        <Tabs
          defaultActiveKey="react"
          items={[
            {
              key: 'react',
              label: 'React 代码',
              children: <CodePreview>{generateReactCode()}</CodePreview>,
            },
            {
              key: 'json',
              label: 'JSON 数据',
              children: <CodePreview>{JSON.stringify(JSON.parse(exportToJSON()), null, 2)}</CodePreview>,
            },
          ]}
        />
      </Modal>
    </HeaderContainer>
  );
};

export default Header;
