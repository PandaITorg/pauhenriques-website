import { Outlet } from 'react-router';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

export default function App() {
  return (
    <div>
      <ScrollToTop />
      <Header />
      <div className="bg-[#a4ac85]">
        <main>
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}