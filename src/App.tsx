import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Library from './routes/Library';
import Record from './routes/Record';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Library />} />
        <Route path="/record" element={<Record />} />
      </Routes>
    </BrowserRouter>
  );
}
