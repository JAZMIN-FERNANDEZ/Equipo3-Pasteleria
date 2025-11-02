
import { Outlet } from 'react-router-dom';
import Header from '../components/HeaderComponent';

function MainLayout() {
  return (
    <div>
      <Header />
      <main className="p-4">
        {/* Outlet es el marcador de posición donde React Router
            inyectará las páginas (HomePage, Dashboard, etc.) */}
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;