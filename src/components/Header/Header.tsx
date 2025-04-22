import React, { useState, useRef, useEffect, MouseEvent } from 'react';
import { Space, Button, Radio, Tooltip, Modal, Tabs, message, Form, Input, Select, Table, Popconfirm, Switch } from 'antd';
import {
  EyeOutlined,
  PrinterOutlined,
  SaveOutlined,
  UndoOutlined,
  RedoOutlined,
  CodeOutlined,
  ImportOutlined,
  ToolOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useStore } from '../../store/useStore';
import { CanvasSize, ProcessorType, DataProcessor } from '../../types';
import styled from 'styled-components';
import { useReactToPrint } from 'react-to-print';
import FormPreview from '../FormPreview/FormPreview';
import confetti from 'canvas-confetti'

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
    undo,
    redo,
    exportToJSON,
    importFromJSON,
    updateCanvas,
  } = useStore();

  const [codePreviewVisible, setCodePreviewVisible] = useState(false);
  const [isPreview, setIspreview] = useState(false);
  const [processorModalVisible, setProcessorModalVisible] = useState(false);
  const [processors, setProcessors] = useState<DataProcessor[]>([]);
  const [editingProcessor, setEditingProcessor] = useState<DataProcessor | null>(null);
  const [processorForm] = Form.useForm();
  const contentRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    a.download = 'low_code.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCodePreview = () => {
    setCodePreviewVisible(true);
  };

  const handleImport = () => {
    // Trigger the hidden file input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        // Validate JSON format
        JSON.parse(json);
        // Import the JSON
        importFromJSON(json);
        message.success('导入成功');
      } catch (error) {
        console.error('导入失败:', error);
        message.error('导入失败: 无效的JSON格式');
      }
    };
    reader.onerror = () => {
      message.error('读取文件失败');
    };
    reader.readAsText(file);

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

  const handlePreview = () => {
    setIspreview(!isPreview);
  }

  // 打开数据处理管理界面
  const handleOpenProcessorModal = () => {
    // 从canvas中获取现有的处理规则
    const currentProcessors = canvas.dataProcessorConfig?.processors || [];
    setProcessors([...currentProcessors]);
    setProcessorModalVisible(true);
  };

  // 添加或编辑处理规则
  const handleAddEditProcessor = (values: any) => {
    const newProcessor: DataProcessor = {
      fieldId: values.fieldId,
      processorType: values.processorType,
      processorValue: values.processorValue,
      processorCondition: values.processorCondition,
      customProcessor: values.customProcessor,
      enabled: values.enabled !== undefined ? values.enabled : true
    };

    if (editingProcessor) {
      // 编辑现有规则
      const updatedProcessors = processors.map(p =>
        p.fieldId === editingProcessor.fieldId ? newProcessor : p
      );
      setProcessors(updatedProcessors);
    } else {
      // 添加新规则
      setProcessors([...processors, newProcessor]);
    }

    processorForm.resetFields();
    setEditingProcessor(null);
  };

  // 删除处理规则
  const handleDeleteProcessor = (fieldId: string) => {
    setProcessors(processors.filter(p => p.fieldId !== fieldId));
  };

  // 编辑处理规则
  const handleEditProcessor = (processor: DataProcessor) => {
    setEditingProcessor(processor);
    processorForm.setFieldsValue({
      fieldId: processor.fieldId,
      processorType: processor.processorType,
      processorValue: processor.processorValue,
      processorCondition: processor.processorCondition,
      customProcessor: processor.customProcessor,
      enabled: processor.enabled
    });
  };

  // 切换处理规则启用状态
  const handleToggleProcessor = (fieldId: string, enabled: boolean) => {
    const updatedProcessors = processors.map(p =>
      p.fieldId === fieldId ? { ...p, enabled } : p
    );
    setProcessors(updatedProcessors);
  };

  // 保存所有处理规则到canvas
  const handleSaveProcessors = (e: MouseEvent<HTMLButtonElement>) => {
    confetti({
      particleCount: 200,
      spread: 180,
      zIndex: 9999,
      origin: {
        x: e.clientX / innerWidth,
        y: e.clientY / innerHeight
      }
    })
    updateCanvas({
      dataProcessorConfig: {
        processors
      }
    });
    setProcessorModalVisible(false);
    message.success('数据处理规则已保存');
  };

  // 当编辑的processor改变时，更新表单
  useEffect(() => {
    if (editingProcessor) {
      processorForm.setFieldsValue({
        fieldId: editingProcessor.fieldId,
        processorType: editingProcessor.processorType,
        processorValue: editingProcessor.processorValue,
        processorCondition: editingProcessor.processorCondition,
        customProcessor: editingProcessor.customProcessor,
        enabled: editingProcessor.enabled
      });
    } else {
      processorForm.resetFields();
    }
  }, [editingProcessor, processorForm]);
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
            type={isPreview ? 'primary' : 'default'}
            icon={<EyeOutlined />}
            onClick={handlePreview}
          />
        </Tooltip>
        <Tooltip title="打印">
          <Button icon={<PrinterOutlined />} onClick={handlePrint} />
        </Tooltip>
        <Tooltip title="导出">
          <Button icon={<SaveOutlined />} onClick={handleExport} />
        </Tooltip>
        <Tooltip title="导入">
          <Button icon={<ImportOutlined />} onClick={handleImport} />
        </Tooltip>
        <Tooltip title="数据处理">
          <Button icon={<ToolOutlined />} onClick={handleOpenProcessorModal} />
        </Tooltip>
        <Tooltip title="代码预览">
          <Button icon={<CodeOutlined />} onClick={handleCodePreview} />
        </Tooltip>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".json"
          onChange={handleFileChange}
        />
      </Space>


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
      <div style={{ display: 'none' }}><FormPreview json={JSON.parse(exportToJSON())} ref={contentRef} /></div>
      <Modal
        title="UI预览"
        open={isPreview}
        onCancel={() => handlePreview()}
        width={842}
        footer={null}
      >
        <FormPreview json={JSON.parse(exportToJSON())} />
      </Modal>

      {/* 数据处理管理模态框 */}
      <Modal
        title="数据处理管理"
        open={processorModalVisible}
        onCancel={() => setProcessorModalVisible(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setProcessorModalVisible(false)}>
            取消
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveProcessors}>
            保存
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <Form
            form={processorForm}
            layout="vertical"
            onFinish={handleAddEditProcessor}
          >
            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item
                name="fieldId"
                label="字段ID"
                rules={[{ required: true, message: '请输入字段ID' }]}
                style={{ flex: 1 }}
              >
                <Input placeholder="输入表单字段ID" disabled={!!editingProcessor} />
              </Form.Item>

              <Form.Item
                name="processorType"
                label="处理类型"
                rules={[{ required: true, message: '请选择处理类型' }]}
                style={{ flex: 1 }}
              >
                <Select placeholder="选择处理类型">
                  <Select.Option value={ProcessorType.PREFIX}>前缀</Select.Option>
                  <Select.Option value={ProcessorType.SUFFIX}>后缀</Select.Option>
                  <Select.Option value={ProcessorType.REPLACE}>替换</Select.Option>
                  <Select.Option value={ProcessorType.TRANSFORM}>自定义转换</Select.Option>
                  <Select.Option value={ProcessorType.CONDITIONAL}>条件处理</Select.Option>
                  <Select.Option value={ProcessorType.NONE}>不处理</Select.Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.processorType !== currentValues.processorType
              }
            >
              {({ getFieldValue }) => {
                const processorType = getFieldValue('processorType');

                if (processorType === ProcessorType.PREFIX || processorType === ProcessorType.SUFFIX || processorType === ProcessorType.REPLACE) {
                  return (
                    <Form.Item
                      name="processorValue"
                      label="处理值"
                      rules={[{ required: true, message: '请输入处理值' }]}
                    >
                      <Input placeholder={processorType === ProcessorType.PREFIX ? '输入前缀' : processorType === ProcessorType.SUFFIX ? '输入后缀' : '输入替换值'} />
                    </Form.Item>
                  );
                }

                if (processorType === ProcessorType.CONDITIONAL) {
                  return (
                    <>
                      <Form.Item
                        name="processorCondition"
                        label="条件表达式"
                        rules={[{ required: true, message: '请输入条件表达式' }]}
                      >
                        <Input placeholder="例如: value.length > 10" />
                      </Form.Item>
                      <Form.Item
                        name="processorValue"
                        label="条件满足时的值"
                        rules={[{ required: true, message: '请输入条件满足时的值' }]}
                      >
                        <Input placeholder="条件满足时显示的值" />
                      </Form.Item>
                    </>
                  );
                }

                if (processorType === ProcessorType.TRANSFORM) {
                  return (
                    <>
                      <Form.Item
                        name="customProcessor"
                        label="自定义处理函数"
                        rules={[{ required: true, message: '请输入自定义处理函数' }]}
                        extra="可使用${fieldId}语法引用其他字段值"
                      >
                        <Input.TextArea
                          placeholder="例如: return `尊敬的$&#123;name&#125;您好，您的手机号是$&#123;phone&#125;`"
                          autoSize={{ minRows: 3, maxRows: 6 }}
                        />
                      </Form.Item>
                      <div style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', marginBottom: '16px' }}>
                        <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>模板语法示例：</div>
                        <div style={{ margin: 0, paddingLeft: '20px' }}>
                          <p>示例1: return `您好，$&#123;name&#125;`; - 在文本中嵌入字段值</p>
                          <p>示例2: return `$&#123;name&#125;的手机号是$&#123;phone&#125;`; - 组合多个字段</p>
                          <p>示例3: return `当前值: $&#123;value&#125;`; - 使用当前字段值</p>
                        </div>
                      </div>
                    </>
                  );
                }

                return null;
              }}
            </Form.Item>

            <Form.Item name="enabled" valuePropName="checked" initialValue={true}>
              <Switch checkedChildren="启用" unCheckedChildren="禁用" defaultChecked />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={editingProcessor ? <EditOutlined /> : <PlusOutlined />}
              >
                {editingProcessor ? '更新' : '添加'}
              </Button>
              {editingProcessor && (
                <Button
                  style={{ marginLeft: 8 }}
                  onClick={() => {
                    setEditingProcessor(null);
                    processorForm.resetFields();
                  }}
                >
                  取消
                </Button>
              )}
            </Form.Item>
          </Form>
        </div>

        <Table
          dataSource={processors}
          rowKey="fieldId"
          pagination={false}
          columns={[
            {
              title: '字段ID',
              dataIndex: 'fieldId',
              key: 'fieldId',
            },
            {
              title: '处理类型',
              dataIndex: 'processorType',
              key: 'processorType',
              render: (type) => {
                const typeMap: Record<string, string> = {
                  [ProcessorType.PREFIX]: '前缀',
                  [ProcessorType.SUFFIX]: '后缀',
                  [ProcessorType.REPLACE]: '替换',
                  [ProcessorType.TRANSFORM]: '自定义转换',
                  [ProcessorType.CONDITIONAL]: '条件处理',
                  [ProcessorType.NONE]: '不处理',
                };
                return typeMap[type] || type;
              }
            },
            {
              title: '处理值/条件',
              key: 'processorValue',
              render: (_, record) => {
                if (record.processorType === ProcessorType.PREFIX ||
                  record.processorType === ProcessorType.SUFFIX ||
                  record.processorType === ProcessorType.REPLACE) {
                  return record.processorValue || '-';
                }
                if (record.processorType === ProcessorType.CONDITIONAL) {
                  return record.processorCondition ? `${record.processorCondition} => ${record.processorValue}` : '-';
                }
                if (record.processorType === ProcessorType.TRANSFORM) {
                  return record.customProcessor ? '自定义函数' : '-';
                }
                return '-';
              },
            },
            {
              title: '状态',
              key: 'enabled',
              render: (_, record) => (
                <Switch
                  checked={record.enabled}
                  onChange={(checked) => handleToggleProcessor(record.fieldId, checked)}
                  checkedChildren="启用"
                  unCheckedChildren="禁用"
                />
              ),
            },
            {
              title: '操作',
              key: 'action',
              render: (_, record) => (
                <Space size="small">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => handleEditProcessor(record)}
                  />
                  <Popconfirm
                    title="确定要删除这个处理规则吗？"
                    onConfirm={() => handleDeleteProcessor(record.fieldId)}
                    okText="是"
                    cancelText="否"
                  >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Modal>
    </HeaderContainer>
  );
};

export default Header;
