import AdminDashboard from "./pages/AdminDashboard";
import SimulatorPage from "./pages/SimulatorPage";
import Navbar from "./component/Navbar";
import Footer from "./component/Footer";

const App = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-100 font-sans text-slate-900">
      <Navbar />
      <main className="px-4 py-10 md:px-8 md:py-16">
        <SimulatorPage />
      </main>
      <Footer />
    </div>
  );
};

export default App;
