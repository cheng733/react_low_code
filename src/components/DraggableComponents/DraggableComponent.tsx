// 修改拖拽源配置
const [{ isDragging }, drag] = useDrag(
  () => ({
    type: 'COMPONENT',
    item: () => {
      // 创建一个新的组件实例
      const componentDef = getComponentDefinitionByType(component.type);
      if (!componentDef) return { id: component.id, type: component.type };

      return {
        id: component.id,
        type: component.type,
        props: { ...componentDef.props },
        children: componentDef.children ? [...componentDef.children] : [],
      };
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }),
  [component.id, component.type],
);
