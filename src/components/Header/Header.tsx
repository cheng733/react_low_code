import React from 'react';
import { Space, Button, Radio, Tooltip } from 'antd';
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

const HeaderContainer = styled.div`
  padding: 8px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 0 0 50px;
`;

const Header: React.FC = () => {
  const {
    canvas,
    setCanvasSize,
    togglePreview,
    toggleCodePreview,
    undo,
    redo,
    exportToJSON,
    ispreview,
  } = useStore();

  const handlePrint = () => {
    window.print();
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
          <Button icon={<CodeOutlined />} onClick={toggleCodePreview} />
        </Tooltip>
      </Space>
    </HeaderContainer>
  );
};

export default Header;
