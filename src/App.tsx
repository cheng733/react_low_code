import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import styled from 'styled-components';
import Header from './components/Header/Header';
import ComponentPanel from './components/ComponentPanel/ComponentPanel';
import Canvas from './components/Canvas/Canvas';
import PropertyPanel from './components/PropertyPanel/PropertyPanel';
const AppContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const CanvasArea = styled.div`
  flex: 1;
  overflow: auto;
  background: #f0f2f5;
  padding: 20px;
`;

const RightPanel = styled.div`
  width: 300px;
  background: #fff;
`;

const App: React.FC = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <AppContainer>
        <Header />
        <MainContent>
          <ComponentPanel />
          <CanvasArea>
            <Canvas />
          </CanvasArea>
          <RightPanel>
            <PropertyPanel />
          </RightPanel>
        </MainContent>
      </AppContainer>
    </DndProvider>
  );
};

export default App;
